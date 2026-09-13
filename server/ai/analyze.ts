import { env } from "../env";
import { log } from "../logger";
import { generateJson, generateText } from "./gemini";
import {
  ANALYSIS_JSON_SCHEMA,
  AnalysisSchema,
  TEMPLATE_SUMMARY_JSON_SCHEMA,
  TemplateSummarySchema,
  type Analysis,
  type TemplateSummary,
  type TranscriptSegmentOut,
} from "./schemas";
import { templateById } from "@/data/templates";

/**
 * Transcript → structured meeting intelligence with gemini-2.5-flash.
 * Output is forced to JSON via responseSchema, validated with zod, and
 * repaired once with the validation errors fed back before giving up.
 */

const SYSTEM = `You are Fathom's meeting intelligence engine. You analyse ONLY the transcript you are given.
Rules:
- Never invent facts, participants, decisions, action items, dates or numbers that are not in the transcript.
- Distinguish explicit decisions ("we'll go with X", "agreed", "decision:") from suggestions or open questions. Mark confidence "explicit" or "implied".
- Action items must be concrete commitments; use the speaker's own words for the task; assignee only if the transcript names or clearly implies the person; dueDate only if stated (keep the phrasing used, e.g. "Friday", "July 7th").
- Every timestamp must be the "start" time (seconds) of the transcript line the item comes from. Use null when unsure.
- Highlights are the 3–8 most important moments (decisions, commitments, strong reactions, risks, customer signals). startTime/endTime must span the actual lines; keep each under 90 seconds.
- Be concise. No repetition across sections. Plain language, no markdown.
- If speakers are labelled speaker_1, speaker_2… and the transcript reveals their names (e.g. "Thanks Marcus"), map them in speakerNames; otherwise return null names.
- Return valid JSON only.`;

export function formatTranscript(segments: { speaker: string; start: number; text: string }[], speakerNames?: Record<string, string>): string {
  const clock = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  return segments.map((s) => `[${clock(s.start)} | ${s.start.toFixed(1)}s] ${speakerNames?.[s.speaker] ?? s.speaker}: ${s.text}`).join("\n");
}

function analysisPrompt(transcript: string, ctx: { title?: string; participants?: string[]; durationSeconds: number }) {
  return `Meeting title: ${ctx.title ?? "(unknown)"}
Known participants: ${ctx.participants?.length ? ctx.participants.join(", ") : "(unknown)"}
Recording length: ${Math.round(ctx.durationSeconds)} seconds

Transcript (each line: [MM:SS | seconds] speaker: text):
${transcript}

Produce the JSON analysis. "summary" is 3–6 key takeaways; "meetingPurpose" is one sentence; "topics" groups the discussion (2–6 topics, 2–5 bullets each); "decisions", "actionItems", "followUps", "highlights", "questions" as instructed. If the transcript is trivial or empty, return empty arrays rather than inventing content.`;
}

const MAX_TRANSCRIPT_CHARS = 350_000; // ~90k tokens, well inside 2.5-flash context

export async function analyzeTranscript(
  segments: TranscriptSegmentOut[],
  ctx: { title?: string; participants?: string[]; durationSeconds: number; speakerNames?: Record<string, string> },
): Promise<Analysis> {
  let text = formatTranscript(segments, ctx.speakerNames);
  if (text.length > MAX_TRANSCRIPT_CHARS) {
    log.warn("analysis", "transcript very long; truncating for analysis", { chars: text.length });
    text = text.slice(0, MAX_TRANSCRIPT_CHARS);
  }
  const model = env().GEMINI_ANALYSIS_MODEL;
  const prompt = analysisPrompt(text, ctx);
  log.info("analysis", "generating meeting intelligence", { model, segments: segments.length });

  let raw = await generateJson(model, prompt, ANALYSIS_JSON_SCHEMA, { systemInstruction: SYSTEM, temperature: 0.2 });
  let parsed = AnalysisSchema.safeParse(normalizeAnalysis(raw));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    log.warn("analysis", "invalid JSON from model, attempting repair", { issues: issues.slice(0, 300) });
    raw = await generateJson(
      model,
      `${prompt}\n\nYour previous answer failed validation with: ${issues}\nReturn corrected JSON that satisfies the schema exactly.`,
      ANALYSIS_JSON_SCHEMA,
      { systemInstruction: SYSTEM, temperature: 0.1 },
    );
    parsed = AnalysisSchema.safeParse(normalizeAnalysis(raw));
    if (!parsed.success) throw new Error(`Gemini analysis failed validation: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  const result = clampTimestamps(parsed.data, ctx.durationSeconds);
  log.info("analysis", "completed", { topics: result.topics.length, decisions: result.decisions.length, actionItems: result.actionItems.length, highlights: result.highlights.length });
  return result;
}

/** Coerce common model deviations (strings for numbers, missing arrays) before validation. */
export function normalizeAnalysis(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const r = { ...(raw as Record<string, unknown>) };
  const num = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/s$/, ""));
    return Number.isFinite(n) ? n : null;
  };
  const fixBullets = (arr: unknown) => (Array.isArray(arr) ? arr.map((b) => (typeof b === "string" ? { text: b } : { ...(b as object), timestamp: num((b as { timestamp?: unknown }).timestamp) })) : []);
  r.summary = fixBullets(r.summary);
  r.topics = Array.isArray(r.topics) ? r.topics.map((t) => ({ ...(t as object), bullets: fixBullets((t as { bullets?: unknown }).bullets) })) : [];
  r.decisions = fixBullets(r.decisions);
  r.followUps = fixBullets(r.followUps);
  r.questions = fixBullets(r.questions);
  r.actionItems = Array.isArray(r.actionItems) ? r.actionItems.map((a) => ({ ...(a as object), timestamp: num((a as { timestamp?: unknown }).timestamp) })) : [];
  r.highlights = Array.isArray(r.highlights)
    ? r.highlights
        .map((h) => ({ ...(h as object), startTime: num((h as { startTime?: unknown }).startTime) ?? 0, endTime: num((h as { endTime?: unknown }).endTime) ?? 0 }))
        .filter((h) => (h as { text?: string }).text)
    : [];
  if (typeof r.meetingPurpose !== "string" || !r.meetingPurpose) r.meetingPurpose = "Meeting summary.";
  return r;
}

function clampTimestamps(a: Analysis, duration: number): Analysis {
  const c = (t: number | null | undefined) => (t === null || t === undefined ? t : Math.min(Math.max(0, t), Math.max(0, duration)));
  return {
    ...a,
    summary: a.summary.map((b) => ({ ...b, timestamp: c(b.timestamp) })),
    topics: a.topics.map((t) => ({ ...t, bullets: t.bullets.map((b) => ({ ...b, timestamp: c(b.timestamp) })) })),
    decisions: a.decisions.map((d) => ({ ...d, timestamp: c(d.timestamp) })),
    actionItems: a.actionItems.map((x) => ({ ...x, timestamp: c(x.timestamp) })),
    followUps: a.followUps.map((x) => ({ ...x, timestamp: c(x.timestamp) })),
    highlights: a.highlights
      .map((h) => ({ ...h, startTime: c(h.startTime) ?? 0, endTime: Math.max(c(h.endTime) ?? 0, (c(h.startTime) ?? 0) + 3) }))
      .filter((h) => h.endTime > h.startTime),
    questions: a.questions?.map((q) => ({ ...q, timestamp: c(q.timestamp) })),
  };
}

/** Summary in a specific Fathom template (Sales, Q&A, …) with optional user instructions. */
export async function summarizeWithTemplate(
  segments: TranscriptSegmentOut[],
  templateId: string,
  ctx: { title?: string; speakerNames?: Record<string, string>; instructions?: string; language?: string },
): Promise<TemplateSummary> {
  const t = templateById(templateId);
  const guide = TEMPLATE_GUIDES[templateId] ?? TEMPLATE_GUIDES.general!;
  const prompt = `Meeting title: ${ctx.title ?? "(unknown)"}
Template: ${t.name} — ${t.description}
Required sections, in order: ${guide}
${ctx.instructions ? `Additional user instructions (follow them where they don't conflict with the rules): ${ctx.instructions}` : ""}
${ctx.language && ctx.language !== "en" ? `Write the summary in ${ctx.language}.` : ""}

Transcript:
${formatTranscript(segments, ctx.speakerNames).slice(0, MAX_TRANSCRIPT_CHARS)}

Return JSON: { "sections": [ { "heading", "paragraph"?, "bullets"?: [ { "lead"?, "text", "timestamp"? } ] } ] }. Use "lead" for a short bold label ending with a colon. Timestamps are the seconds value of the source line.`;
  const raw = await generateJson(env().GEMINI_ANALYSIS_MODEL, prompt, TEMPLATE_SUMMARY_JSON_SCHEMA, { systemInstruction: SYSTEM, temperature: 0.2 });
  const parsed = TemplateSummarySchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Template summary failed validation: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  return parsed.data;
}

const TEMPLATE_GUIDES: Record<string, string> = {
  general: "Meeting Purpose (paragraph); Key Takeaways (bullets with bold leads); Topics (one section per topic with bullets); Next Steps (bullets).",
  chronological: "One section per chapter of the meeting in time order, heading = 'MM:SS – chapter title', paragraph = short summary.",
  sales: "Prospect's Needs; Challenges; Buying Journey (Champion, Technical evaluator, Economic buyer, Timeline as leads); Pricing Discussed; Next Steps.",
  sales_sandler: "Pain; Budget; Decision; Fulfillment; Next Steps.",
  sales_spiced: "Situation (paragraph); Pain; Impact; Critical Event; Decision.",
  sales_meddpicc: "Metrics; Economic Buyer; Decision Criteria; Decision Process; Paper Process; Identify Pain; Champion; Competition.",
  sales_bant: "Budget; Authority; Need; Timeline; Next Steps.",
  qa: "Questions & Answers: one bullet per question, lead = the question, text = the answer given.",
  demo: "Demo Overview; Features Shown; Customer Reactions; Objections; Next Steps.",
  customer_success: "Customer Experience; Challenges; Goals; Questions & Answers; Next Steps.",
  customer_success_reach: "Relationship; Expansion; Adoption; Concerns; Handoffs.",
  one_on_one: "Updates; Priorities; Support Signals; Discussion; Next Steps.",
  project_update: "One section per workstream with leads Status:, Discussion:, Next steps:.",
  project_kickoff: "Vision; Targets; Resources; Risks; Next Steps.",
  candidate_interview: "Experience; Goals; Responses to Key Questions; Strengths; Concerns; Recommendation.",
  retrospective: "Start; Stop; Continue; Action Items.",
};

/** Ask Fathom: answer a question over one or many transcripts, citing seconds. */
export async function askOverTranscripts(question: string, sources: { meetingId: string; title: string; segments: TranscriptSegmentOut[]; speakerNames?: Record<string, string> }[]): Promise<{ answer: string; citations: { meetingId: string; at: number; label: string }[] }> {
  const budget = Math.floor(MAX_TRANSCRIPT_CHARS / Math.max(1, sources.length));
  const context = sources.map((s) => `### Meeting ${s.meetingId}: ${s.title}\n${formatTranscript(s.segments, s.speakerNames).slice(0, budget)}`).join("\n\n");
  const prompt = `Answer the question using ONLY these meeting transcripts. Cite moments as [[meetingId@seconds]] right after the sentence they support (use the seconds value from the transcript line). If the transcripts don't contain the answer, say so plainly. Be concise (max 6 sentences).

${context}

Question: ${question}`;
  const text = await generateText(env().GEMINI_ANALYSIS_MODEL, prompt, { systemInstruction: "You are Ask Fathom, a precise assistant that answers from meeting transcripts and never invents facts." });
  const citations: { meetingId: string; at: number; label: string }[] = [];
  const answer = text
    .replace(/\[\[([^\]@]+)@(\d+(?:\.\d+)?)s?\]\]/g, (_, id: string, at: string) => {
      const src = sources.find((s) => s.meetingId === id.trim());
      if (src) citations.push({ meetingId: src.meetingId, at: Number(at), label: src.title });
      return "";
    })
    .replace(/\s{2,}/g, " ")
    .trim();
  return { answer, citations: citations.slice(0, 6) };
}
