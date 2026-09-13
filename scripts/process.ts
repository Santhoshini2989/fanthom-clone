import fs from "node:fs";
import path from "node:path";
import { assertDatabase, prisma } from "../server/db";
import { storageDir } from "../server/env";
import { attachRecording, createMeeting } from "../server/meetings/service";
import { transition } from "../server/meetings/state";
import { processMeeting } from "../server/pipeline/process";
import { probeDuration } from "../server/audio/ffmpeg";
import { log } from "../server/logger";

/**
 * `npm run process -- <meetingId>`             re-run transcription + analysis
 * `npm run process -- <audio file> [title]`    import a local recording as a new meeting
 */
async function main() {
  const [target, ...rest] = process.argv.slice(2);
  if (!target) {
    console.log("usage: npm run process -- <meetingId | path/to/audio> [title]");
    process.exit(1);
  }
  await assertDatabase();
  let id = target;
  if (fs.existsSync(target)) {
    const abs = path.resolve(target);
    const title = rest.join(" ") || path.basename(abs, path.extname(abs));
    const meeting = await createMeeting({ title, startNow: false });
    id = meeting.id;
    const dest = storageDir("recordings", `${id}${path.extname(abs).toLowerCase()}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(abs, dest);
    const duration = await probeDuration(dest);
    await attachRecording(id, { absPath: dest, mimeType: mimeFor(dest), duration, provider: "IMPORT" });
    log.info("pipeline", "imported file", { meetingId: id, seconds: Math.round(duration) });
  } else {
    const row = await prisma.meeting.findUnique({ where: { id }, include: { recording: true } });
    if (!row) throw new Error(`Meeting ${id} not found`);
    if (!row.recording) throw new Error(`Meeting ${id} has no recording to process`);
  }
  await transition(id, "PROCESSING", { step: "Queued from CLI", stage: "pipeline" });
  await processMeeting(id);
  const final = await prisma.meeting.findUnique({ where: { id }, select: { status: true, errorMessage: true } });
  log.info("pipeline", "done", { meetingId: id, status: final?.status, error: final?.errorMessage ?? undefined });
  await prisma.$disconnect();
  process.exit(final?.status === "COMPLETED" ? 0 : 2);
}

function mimeFor(file: string) {
  const ext = path.extname(file).toLowerCase();
  const map: Record<string, string> = { ".wav": "audio/wav", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".webm": "audio/webm", ".ogg": "audio/ogg", ".mp4": "video/mp4", ".flac": "audio/flac" };
  return map[ext] ?? "application/octet-stream";
}

main().catch((e) => {
  log.error("pipeline", "failed", { error: (e as Error).message });
  process.exit(1);
});
