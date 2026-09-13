import { handler, ok } from "@/server/http";
import { assertDatabase } from "@/server/db";
import { hasGeminiKey } from "@/server/env";
import { ffmpegAvailable } from "@/server/audio/ffmpeg";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  let db = true;
  let dbError: string | undefined;
  try {
    await assertDatabase();
  } catch (e) {
    db = false;
    dbError = (e as Error).message;
  }
  return ok({ ok: db, db, dbError, gemini: hasGeminiKey(), ffmpeg: ffmpegAvailable() });
});
