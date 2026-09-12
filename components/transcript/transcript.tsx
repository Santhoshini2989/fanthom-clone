"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, CheckSquare, Copy, MoreHorizontal, Pencil, Plus, Scissors, Search, UserRound, X } from "lucide-react";
import type { Meeting, TranscriptSegment } from "@/data/types";
import type { Playback } from "@/lib/playback";
import { useAppStore } from "@/lib/store";
import { cn, copyText, formatClock } from "@/lib/utils";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Highlighted } from "@/components/search/ai-search";

/**
 * Transcript tab (verified): speaker bubbles with the name (and pronouns)
 * under each run, a blue "+" on the left on hover (Action Item / Bookmark /
 * highlight types), a "⋯" per bubble (Edit transcript / Change speaker / Trim
 * this section / Trim all before / after), "Copy Transcript" above, and cyan
 * diamond markers on the left rail for highlights. Clicking a bubble seeks the
 * player; the current bubble follows playback and auto-scrolls.
 */
export function Transcript({
  meeting,
  playback,
  onCreateHighlight,
  readOnly,
  className,
}: {
  meeting: Meeting;
  playback: Playback;
  onCreateHighlight?: (segment: TranscriptSegment, typeId: string) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const highlightTypes = useAppStore((s) => s.highlightTypes);
  const edits = useAppStore((s) => s.transcriptEdits);
  const trimmed = useAppStore((s) => s.trimmedSegments[meeting.id] ?? []);
  const bookmarks = useAppStore((s) => s.bookmarks[meeting.id] ?? []);
  const editTranscript = useAppStore((s) => s.editTranscript);
  const trimSegments = useAppStore((s) => s.trimSegments);
  const addBookmark = useAppStore((s) => s.addBookmark);
  const addActionItem = useAppStore((s) => s.addActionItem);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [follow, setFollow] = useState(true);
  const [editing, setEditing] = useState<TranscriptSegment | null>(null);
  const [editText, setEditText] = useState("");
  const [changingSpeaker, setChangingSpeaker] = useState<TranscriptSegment | null>(null);
  const [trim, setTrim] = useState<{ ids: string[]; label: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(
    () =>
      meeting.transcript
        .filter((s) => !trimmed.includes(s.id))
        .map((s) => ({ ...s, text: edits[s.id]?.text ?? s.text, speakerId: edits[s.id]?.speakerId ?? s.speakerId })),
    [meeting.transcript, trimmed, edits],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? segments.filter((s) => s.text.toLowerCase().includes(q)) : segments;
  }, [segments, query]);

  const activeId = useMemo(() => {
    const t = playback.time;
    let cur: string | null = null;
    for (const s of segments) if (t >= s.start) cur = s.id;
    return cur;
  }, [segments, playback.time]);

  useEffect(() => {
    if (!follow || !activeId || query) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-seg="${activeId}"]`);
    el?.scrollIntoView({ block: "center", behavior: playback.playing ? "smooth" : "auto" });
  }, [activeId, follow, query, playback.playing]);

  const speakerOf = (id: string) => meeting.speakers.find((s) => s.id === id);
  const highlightFor = (seg: TranscriptSegment) => meeting.highlights.find((h) => h.segmentIds.includes(seg.id) || (seg.start >= h.start && seg.end <= h.end));

  const copyTranscript = async () => {
    const text = segments
      .map((s) => `${speakerOf(s.speakerId)?.name ?? "Speaker"} (${formatClock(s.start)}):\n${s.text}`)
      .join("\n\n");
    await copyText(text);
    toast("Transcript copied to clipboard");
  };

  // group consecutive segments by speaker into runs (name shown once under the run)
  const runs = useMemo(() => {
    const out: { speakerId: string; items: typeof visible }[] = [];
    for (const s of visible) {
      const last = out[out.length - 1];
      if (last && last.speakerId === s.speakerId && !query) last.items.push(s);
      else out.push({ speakerId: s.speakerId, items: [s] });
    }
    return out;
  }, [visible, query]);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-3 flex items-center gap-2">
        {showSearch ? (
          <div className="flex h-8 flex-1 items-center gap-2 rounded-md border border-white/15 bg-app-input px-2.5">
            <Search className="size-3.5 text-white/50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transcript"
              aria-label="Search transcript"
              className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-off-white placeholder:text-white/40 outline-none"
            />
            {query && <span className="text-[11px] text-white/50">{visible.length} match{visible.length === 1 ? "" : "es"}</span>}
            <button type="button" aria-label="Close search" onClick={() => { setShowSearch(false); setQuery(""); }} className="text-white/50 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowSearch(true)} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[13px] text-white/70 hover:bg-white/8 hover:text-white">
            <Search className="size-3.5" /> Search
          </button>
        )}
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-white/55">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-fathom" />
          Follow playback
        </label>
        <Button variant="share" size="sm" onClick={copyTranscript}>
          <Copy className="size-3.5" /> Copy Transcript
        </Button>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin" onWheel={() => playback.playing && setFollow(false)}>
        {visible.length === 0 && (
          <p className="py-10 text-center text-sm text-white/50">No lines match “{query}”.</p>
        )}
        {runs.map((run, ri) => {
          const speaker = speakerOf(run.speakerId);
          return (
            <div key={`${run.speakerId}_${ri}`} className="relative mb-4 pl-7">
              {run.items.map((seg) => {
                const hl = highlightFor(seg);
                const type = hl ? highlightTypes.find((t) => t.id === hl.typeId) : undefined;
                const isFirstOfHl = hl && (hl.segmentIds[0] === seg.id || Math.abs(hl.start - seg.start) < 1);
                const active = seg.id === activeId;
                const bookmarked = bookmarks.some((b) => b >= seg.start && b < seg.end);
                return (
                  <div key={seg.id} data-seg={seg.id} className="group/seg relative mb-1.5">
                    {/* left rail: highlight diamond / hover plus */}
                    <div className="absolute -left-7 top-0 flex h-full w-6 items-start justify-center">
                      {hl ? (
                        <span className="relative flex h-full w-full justify-center">
                          <span className="absolute top-2 bottom-0 w-[3px]" style={{ backgroundColor: type?.color ?? "#00beff" }} />
                          {isFirstOfHl && (
                            <span
                              className="absolute top-1 size-3 rotate-45 border-2 border-app-bg"
                              style={{ backgroundColor: type?.color ?? "#00beff" }}
                              title={type?.name}
                            />
                          )}
                        </span>
                      ) : bookmarked ? (
                        <Bookmark className="mt-1 size-3.5 text-white/60" fill="currentColor" />
                      ) : !readOnly ? (
                        <Dropdown>
                          <DropdownTrigger>
                            <span
                              aria-label="Add annotation"
                              className="mt-1 flex size-5 items-center justify-center rounded-full bg-fathom text-black opacity-0 transition-opacity group-hover/seg:opacity-100 focus-visible:opacity-100"
                            >
                              <Plus className="size-3.5" strokeWidth={3} />
                            </span>
                          </DropdownTrigger>
                          <DropdownContent align="start" width={230} className="p-1.5">
                            <DropdownItem
                              icon={<CheckSquare />}
                              className="text-[13px] font-bold uppercase tracking-wide"
                              onSelect={() => {
                                addActionItem(meeting.id, { text: seg.text.split(/(?<=[.!?])\s+/)[0] ?? seg.text, at: seg.start });
                                toast("Action item added");
                              }}
                            >
                              Action Item
                            </DropdownItem>
                            <DropdownItem
                              icon={<Bookmark />}
                              className="text-[13px] font-bold uppercase tracking-wide text-white/60"
                              onSelect={() => {
                                addBookmark(meeting.id, seg.start);
                                toast("Bookmark added");
                              }}
                            >
                              Bookmark
                            </DropdownItem>
                            <DropdownSeparator />
                            {highlightTypes.map((t) => (
                              <DropdownItem
                                key={t.id}
                                className="text-[13px] font-bold uppercase tracking-wide"
                                icon={<span className="flex size-3.5 items-center justify-center rounded-[3px] border-2" style={{ borderColor: t.color }}><span className="ml-[1px] size-0 border-y-[3px] border-l-[4px] border-y-transparent" style={{ borderLeftColor: t.color }} /></span>}
                                onSelect={() => onCreateHighlight?.(seg, t.id)}
                              >
                                <span style={{ color: t.color }}>{t.name}</span>
                              </DropdownItem>
                            ))}
                          </DropdownContent>
                        </Dropdown>
                      ) : null}
                    </div>

                    {isFirstOfHl && type && (
                      <div className="mb-1.5 flex items-start gap-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: type.color }}>
                        {type.name}
                        <span className="font-semibold normal-case tracking-normal text-white/85">{hl.title}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-1.5">
                      <button
                        type="button"
                        onClick={() => playback.seek(seg.start)}
                        title={formatClock(seg.start)}
                        className={cn(
                          "max-w-full rounded-lg px-3 py-2 text-left text-[15px] leading-[22px] text-off-white transition-[background-color,box-shadow] duration-150",
                          hl ? "bg-[#0f5d80]" : "bg-app-bubble hover:bg-[#4a4b4b]",
                          active && "shadow-[0_0_0_2px_rgba(0,190,255,0.7)]",
                        )}
                      >
                        <span className="mr-2 font-inter text-[11px] tabular-nums text-white/45">{formatClock(seg.start)}</span>
                        {query ? <Highlighted text={seg.text} q={query} /> : seg.text}
                      </button>
                      {!readOnly && (
                        <Dropdown>
                          <DropdownTrigger>
                            <span aria-label="Transcript section options" className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4b4b50] text-white opacity-0 transition-opacity group-hover/seg:opacity-100 focus-visible:opacity-100">
                              <MoreHorizontal className="size-4" />
                            </span>
                          </DropdownTrigger>
                          <DropdownContent align="end" width={280} className="bg-[#121314] p-2">
                            <DropdownItem icon={<Pencil />} className="text-[15px] font-semibold" onSelect={() => { setEditing(seg); setEditText(seg.text); }}>Edit transcript</DropdownItem>
                            <DropdownItem icon={<UserRound />} className="text-[15px] font-semibold" onSelect={() => setChangingSpeaker(seg)}>Change speaker</DropdownItem>
                            <DropdownItem icon={<Scissors />} className="text-[15px] font-semibold" onSelect={() => setTrim({ ids: [seg.id], label: "this section" })}>Trim this section</DropdownItem>
                            <DropdownItem
                              icon={<Scissors />}
                              className="text-[15px] font-semibold"
                              onSelect={() => setTrim({ ids: segments.filter((s) => s.start < seg.start).map((s) => s.id), label: "all sections before this section" })}
                            >
                              Trim all sections before this section
                            </DropdownItem>
                            <DropdownItem
                              icon={<Scissors />}
                              className="text-[15px] font-semibold"
                              onSelect={() => setTrim({ ids: segments.filter((s) => s.start > seg.start).map((s) => s.id), label: "all sections after this section" })}
                            >
                              Trim all sections after this section
                            </DropdownItem>
                          </DropdownContent>
                        </Dropdown>
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="mt-1 text-[13px] font-medium text-white/70">
                {speaker?.name ?? "Unknown speaker"}
                {speaker?.pronouns ? <span className="text-white/45"> ({speaker.pronouns})</span> : null}
              </p>
            </div>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit transcript" width={560}>
        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} aria-label="Transcript text" />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="cyan"
            onClick={() => {
              if (editing) editTranscript(editing.id, { text: editText.trim() });
              setEditing(null);
              toast("Transcript updated");
            }}
          >
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={!!changingSpeaker} onClose={() => setChangingSpeaker(null)} title="Change speaker" width={420}>
        <DropdownLabel>Speakers on this call</DropdownLabel>
        <div className="mt-1 flex flex-col gap-1">
          {meeting.speakers.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                if (changingSpeaker) editTranscript(changingSpeaker.id, { speakerId: s.id });
                setChangingSpeaker(null);
                toast(`Speaker changed to ${s.name}`);
              }}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] hover:bg-white/8", changingSpeaker?.speakerId === s.id && "text-fathom")}
            >
              <span className="size-3 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
              {s.pronouns && <span className="text-white/45">({s.pronouns})</span>}
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!trim}
        onClose={() => setTrim(null)}
        onConfirm={() => {
          if (trim) {
            trimSegments(meeting.id, trim.ids);
            toast(`Trimmed ${trim.label}`);
          }
        }}
        title={`Trim ${trim?.label ?? ""}?`}
        body="Once a meeting is trimmed, it cannot be undone. The trimmed portion is removed from the recording, transcript and summary."
        confirmLabel="Trim"
        destructive
      />
    </div>
  );
}
