import type { Highlight, Meeting, TranscriptSegment } from "@/data/types";
import { userById } from "@/data/users";

export interface MeetingHit {
  kind: "meeting";
  meeting: Meeting;
  score: number;
  matchedOn: "title" | "attendee" | "summary";
}
export interface TranscriptHit {
  kind: "transcript";
  meeting: Meeting;
  segment: TranscriptSegment;
  score: number;
  snippet: string;
}
export interface HighlightHit {
  kind: "highlight";
  meeting: Meeting;
  highlight: Highlight;
  score: number;
}
export type SearchHit = MeetingHit | TranscriptHit | HighlightHit;

const norm = (s: string) => s.toLowerCase();

function terms(q: string) {
  return norm(q)
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9'&-]/g, ""))
    .filter((t) => t.length > 1);
}

function snippetAround(text: string, term: string, radius = 70): string {
  const i = norm(text).indexOf(term);
  if (i < 0) return text.slice(0, radius * 2);
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + term.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

export function searchMeetings(meetings: Meeting[], query: string, limit = 40): SearchHit[] {
  const ts = terms(query);
  if (!ts.length) return [];
  const hits: SearchHit[] = [];

  for (const m of meetings) {
    if (m.status !== "ready") continue;
    const title = norm(m.title);
    const attendees = m.attendeeIds.map((id) => norm(userById(id).name)).join(" ");
    const titleScore = ts.filter((t) => title.includes(t)).length;
    const attScore = ts.filter((t) => attendees.includes(t)).length;
    const summaryText = norm(
      Object.values(m.summaries)
        .flatMap((s) => s.sections)
        .flatMap((sec) => [
          sec.paragraph ?? "",
          ...(sec.bullets ?? []).map((b) => `${b.lead ?? ""} ${b.text}`),
          ...(sec.topics ?? []).flatMap((tp) => [tp.title, ...tp.bullets.map((b) => b.text)]),
        ])
        .join(" "),
    );
    const sumScore = ts.filter((t) => summaryText.includes(t)).length;
    if (titleScore === ts.length) hits.push({ kind: "meeting", meeting: m, score: 100 + titleScore, matchedOn: "title" });
    else if (attScore === ts.length) hits.push({ kind: "meeting", meeting: m, score: 80, matchedOn: "attendee" });
    else if (sumScore === ts.length) hits.push({ kind: "meeting", meeting: m, score: 60, matchedOn: "summary" });

    for (const seg of m.transcript) {
      const text = norm(seg.text);
      const matched = ts.filter((t) => text.includes(t)).length;
      if (matched === ts.length) {
        hits.push({ kind: "transcript", meeting: m, segment: seg, score: 40 + matched, snippet: snippetAround(seg.text, ts[0]!) });
      }
    }
    for (const h of m.highlights) {
      const text = norm(h.title);
      if (ts.every((t) => text.includes(t))) hits.push({ kind: "highlight", meeting: m, highlight: h, score: 50 });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Deterministic "Ask Fathom" answer generator over mock data. Finds the
 * transcript passages most related to the question and composes an answer with
 * timestamp citations so the UI can jump to moments. Purely local.
 */
export function askFathom(meetings: Meeting[], question: string, scope: "meeting" | "all" = "all") {
  const ts = terms(question).filter((t) => !STOP.has(t));
  const ranked: { meeting: Meeting; seg: TranscriptSegment; score: number }[] = [];
  for (const m of meetings) {
    if (m.status !== "ready") continue;
    for (const seg of m.transcript) {
      const text = norm(seg.text);
      const score = ts.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
      if (score > 0) ranked.push({ meeting: m, seg, score: score + Math.min(seg.text.length, 400) / 4000 });
    }
  }
  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  if (!top.length) {
    return {
      answer:
        scope === "meeting"
          ? "I couldn't find anything in this meeting about that. Try asking about a topic, decision, or person who was discussed."
          : "I couldn't find anything about that across your meetings. Try a different phrasing, a topic, or an attendee's name.",
      citations: [] as { meetingId: string; at: number; label: string }[],
    };
  }
  const speakerName = (m: Meeting, id: string) => m.speakers.find((s) => s.id === id)?.name.split(" ")[0] ?? "Someone";
  const sentences = top.map(({ meeting, seg }) => {
    const first = seg.text.split(/(?<=[.!?])\s+/)[0] ?? seg.text;
    const who = speakerName(meeting, seg.speakerId);
    return scope === "meeting" ? `${who} said: "${first}"` : `In "${meeting.title}", ${who} said: "${first}"`;
  });
  const answer = `${sentences.join(" ")}${top.length > 1 ? " These were the most relevant moments." : ""}`;
  return {
    answer,
    citations: top.map(({ meeting, seg }) => ({ meetingId: meeting.id, at: seg.start, label: meeting.title })),
  };
}

const STOP = new Set([
  "the", "and", "for", "what", "when", "who", "did", "does", "was", "were", "about", "that", "this", "with",
  "how", "are", "our", "you", "your", "they", "them", "their", "any", "have", "has", "had", "say", "said",
  "which", "where", "why", "from", "into", "meeting", "meetings", "call", "calls",
]);
