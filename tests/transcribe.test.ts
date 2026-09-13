import { describe, expect, it } from "vitest";
import { extractWords, mergeChunks, parseOffset, wordsToSegments, type Word } from "@/server/ai/transcribe";

const w = (text: string, start: number, end: number, speaker = "speaker_1"): Word => ({ text, start, end, speaker });

describe("parseOffset", () => {
  it("parses the offset formats Gemini may return", () => {
    expect(parseOffset("1.5s")).toBe(1.5);
    expect(parseOffset("62.5")).toBe(62.5);
    expect(parseOffset(12)).toBe(12);
    expect(parseOffset("00:01:02.500")).toBeCloseTo(62.5);
    expect(parseOffset("1:02")).toBe(62);
    expect(parseOffset("1m2s")).toBe(62);
    expect(parseOffset({ seconds: 3, nanos: 500_000_000 })).toBe(3.5);
  });
  it("rejects junk", () => {
    expect(parseOffset("")).toBeNull();
    expect(parseOffset("soon")).toBeNull();
    expect(parseOffset(NaN)).toBeNull();
    expect(parseOffset(undefined)).toBeNull();
  });
});

describe("extractWords", () => {
  it("finds word_info annotations anywhere in an interactions response", () => {
    const interaction = {
      outputs: [
        {
          type: "text",
          text: "hello world",
          annotations: [
            { type: "word_info", text: "hello", start_offset: "0.2s", end_offset: "0.6s", speaker: "A" },
            { type: "word_info", text: "world", start_offset: "0.7s", end_offset: "1.1s", speaker: "A" },
          ],
        },
      ],
    };
    const words = extractWords(interaction);
    expect(words).toHaveLength(2);
    expect(words[0]).toMatchObject({ text: "hello", start: 0.2, end: 0.6, speaker: "A" });
  });
});

describe("wordsToSegments", () => {
  it("splits on speaker change and long pauses, keeps timestamps", () => {
    const words = [w("Hi", 0, 0.3, "A"), w("there.", 0.4, 0.7, "A"), w("Hello!", 0.9, 1.3, "B"), w("Okay", 5, 5.2, "B")];
    const segs = wordsToSegments(words);
    expect(segs).toHaveLength(3);
    expect(segs[0]).toMatchObject({ speaker: "A", start: 0, end: 0.7, text: "Hi there." });
    expect(segs[1]).toMatchObject({ speaker: "B", start: 0.9, end: 1.3 });
    expect(segs[2].start).toBe(5);
  });
});

describe("mergeChunks", () => {
  it("offsets timestamps, drops lead-in words and unifies speaker labels", () => {
    const chunk1 = { offset: 0, leadIn: 0, words: [w("one", 0, 1, "spk_x"), w("two", 10, 11, "spk_y")] };
    // second chunk starts at 100s with a 2s lead-in; its first speaker is the
    // same person as chunk1's first speaker but diarization named it differently
    const chunk2 = { offset: 100, leadIn: 2, words: [w("stale", 0.5, 1.2, "spk_q"), w("three", 2.5, 3, "spk_q"), w("four", 4, 4.5, "spk_r")] };
    const merged = mergeChunks([chunk1, chunk2]);
    expect(merged.map((m) => m.text)).toEqual(["one", "two", "three", "four"]);
    expect(merged[2]).toMatchObject({ start: 102.5, end: 103, speaker: "speaker_1" });
    expect(merged[3].speaker).toBe("speaker_2");
    expect(merged[0].speaker).toBe("speaker_1");
    expect(merged[1].speaker).toBe("speaker_2");
  });

  it("keeps a monotonic timeline across three chunks", () => {
    const chunks = [0, 50, 100].map((offset, i) => ({ offset, leadIn: i ? 2 : 0, words: [w(`w${i}`, 3, 4)] }));
    const merged = mergeChunks(chunks);
    const starts = merged.map((m) => m.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(starts).toEqual([3, 53, 103]);
  });
});
