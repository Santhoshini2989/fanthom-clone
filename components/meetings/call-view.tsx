"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Meeting, TranscriptSegment } from "@/data/types";
import { usePlayback } from "@/lib/playback";
import { useAppStore } from "@/lib/store";
import { MeetingPlayer } from "@/components/player/meeting-player";
import { UnderlineTabs } from "@/components/ui/tabs";
import { SummaryPanel } from "@/components/ai/summary";
import { Transcript } from "@/components/transcript/transcript";
import { AskPanel } from "@/components/ask/ask-panel";
import { CallSidebar } from "./call-sidebar";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Tab = "summary" | "transcript" | "ask";
const EMPTY_IDS: string[] = [];

/**
 * The integrated call page body: one playback clock shared by the player,
 * summary timestamps, transcript follow/seek, highlight markers, and the
 * sidebar (verified relationships: transcript timestamp → playback; playback →
 * current transcript line; highlight → timestamp; summary bullet → moment;
 * search result → timestamp; highlight creation stores a time range).
 */
export function CallView({
  meeting,
  readOnly,
  sidebar,
  className,
}: {
  meeting: Meeting;
  readOnly?: boolean;
  /** custom sidebar (share page); defaults to the full CallSidebar */
  sidebar?: (ctx: { seek: (t: number) => void; time: number }) => React.ReactNode;
  className?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const addHighlight = useAppStore((s) => s.addHighlight);
  const highlightTypes = useAppStore((s) => s.highlightTypes);
  const trimmed = useAppStore((s) => s.trimmedSegments[meeting.id]) ?? EMPTY_IDS;

  const clip = params.get("clip");
  const clipHighlight = clip ? meeting.highlights.find((x) => x.id === clip) : undefined;
  // ?t= seeks, ?tab= picks a tab, ?clip= opens straight at a highlight (verified: clip share links)
  const initialT = clipHighlight ? clipHighlight.start : Number(params.get("t") ?? 0) || 0;
  const requestedTab = (params.get("tab") as Tab | null) ?? (clipHighlight ? "transcript" : "summary");
  const playback = usePlayback(meeting.duration, initialT);
  const [tab, setTab] = useState<Tab>(["summary", "transcript", "ask"].includes(requestedTab) ? requestedTab : "summary");

  // keep ?t out of the URL after first use so refreshes don't jump back
  useEffect(() => {
    if (params.has("t") || params.has("tab")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("t");
      url.searchParams.delete("tab");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seek = useCallback(
    (t: number) => {
      playback.seek(t);
      if (!playback.playing) playback.play();
    },
    [playback],
  );

  const effectiveMeeting = useMemo(
    () => ({ ...meeting, transcript: meeting.transcript.filter((s) => !trimmed.includes(s.id)) }),
    [meeting, trimmed],
  );

  const markers = meeting.highlights.map((h) => ({
    at: h.start,
    end: h.end,
    color: highlightTypes.find((t) => t.id === h.typeId)?.color ?? "#00beff",
    label: h.title,
  }));

  const createHighlight = (seg: TranscriptSegment, typeId: string) => {
    const type = highlightTypes.find((t) => t.id === typeId);
    // AI-style one-line description: first sentence of the passage, attributed
    const speaker = meeting.speakers.find((s) => s.id === seg.speakerId)?.name.split(" ")[0] ?? "The speaker";
    const first = seg.text.split(/(?<=[.!?])\s+/)[0] ?? seg.text;
    const title = `${speaker} ${/\?$/.test(first) ? "asks" : "notes"}: ${first.length > 120 ? `${first.slice(0, 117)}…` : first}`;
    addHighlight(meeting.id, { typeId, start: seg.start, end: seg.end, title, segmentIds: [seg.id], kind: "highlight" });
    toast(`${type?.name ?? "Highlight"} added`);
  };

  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "transcript", label: "Transcript" },
    { id: "ask", label: "Ask Fathom" },
  ];

  return (
    <div className={cn("mx-auto grid w-full max-w-[1400px] gap-6 px-3 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8", className)}>
      <div className="min-w-0">
        <MeetingPlayer meeting={effectiveMeeting} playback={playback} highlightMarkers={markers} />

        <div className="mt-4 border-b border-white/10">
          <UnderlineTabs items={tabs} value={tab} onChange={(id) => setTab(id as Tab)} uppercase size="md" ariaLabel="Call content" className="-mb-px" />
        </div>

        <div className="pt-5">
          {tab === "summary" && <SummaryPanel meeting={meeting} onSeek={seek} readOnly={readOnly} />}
          {tab === "transcript" && (
            <Transcript
              meeting={meeting}
              playback={playback}
              onCreateHighlight={readOnly ? undefined : createHighlight}
              readOnly={readOnly}
              className="h-[min(70vh,900px)]"
            />
          )}
          {tab === "ask" && (
            <div className="h-[min(70vh,900px)]">
              <AskPanel meetings={[meeting]} scope="meeting" onSeek={seek} />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {sidebar ? sidebar({ seek, time: playback.time }) : <CallSidebar meeting={meeting} onSeek={seek} currentTime={playback.time} />}
      </div>
    </div>
  );
}
