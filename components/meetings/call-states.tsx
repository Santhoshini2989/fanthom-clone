"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
import type { Meeting } from "@/data/types";
import { FathomSpinner } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { formatDate, formatDurationShort } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/lib/store";

/** Meeting still being processed: skeleton player, progress, staged steps. */
export function ProcessingState({ meeting }: { meeting: Meeting }) {
  const p = meeting.processingProgress ?? 40;
  const steps = [
    { label: "Recording uploaded", done: true },
    { label: "Transcribing", done: p > 30 },
    { label: "Identifying speakers", done: p > 55 },
    { label: "Generating summary & action items", done: p > 85 },
  ];
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
            <p className="text-[15px] font-medium text-off-white">Processing recording…</p>
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
        <div className="h-[92px] rounded-lg border border-dashed border-white/20" />
        <div className="h-[140px] rounded-lg border border-dashed border-white/20" />
      </aside>
    </div>
  );
}

/** Recording failed (e.g. bot not admitted). */
export function FailedState({ meeting }: { meeting: Meeting }) {
  const deleteMeeting = useAppStore((s) => s.deleteMeeting);
  const { toast } = useToast();
  const router = useRouter();
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
        <Button variant="cyan" onClick={() => toast("Recording retry is not available for a meeting that has ended", "info")}>Retry recording</Button>
        <a href="https://help.fathom.video/" target="_blank" rel="noreferrer">
          <Button>Troubleshoot</Button>
        </a>
        <Button
          variant="ghost"
          onClick={() => {
            deleteMeeting(meeting.id);
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
