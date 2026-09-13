import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { env, hasGeminiKey } from "../env";
import { log } from "../logger";

/**
 * Gemini client (the only external service in this architecture). The key
 * comes from GEMINI_API_KEY in .env and is never logged.
 */
let client: GoogleGenAI | null = null;

export class GeminiConfigError extends Error {}

export function gemini(): GoogleGenAI {
  if (!hasGeminiKey()) {
    throw new GeminiConfigError("GEMINI_API_KEY is not set. Add it to .env (see .env.example) and restart the process.");
  }
  if (!client) client = new GoogleGenAI({ apiKey: env().GEMINI_API_KEY });
  return client;
}

const MIME: Record<string, string> = {
  ".wav": "audio/wav",
  ".mp3": "audio/mp3",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".aiff": "audio/aiff",
};

export function mimeFor(file: string): string {
  return MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
}

/** Upload a local file through the Files API and wait until it is ACTIVE. */
export async function uploadFile(file: string): Promise<{ uri: string; mimeType: string; name: string }> {
  const ai = gemini();
  const size = fs.statSync(file).size;
  log.info("transcription", "uploading audio to Gemini Files API", { file: path.basename(file), bytes: size });
  const uploaded = await ai.files.upload({ file, config: { mimeType: mimeFor(file), displayName: path.basename(file) } });
  let info = uploaded;
  const deadline = Date.now() + 5 * 60_000;
  while (info.state && String(info.state).toUpperCase() === "PROCESSING") {
    if (Date.now() > deadline) throw new Error("Gemini file processing timed out");
    await new Promise((r) => setTimeout(r, 2000));
    info = await ai.files.get({ name: info.name! });
  }
  if (info.state && String(info.state).toUpperCase() === "FAILED") throw new Error("Gemini could not process the uploaded audio file");
  if (!info.uri) throw new Error("Gemini upload returned no file URI");
  return { uri: info.uri, mimeType: info.mimeType ?? mimeFor(file), name: info.name ?? "" };
}

export async function deleteFile(name: string) {
  if (!name) return;
  try {
    await gemini().files.delete({ name });
  } catch {
    /* best effort */
  }
}

/** Retry helper for transient API failures (429/5xx/network). */
export async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message ?? String(e);
      const transient = /429|RESOURCE_EXHAUSTED|5\d\d|UNAVAILABLE|ECONNRESET|ETIMEDOUT|fetch failed|timeout/i.test(msg);
      if (!transient || i === attempts) break;
      const wait = 1500 * 2 ** (i - 1);
      log.warn("pipeline", `${label} failed (attempt ${i}/${attempts}), retrying in ${wait}ms`, { error: msg.slice(0, 200) });
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/** Strip ```json fences and leading prose that models sometimes add. */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/** Ask a model for JSON matching `schema`; returns the parsed object (unvalidated). */
export async function generateJson(model: string, prompt: string, schema: object, opts: { temperature?: number; systemInstruction?: string } = {}): Promise<unknown> {
  const ai = gemini();
  const res = await withRetry(`generateContent(${model})`, () =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema as never,
        temperature: opts.temperature ?? 0.2,
        systemInstruction: opts.systemInstruction,
      },
    }),
  );
  const text = res.text ?? "";
  if (!text.trim()) throw new Error("Gemini returned an empty response");
  return JSON.parse(extractJson(text));
}

export async function generateText(model: string, prompt: string, opts: { systemInstruction?: string; temperature?: number } = {}): Promise<string> {
  const ai = gemini();
  const res = await withRetry(`generateContent(${model})`, () =>
    ai.models.generateContent({ model, contents: prompt, config: { temperature: opts.temperature ?? 0.3, systemInstruction: opts.systemInstruction } }),
  );
  return (res.text ?? "").trim();
}
