import os from "node:os";
import { env } from "../server/env";
import { assertDatabase, prisma } from "../server/db";
import { claimNextBotJob } from "../server/meetings/state";
import { log } from "../server/logger";
import { loginFlow, runMeetingJob } from "./meet";

/**
 * Bot worker: `npm run bot`
 *   Polls the database for meetings in BOT_REQUESTED, claims one atomically,
 *   joins the Google Meet, records, then triggers processing. One meeting at a
 *   time per worker; run several workers for parallel meetings.
 *
 * `npm run bot:login` opens the persistent browser profile so you can sign the
 * bot's Google account in once. No credentials ever pass through this code.
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--login")) {
    await loginFlow();
    return;
  }
  const e = env();
  await assertDatabase();
  const workerId = `${os.hostname()}-${process.pid}`;
  const headless = args.includes("--headless");
  log.info("bot", "Bot worker started", { workerId, provider: e.RECORDING_PROVIDER, browser: e.BOT_BROWSER_CHANNEL, pollMs: e.BOT_POLL_MS, headless });
  if (e.RECORDING_PROVIDER === "mock") log.warn("bot", "RECORDING_PROVIDER=mock: recordings will be silent placeholders");

  let stopping = false;
  const onSignal = () => {
    stopping = true;
    log.info("bot", "shutting down after the current job");
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  while (!stopping) {
    try {
      const job = await claimNextBotJob(workerId);
      if (job) {
        log.info("bot", "claimed meeting", { meetingId: job.id, title: job.title });
        await runMeetingJob(job.id, { workerId, headless });
        continue;
      }
    } catch (err) {
      log.error("bot", "poll failed", { error: (err as Error).message });
    }
    await new Promise((r) => setTimeout(r, e.BOT_POLL_MS));
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  log.error("bot", "fatal", { error: (err as Error).message });
  process.exit(1);
});
