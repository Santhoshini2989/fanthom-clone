"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Highlighter, Search, Sparkles, Video } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AskPanel } from "@/components/ask/ask-panel";
import { Highlighted } from "@/components/search/ai-search";
import { Thumbnail } from "@/components/meetings/thumbnail";
import { UnderlineTabs } from "@/components/ui/tabs";
import { PillSelect } from "@/components/ui/select";
import { FathomSpinner } from "@/components/brand/logo";
import { useAppStore, useHydrated } from "@/lib/store";
import { searchMeetings } from "@/lib/search";
import { cn, formatClock, formatDate } from "@/lib/utils";
import { userById } from "@/data/users";

/**
 * Full search results. The real product's dedicated results layout is NOT
 * VERIFIED; this follows the verified concepts: attendee + keyword search
 * across meetings, transcript matches that jump to a timestamp, highlight
 * matches, and Ask Fathom across all calls.
 */
export default function SearchPage() {
  return (
    <AppShell tabs>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><FathomSpinner /></div>}>
        <SearchBody />
      </Suspense>
    </AppShell>
  );
}

function SearchBody() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  const [kind, setKind] = useState<"all" | "meeting" | "transcript" | "highlight">("all");
  const [sort, setSort] = useState<"relevance" | "newest">("relevance");
  const meetings = useAppStore((s) => s.meetings);

  const hits = useMemo(() => {
    let h = searchMeetings(meetings, q, 100);
    if (kind !== "all") h = h.filter((x) => x.kind === kind);
    if (sort === "newest") h = [...h].sort((a, b) => (a.meeting.startedAt < b.meeting.startedAt ? 1 : -1));
    return h;
  }, [meetings, q, kind, sort]);

  const counts = useMemo(() => {
    const all = searchMeetings(meetings, q, 100);
    return {
      all: all.length,
      meeting: all.filter((x) => x.kind === "meeting").length,
      transcript: all.filter((x) => x.kind === "transcript").length,
      highlight: all.filter((x) => x.kind === "highlight").length,
    };
  }, [meetings, q]);

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(draft.trim())}`);
          }}
          className="flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-app-input px-3.5 focus-within:border-fathom"
        >
          <Search className="size-4 text-white/50" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search attendees, keywords, or ask a question"
            aria-label="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-off-white placeholder:text-white/40 outline-none"
          />
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-white/10">
          <UnderlineTabs
            items={[
              { id: "all", label: "All", count: counts.all },
              { id: "meeting", label: "Meetings", count: counts.meeting },
              { id: "transcript", label: "Transcript", count: counts.transcript },
              { id: "highlight", label: "Highlights", count: counts.highlight },
            ]}
            value={kind}
            onChange={(id) => setKind(id as typeof kind)}
            size="sm"
            className="-mb-px"
          />
          <span className="ml-auto pb-2">
            <PillSelect value={sort} onChange={setSort} size="sm" variant="ghost" options={[{ value: "relevance", label: "Most relevant" }, { value: "newest", label: "Newest first" }]} />
          </span>
        </div>

        {!hydrated ? (
          <div className="flex h-48 items-center justify-center"><FathomSpinner /></div>
        ) : !q.trim() ? (
          <p className="py-16 text-center text-sm text-white/50">Type a keyword or an attendee’s name to search across your meetings.</p>
        ) : hits.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[15px] text-off-white">No results for “{q}”</p>
            <p className="mt-1 text-sm text-white/50">Try a different keyword, or ask Fathom on the right.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/8">
            {hits.map((h, i) => (
              <li key={i} className="py-4">
                {h.kind === "meeting" && (
                  <Link href={`/calls/${h.meeting.id}`} className="group flex gap-4">
                    <div className="w-[180px] shrink-0"><Thumbnail meeting={h.meeting} /></div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/45"><Video className="size-3" /> Meeting · matched {h.matchedOn}</p>
                      <h3 className="mt-1 text-[16px] font-semibold group-hover:text-fathom"><Highlighted text={h.meeting.title} q={q} /></h3>
                      <p className="text-[13px] text-white/55">{formatDate(h.meeting.startedAt)} · {h.meeting.attendeeIds.map((id) => userById(id).name.split(" ")[0]).join(", ")}</p>
                    </div>
                  </Link>
                )}
                {h.kind === "transcript" && (
                  <Link href={`/calls/${h.meeting.id}?t=${h.segment.start}&tab=transcript`} className="group block">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/45"><FileText className="size-3" /> Transcript</p>
                    <p className="mt-1.5 rounded-lg bg-app-bubble px-3 py-2 text-[15px] leading-[22px] text-off-white group-hover:bg-[#4a4b4b]">
                      <Highlighted text={h.snippet} q={q} />
                    </p>
                    <p className="mt-1 text-[13px] text-white/55">
                      {h.meeting.speakers.find((s) => s.id === h.segment.speakerId)?.name} in <span className="text-white/80">{h.meeting.title}</span> · <span className="font-inter tabular-nums text-fathom">{formatClock(h.segment.start)}</span>
                    </p>
                  </Link>
                )}
                {h.kind === "highlight" && (
                  <Link href={`/calls/${h.meeting.id}?t=${h.highlight.start}`} className="group block">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-fathom"><Highlighter className="size-3" /> Highlight</p>
                    <p className="mt-1 text-[15px] leading-5 text-off-white group-hover:text-fathom"><Highlighted text={h.highlight.title} q={q} /></p>
                    <p className="text-[13px] text-white/55">{h.meeting.title} · <span className="font-inter tabular-nums text-fathom">{formatClock(h.highlight.start)}</span></p>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className={cn("hidden lg:block")}>
        <div className="sticky top-[104px] flex h-[calc(100vh-128px)] flex-col rounded-xl border border-white/10 bg-[#1f1f22] px-3 pb-3 pt-2">
          <span className="mb-1 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-white/80"><Sparkles className="size-3.5 text-fathom" /> Ask Fathom</span>
          <AskPanel meetings={meetings} scope="all" scopeLabel="All meetings" compact />
        </div>
      </aside>
    </div>
  );
}
