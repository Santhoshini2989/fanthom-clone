"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Meeting } from "@/data/types";
import { periodLabel } from "@/lib/utils";
import { FathomSpinner } from "@/components/brand/logo";
import { MeetingCard } from "./meeting-card";

const PAGE = 8;

/**
 * Recording grid grouped by period ("Last Week", "August"...). Loads more
 * rows as you scroll, with the Fathom-mark spinner at the bottom (verified).
 */
export function MeetingGrid({
  meetings,
  showOwner,
  emptyTitle = "No recordings yet",
  emptyBody = "Once Fathom joins a meeting, the recording, transcript and summary will show up here.",
  emptyAction,
}: {
  meetings: Meeting[];
  showOwner?: boolean;
  emptyTitle?: string;
  emptyBody?: React.ReactNode;
  emptyAction?: React.ReactNode;
}) {
  const [shown, setShown] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = shown < meetings.length;

  useEffect(() => {
    if (!hasMore || !sentinel.current) return;
    const el = sentinel.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          setLoading(true);
          window.setTimeout(() => {
            setShown((s) => s + PAGE);
            setLoading(false);
          }, 650);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  const groups = useMemo(() => {
    const now = new Date("2026-09-12T18:00:00");
    const map = new Map<string, Meeting[]>();
    for (const m of meetings.slice(0, shown)) {
      const k = periodLabel(m.startedAt, now);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return Array.from(map.entries());
  }, [meetings, shown]);

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-24 text-center">
        <div className="mb-5 grid w-[220px] grid-cols-2 gap-2 opacity-60">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-md border border-dashed border-white/25" />
          ))}
        </div>
        <h2 className="text-lg font-semibold text-off-white">{emptyTitle}</h2>
        <p className="mt-1.5 max-w-sm text-sm leading-5 text-white/55">{emptyBody}</p>
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {groups.map(([label, items]) => (
        <section key={label} aria-label={label}>
          <h2 className="mb-3 text-[15px] font-semibold text-off-white">{label}</h2>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
              <MeetingCard key={m.id} meeting={m} showOwner={showOwner} />
            ))}
          </div>
        </section>
      ))}
      <div ref={sentinel} className="flex h-16 items-center justify-center">
        {hasMore && <FathomSpinner />}
      </div>
    </div>
  );
}
