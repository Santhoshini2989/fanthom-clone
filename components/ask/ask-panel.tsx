"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Clock3, Sparkles, Trash2 } from "lucide-react";
import type { Meeting } from "@/data/types";
import { askFathom } from "@/lib/search";
import { useAppStore } from "@/lib/store";
import { cn, formatClock } from "@/lib/utils";

export const SUGGESTED_PROMPTS: Record<string, string[]> = {
  meeting: [
    "What were the key decisions?",
    "What did we agree to do next?",
    "Summarize the concerns that were raised.",
    "Were there any deadlines mentioned?",
  ],
  all: [
    "What common objections are raised by customers in these calls?",
    "Which features are most frequently mentioned or requested?",
    "Summarize the customer's current use case and goals.",
    "Help me create an agenda for my next call.",
  ],
};

/**
 * Ask Fathom: conversational panel over one meeting or all meetings. Answers
 * cite moments; clicking a citation seeks the player (on a call) or opens the
 * call at that timestamp. History is not persisted, matching the real product.
 */
export function AskPanel({
  meetings,
  scope,
  scopeLabel,
  onSeek,
  className,
  compact,
}: {
  meetings: Meeting[];
  scope: "meeting" | "all";
  scopeLabel?: string;
  onSeek?: (seconds: number) => void;
  className?: string;
  compact?: boolean;
}) {
  const key = scope === "meeting" ? `m_${meetings[0]?.id}` : "all";
  const history = useAppStore((s) => s.askHistory[key] ?? []);
  const pushAsk = useAppStore((s) => s.pushAsk);
  const clearAsk = useAppStore((s) => s.clearAsk);
  const [q, setQ] = useState("");
  const [thinking, setThinking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [history.length, thinking]);

  const submit = (text: string) => {
    const question = text.trim();
    if (!question || thinking) return;
    setQ("");
    setThinking(true);
    window.setTimeout(() => {
      const { answer, citations } = askFathom(meetings, question, scope);
      pushAsk(key, { q: question, a: answer, at: citations[0]?.at });
      setThinking(false);
      // stash citations on the entry via a parallel map
      citationStore.set(`${key}:${history.length}`, citations);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {history.length === 0 && !thinking ? (
          <div className={cn("px-1", compact ? "py-3" : "py-6")}>
            <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-off-white">
              <Sparkles className="size-4 text-fathom" />
              Ask Fathom {scopeLabel ? <span className="font-normal text-white/50">· {scopeLabel}</span> : null}
            </div>
            <p className="mb-4 text-[13px] leading-5 text-white/55">
              {scope === "meeting"
                ? "Ask anything about this meeting. Answers link to the exact moment in the recording."
                : "Ask questions across all your meetings, your team’s meetings, or your entire organization."}
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_PROMPTS[scope]!.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => submit(p)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[13px] leading-5 text-white/80 transition-colors hover:border-fathom/40 hover:bg-fathom/5 hover:text-off-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 px-1 py-4">
            {history.map((h, i) => (
              <div key={i} className="space-y-2.5">
                <div className="ml-8 rounded-2xl rounded-tr-sm bg-[#2a3b45] px-3.5 py-2 text-[14px] leading-5 text-off-white">{h.q}</div>
                <div className="flex gap-2.5">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-fathom/20 text-fathom">
                    <Sparkles className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-6 text-white/85">{h.a}</p>
                    <Citations scopeKey={key} index={i} onSeek={onSeek} scope={scope} fallbackAt={h.at} meetingId={meetings[0]?.id} />
                  </div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex items-center gap-2.5 text-[13px] text-white/50">
                <span className="flex size-5 items-center justify-center rounded-full bg-fathom/20 text-fathom">
                  <Sparkles className="size-3 animate-pulse-slow" />
                </span>
                Searching {scope === "meeting" ? "this meeting" : "your meetings"}…
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="mt-2 flex items-end gap-2 border-t border-white/10 pt-3"
      >
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-app-input pl-3.5 pr-1.5 transition-colors focus-within:border-fathom">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={scope === "meeting" ? "Ask about this meeting…" : "Ask across all your meetings…"}
            aria-label="Ask Fathom"
            className="h-10 min-w-0 flex-1 bg-transparent text-[14px] text-off-white placeholder:text-white/40 outline-none"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!q.trim() || thinking}
            className="flex size-7 items-center justify-center rounded-lg bg-fathom text-black transition-opacity disabled:opacity-30"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </button>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            aria-label="Clear conversation"
            onClick={() => clearAsk(key)}
            className="flex size-10 items-center justify-center rounded-xl text-white/40 hover:bg-white/8 hover:text-white"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </form>
      <p className="mt-1.5 text-[11px] text-white/35">Ask Fathom history is not saved when you leave this view.</p>
    </div>
  );
}

const citationStore = new Map<string, { meetingId: string; at: number; label: string }[]>();

function Citations({
  scopeKey,
  index,
  onSeek,
  scope,
  fallbackAt,
  meetingId,
}: {
  scopeKey: string;
  index: number;
  onSeek?: (s: number) => void;
  scope: "meeting" | "all";
  fallbackAt?: number;
  meetingId?: string;
}) {
  const cites =
    citationStore.get(`${scopeKey}:${index}`) ??
    (fallbackAt !== undefined && meetingId ? [{ meetingId, at: fallbackAt, label: "" }] : []);
  if (!cites.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {cites.map((c, i) =>
        scope === "meeting" && onSeek ? (
          <button
            key={i}
            type="button"
            onClick={() => onSeek(c.at)}
            className="inline-flex items-center gap-1 rounded-md bg-fathom/12 px-2 py-1 text-[12px] font-medium text-fathom transition-colors hover:bg-fathom/20"
          >
            <Clock3 className="size-3" />
            {formatClock(c.at)}
          </button>
        ) : (
          <Link
            key={i}
            href={`/calls/${c.meetingId}?t=${c.at}`}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-fathom/12 px-2 py-1 text-[12px] font-medium text-fathom transition-colors hover:bg-fathom/20"
          >
            <Clock3 className="size-3 shrink-0" />
            <span className="truncate">{c.label || "Open"}</span>
            <span className="text-fathom/70">{formatClock(c.at)}</span>
          </Link>
        ),
      )}
    </div>
  );
}
