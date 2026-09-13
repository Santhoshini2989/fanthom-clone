"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const MEET_RE = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#].*)?$/i;

/**
 * "Record" entry point: send the notetaker bot to a Google Meet, or import an
 * existing recording file. Both create a real meeting row through the API.
 */
export function RecordMeetingButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="cyan" size="sm" className={cn("gap-1.5", className)} onClick={() => setOpen(true)}>
        <Video className="size-4" /> Record
      </Button>
      <RecordMeetingModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function RecordMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const createMeeting = useAppStore((s) => s.createMeeting);
  const importRecording = useAppStore((s) => s.importRecording);
  const gemini = useAppStore((s) => s.capabilities.gemini);
  const [mode, setMode] = useState<"meet" | "import">("meet");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUrl("");
    setTitle("");
    setError(null);
    setBusy(false);
  };

  const startBot = async () => {
    const link = url.trim();
    if (!MEET_RE.test(link)) {
      setError("Enter a Google Meet link like https://meet.google.com/abc-defg-hij");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const m = await createMeeting({ title: title.trim() || undefined, meetUrl: link, startNow: true });
      toast("Notetaker requested. Admit it from the meeting when it asks to join.");
      onClose();
      reset();
      router.push(`/calls/${m.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the notetaker");
      setBusy(false);
    }
  };

  const doImport = async () => {
    const f = file.current?.files?.[0];
    if (!f) {
      setError("Choose an audio or video file first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await importRecording(f, title.trim() || undefined);
      toast(gemini ? "Recording imported. Transcription has started." : "Recording imported. Add GEMINI_API_KEY to .env and click Retry to transcribe.");
      onClose();
      reset();
      router.push(`/calls/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => (busy ? null : (onClose(), reset()))} title="Record a meeting" width={520}>
      <div className="mb-4 flex gap-1 rounded-lg bg-white/[0.06] p-1 text-[13px] font-semibold">
        {(["meet", "import"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => (setMode(m), setError(null))}
            className={cn("flex-1 rounded-md px-3 py-1.5 transition-colors", mode === m ? "bg-[#1f3340] text-fathom" : "text-white/60 hover:text-white")}
          >
            {m === "meet" ? "Google Meet" : "Import recording"}
          </button>
        ))}
      </div>

      {mode === "meet" ? (
        <div className="space-y-3">
          <p className="text-[14px] leading-5 text-white/65">
            Paste the meeting link. The notetaker joins as a participant and asks to be admitted; the host must let it in. It records, transcribes and summarizes the call locally.
          </p>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" aria-label="Google Meet link" autoFocus />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title (optional)" aria-label="Meeting title" />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[14px] leading-5 text-white/65">Import an existing audio or video file (wav, mp3, m4a, webm, mp4). It is transcribed and analyzed like a live recording.</p>
          <input ref={file} type="file" accept="audio/*,video/*,.wav,.mp3,.m4a,.webm,.mp4,.ogg,.flac" aria-label="Recording file" className="block w-full text-[13px] text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold file:text-white hover:file:bg-white/15" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title (optional)" aria-label="Meeting title" />
        </div>
      )}

      {error && <p className="mt-3 text-[13px] text-[#f05252]">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => (onClose(), reset())} disabled={busy}>Cancel</Button>
        {mode === "meet" ? (
          <Button variant="cyan" onClick={startBot} disabled={busy} className="gap-1.5">
            <Video className="size-4" /> {busy ? "Starting…" : "Send notetaker"}
          </Button>
        ) : (
          <Button variant="cyan" onClick={doImport} disabled={busy} className="gap-1.5">
            <Upload className="size-4" /> {busy ? "Uploading…" : "Import"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
