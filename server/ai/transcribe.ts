import fs from "node:fs";
import path from "node:path";
import { env } from "../env";
import { log } from "../logger";
import { probeDuration, splitWav, toWav } from "../audio/ffmpeg";
import { deleteFile, gemini, uploadFile, withRetry } from "./gemini";
import { TranscriptSchema, type TranscriptOut, type TranscriptSegmentOut } from "./schemas";

/**
 * Audio → timestamped, speaker-attributed transcript with gemini-3.5-transcribe.
 *
 * The transcribe model returns word-level annotations (speaker, start/end
 * offsets). Diarization is limited to 30 minutes per request, so recordings
 * are split into TRANSCRIBE_CHUNK_SECONDS chunks (default 25 min) with a
 * 2-second lead-in, transcribed independently, and merged: offsets are
 * shifted by the chunk's absolute start, words inside the lead-in are dropped
 * (they belong to the previous chunk), and speaker labels are aligned across
 * chunks by order of first appearance.
 */

export interface Word {
  text: string;
  start: number;
  end: number;
  speaker: string;
}

/** Parse "1.5s", "00:01:02.500", "62.5", "1m2s" style offsets into seconds. */
export function parseOffset(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "object") {
    const o = v as { seconds?: number; nanos?: number };
    if (typeof o.seconds === "number") return o.seconds + (o.nanos ?? 0) / 1e9;
  }
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  const sec = s.match(/^(\d+(?:\.\d+)?)s$/i);
  if (sec) return Number(sec[1]);
  const clock = s.match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/);
  if (clock) return Number(clock[1] ?? 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  const hms = s.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/i);
  if (hms && (hms[1] || hms[2] || hms[3])) return Number(hms[1] ?? 0) * 3600 + Number(hms[2] ?? 0) * 60 + Number(hms[3] ?? 0);
  return null;
}

/** Pull word annotations out of an interactions response (shape-tolerant). */
export function extractWords(interaction: unknown): Word[] {
  const words: Word[] = [];
  const root = interaction as { steps?: unknown[]; output?: unknown[]; outputs?: unknown[] };
  const containers = [...(root.steps ?? []), ...(root.output ?? []), ...(root.outputs ?? [])];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const n = node as Record<string, unknown>;
    if (n.type === "word_info" || (typeof n.text === "string" && (n.start_offset !== undefined || n.startOffset !== undefined))) {
      const start = parseOffset(n.start_offset ?? n.startOffset);
      const end = parseOffset(n.end_offset ?? n.endOffset);
      if (start !== null && end !== null && typeof n.text === "string" && n.text.trim()) {
        words.push({ text: n.text.trim(), start, end: Math.max(end, start), speaker: String(n.speaker ?? n.speaker_label ?? n.speakerLabel ?? "speaker_1") });
      }
      return;
    }
    for (const v of Object.values(n)) if (v && typeof v === "object") visit(v);
  };
  containers.forEach(visit);
  if (!words.length) visit(interaction);
  return words.sort((a, b) => a.start - b.start);
}

/**
 * Group consecutive words of one speaker into segments. A new segment starts
 * on a speaker change, a pause > 1.2s, or when a sentence ends and the
 * segment is already long.
 */
export function wordsToSegments(words: Word[], opts: { maxWords?: number; pause?: number } = {}): TranscriptSegmentOut[] {
  const maxWords = opts.maxWords ?? 60;
  const pause = opts.pause ?? 1.2;
  const out: TranscriptSegmentOut[] = [];
  let cur: { speaker: string; start: number; end: number; words: string[] } | null = null;
  const flush = () => {
    if (cur && cur.words.length) out.push({ speaker: cur.speaker, start: round(cur.start), end: round(cur.end), text: cur.words.join(" ").replace(/\s+([,.!?;:])/g, "$1") });
    cur = null;
  };
  for (const w of words) {
    const endsSentence = /[.!?]$/.test(w.text);
    if (!cur) cur = { speaker: w.speaker, start: w.start, end: w.end, words: [w.text] };
    else if (w.speaker !== cur.speaker || w.start - cur.end > pause || (cur.words.length >= maxWords && endsSentence)) {
      flush();
      cur = { speaker: w.speaker, start: w.start, end: w.end, words: [w.text] };
    } else {
      cur.words.push(w.text);
      cur.end = Math.max(cur.end, w.end);
    }
    if (cur && cur.words.length >= maxWords * 2) flush();
  }
  flush();
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Merge per-chunk word lists into one timeline. Words inside a chunk's lead-in
 * are dropped (the previous chunk owns them). Speaker labels are re-mapped so
 * the first speaker to appear in each chunk gets the same global label as the
 * first speaker overall, etc. — a best-effort alignment (diarization labels
 * are not stable across requests).
 */
export function mergeChunks(chunks: { offset: number; leadIn: number; words: Word[] }[]): Word[] {
  const merged: Word[] = [];
  const globalOrder: string[] = [];
  for (const c of chunks) {
    const localOrder: string[] = [];
    for (const w of c.words) if (!localOrder.includes(w.speaker)) localOrder.push(w.speaker);
    const map = new Map<string, string>();
    localOrder.forEach((label, i) => {
      if (!globalOrder[i]) globalOrder[i] = `speaker_${i + 1}`;
      map.set(label, globalOrder[i]!);
    });
    for (const w of c.words) {
      if (w.start < c.leadIn) continue; // belongs to the previous chunk
      merged.push({ ...w, start: round(w.start + c.offset), end: round(w.end + c.offset), speaker: map.get(w.speaker) ?? w.speaker });
    }
  }
  return merged.sort((a, b) => a.start - b.start);
}

/** Call gemini-3.5-transcribe on one (≤ chunk-length) file and return words. */
export async function transcribeFile(file: string, language = "en-US"): Promise<{ words: Word[]; rawText: string }> {
  const ai = gemini();
  const uploaded = await uploadFile(file);
  try {
    const interaction = await withRetry(`interactions.create(${env().GEMINI_TRANSCRIBE_MODEL})`, () =>
      (ai as unknown as { interactions: { create: (r: unknown) => Promise<unknown> } }).interactions.create({
        model: env().GEMINI_TRANSCRIBE_MODEL,
        input: [{ type: "audio", uri: uploaded.uri, mime_type: uploaded.mimeType }],
        generation_config: {
          transcription_config: {
            language_codes: [language],
            mode: { type: "verbatim", diarization_mode: "speaker", timestamp_granularities: ["word"] },
          },
        },
      }),
    );
    const words = extractWords(interaction);
    const rawText = String((interaction as { output_text?: string }).output_text ?? "");
    if (!words.length && rawText.trim()) {
      // Model returned text without annotations: fall back to one segment per sentence, evenly spaced.
      log.warn("transcription", "no word annotations in response; falling back to text-only transcript");
      return { words: sentencesToWords(rawText, await probeDuration(file)), rawText };
    }
    return { words, rawText };
  } finally {
    await deleteFile(uploaded.name);
  }
}

function sentencesToWords(text: string, duration: number): Word[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const per = duration / Math.max(1, sentences.length);
  return sentences.map((s, i) => ({ text: s, start: round(i * per), end: round((i + 1) * per), speaker: "speaker_1" }));
}

/**
 * Full pipeline for a recording on disk: normalise → chunk → transcribe each
 * chunk → merge → segments. `onProgress` receives human-readable steps.
 */
export async function transcribeRecording(
  inputFile: string,
  workDir: string,
  onProgress: (step: string) => Promise<void> | void = () => {},
): Promise<TranscriptOut & { duration: number; wavFile: string }> {
  fs.mkdirSync(workDir, { recursive: true });
  const wav = path.extname(inputFile).toLowerCase() === ".wav" ? inputFile : await toWav(inputFile, path.join(workDir, "audio-16k.wav"));
  const duration = await probeDuration(wav);
  if (duration < 1) throw new Error("Recording is empty (duration < 1s)");
  const chunkSeconds = env().TRANSCRIBE_CHUNK_SECONDS;
  const chunks = await splitWav(wav, path.join(workDir, "chunks"), duration, chunkSeconds);
  log.info("transcription", `processing audio`, { duration: Math.round(duration), chunks: chunks.length });
  const results: { offset: number; leadIn: number; words: Word[] }[] = [];
  for (const c of chunks) {
    await onProgress(chunks.length > 1 ? `Transcribing chunk ${c.index + 1}/${chunks.length}` : "Transcribing");
    const { words } = await transcribeFile(c.file);
    log.info("transcription", `chunk ${c.index + 1}/${chunks.length} done`, { words: words.length });
    results.push({ offset: c.offset, leadIn: c.leadIn, words });
  }
  const words = mergeChunks(results);
  const segments = wordsToSegments(words);
  if (!segments.length) throw new Error("Transcription produced no speech. Check that the recording contains audio.");
  const transcript = TranscriptSchema.parse({ language: "en", segments });
  log.info("transcription", "completed", { segments: segments.length, speakers: new Set(segments.map((s) => s.speaker)).size });
  return { ...transcript, duration, wavFile: wav };
}
