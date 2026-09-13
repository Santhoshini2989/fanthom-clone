import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright";
import { log } from "../logger";
import { silence } from "../audio/ffmpeg";

/**
 * Recording adapters. The bot only talks to this interface so the capture
 * strategy can be swapped without touching the join/stop logic.
 *
 *   LocalTabAudioRecorder  — REAL capture: runs getDisplayMedia + MediaRecorder
 *                            inside the Google Meet tab (Chromium auto-selects
 *                            the tab via --auto-select-tab-capture-source-by-title)
 *                            and streams WebM/Opus chunks to a local file.
 *   MockRecordingProvider  — FALLBACK: writes a silent WAV of the elapsed
 *                            duration. Clearly marked provider=MOCK in the DB;
 *                            it never pretends to contain meeting audio.
 */
export interface RecordingResult {
  filePath: string; // absolute
  mimeType: string;
  provider: "REAL" | "MOCK";
  startedAt: Date;
  endedAt: Date;
}

export interface RecordingProvider {
  readonly name: string;
  start(ctx: { page: Page; outFile: string }): Promise<void>;
  stop(): Promise<RecordingResult>;
}

export class MockRecordingProvider implements RecordingProvider {
  readonly name = "mock";
  private startedAt = new Date();
  private outFile = "";

  async start({ outFile }: { page: Page; outFile: string }) {
    this.startedAt = new Date();
    this.outFile = outFile.replace(/\.\w+$/, "") + ".wav";
    log.warn("recording", "MOCK recording provider active: the saved file will be silence, not meeting audio");
  }

  async stop(): Promise<RecordingResult> {
    const endedAt = new Date();
    const seconds = Math.max(1, Math.round((endedAt.getTime() - this.startedAt.getTime()) / 1000));
    await silence(this.outFile, seconds);
    return { filePath: this.outFile, mimeType: "audio/wav", provider: "MOCK", startedAt: this.startedAt, endedAt };
  }
}

/**
 * Real capture. Requires the browser to be launched with
 *   --auto-select-tab-capture-source-by-title=Meet
 *   --use-fake-ui-for-media-stream
 * so getDisplayMedia resolves without a picker. Chunks arrive through an
 * exposed binding as base64 and are appended to <outFile>.webm.
 */
export class LocalTabAudioRecorder implements RecordingProvider {
  readonly name = "local-tab-audio";
  private page: Page | null = null;
  private outFile = "";
  private fd: number | null = null;
  private bytes = 0;
  private startedAt = new Date();
  private stopped = false;

  async start({ page, outFile }: { page: Page; outFile: string }) {
    this.page = page;
    this.outFile = outFile.replace(/\.\w+$/, "") + ".webm";
    fs.mkdirSync(path.dirname(this.outFile), { recursive: true });
    this.fd = fs.openSync(this.outFile, "w");
    this.bytes = 0;
    this.startedAt = new Date();

    await page.exposeBinding("__fathomChunk", async (_src, b64: string) => {
      if (this.fd === null) return;
      const buf = Buffer.from(b64, "base64");
      fs.writeSync(this.fd, buf);
      this.bytes += buf.length;
    });

    const started = await page.evaluate(async () => {
      const w = window as unknown as { __fathomRec?: MediaRecorder; __fathomStream?: MediaStream; __fathomChunk: (b: string) => void };
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 320, height: 180, frameRate: 1 },
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        // @ts-expect-error non-standard hints supported by Chromium
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        systemAudio: "exclude",
      });
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks.length) {
        stream.getTracks().forEach((t) => t.stop());
        return { ok: false, error: "The captured stream has no audio track (tab audio not shared)" };
      }
      const audioOnly = new MediaStream(audioTracks);
      stream.getVideoTracks().forEach((t) => t.stop());
      const rec = new MediaRecorder(audioOnly, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 128_000 });
      rec.ondataavailable = async (e) => {
        if (!e.data || !e.data.size) return;
        const buf = await e.data.arrayBuffer();
        let bin = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        w.__fathomChunk(btoa(bin));
      };
      rec.start(2000);
      w.__fathomRec = rec;
      w.__fathomStream = audioOnly;
      return { ok: true, error: "" };
    });
    if (!started.ok) {
      this.close();
      throw new Error(`Audio capture could not start: ${started.error}`);
    }
    log.info("recording", "Recording started", { file: path.basename(this.outFile) });
  }

  private close() {
    if (this.fd !== null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }

  async stop(): Promise<RecordingResult> {
    if (this.stopped) throw new Error("recorder already stopped");
    this.stopped = true;
    const page = this.page;
    if (page && !page.isClosed()) {
      try {
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              const w = window as unknown as { __fathomRec?: MediaRecorder; __fathomStream?: MediaStream };
              const rec = w.__fathomRec;
              if (!rec || rec.state === "inactive") return resolve();
              rec.onstop = () => resolve();
              rec.stop();
              w.__fathomStream?.getTracks().forEach((t) => t.stop());
              setTimeout(resolve, 3000);
            }),
        );
        await page.waitForTimeout(500); // let the last chunk flush through the binding
      } catch (e) {
        log.warn("recording", "could not stop MediaRecorder cleanly", { error: (e as Error).message });
      }
    }
    this.close();
    const endedAt = new Date();
    log.info("recording", "Recording stopped", { bytes: this.bytes, seconds: Math.round((endedAt.getTime() - this.startedAt.getTime()) / 1000) });
    if (this.bytes < 1000) throw new Error("Recording file is empty — the tab audio was not captured");
    return { filePath: this.outFile, mimeType: "audio/webm", provider: "REAL", startedAt: this.startedAt, endedAt };
  }
}

export function createRecordingProvider(kind: "real" | "mock"): RecordingProvider {
  return kind === "mock" ? new MockRecordingProvider() : new LocalTabAudioRecorder();
}
