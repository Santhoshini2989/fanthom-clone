import { handler, type Params } from "@/server/http";
import { clipFile } from "@/server/meetings/service";
import { streamFile } from "@/server/stream";

export const dynamic = "force-dynamic";

export const GET = handler(async (req, { params }: Params<{ id: string }>) => {
  const { abs, mimeType, size, clip } = await clipFile((await params).id);
  const download = new URL(req.url).searchParams.get("download");
  return streamFile(req, abs, mimeType, size, download ? { "Content-Disposition": `attachment; filename="${clip.title.replace(/[^\w.-]+/g, "_")}.mp3"` } : {});
});
