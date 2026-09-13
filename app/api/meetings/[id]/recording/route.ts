import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { handler, ok, type Params } from "@/server/http";
import { storageDir } from "@/server/env";
import { attachRecording, BadRequest, NotFound } from "@/server/meetings/service";
import { probeDuration } from "@/server/audio/ffmpeg";
import { prisma } from "@/server/db";
import { jobLog } from "@/server/db";

export const dynamic = "force-dynamic";
type Ctx = Params<{ id: string }>;

const ALLOWED = new Set([".wav", ".mp3", ".m4a", ".webm", ".ogg", ".flac"]);

/**
 * Attach a recording file to an existing meeting.
 * multipart/form-data: file, provider? (REAL | MOCK | IMPORT)
 *
 * Used by a bot worker that runs on a different machine than the web app
 * (WEB_BASE_URL set): the bot records and processes locally, then uploads the
 * audio here so the web app can stream playback and cut clips. Does not start
 * processing; the uploader owns that.
 */
export const POST = handler(async (req, { params }: Ctx) => {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({ where: { id }, select: { id: true } });
  if (!meeting) throw new NotFound(`Meeting ${id} not found`);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new BadRequest("Attach the audio file in the `file` field");
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) throw new BadRequest(`Unsupported audio type ${ext || "(none)"}`);
  if (file.size > 2 * 1024 * 1024 * 1024) throw new BadRequest("File larger than 2 GB");
  const providerRaw = String(form.get("provider") ?? "REAL").toUpperCase();
  const provider = providerRaw === "MOCK" ? "MOCK" : providerRaw === "IMPORT" ? "IMPORT" : "REAL";

  const dest = storageDir("recordings", `${id}${ext}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  let duration = 0;
  try {
    duration = await probeDuration(dest);
  } catch (e) {
    fs.rmSync(dest, { force: true });
    return NextResponse.json({ error: `Could not read audio: ${(e as Error).message}` }, { status: 400 });
  }
  await attachRecording(id, { absPath: dest, mimeType: file.type || `audio/${ext.slice(1)}`, duration, provider });
  await jobLog(id, "recording", "Recording uploaded to the web app", { bytes: file.size, provider });
  return ok({ id, duration, bytes: file.size }, { status: 201 });
});
