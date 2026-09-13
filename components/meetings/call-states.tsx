"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Radio, Sparkles, Square } from "lucide-react";
import type { Meeting } from "@/data/types";
import { FathomSpinner } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { formatDate, formatDurationShort } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useAppStore, useMeetingPolling, type ApiMeeting } from "@/lib/store";

/** Meeting still being processed: skeleton player, progress, staged steps. */
export function ProcessingState({ meeting }: { meeting: Meeting }) {
  useMeetingPolling(meeting.id);
  const db = (meeting as ApiMeeting).db;
  const p = meeting.processingProgress ?? 40;
  const stage = db?.status ?? "PROCESSING";
  const afterTranscribe = stage === "ANALYZING" || stage === "COMPLETED";
  const steps = [
    { label: "Recording saved", done: true },
    { label: stage === "TRANSCRIBING" && db?.processingStep ? db.processingStep : "Transcribing", done: afterTranscribe },
    { label: "Identifying speakers", done: afterTranscribe },
    { label: stage === "ANALYZING" && db?.processingStep ? db.processingStep : "Generating summary & action items", done: stage === "COMPLETED" },
  ];
  const mock = db?.recordingProvider === "MOCK";
  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
          <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-sm bg-white/[0.04] animate-pulse-slow" style={{ animationDelay: `${i * 200}ms` }} />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
            <FathomSpinner className="size-9" />
            <p className="text-[15px] font-medium text-off-white">{db?.processingStep ? `${db.processingStep}…` : "Processing recording…"}</p>
            <p className="text-[13px] text-white/55">This usually takes a few minutes after the call ends.</p>
          </div>
        </div>
        <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-fathom transition-[width] duration-700" style={{ width: `${p}%` }} />
        </div>
        <div className="mt-6 flex gap-6 border-b border-white/10 text-[13px] font-semibold uppercase tracking-wide text-white/35">
          <span className="border-b-2 border-transparent pb-2">Summary</span>
          <span className="pb-2">Transcript</span>
          <span className="pb-2">Ask Fathom</span>
        </div>
        <ul className="mt-6 space-y-3">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-[15px]">
              <span className={`flex size-5 items-center justify-center rounded-full ${s.done ? "bg-emerald-500/20 text-emerald-400" : "border border-white/25 text-transparent"}`}>
                {s.done ? "✓" : <span className="size-2 rounded-full bg-white/30 animate-pulse-slow" />}
              </span>
              <span className={s.done ? "text-white/85" : "text-white/50"}>{s.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 space-y-3">
          {[80, 95, 60, 90, 70].map((w, i) => (
            <div key={i} className="h-3.5 rounded bg-white/[0.06] animate-pulse-slow" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <aside className="space-y-6">
        <div>
          <h1 className="text-[21px] font-semibold leading-7">{meeting.title}</h1>
          <p className="mt-1 text-[13px] text-white/55">
            {formatDate(meeting.startedAt)} · {formatDurationShort(meeting.duration)}
          </p>
        </div>
        <div className="rounded-lg border border-fathom/30 bg-fathom/8 px-4 py-3 text-[14px] leading-5 text-white/85">
          <Sparkles className="mb-1 size-4 text-fathom" />
          We’ll email you the summary as soon as it’s ready. You can leave this page.
        </div>
        {mock && (
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[13px] leading-5 text-amber-200">
            This recording was captured with the mock provider, so the audio is silent. Set RECORDING_PROVIDER=real to capture meeting audio.
          </div>
        )}
        <div className="h-[92px] rounded-lg border border-dashed border-white/20" />
        <div className="h-[140px] rounded-lg border border-dashed border-white/20" />
      </aside>
    </div>
  );
}

/** Recording failed (e.g. bot not admitted). */
export function FailedState({ meeting }: { meeting: Meeting }) {
  const deleteMeeting = useAppStore((s) => s.deleteMeeting);
  const retryMeeting = useAppStore((s) => s.retryMeeting);
  const { toast } = useToast();
  const router = useRouter();
  const db = (meeting as ApiMeeting).db;
  const canRetry = !!(db?.hasRecording || db?.meetUrl);
  const retry = async () => {
    try {
      await retryMeeting(meeting.id);
      toast(db?.hasRecording ? "Processing restarted" : "Notetaker requested again");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Retry failed", "error");
    }
  };
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
      <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-[#f05252]/15 text-[#f05252]">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="text-[22px] font-semibold">We couldn’t record this meeting</h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-white/65">{meeting.failureReason}</p>
      <p className="mt-1 text-[13px] text-white/45">
        {meeting.title} · {formatDate(meeting.startedAt)}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button variant="cyan" onClick={() => (canRetry ? retry() : toast("Nothing to retry: this meeting has no recording or Meet link", "info"))}>
          {db?.hasRecording ? "Retry processing" : "Retry recording"}
        </Button>
        <a href="https://help.fathom.video/" target="_blank" rel="noreferrer">
          <Button>Troubleshoot</Button>
        </a>
        <Button
          variant="ghost"
          onClick={() => {
            void deleteMeeting(meeting.id);
            toast("Recording removed");
            router.push("/my_calls");
          }}
        >
          Remove from My Calls
        </Button>
      </div>
      <Link href="/my_calls" className="mt-8 inline-flex items-center gap-1 text-[13px] text-white/55 hover:text-white">
        <ArrowLeft className="size-4" /> Back to My Calls
      </Link>
    </div>
  );
}

export function NotFoundState() {
  return (
    <div className="mx-auto max-w-[560px] px-4 py-24 text-center">
      <h1 className="text-[22px] font-semibold">This recording isn’t available</h1>
      <p className="mt-2 text-[15px] text-white/60">It may have been deleted, or you don’t have access. Ask the owner to share it with you.</p>
      <Link href="/my_calls" className="mt-6 inline-flex items-center gap-1 text-[13px] text-fathom hover:underline">
        <ArrowLeft className="size-4" /> Back to My Calls
      </Link>
    </div>
  );
}

const LIVE_STEPS: Record<string, string> = {
  SCHEDULED: "Ready to record",
  BOT_REQUESTED: "Waiting for the notetaker to pick up this meeting",
  BOT_JOINING: "Joining the meeting",
  RECORDING: "Recording",
};

/** Meeting that is scheduled, being joined, or being recorded right now. */
export function LiveState({ meeting }: { meeting: Meeting }) {
  useMeetingPolling(meeting.id);
  const db = (meeting as ApiMeeting).db;
  const startBot = useAppStore((s) => s.startBot);
  const stopBot = useAppStore((s) => s.stopBot);
  const deleteMeeting = useAppStore((s) => s.deleteMeeting);
  const { toast } = useToast();
  const router = useRouter();
  const status = db?.status ?? "SCHEDULED";
  const recording = status === "RECORDING";
  const busy = status === "BOT_REQUESTED" || status === "BOT_JOINING" || recording;
  const act = async (fn: () => Promise<void>, done: string) => {
    try {
      await fn();
      toast(done);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Request failed", "error");
    }
  };
  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {recording ? (
              <span className="flex items-center gap-2 rounded-full bg-[#f05252]/15 px-3 py-1 text-[13px] font-semibold text-[#f05252]">
                <Radio className="size-4 animate-pulse" /> REC
              </span>
            ) : busy ? (
              <FathomSpinner className="size-9" />
            ) : (
              <Sparkles className="size-8 text-fathom" />
            )}
            <p className="text-[15px] font-medium text-off-white">{db?.processingStep || LIVE_STEPS[status] || status}</p>
            {db?.meetUrl && (
              <a href={db.meetUrl} target="_blank" rel="noreferrer" className="text-[13px] text-fathom hover:underline">
                {db.meetUrl}
              </a>
            )}
            {status === "BOT_REQUESTED" && !db?.botClaimedAt && <p className="text-[13px] text-white/55">Start the bot worker (npm run bot) if it is not running.</p>}
            {status === "BOT_JOINING" && <p className="text-[13px] text-white/55">Admit the notetaker from the Google Meet window.</p>}
          </div>
        </div>
        <div className="mt-6 flex gap-6 border-b border-white/10 text-[13px] font-semibold uppercase tracking-wide text-white/35">
          <span className="border-b-2 border-transparent pb-2">Summary</span>
          <span className="pb-2">Transcript</span>
          <span className="pb-2">Ask Fathom</span>
        </div>
        <p className="mt-6 text-[15px] text-white/55">The transcript and summary appear here once the recording ends and processing completes.</p>
      </div>
      <aside className="space-y-6">
        <div>
          <h1 className="text-[21px] font-semibold leading-7">{meeting.title}</h1>
          <p className="mt-1 text-[13px] text-white/55">{formatDate(meeting.startedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {busy ? (
            <Button variant="cyan" className="gap-1.5" onClick={() => act(() => stopBot(meeting.id), recording ? "Stopping the recording" : "Notetaker cancelled")}>
              <Square className="size-4" /> {recording ? "Stop recording" : "Cancel"}
            </Button>
          ) : db?.meetUrl ? (
            <Button variant="cyan" className="gap-1.5" onClick={() => act(() => startBot(meeting.id), "Notetaker requested")}>
              <Radio className="size-4" /> Send notetaker
            </Button>
          ) : null}
          {!busy && (
            <Button
              variant="ghost"
              onClick={() => {
                void deleteMeeting(meeting.id);
                toast("Meeting removed");
                router.push("/my_calls");
              }}
            >
              Remove
            </Button>
          )}
        </div>
        {db?.stopRequested && <p className="text-[13px] text-white/55">Stop requested. The notetaker leaves at the next check.</p>}
      </aside>
    </div>
  );
}
