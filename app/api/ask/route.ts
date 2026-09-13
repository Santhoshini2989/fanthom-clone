import { NextResponse } from "next/server";
import { z } from "zod";
import { handler, ok, readJson } from "@/server/http";
import { hasGeminiKey } from "@/server/env";
import { askOverTranscripts } from "@/server/ai/analyze";
import { prisma } from "@/server/db";
import { search } from "@/server/meetings/service";

export const dynamic = "force-dynamic";

/**
 * Account-wide Ask Fathom: picks the most relevant completed meetings (by
 * keyword hits, else the most recent) and asks Gemini over their transcripts.
 */
export const POST = handler(async (req) => {
  const { question, meetingIds } = z.object({ question: z.string().min(2).max(1000), meetingIds: z.array(z.string()).optional() }).parse(await readJson(req));
  if (!hasGeminiKey()) return NextResponse.json({ error: "GEMINI_API_KEY is not set.", code: "GEMINI_KEY_MISSING" }, { status: 503 });
  let ids = meetingIds ?? [];
  if (!ids.length) {
    const hits = await search(question, 30);
    ids = Array.from(new Set(hits.map((h) => h.meetingId))).slice(0, 4);
  }
  if (!ids.length) {
    const recent = await prisma.meeting.findMany({ where: { status: "COMPLETED" }, orderBy: { startedAt: "desc" }, take: 3, select: { id: true } });
    ids = recent.map((r) => r.id);
  }
  const rows = await prisma.meeting.findMany({
    where: { id: { in: ids } },
    include: { transcript: { include: { speakers: true, segments: { where: { trimmed: false }, orderBy: { index: "asc" } } } } },
  });
  const sources = rows
    .filter((r) => r.transcript?.segments.length)
    .map((r) => ({
      meetingId: r.id,
      title: r.title,
      speakerNames: Object.fromEntries(r.transcript!.speakers.map((s) => [s.id, s.name])),
      segments: r.transcript!.segments.map((s) => ({ speaker: s.speakerId, start: s.start, end: s.end, text: s.text })),
    }));
  if (!sources.length) return ok({ answer: "There are no transcribed meetings to search yet.", citations: [] });
  return ok(await askOverTranscripts(question, sources));
});
