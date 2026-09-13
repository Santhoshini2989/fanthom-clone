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
  // Explicit denial / removal only. NOTE: "Return to home screen" is shown on
  // the normal "Asking to join…" lobby screen, so it must never count as denial.
  denied: ["text=denied your request", "text=Someone in the call denied", "text=You've been removed", "text=You can't join this call", "text=You can't join this video call"],
  // Meet gave up asking on our behalf (host did not answer in time). We re-ask.
  noResponse: ["text=No one responded", "text=Nobody responded"],
  asking: ["text=Asking to join", "text=Asking to be let in", "text=You'll join the call when someone lets you in", "text=Someone will let you in soon"],
  ended: ["text=You left the meeting", "text=The call has ended", "text=Rejoin"],
  signIn: ["text=Sign in to join", "text=You must sign in", "text=Sign in with Google"],
};

type LobbyState = "in_call" | "asking" | "lobby" | "denied" | "no_response" | "sign_in" | "unknown";

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
      if (!(await loc.isVisible({ timeout }))) continue;
      const until = Date.now() + Math.max(timeout, 5000);
      while (!(await loc.isEnabled().catch(() => false)) && Date.now() < until) await page.waitForTimeout(250);
      await loc.click({ timeout: 5000 });
      return s;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Close informational dialogs that can sit on top of the lobby ("Got it", device permission hints…). */
async function dismissDialogs(page: Page) {
  for (const label of ["Got it", "Dismiss", "Continue without microphone and camera", "Use microphone and camera", "Close"]) {
    try {
      const btn = page.locator(`button:has-text("${label}")`).first();
      if (await btn.isVisible({ timeout: 300 })) await btn.click({ timeout: 2000 });
    } catch {
      /* not present */
    }
  }
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

/** Classify what Google Meet is currently showing. Order matters: in-call first, then explicit outcomes. */
async function lobbyState(page: Page): Promise<{ state: LobbyState; detail: string }> {
  if (await inCall(page)) return { state: "in_call", detail: "Leave call button visible" };
  const denied = await anyVisible(page, SEL.denied);
  if (denied) return { state: "denied", detail: denied };
  const noResp = await anyVisible(page, SEL.noResponse);
  if (noResp) return { state: "no_response", detail: noResp };
  const signIn = await anyVisible(page, SEL.signIn);
  if (signIn || page.url().includes("accounts.google.com")) return { state: "sign_in", detail: signIn ?? page.url() };
  const asking = await anyVisible(page, SEL.asking);
  if (asking) return { state: "asking", detail: asking };
  const join = await anyVisible(page, SEL.joinButtons);
  if (join) return { state: "lobby", detail: join };
  return { state: "unknown", detail: "" };
}

/** Short visible text for logs (headings + buttons), never more than ~300 chars. */
async function visibleSummary(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => {
      const parts: string[] = [];
      document.querySelectorAll("h1, h2, [role=heading], button").forEach((el) => {
        const t = (el as HTMLElement).innerText?.trim();
        if (t && t.length < 60 && (el as HTMLElement).offsetParent !== null) parts.push(t.replace(/\s+/g, " "));
      });
      return Array.from(new Set(parts)).slice(0, 12).join(" | ").slice(0, 300);
    });
  } catch {
    return "";
  }
}

async function snapshot(page: Page, meetingId: string, label: string) {
  try {
    const file = storageDir("work", meetingId, `bot-${label}.png`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: false });
    return path.relative(process.cwd(), file);
  } catch {
    return null;
  }
}

/** Wait until the lobby is usable: a join button or the guest name box appears (Meet can take a while to load). */
async function waitForLobby(page: Page, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (page.url().includes("accounts.google.com")) return "sign_in" as const;
    if (await anyVisible(page, SEL.signIn)) return "sign_in" as const;
    if (await anyVisible(page, SEL.joinButtons)) return "ready" as const;
    if (await inCall(page)) return "in_call" as const;
    const denied = await anyVisible(page, SEL.denied);
    if (denied) return "denied" as const;
    await page.waitForTimeout(500);
  }
  return "timeout" as const;
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
    await jobLog(meetingId, "bot", "Opened Meet link, waiting for the lobby to load", { url: meeting.meetUrl });
    const lobby = await waitForLobby(page, 45_000);
    await jobLog(meetingId, "bot", `Lobby state: ${lobby}`, { screen: await visibleSummary(page) });
    if (lobby === "sign_in") throw new Error("This meeting requires a signed-in Google account. Run `npm run bot:login` first.");
    if (lobby === "denied") throw new Error("Google Meet refused entry before joining (link invalid or meeting locked)");
    if (lobby === "timeout") {
      const shot = await snapshot(page, meetingId, "lobby-timeout");
      throw new Error(`Could not find the Join / Ask to join button within 45s (is the link valid and the meeting open?)${shot ? ` — screenshot: ${shot}` : ""}`);
    }

    if (lobby === "ready") {
      await dismissDialogs(page);
      // Display name (shown to other participants) is only offered for guest joins.
      try {
        const name = page.locator(SEL.nameInput).first();
        if (await name.isVisible({ timeout: 1500 })) {
          await name.fill(e.BOT_NAME);
          await jobLog(meetingId, "bot", "Entered display name", { name: e.BOT_NAME });
        }
      } catch {
        /* signed-in accounts don't get a name box */
      }
      await muteDevices(page);
      await setStep(meetingId, "Asking to join");
      const clicked = await clickFirst(page, SEL.joinButtons, 4000);
      if (!clicked) throw new Error("Join / Ask to join button disappeared before it could be clicked");
      await jobLog(meetingId, "bot", `Clicked "${clicked.replace(/button:has-text\("|"\)/g, "")}"`);
    }

    // Wait for admission. The host must click Admit unless the meeting is open
    // to anyone with the link, in which case Meet drops us straight into the call.
    await setStep(meetingId, "Waiting to be admitted");
    const admitDeadline = Date.now() + e.BOT_ADMISSION_TIMEOUT_SECONDS * 1000;
    let admitted = lobby === "in_call";
    let lastState = "";
    let reAsked = 0;
    let deniedStreak = 0;
    while (!admitted && Date.now() < admitDeadline) {
      const { state, detail } = await lobbyState(page);
      deniedStreak = state === "denied" ? deniedStreak + 1 : 0;
      if (state !== lastState) {
        const remaining = Math.round((admitDeadline - Date.now()) / 1000);
        const msg =
          state === "asking" ? "waiting for host admission"
          : state === "in_call" ? "admitted"
          : state === "denied" ? "explicitly denied"
          : state === "no_response" ? "Meet reports no one responded to the join request"
          : state === "lobby" ? "back in the lobby (join button visible)"
          : state === "sign_in" ? "sign-in required"
          : "unrecognised screen";
        await jobLog(meetingId, "bot", `Lobby: ${msg}`, { state, detail, secondsLeft: remaining, screen: state === "unknown" ? await visibleSummary(page) : undefined });
        lastState = state;
      }
      if (state === "in_call") {
        admitted = true;
        break;
      }
      if (state === "denied" && deniedStreak >= 2) {
        await snapshot(page, meetingId, "denied");
        throw new Error(`The meeting host denied the bot's request to join (${detail.replace(/^text=/, "")})`);
      }
      if (state === "sign_in") throw new Error("This meeting requires a signed-in Google account. Run `npm run bot:login` first.");
      if (state === "no_response" || state === "lobby") {
        // Meet stopped asking on our behalf; ask again while time remains.
        if (reAsked >= 5) throw new Error("Join request expired repeatedly without an answer from the host");
        const clicked = await clickFirst(page, SEL.joinButtons, 3000);
        if (clicked) {
          reAsked += 1;
          await jobLog(meetingId, "bot", "Asked to join again", { attempt: reAsked });
          lastState = "";
        }
      }
      const fresh = await prisma.meeting.findUnique({ where: { id: meetingId }, select: { stopRequested: true } });
      if (fresh?.stopRequested) throw new Error("Stopped by user before admission");
      await page.waitForTimeout(1500);
    }
    if (!admitted) {
      await snapshot(page, meetingId, "admission-timeout");
      throw new Error(`timed out: not admitted within ${e.BOT_ADMISSION_TIMEOUT_SECONDS}s`);
    }
    await jobLog(meetingId, "bot", "admitted — inside the meeting");
    await page.waitForTimeout(1500); // let the in-call UI settle before capturing

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
    await jobLog(meetingId, "recording", provider.name === "mock" ? "recording started (MOCK provider, silent audio)" : "recording started (real tab audio)", { provider: provider.name });
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
