"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Download,
  FolderInput,
  Link2,
  ListPlus,
  Lock,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { Meeting } from "@/data/types";
import { userById } from "@/data/users";
import { useAppStore, type ApiMeeting } from "@/lib/store";
import { api } from "@/lib/api";
import { actionItemsToText, followUpEmail } from "@/lib/summary-text";
import { cn, copyText, formatClock, formatDate, formatDurationShort } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import { ShareModal } from "./share-modal";
import { VisibilitySelect } from "./visibility";
import { PlatformIcon, PLATFORM_LABEL } from "./platform-icon";

/**
 * Right column of the call page (verified): title, date, "Add to Folder";
 * Share (cyan text on dark-cyan pill, link icon) + ⋯ (Download Video, Delete
 * Call); ATTENDEES; ACTION ITEMS (dashed "None detected. Add manually on
 * transcript tab" box); ANNOTATIONS (highlight cards with ⋯: Delete
 * Annotation · Download Video Clip (mp4) · Add to Playlist, and a share-link
 * icon); QUESTIONS; comments (Team plan).
 */
export function CallSidebar({
  meeting,
  onSeek,
  currentTime,
  className,
}: {
  meeting: Meeting;
  onSeek: (t: number) => void;
  currentTime: number;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const folders = useAppStore((s) => s.folders);
  const playlists = useAppStore((s) => s.playlists);
  const highlightTypes = useAppStore((s) => s.highlightTypes);
  const renameMeeting = useAppStore((s) => s.renameMeeting);
  const setMeetingFolder = useAppStore((s) => s.setMeetingFolder);
  const deleteMeeting = useAppStore((s) => s.deleteMeeting);
  const toggleActionItem = useAppStore((s) => s.toggleActionItem);
  const removeActionItem = useAppStore((s) => s.removeActionItem);
  const addActionItem = useAppStore((s) => s.addActionItem);
  const removeHighlight = useAppStore((s) => s.removeHighlight);
  const addClipToPlaylist = useAppStore((s) => s.addClipToPlaylist);
  const addComment = useAppStore((s) => s.addComment);
  const setVisibility = useAppStore((s) => s.setVisibility);

  const [share, setShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [emailOpen, setEmailOpen] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [comment, setComment] = useState("");

  const folder = folders.find((f) => f.id === meeting.folderId);
  const attendees = meeting.attendeeIds.map(userById);
  const assignee = (id?: string) => (id ? userById(id).name : "Unassigned");
  const openItems = meeting.actionItems.filter((a) => !a.done).length;

  return (
    <aside className={cn("flex flex-col gap-6", className)}>
      {/* title + meta */}
      <div>
        {editingTitle ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (title.trim()) renameMeeting(meeting.id, title.trim());
              setEditingTitle(false);
              toast("Title updated");
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setEditingTitle(false)}
              aria-label="Meeting title"
              className="h-9 min-w-0 flex-1 rounded-md border border-fathom bg-app-input px-2 text-[19px] font-semibold text-off-white outline-none"
            />
            <button type="submit" aria-label="Save title" className="rounded-md p-1.5 text-fathom hover:bg-white/8"><Check className="size-4" /></button>
            <button type="button" aria-label="Cancel" onClick={() => { setEditingTitle(false); setTitle(meeting.title); }} className="rounded-md p-1.5 text-white/60 hover:bg-white/8"><X className="size-4" /></button>
          </form>
        ) : (
          <h1 className="group flex items-start gap-2 text-[21px] font-semibold leading-7 text-off-white">
            <span className="min-w-0 break-words">{meeting.title}</span>
            <button
              type="button"
              aria-label="Rename"
              onClick={() => setEditingTitle(true)}
              className="mt-1 shrink-0 rounded p-1 text-white/40 opacity-0 transition-opacity hover:bg-white/8 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Pencil className="size-3.5" />
            </button>
          </h1>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/55">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" /> {formatDate(meeting.startedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <PlatformIcon platform={meeting.platform} className="size-3.5" /> {PLATFORM_LABEL[meeting.platform]} · {formatDurationShort(meeting.duration)}
          </span>
          <Dropdown>
            <DropdownTrigger>
              <span className="flex items-center gap-1.5 rounded px-1 py-0.5 text-white/70 hover:bg-white/8 hover:text-white">
                <FolderInput className="size-3.5" /> {folder ? folder.name : "Add to Folder"}
              </span>
            </DropdownTrigger>
            <DropdownContent align="start" width={240}>
              {folders.map((f) => (
                <DropdownItem key={f.id} selected={f.id === meeting.folderId} onSelect={() => { setMeetingFolder(meeting.id, f.id); toast(`Added to ${f.name}`); }}>
                  {f.name}
                </DropdownItem>
              ))}
              {folder && (
                <>
                  <DropdownSeparator />
                  <DropdownItem destructive onSelect={() => { setMeetingFolder(meeting.id, undefined); toast("Removed from folder"); }}>
                    Remove from folder
                  </DropdownItem>
                </>
              )}
            </DropdownContent>
          </Dropdown>
        </div>
        <div className="mt-2 -ml-2">
          <VisibilitySelect value={meeting.visibility} onChange={(v) => { setVisibility(meeting.id, v); toast("Team visibility updated"); }} />
        </div>
      </div>

      {/* share + kebab */}
      <div className="flex items-center gap-1.5">
        <Button variant="share" className="h-11 flex-1 justify-between px-4 text-[16px] font-semibold" onClick={() => setShare(true)}>
          Share
          <Link2 className="size-4" />
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <span aria-label="More actions" className="flex size-11 items-center justify-center rounded-lg bg-app-card text-white/80 hover:bg-app-card-hover">
              <MoreVertical className="size-5" />
            </span>
          </DropdownTrigger>
          <DropdownContent align="end" width={260} className="bg-[#121314]">
            <DropdownItem icon={<Mail />} className="text-[16px] font-semibold" onSelect={() => setEmailOpen(true)}>Draft Follow-up Email</DropdownItem>
            <DropdownItem icon={<Download />} className="text-[16px] font-semibold" onSelect={() => toast(`Preparing ${meeting.title}.mp4…`, "info")}>Download Video</DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<Trash2 />} destructive className="text-[16px] font-semibold" onSelect={() => setConfirmDelete(true)}>Delete Call</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>

      {/* attendees */}
      <Section title="Attendees" count={attendees.length}>
        <ul className="space-y-2">
          {attendees.map((u) => (
            <li key={u.id} className="flex items-center gap-2.5">
              <Avatar user={u} size="sm" />
              <span className="min-w-0 flex-1 truncate text-[14px] text-off-white">{u.name}</span>
              {u.isExternal && <span className="text-[11px] text-white/45">{u.email.split("@")[1]}</span>}
              {u.id === meeting.ownerId && <span className="text-[11px] text-white/45">Host</span>}
            </li>
          ))}
        </ul>
      </Section>

      {/* action items */}
      <Section
        title="Action Items"
        count={meeting.actionItems.length || undefined}
        action={
          meeting.actionItems.length ? (
            <div className="flex items-center gap-1">
              <Tooltip label="Copy action items">
                <button type="button" aria-label="Copy action items" onClick={async () => { await copyText(actionItemsToText(meeting, assignee)); toast("Action items copied"); }} className="rounded p-1 text-white/50 hover:bg-white/8 hover:text-white">
                  <Link2 className="size-3.5" />
                </button>
              </Tooltip>
              <Tooltip label="Add action item">
                <button type="button" aria-label="Add action item" onClick={() => setAddingItem(true)} className="rounded p-1 text-white/50 hover:bg-white/8 hover:text-white">
                  <Plus className="size-3.5" />
                </button>
              </Tooltip>
            </div>
          ) : null
        }
      >
        {meeting.actionItems.length === 0 && !addingItem ? (
          <button
            type="button"
            onClick={() => setAddingItem(true)}
            className="w-full rounded-lg border border-dashed border-white/25 bg-[#1c1c22] px-4 py-3.5 text-left text-[14px] italic leading-5 text-white/55 hover:border-white/40"
          >
            None detected. Add manually on transcript tab
          </button>
        ) : (
          <ul className="space-y-1">
            {meeting.actionItems.map((a) => (
              <li key={a.id} className="group/ai flex items-start gap-2.5 rounded-md py-1 pr-1 hover:bg-white/[0.04]">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={a.done}
                  aria-label={a.done ? "Mark not done" : "Mark done"}
                  onClick={() => toggleActionItem(meeting.id, a.id)}
                  className={cn(
                    "mt-[3px] flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                    a.done ? "border-fathom bg-fathom text-black" : "border-white/40 hover:border-white/80",
                  )}
                >
                  {a.done && <Check className="size-3" strokeWidth={3.5} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[14px] leading-5 text-off-white", a.done && "text-white/45 line-through")}>{a.text}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[12px] text-white/45">
                    {a.assigneeId && (
                      <span className="flex items-center gap-1">
                        <Avatar user={userById(a.assigneeId)} size="xs" /> {userById(a.assigneeId).name.split(" ")[0]}
                      </span>
                    )}
                    {a.at !== undefined && (
                      <button type="button" onClick={() => onSeek(a.at!)} className="font-inter tabular-nums text-fathom hover:underline">
                        {formatClock(a.at)}
                      </button>
                    )}
                    {a.source === "manual" && <span>manual</span>}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove action item"
                  onClick={() => removeActionItem(meeting.id, a.id)}
                  className="mt-0.5 rounded p-1 text-white/40 opacity-0 hover:bg-white/8 hover:text-white group-hover/ai:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {addingItem && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newItem.trim()) {
                addActionItem(meeting.id, { text: newItem.trim(), at: Math.round(currentTime), assigneeId: "u_nancy" });
                toast("Action item added");
              }
              setNewItem("");
              setAddingItem(false);
            }}
            className="mt-2 flex items-center gap-2"
          >
            <input
              autoFocus
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setAddingItem(false)}
              placeholder="Describe the action item…"
              aria-label="New action item"
              className="h-9 min-w-0 flex-1 rounded-md border border-white/15 bg-app-input px-2.5 text-[14px] text-off-white outline-none focus:border-fathom"
            />
            <Button size="sm" variant="cyan" type="submit" disabled={!newItem.trim()}>Add</Button>
          </form>
        )}
        {openItems > 0 && (
          <button type="button" onClick={() => setEmailOpen(true)} className="mt-3 text-[13px] font-medium text-fathom hover:underline">
            Draft follow-up email from action items
          </button>
        )}
      </Section>

      {/* annotations */}
      <Section
        title="Annotations"
        badge={meeting.visibility === "private" || meeting.visibility === "no_teams" ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-fathom-warn"><Lock className="size-3" /> Internal to your team</span> : undefined}
      >
        {meeting.highlights.length === 0 ? (
          <p className="text-[13px] leading-5 text-white/50">No highlights yet. Hover a transcript line and click <span className="text-fathom">+</span> to add one.</p>
        ) : (
          <ul className="space-y-2">
            {meeting.highlights.map((h) => {
              const type = highlightTypes.find((t) => t.id === h.typeId);
              const active = currentTime >= h.start && currentTime < h.end;
              return (
                <li key={h.id} className={cn("group/hl rounded-lg bg-[#313131] p-3 transition-shadow", active && "shadow-[0_0_0_1px_rgba(0,190,255,0.6)]")}>
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => onSeek(h.start)} className="mt-0.5 shrink-0 text-fathom" aria-label="Play highlight">
                      <Play className="size-3" fill="currentColor" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => onSeek(h.start)} className="text-left text-[15px] font-semibold leading-5" style={{ color: type?.color ?? "#00beff" }}>
                        {type?.name ?? "Highlight"} <span className="font-normal text-white/60">- {formatDurationShort(h.end - h.start)}</span>
                      </button>
                      <p className="mt-0.5 text-[14px] leading-5 text-white/85">{h.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Tooltip label="Copy clip link">
                        <button
                          type="button"
                          aria-label="Copy highlight link"
                          onClick={async () => { await copyText(`${location.origin}/share/${meeting.id}?clip=${h.id}`); toast("Highlight clip link copied to clipboard"); }}
                          className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
                        >
                          <Link2 className="size-4" />
                        </button>
                      </Tooltip>
                      <Dropdown>
                        <DropdownTrigger>
                          <span aria-label="Annotation options" className="flex size-6 items-center justify-center rounded-full bg-[#4b4b50] text-white hover:bg-[#5a5a60]">
                            <MoreVertical className="size-3.5" />
                          </span>
                        </DropdownTrigger>
                        <DropdownContent align="end" width={250} className="bg-[#121314]">
                          <DropdownItem icon={<Trash2 />} className="text-[15px] font-semibold" onSelect={() => { removeHighlight(meeting.id, h.id); toast("Annotation deleted"); }}>Delete Annotation</DropdownItem>
                          <DropdownItem
                            icon={<Download />}
                            className="text-[15px] font-semibold"
                            onSelect={async () => {
                              if (!(meeting as ApiMeeting).db?.hasRecording) {
                                toast("This meeting has no recording file to clip", "info");
                                return;
                              }
                              toast("Preparing clip…", "info");
                              try {
                                const clip = await api.post<{ id: string; status: string; error?: string | null }>(`/api/meetings/${meeting.id}/clips`, { start: h.start, end: h.end, title: h.title, highlightId: h.id });
                                if (clip.status !== "READY") throw new Error(clip.error ?? "Clip failed");
                                window.open(`/api/clips/${clip.id}/file`, "_blank");
                              } catch (e) {
                                toast(e instanceof Error ? e.message : "Clip failed", "error");
                              }
                            }}
                          >
                            Download Audio Clip
                          </DropdownItem>
                          {playlists.map((p) => (
                            <DropdownItem key={p.id} icon={<ListPlus />} className="text-[15px] font-semibold" onSelect={() => { addClipToPlaylist(p.id, meeting.id, h.id); toast(`Added to ${p.name}`); }}>
                              Add to {p.name}
                            </DropdownItem>
                          ))}
                          {playlists.length === 0 && (
                            <DropdownItem icon={<ListPlus />} className="text-[15px] font-semibold" onSelect={() => router.push("/playlists")}>Add to Playlist</DropdownItem>
                          )}
                        </DropdownContent>
                      </Dropdown>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* questions */}
      {meeting.questions.length > 0 && (
        <Section title="Questions" count={meeting.questions.length}>
          <ul className="space-y-1.5">
            {meeting.questions.map((q) => (
              <li key={q.id}>
                <button type="button" onClick={() => onSeek(q.at)} className="flex w-full items-start gap-2 rounded-md py-1 text-left hover:bg-white/[0.04]">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-white/40 text-[10px] text-white/70">?</span>
                  <span className="min-w-0 flex-1 text-[14px] leading-5 text-white/80">“{q.text}”</span>
                  <span className="shrink-0 font-inter text-[11px] tabular-nums text-white/45">{formatClock(q.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* comments */}
      <Section title="Comments" count={meeting.comments.length || undefined}>
        <ul className="space-y-3">
          {meeting.comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar user={userById(c.authorId)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-white/60">
                  <span className="font-semibold text-off-white">{userById(c.authorId).name}</span>
                  {c.at !== undefined && (
                    <button type="button" onClick={() => onSeek(c.at!)} className="ml-2 font-inter tabular-nums text-fathom hover:underline">{formatClock(c.at)}</button>
                  )}
                </p>
                <p className="text-[14px] leading-5 text-white/85">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            addComment(meeting.id, comment.trim(), Math.round(currentTime));
            setComment("");
            toast("Comment added");
          }}
          className="mt-3 flex items-end gap-2"
        >
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-white/15 bg-app-input pl-3 pr-1 focus-within:border-fathom">
            <MessageSquare className="mr-2 size-3.5 shrink-0 text-white/40" />
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Comment at ${formatClock(currentTime)}…`}
              aria-label="Add a comment"
              className="h-9 min-w-0 flex-1 bg-transparent text-[14px] text-off-white placeholder:text-white/40 outline-none"
            />
            <button type="submit" aria-label="Post comment" disabled={!comment.trim()} className="rounded-md p-1.5 text-fathom disabled:opacity-30">
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </Section>

      <ShareModal open={share} onClose={() => setShare(false)} meeting={meeting} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteMeeting(meeting.id);
          toast("Call deleted");
          router.push("/my_calls");
        }}
        title="Delete call?"
        body="Deleting a call recording will also remove all associated notes. Once deleted, a call cannot be recovered."
        confirmLabel="Delete Call"
        destructive
      />
      <Modal open={emailOpen} onClose={() => setEmailOpen(false)} title="Follow-up email" width={640}>
        <Textarea readOnly value={followUpEmail(meeting, assignee)} rows={12} className="font-inter text-[14px]" aria-label="Follow-up email draft" />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setEmailOpen(false)}>Close</Button>
          <Button variant="cyan" onClick={async () => { await copyText(followUpEmail(meeting, assignee)); toast("Email draft copied"); }}>
            Copy Email
          </Button>
        </div>
      </Modal>
    </aside>
  );
}

function Section({
  title,
  count,
  action,
  badge,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-white/55">{title}</h2>
        {typeof count === "number" && <span className="text-[12px] text-white/40">{count}</span>}
        {badge}
        <span className="ml-auto">{action}</span>
      </div>
      {children}
    </section>
  );
}
