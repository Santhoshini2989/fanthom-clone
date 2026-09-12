import type { Meeting, Summary } from "@/data/types";
import { formatClock, formatDurationWords, formatMonthDay } from "./utils";

/**
 * Formats a summary the way Fathom's "Copy Summary" does (verified from the
 * pasted output): "<Title> - <Month Day>", a "VIEW RECORDING - N mins (M
 * highlights)" line, then each section with headings and bullets. With links,
 * bullets carry a timestamp link into the recording.
 */
export function summaryToText(meeting: Meeting, summary: Summary, opts: { links: boolean; origin?: string }): string {
  const origin = opts.origin ?? "";
  const link = (at?: number) => (opts.links && at !== undefined ? ` (${origin}/share/${meeting.id}?t=${Math.round(at)})` : "");
  const lines: string[] = [];
  lines.push(`${meeting.title} - ${formatMonthDay(meeting.startedAt)}`);
  lines.push("");
  const hl = meeting.highlights.length;
  lines.push(
    `VIEW RECORDING - ${formatDurationWords(meeting.duration)} (${hl === 0 ? "No highlights" : `${hl} highlight${hl === 1 ? "" : "s"}`})${opts.links ? `: ${origin}/share/${meeting.id}` : ""}`,
  );
  lines.push("");
  for (const sec of summary.sections) {
    lines.push(sec.heading);
    if (sec.paragraph) {
      lines.push(sec.paragraph);
    }
    for (const b of sec.bullets ?? []) {
      lines.push(`- ${b.lead ? `${b.lead} ` : ""}${b.text}${link(b.at)}`);
    }
    for (const tp of sec.topics ?? []) {
      lines.push("");
      lines.push(tp.title);
      for (const b of tp.bullets) lines.push(`- ${b.lead ? `${b.lead} ` : ""}${b.text}${link(b.at)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function actionItemsToText(meeting: Meeting, assignee: (id?: string) => string): string {
  return meeting.actionItems
    .map((a) => `- [${a.done ? "x" : " "}] ${a.text}${a.assigneeId ? ` — ${assignee(a.assigneeId)}` : ""}${a.at !== undefined ? ` (${formatClock(a.at)})` : ""}`)
    .join("\n");
}

/** Follow-up email draft generated from action items (verified feature: "AI follow-up emails"). */
export function followUpEmail(meeting: Meeting, assignee: (id?: string) => string): string {
  const items = meeting.actionItems.map((a) => `• ${a.text}${a.assigneeId ? ` (${assignee(a.assigneeId)})` : ""}`).join("\n");
  const purpose = meeting.summaries.general?.sections.find((s) => s.heading === "Meeting Purpose")?.paragraph ?? "";
  return `Subject: Follow-up: ${meeting.title}\n\nHi all,\n\nThanks for your time today. ${purpose}\n\nHere's what we agreed to:\n${items}\n\nLet me know if I missed anything.\n\nBest,\nNancy`;
}
