import path from "node:path";
import { z } from "zod";

/**
 * Environment contract for the local-first stack. Parsed once; secrets are
 * never logged. Next.js loads .env automatically; the bot/CLI processes run
 * with `node --env-file=.env` (see package.json scripts).
 */
const schema = z.object({
  DATABASE_URL: z.string().default("postgresql://fathom:fathom@127.0.0.1:5433/fathom"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_TRANSCRIBE_MODEL: z.string().default("gemini-3.5-transcribe"),
  GEMINI_ANALYSIS_MODEL: z.string().default("gemini-3.6-flash"),
  TRANSCRIBE_CHUNK_SECONDS: z.coerce.number().int().min(60).max(3600).default(1500),
  STORAGE_DIR: z.string().default("./storage"),
  BOT_NAME: z.string().default("Fathom Notetaker"),
  BOT_PROFILE_DIR: z.string().default("./.bot-profile"),
  BOT_BROWSER_CHANNEL: z.enum(["chrome", "chromium", "msedge"]).default("chrome"),
  RECORDING_PROVIDER: z.enum(["real", "mock"]).default("real"),
  BOT_ADMISSION_TIMEOUT_SECONDS: z.coerce.number().int().min(10).default(300),
  BOT_ALONE_TIMEOUT_SECONDS: z.coerce.number().int().min(10).default(90),
  BOT_MAX_RECORDING_SECONDS: z.coerce.number().int().min(60).default(10800),
  BOT_POLL_MS: z.coerce.number().int().min(500).default(2000),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function storageDir(...parts: string[]) {
  return path.resolve(process.cwd(), env().STORAGE_DIR, ...parts);
}

export function hasGeminiKey() {
  return env().GEMINI_API_KEY.trim().length > 0;
}
