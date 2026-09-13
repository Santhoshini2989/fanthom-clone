"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CallView } from "@/components/meetings/call-view";
import { FailedState, LiveState, NotFoundState, ProcessingState } from "@/components/meetings/call-states";
import { FathomSpinner } from "@/components/brand/logo";
import { useAppStore, useHydrated } from "@/lib/store";

export default function CallPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const meeting = useAppStore((s) => s.meetings.find((m) => m.id === id));

  return (
    <AppShell>
      {!hydrated ? (
        <div className="flex h-[60vh] items-center justify-center">
          <FathomSpinner />
        </div>
      ) : !meeting ? (
        <NotFoundState />
      ) : meeting.status === "processing" ? (
        <ProcessingState meeting={meeting} />
      ) : meeting.status === "failed" ? (
        <FailedState meeting={meeting} />
      ) : meeting.status === "recording" || meeting.status === "scheduled" ? (
        <LiveState meeting={meeting} />
      ) : (
        <Suspense fallback={<div className="flex h-[60vh] items-center justify-center"><FathomSpinner /></div>}>
          <CallView meeting={meeting} />
        </Suspense>
      )}
    </AppShell>
  );
}
