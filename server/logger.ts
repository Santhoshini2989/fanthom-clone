/**
 * Structured console logging for the local pipeline:
 *   [bot] Starting meeting abc123
 *   [transcription] Completed (2 chunks, 143 segments)
 * Never log secrets; callers pass plain data only.
 */
export type Stage = "bot" | "recording" | "transcription" | "analysis" | "db" | "api" | "pipeline" | "clip";

const REDACT = /(api[_-]?key|token|cookie|password|secret)/i;

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitize);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    out[k] = REDACT.test(k) ? "[redacted]" : sanitize(v);
  }
  return out;
}

function fmt(stage: Stage, message: string, data?: unknown) {
  const ts = new Date().toISOString().slice(11, 19);
  const extra = data === undefined ? "" : ` ${JSON.stringify(sanitize(data))}`;
  return `${ts} [${stage}] ${message}${extra}`;
}

export const log = {
  info: (stage: Stage, message: string, data?: unknown) => console.log(fmt(stage, message, data)),
  warn: (stage: Stage, message: string, data?: unknown) => console.warn(fmt(stage, message, data)),
  error: (stage: Stage, message: string, data?: unknown) => console.error(fmt(stage, message, data)),
};

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
