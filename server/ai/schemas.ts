import { z } from "zod";

/** A transcript segment as produced by the transcription pipeline. */
export const TranscriptSegmentSchema = z.object({
  speaker: z.string().min(1), // diarization label, e.g. "speaker_1"
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string().min(1),
});
export type TranscriptSegmentOut = z.infer<typeof TranscriptSegmentSchema>;

export const TranscriptSchema = z.object({
  language: z.string().default("en"),
  segments: z.array(TranscriptSegmentSchema),
});
export type TranscriptOut = z.infer<typeof TranscriptSchema>;

/**
 * Structured meeting intelligence returned by Gemini. Timestamps are seconds
 * into the recording. Everything here is validated before it touches the DB.
 */
const Timestamp = z.number().min(0).nullable().optional();

export const BulletSchema = z.object({
  text: z.string().min(1),
  timestamp: Timestamp,
});

export const AnalysisSchema = z.object({
  meetingPurpose: z.string().min(1),
  summary: z.array(BulletSchema).min(1).max(12),
  topics: z
    .array(
      z.object({
        title: z.string().min(1),
        bullets: z.array(BulletSchema).min(1).max(8),
      }),
    )
    .max(12),
  decisions: z.array(z.object({ text: z.string().min(1), timestamp: Timestamp, confidence: z.enum(["explicit", "implied"]).optional() })).max(20),
  actionItems: z
    .array(
      z.object({
        task: z.string().min(1),
        assignee: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        timestamp: Timestamp,
      }),
    )
    .max(30),
  followUps: z.array(z.object({ text: z.string().min(1), timestamp: Timestamp })).max(20),
  highlights: z
    .array(
      z.object({
        startTime: z.number().min(0),
        endTime: z.number().min(0),
        reason: z.string().min(1),
        text: z.string().min(1),
        type: z.enum(["highlight", "positive_reaction", "needs_review", "feedback"]).optional(),
      }),
    )
    .max(12),
  questions: z.array(z.object({ text: z.string().min(1), timestamp: Timestamp, askedBy: z.string().nullable().optional() })).max(20).optional(),
  speakerNames: z.array(z.object({ label: z.string(), name: z.string().nullable() })).optional(),
  title: z.string().nullable().optional(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** JSON Schema handed to Gemini as `responseSchema` (mirrors AnalysisSchema). */
export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", nullable: true },
    meetingPurpose: { type: "string" },
    summary: { type: "array", items: { type: "object", properties: { text: { type: "string" }, timestamp: { type: "number", nullable: true } }, required: ["text"] } },
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          bullets: { type: "array", items: { type: "object", properties: { text: { type: "string" }, timestamp: { type: "number", nullable: true } }, required: ["text"] } },
        },
        required: ["title", "bullets"],
      },
    },
    decisions: { type: "array", items: { type: "object", properties: { text: { type: "string" }, timestamp: { type: "number", nullable: true }, confidence: { type: "string", enum: ["explicit", "implied"] } }, required: ["text"] } },
    actionItems: {
      type: "array",
      items: {
        type: "object",
        properties: { task: { type: "string" }, assignee: { type: "string", nullable: true }, dueDate: { type: "string", nullable: true }, timestamp: { type: "number", nullable: true } },
        required: ["task"],
      },
    },
    followUps: { type: "array", items: { type: "object", properties: { text: { type: "string" }, timestamp: { type: "number", nullable: true } }, required: ["text"] } },
    highlights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          startTime: { type: "number" },
          endTime: { type: "number" },
          reason: { type: "string" },
          text: { type: "string" },
          type: { type: "string", enum: ["highlight", "positive_reaction", "needs_review", "feedback"] },
        },
        required: ["startTime", "endTime", "reason", "text"],
      },
    },
    questions: { type: "array", items: { type: "object", properties: { text: { type: "string" }, timestamp: { type: "number", nullable: true }, askedBy: { type: "string", nullable: true } }, required: ["text"] } },
    speakerNames: { type: "array", items: { type: "object", properties: { label: { type: "string" }, name: { type: "string", nullable: true } }, required: ["label"] } },
  },
  required: ["meetingPurpose", "summary", "topics", "decisions", "actionItems", "followUps", "highlights"],
} as const;

/** Alternative-template summaries (Sales, Q&A, …) share a looser section shape. */
export const TemplateSummarySchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        paragraph: z.string().nullable().optional(),
        bullets: z.array(z.object({ lead: z.string().nullable().optional(), text: z.string().min(1), timestamp: Timestamp })).optional(),
      }),
    )
    .min(1)
    .max(12),
});
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;

export const TEMPLATE_SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          paragraph: { type: "string", nullable: true },
          bullets: { type: "array", items: { type: "object", properties: { lead: { type: "string", nullable: true }, text: { type: "string" }, timestamp: { type: "number", nullable: true } }, required: ["text"] } },
        },
        required: ["heading"],
      },
    },
  },
  required: ["sections"],
} as const;
