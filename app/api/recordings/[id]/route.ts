import { handler, type Params } from "@/server/http";
import { recordingFile } from "@/server/meetings/service";
import { streamFile } from "@/server/stream";

export const dynamic = "force-dynamic";

/** Stream the local recording for a meeting (Range requests supported for seeking). */
export const GET = handler(async (req, { params }: Params<{ id: string }>) => {
  const { abs, mimeType, size } = await recordingFile((await params).id);
  return streamFile(req, abs, mimeType, size);
});
