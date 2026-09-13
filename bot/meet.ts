import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import { env, storageDir } from "../server/env";
import { prisma, jobLog } from "../server/db";
import { transition, setStep } from "../server/meetings/state";
import { attachRecording, MEET_URL } from "../server/meetings/service";
import { createRecordingProvider, type RecordingProvider } from "../server/recording/provider";
import { probeDuration, toWav } from "../server/audio/ffmpeg";
import { processMeeting } from "../server/pipeline/process";
import { log, errorMessage } from "../server/logger";

/**
 * Google Meet bot. It behaves like a normal participant:
 *   - opens the Meet link in a persistent Chromium profile (`.bot-profile/`)
 *     that the user signed into once with `npm run bot:login`,
 *   - sets its display name, mutes mic and camera,
 *   - clicks "Join now" / "Ask to join" and WAITS for the host to admit it,
 *   - records the tab audio through the RecordingProvider,
 *   - leaves when asked to stop, when it is alone, or at the max duration,
 *   - hands the file to the processing pipeline.
 * It never bypasses Google authentication or meeting admission.
 */

const SEL = {
  nameInput: 'input[aria-label*="name" i], input[placeholder*="name" i]',
  joinButtons: ['button:has-text("Ask to join")', 'button:has-text("Join now")', 'button:has-text("Join anyway")', 'button:has-text("Switch here")'],
  leave: 'button[aria-label*="Leave call" i]',
  denied: ["text=You can't join this call", "text=You've been removed", "text=denied your request", "text=Someone in the call denied", "text=You can't join this video call", "text=Return to home screen"],
  ended: ["text=You left the meeting", "text=The call has ended", "text=Rejoin"],
};

export function isValidMeetUrl(url: string) {
  return MEET_URL.test(url);
}

export async function launchContext(headless: boolean): Promise<BrowserContext> {
  const e = env();
  const profile = path.resolve(process.cwd(), e.BOT_PROFILE_DIR);
  fs.mkdirSync(profile, { recursive: true });
  const base = {
    headless,
    args: [
      "--use-fake-ui-for-media-stream",
      "--auto-select-tab-capture-source-by-title=Meet",
      "--autoplay-policy=no-user-gesture-required",
      "--disable-blink-features=AutomationControlled",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    ignoreDefaultArgs: ["--enable-automation", "--mute-audio"],
    viewport: { width: 1280, height: 800 },
    permissions: ["microphone", "camera"],
    locale: "en-US",
  };
  try {
    return await chromium.launchPersistentContext(profile, { ...base, channel: e.BOT_BROWSER_CHANNEL });
  } catch (err) {
    if (e.BOT_BROWSER_CHANNEL === "chromium") throw err;
    log.warn("bot", `Browser channel "${e.BOT_BROWSER_CHANNEL}" unavailable, falling back to bundled Chromium`, { error: errorMessage(err) });
    return chromium.launchPersistentContext(profile, base);
  }
}

/** Interactive sign-in: opens Google in the persistent profile and waits for the user to close the window. */
export async function loginFlow() {
  const ctx = await launchContext(false);
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  await page.goto("https://accounts.google.com/", { waitUntil: "domcontentloaded" });
  log.info("bot", "Sign in to the Google account the bot should use, then close the browser window.");
  log.info("bot", "No credentials are stored by this app; Chromium keeps the session inside .bot-profile/ (git-ignored).");
  await new Promise<void>((resolve) => ctx.on("close", () => resolve()));
  log.info("bot", "Profile saved. You can now run `npm run bot`.");
}

async function clickFirst(page: Page, selectors: string[], timeout = 2000) {
  for (const s of selectors) {
    const loc = page.locator(s).first();
    try {
      if (await loc.isVisible({ timeout })) {
        await loc.click({ timeout: 5000 });
        return s;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

async function anyVisible(page: Page, selectors: string[]) {
  for (const s of selectors) {
    try {
      if (await page.locator(s).first().isVisible({ timeout: 300 })) return s;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function muteDevices(page: Page) {
  for (const label of ["Turn off microphone", "Turn off camera"]) {
    try {
      const btn = page.locator(`button[aria-label*="${label}" i]`).first();
      if (await btn.isVisible({ timeout: 1500 })) await btn.click({ timeout: 3000 });
    } catch {
      /* already off or not present */
    }
  }
}

async function participantCount(page: Page): Promise<number | null> {
  try {
    const txt = await page.locator('button[aria-label*="People" i], button[aria-label*="participants" i]').first().getAttribute("aria-label", { timeout: 500 });
    const m = txt?.match(/(\d+)/);
    if (m) return Number(m[1]);
    return null;
  } catch {
    return null;
  }
}

function inCall(page: Page) {
  return page
    .locator(SEL.leave)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
}

export interface RunOptions {
  headless?: boolean;
  workerId: string;
}

/** Full lifecycle for one claimed meeting. Never throws; failures land in FAILED. */
export async function runMeetingJob(meetingId: string, opts: RunOptions) {
  const e = env();
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting || !meeting.meetUrl) {
    await transition(meetingId, "FAILED", { error: "Meeting has no Google Meet link", stage: "bot" }).catch(() => {});
    return;
  }
  if (!isValidMeetUrl(meeting.meetUrl)) {
    await transition(meetingId, "FAILED", { error: "Invalid Google Meet URL", stage: "bot" });
    return;
  }

  let ctx: BrowserContext | null = null;
  let provider: RecordingProvider | null = null;
  let recording = false;
  try {
    await transition(meetingId, "BOT_JOINING", { step: "Opening browser", stage: "bot" });
    ctx = await launchContext(opts.headless ?? false);
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    page.setDefaultTimeout(15_000);

    await page.goto(meeting.meetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    if (page.url().includes("accounts.google.com")) {
      throw new Error("The bot profile is not signed in to Google. Run `npm run bot:login` first.");
    }

    // Display name (shown to other participants) is only offered for guest joins.
    try {
      const name = page.locator(SEL.nameInput).first();
      if (await name.isVisible({ timeout: 2000 })) await name.fill(e.BOT_NAME);
    } catch {
      /* signed-in accounts don't get a name box */
    }
    await muteDevices(page);
    await setStep(meetingId, "Asking to join");

    const clicked = await clickFirst(page, SEL.joinButtons, 4000);
    if (!clicked) throw new Error("Could not find the Join / Ask to join button (is the link valid and the meeting open?)");
    await jobLog(meetingId, "bot", "Requested to join the meeting", { button: clicked });
    await setStep(meetingId, "Waiting to be admitted");

    // Wait for admission (host must let the bot in). Respect denial.
    const admitDeadline = Date.now() + e.BOT_ADMISSION_TIMEOUT_SECONDS * 1000;
    let admitted = false;
    while (Date.now() < admitDeadline) {
      if (await inCall(page)) {
        admitted = true;
        break;
      }
      const denied = await anyVisible(page, SEL.denied);
      if (denied) throw new Error("The meeting host denied the bot's request to join");
      const fresh = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { stopRequested: true } });
      if (fresh?.stopRequested) throw new Error("Stopped by user before admission");
      await page.waitForTimeout(2000);
    }
    if (!admitted) throw new Error(`Not admitted within ${e.BOT_ADMISSION_TIMEOUT_SECONDS}s`);
    await jobLog(meetingId, "bot", "Admitted to the meeting");

    // Recording
    const outFile = storageDir("recordings", `${meetingId}.webm`);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    provider = createRecordingProvider(e.RECORDING_PROVIDER);
    try {
      await provider.start({ page, outFile });
    } catch (err) {
      if (e.RECORDING_PROVIDER === "real") {
        await jobLog(meetingId, "recording", `Real capture failed: ${errorMessage(err)}. Falling back to MOCK (silent) recording.`, undefined, "warn");
        provider = createRecordingProvider("mock");
        await provider.start({ page, outFile });
      } else throw err;
    }
    recording = true;
    await transition(meetingId, "RECORDING", {
      step: provider.name === "mock" ? "Recording (MOCK: silent audio)" : "Recording",
      stage: "recording",
      extra: { startedAt: new Date() },
    });

    // Stay in the call until stop / alone / max duration / call ended
    const started = Date.now();
    let aloneSince: number | null = null;
    let reason = "max duration reached";
    for (;;) {
      await page.waitForTimeout(e.BOT_POLL_MS);
      const elapsed = (Date.now() - started) / 1000;
      if (elapsed >= e.BOT_MAX_RECORDING_SECONDS) break;
      const fresh = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { stopRequested: true } });
      if (fresh?.stopRequested) {
        reason = "stop requested";
        break;
      }
      if (!(await inCall(page)) || (await anyVisible(page, SEL.ended))) {
        reason = "call ended";
        break;
      }
      const n = await participantCount(page);
      if (n !== null && n <= 1) {
        aloneSince ??= Date.now();
        if (Date.now() - aloneSince > e.BOT_ALONE_TIMEOUT_SECONDS * 1000) {
          reason = "everyone else left";
          break;
        }
      } else aloneSince = null;
    }
    await jobLog(meetingId, "bot", `Leaving meeting: ${reason}`);

    const result = await provider.stop();
    recording = false;
    try {
      await page.locator(SEL.leave).first().click({ timeout: 3000 });
    } catch {
      /* already out */
    }
    await ctx.close().catch(() => {});
    ctx = null;

    // Normalise to WAV so playback/transcription don't depend on WebM support.
    await transition(meetingId, "PROCESSING", { step: "Saving recording", stage: "recording" });
    const wav = outFile.replace(/\.\w+$/, ".wav");
    let finalFile = result.filePath;
    let mime = result.mimeType;
    if (!result.filePath.endsWith(".wav")) {
      await toWav(result.filePath, wav);
      fs.rmSync(result.filePath, { force: true });
      finalFile = wav;
      mime = "audio/wav";
    }
    const duration = await probeDuration(finalFile);
    await attachRecording(meetingId, { absPath: finalFile, mimeType: mime, duration, provider: result.provider });
    await prisma.meeting.update({ where: { id: meetingId }, data: { endedAt: new Date(), stopRequested: false } });
    await processMeeting(meetingId);
  } catch (err) {
    const msg = errorMessage(err);
    log.error("bot", "meeting job failed", { meetingId, error: msg });
    if (recording && provider) await provider.stop().catch(() => {});
    if (ctx) await ctx.close().catch(() => {});
    await transition(meetingId, "FAILED", { error: msg.slice(0, 500), stage: "bot" }).catch(() => {});
  }
}
