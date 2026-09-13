import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { log } from "../logger";

/**
 * Thin wrapper over the ffmpeg binary shipped by `ffmpeg-static` (no system
 * install required). Used to normalise recordings to 16 kHz mono WAV, probe
 * duration, split long files for transcription and cut clips.
 */
function binary(): string {
  const fromEnv = process.env.FFMPEG_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const candidates: string[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const p = require("ffmpeg-static") as string | null;
    if (p) candidates.push(p);
  } catch {
    /* bundled by Next: fall through to the on-disk lookup */
  }
  // Direct lookup: bundlers rewrite __dirname inside ffmpeg-static, so resolve from the project root too.
  const exe = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  candidates.push(path.join(process.cwd(), "node_modules", "ffmpeg-static", exe));
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error("ffmpeg binary not found. Install ffmpeg-static (npm i ffmpeg-static) or set FFMPEG_PATH.");
  return found;
}

function run(args: string[], opts: { input?: Buffer } = {}): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary(), args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr.split("\n").filter(Boolean).slice(-3).join(" | ")}`));
    });
    if (opts.input) child.stdin.end(opts.input);
  });
}

/** Duration in seconds, parsed from ffmpeg's own info output (no ffprobe needed). */
export async function probeDuration(file: string): Promise<number> {
  try {
    await run(["-hide_banner", "-i", file, "-f", "null", "-"]);
  } catch (e) {
    const msg = (e as Error).message;
    const m = /time=(\d+):(\d+):(\d+(?:\.\d+)?)/g;
    let last: RegExpExecArray | null = null;
    let cur: RegExpExecArray | null;
    while ((cur = m.exec(msg))) last = cur;
    if (last) return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
    throw e;
  }
  // success path: ffmpeg prints progress to stderr; re-run capturing stderr
  const { stderr } = await runAllowFail(["-hide_banner", "-i", file, "-f", "null", "-"]);
  const times = [...stderr.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
  const last = times[times.length - 1];
  if (!last) {
    const d = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (d) return Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]);
    return 0;
  }
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
}

function runAllowFail(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(binary(), args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", () => resolve({ stdout, stderr }));
    child.on("error", () => resolve({ stdout, stderr }));
  });
}

/** Convert any input (webm/opus, mp3, m4a, …) to 16 kHz mono PCM WAV. */
export async function toWav(input: string, output: string): Promise<string> {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await run(["-hide_banner", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", output]);
  log.info("recording", "converted to wav", { output: path.basename(output) });
  return output;
}

/** Cut [start, end] seconds out of a file into a new file (re-encoded to the target extension). */
export async function cut(input: string, output: string, start: number, end: number): Promise<string> {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const dur = Math.max(0.1, end - start);
  const ext = path.extname(output).toLowerCase();
  const codec = ext === ".wav" ? ["-c:a", "pcm_s16le"] : ext === ".mp3" ? ["-c:a", "libmp3lame", "-q:a", "4"] : ["-c:a", "libopus"];
  await run(["-hide_banner", "-y", "-ss", String(start), "-t", String(dur), "-i", input, "-vn", ...codec, output]);
  return output;
}

/**
 * Split a WAV into consecutive chunks of `chunkSeconds`, each starting
 * `overlapSeconds` before its nominal boundary (except the first) so words on
 * the boundary are fully inside one chunk. Returns absolute offsets.
 */
export async function splitWav(
  input: string,
  outDir: string,
  totalSeconds: number,
  chunkSeconds: number,
  overlapSeconds = 2,
): Promise<{ file: string; offset: number; leadIn: number; index: number }[]> {
  if (totalSeconds <= chunkSeconds) return [{ file: input, offset: 0, leadIn: 0, index: 0 }];
  fs.mkdirSync(outDir, { recursive: true });
  const chunks: { file: string; offset: number; leadIn: number; index: number }[] = [];
  const n = Math.ceil(totalSeconds / chunkSeconds);
  for (let i = 0; i < n; i++) {
    const nominal = i * chunkSeconds;
    const leadIn = i === 0 ? 0 : Math.min(overlapSeconds, nominal);
    const start = nominal - leadIn;
    const len = chunkSeconds + leadIn;
    const file = path.join(outDir, `chunk-${String(i + 1).padStart(2, "0")}.wav`);
    await run(["-hide_banner", "-y", "-ss", String(start), "-t", String(len), "-i", input, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", file]);
    chunks.push({ file, offset: start, leadIn, index: i });
  }
  return chunks;
}

/** Generate a WAV of silence (mock recordings / tests). */
export async function silence(output: string, seconds: number): Promise<string> {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await run(["-hide_banner", "-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", String(seconds), "-c:a", "pcm_s16le", output]);
  return output;
}

export function ffmpegAvailable(): boolean {
  try {
    binary();
    return true;
  } catch {
    return false;
  }
}
