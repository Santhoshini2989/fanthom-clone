"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Link2, ListVideo, Play, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { FathomSpinner } from "@/components/brand/logo";
import { Thumbnail } from "@/components/meetings/thumbnail";
import { useToast } from "@/components/ui/toast";
import { useAppStore, useHydrated } from "@/lib/store";
import { copyText, formatClock, formatDurationShort } from "@/lib/utils";
import { userById } from "@/data/users";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const playlist = useAppStore((s) => s.playlists.find((p) => p.id === id));
  const meetings = useAppStore((s) => s.meetings);
  const highlightTypes = useAppStore((s) => s.highlightTypes);
  const removeClip = useAppStore((s) => s.removeClipFromPlaylist);
  const { toast } = useToast();

  const clips = (playlist?.clipIds ?? [])
    .map((c) => {
      const meeting = meetings.find((m) => m.id === c.meetingId);
      const highlight = meeting?.highlights.find((h) => h.id === c.highlightId);
      return meeting && highlight ? { meeting, highlight } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={clips.map((c) => c.meeting)} askLabel={playlist?.name ?? "Playlist"}>
        <Link href="/playlists" className="mb-5 inline-flex items-center gap-1 text-[13px] text-white/60 hover:text-white">
          <ArrowLeft className="size-4" /> Playlists
        </Link>
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : !playlist ? (
          <div className="py-24 text-center text-white/60">This playlist doesn’t exist or was deleted.</div>
        ) : (
          <>
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-purple/25 text-brand-pink">
                <ListVideo className="size-5" />
              </span>
              <div>
                <h1 className="text-xl font-semibold">{playlist.name}</h1>
                <p className="text-sm text-white/55">{playlist.description}</p>
                <p className="mt-1 text-[12px] text-white/45">
                  {clips.length} clip{clips.length === 1 ? "" : "s"} · {userById(playlist.ownerId).name}
                </p>
              </div>
            </div>
            {clips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-white/55">
                No clips yet. On any call page, open a highlight’s menu and choose <b className="text-white/80">Add to Playlist</b>.
              </div>
            ) : (
              <ol className="space-y-3">
                {clips.map(({ meeting, highlight }, i) => {
                  const type = highlightTypes.find((t) => t.id === highlight.typeId);
                  return (
                    <li key={highlight.id} className="group flex gap-4 rounded-xl border border-white/10 bg-app-card p-3 transition-colors hover:border-white/20">
                      <Link href={`/calls/${meeting.id}?t=${highlight.start}`} className="relative w-[200px] shrink-0">
                        <Thumbnail meeting={meeting} />
                        <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-black"><Play className="size-4" fill="currentColor" /></span>
                        </span>
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 text-[11px] text-white">{formatDurationShort(highlight.end - highlight.start)}</span>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: type?.color }}>
                          <span className="text-white/40">{i + 1}.</span> {type?.name ?? "Highlight"}
                          <span className="font-medium normal-case tracking-normal text-white/50">· {formatClock(highlight.start)}</span>
                        </div>
                        <Link href={`/calls/${meeting.id}?t=${highlight.start}`} className="mt-1 block text-[15px] leading-5 text-off-white hover:underline">
                          {highlight.title}
                        </Link>
                        <p className="mt-1 text-[13px] text-white/50">{meeting.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Copy clip link"
                          onClick={async () => { await copyText(`${location.origin}/share/${meeting.id}?clip=${highlight.id}`); toast("Clip link copied"); }}
                          className="flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <Link2 className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove from playlist"
                          onClick={() => { removeClip(playlist.id, highlight.id); toast("Removed from playlist"); }}
                          className="flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </LibraryPage>
    </AppShell>
  );
}
