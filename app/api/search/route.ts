import { handler, ok } from "@/server/http";
import { search } from "@/server/meetings/service";

export const dynamic = "force-dynamic";

/** GET /api/search?q= — meetings (title, participants, topics, decisions, action items), transcript lines, highlights. */
export const GET = handler(async (req) => {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return ok(await search(q));
});
