"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, FileText, Highlighter, Search, Sparkles, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { searchMeetings } from "@/lib/search";
import { cn, formatClock, formatDate } from "@/lib/utils";

/**
 * "Search with AI..." field from the app top bar. Typing shows instant results
 * (meetings, transcript moments, highlights); Enter goes to the full results
 * page; ⌘K / Ctrl+K focuses the field (NOT VERIFIED in the real product, but a
 * common convention; documented in RECON.md).
 */
export function AiSearch({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const meetings = useAppStore((s) => s.meetings);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => (q.trim().length >= 2 ? searchMeetings(meetings, q, 8) : []), [q, meetings]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const go = (i: number) => {
    const h = hits[i];
    if (!h) {
      if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
      return;
    }
    if (h.kind === "meeting") router.push(`/calls/${h.meeting.id}`);
    if (h.kind === "transcript") router.push(`/calls/${h.meeting.id}?t=${h.segment.start}&tab=transcript`);
    if (h.kind === "highlight") router.push(`/calls/${h.meeting.id}?t=${h.highlight.start}`);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-8 items-center gap-2 rounded-md border border-transparent bg-[#1c1b20] pl-2.5 pr-1.5 transition-colors duration-150",
          open && "border-white/15",
        )}
      >
        <Sparkles className="size-3.5 shrink-0 text-white/50" strokeWidth={2} />
        <input
          ref={inputRef}
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(active >= hits.length ? -1 : active);
            } else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder="Search with AI..."
          aria-label="Search with AI"
          role="combobox"
          aria-expanded={open && q.length > 0}
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-off-white placeholder:text-white/45 outline-none"
        />
        <Badge kind="new">New</Badge>
      </div>

      {open && q.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[70] mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-app-menu shadow-[0_16px_48px_rgba(0,0,0,0.6)] animate-pop-in"
        >
          {hits.length === 0 ? (
            <div className="px-4 py-5 text-sm text-white/60">
              No matches in your meetings. Press <kbd className="rounded bg-white/10 px-1 text-xs">Enter</kbd> to ask Fathom.
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto py-1.5 scrollbar-thin">
              {hits.map((h, i) => (
                <li key={i}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors",
                      active === i ? "bg-app-menu-hover" : "hover:bg-app-menu-hover",
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/8 text-white/70 [&_svg]:size-3.5">
                      {h.kind === "meeting" ? <Video /> : h.kind === "transcript" ? <FileText /> : <Highlighter />}
                    </span>
                    <span className="min-w-0 flex-1">
                      {h.kind === "meeting" && (
                        <>
                          <span className="block truncate text-[14px] text-off-white">{h.meeting.title}</span>
                          <span className="block text-xs text-white/50">
                            {formatDate(h.meeting.startedAt)} · matched {h.matchedOn}
                          </span>
                        </>
                      )}
                      {h.kind === "transcript" && (
                        <>
                          <span className="block truncate text-[14px] text-off-white">
                            <Highlighted text={h.snippet} q={q} />
                          </span>
                          <span className="block text-xs text-white/50">
                            {h.meeting.title} · <span className="text-fathom">{formatClock(h.segment.start)}</span>
                          </span>
                        </>
                      )}
                      {h.kind === "highlight" && (
                        <>
                          <span className="block truncate text-[14px] text-off-white">{h.highlight.title}</span>
                          <span className="block text-xs text-white/50">
                            Highlight in {h.meeting.title} · <span className="text-fathom">{formatClock(h.highlight.start)}</span>
                          </span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => go(-1)}
            onMouseEnter={() => setActive(hits.length)}
            className={cn(
              "flex w-full items-center gap-2 border-t border-white/10 px-3.5 py-2.5 text-left text-[13px] text-fathom transition-colors",
              active === hits.length ? "bg-app-menu-hover" : "hover:bg-app-menu-hover",
            )}
          >
            <Search className="size-3.5" />
            Ask Fathom “{q.trim()}” across all meetings
            <CornerDownLeft className="ml-auto size-3.5 text-white/40" />
          </button>
        </div>
      )}
    </div>
  );
}

export function Highlighted({ text, q }: { text: string; q: string }) {
  const term = q.trim().split(/\s+/)[0] ?? "";
  if (!term) return <>{text}</>;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-fathom/30 text-off-white">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}
