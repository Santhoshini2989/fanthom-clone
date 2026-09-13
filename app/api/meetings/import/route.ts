import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { handler, ok } from "@/server/http";
import { storageDir } from "@/server/env";
import { attachRecording, createMeeting, BadRequest } from "@/server/meetings/service";
import { probeDuration } from "@/server/audio/ffmpeg";
import { processMeeting } from "@/server/pipeline/process";
import { prisma } from "@/server/db";
import { transition } from "@/server/meetings/state";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".webm", ".mp4"]);

/**
 * Import an existing audio file as a meeting and run the pipeline on it.
 * multipart/form-data: file (audio), title?
 * This is how the transcription + analysis pipeline is exercised without a
 * live Google Meet.
 */
export const POST = handler(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new BadRequest("Attach an audio file in the `file` field");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) throw new BadRequest(`Unsupported audio type ${ext || "(none)"}. Use wav, mp3, m4a, aac, ogg, opus, flac, webm or mp4.`);
  if (file.size > 2 * 1024 * 1024 * 1024) throw new BadRequest("File larger than 2 GB");

  const title = String(form.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
  const meeting = await createMeeting({ title, startNow: false });
  const dest = storageDir("recordings", `${meeting.id}${ext}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  let duration = 0;
  try {
    duration = await probeDuration(dest);
  } catch (e) {
    await prisma.meeting.delete({ where: { id: meeting.id } });
    fs.rmSync(dest, { force: true });
    return NextResponse.json({ error: `Could not read audio: ${(e as Error).message}` }, { status: 400 });
  }
  await attachRecording(meeting.id, { absPath: dest, mimeType: file.type || `audio/${ext.slice(1)}`, duration, provider: "IMPORT" });
  await transition(meeting.id, "PROCESSING", { step: "Queued", stage: "api" });
  void processMeeting(meeting.id);
  return ok({ id: meeting.id }, { status: 202 });
});
