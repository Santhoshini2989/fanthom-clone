import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalysisSchema } from "@/server/ai/schemas";
import { extractJson } from "@/server/ai/gemini";

// Gemini is never called in tests: generateJson is replaced per test.
const generateJson = vi.fn();
vi.mock("@/server/ai/gemini", async (orig) => ({ ...(await orig<typeof import("@/server/ai/gemini")>()), generateJson: (...a: unknown[]) => generateJson(...a) }));

import { analyzeTranscript, normalizeAnalysis } from "@/server/ai/analyze";

const segments = [
  { speaker: "speaker_1", start: 0, end: 4, text: "Let's decide on the launch date." },
  { speaker: "speaker_2", start: 5, end: 9, text: "I'll ship the beta by Friday." },
];

const good = {
  meetingPurpose: "Plan the launch.",
  summary: [{ text: "Launch date discussed", timestamp: 0 }],
  topics: [{ title: "Launch", bullets: [{ text: "Beta by Friday", timestamp: 5 }] }],
  decisions: [{ text: "Beta ships Friday", timestamp: 5, confidence: "explicit" }],
  actionItems: [{ task: "Ship the beta", assignee: "speaker_2", dueDate: "Friday", timestamp: 5 }],
  followUps: [],
  highlights: [{ startTime: 5, endTime: 9, reason: "Commitment", text: "I'll ship the beta by Friday.", type: "highlight" }],
};

describe("analysis validation", () => {
  beforeEach(() => generateJson.mockReset());

  it("accepts a well-formed response", () => {
    expect(AnalysisSchema.safeParse(good).success).toBe(true);
  });

  it("normalizes strings-as-numbers and bare bullet strings before validating", () => {
    const messy = { ...good, summary: ["Launch date discussed"], actionItems: [{ task: "Ship", timestamp: "5s" }], highlights: [{ startTime: "5", endTime: "9", reason: "r", text: "t" }] };
    const parsed = AnalysisSchema.safeParse(normalizeAnalysis(messy));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.summary[0].text).toBe("Launch date discussed");
      expect(parsed.data.actionItems[0].timestamp).toBe(5);
      expect(parsed.data.highlights[0].startTime).toBe(5);
    }
  });

  it("rejects hallucinated shapes", () => {
    expect(AnalysisSchema.safeParse({ ...good, summary: [] }).success).toBe(false);
    expect(AnalysisSchema.safeParse({ ...good, decisions: [{ text: "", timestamp: -1 }] }).success).toBe(false);
  });

  it("analyzeTranscript clamps timestamps to the recording length and retries once on invalid JSON", async () => {
    generateJson.mockResolvedValueOnce({ nonsense: true }).mockResolvedValueOnce({ ...good, highlights: [{ ...good.highlights[0], startTime: 5, endTime: 500 }] });
    const result = await analyzeTranscript(segments, { title: "t", participants: [], durationSeconds: 10 });
    expect(generateJson).toHaveBeenCalledTimes(2);
    expect(result.highlights[0].endTime).toBeLessThanOrEqual(10);
    expect(result.decisions[0].text).toBe("Beta ships Friday");
  });

  it("analyzeTranscript fails loudly when the repair attempt is still invalid", async () => {
    generateJson.mockResolvedValue({ nonsense: true });
    await expect(analyzeTranscript(segments, { durationSeconds: 10 })).rejects.toThrow(/validation/);
  });

  it("extractJson strips markdown fences", () => {
    expect(JSON.parse(extractJson('```json\n{"a":1}\n```'))).toEqual({ a: 1 });
    expect(JSON.parse(extractJson('text before {"a":2} after'))).toEqual({ a: 2 });
  });
});
