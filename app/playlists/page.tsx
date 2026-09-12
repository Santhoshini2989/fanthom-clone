"use client";

import Link from "next/link";
import { useState } from "react";
import { ListVideo, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { Input, Textarea } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAppStore, useHydrated } from "@/lib/store";
import { userById } from "@/data/users";
import { formatDurationShort } from "@/lib/utils";
import { FathomSpinner } from "@/components/brand/logo";

export default function PlaylistsPage() {
  const hydrated = useHydrated();
  const playlists = useAppStore((s) => s.playlists);
  const meetings = useAppStore((s) => s.meetings);
  const createPlaylist = useAppStore((s) => s.createPlaylist);
  const deletePlaylist = useAppStore((s) => s.deletePlaylist);
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const durationOf = (p: (typeof playlists)[number]) =>
    p.clipIds.reduce((acc, c) => {
      const h = meetings.find((m) => m.id === c.meetingId)?.highlights.find((x) => x.id === c.highlightId);
      return acc + (h ? h.end - h.start : 0);
    }, 0);

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={meetings} askLabel="Playlists">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold">Playlists</h1>
          <Button variant="share" size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New Playlist
          </Button>
        </div>
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <ListVideo className="mb-4 size-10 text-white/30" />
            <h2 className="text-lg font-semibold">No playlists yet</h2>
            <p className="mt-1 max-w-sm text-sm text-white/55">Collect highlight clips from across your meetings. Add a clip from a highlight’s menu on any call page.</p>
            <Button className="mt-5" variant="share" onClick={() => setCreating(true)}>Create a playlist</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {playlists.map((p) => (
              <div key={p.id} className="group relative rounded-xl border border-white/10 bg-app-card p-4 transition-colors hover:border-white/20">
                <Link href={`/playlists/${p.id}`} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-fathom/60">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-purple/25 text-brand-pink">
                      <ListVideo className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[15px] font-semibold">{p.name}</h3>
                      <p className="line-clamp-2 text-[13px] leading-5 text-white/55">{p.description}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] text-white/45">
                    {p.clipIds.length} clip{p.clipIds.length === 1 ? "" : "s"} · {formatDurationShort(durationOf(p))} · {userById(p.ownerId).name}
                  </p>
                </Link>
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Dropdown>
                    <DropdownTrigger>
                      <span aria-label="Playlist options" className="flex size-7 items-center justify-center rounded-md text-white/70 hover:bg-white/10">
                        <MoreHorizontal className="size-4" />
                      </span>
                    </DropdownTrigger>
                    <DropdownContent align="end" width={200}>
                      <DropdownItem icon={<Trash2 />} destructive onSelect={() => setDeleting(p.id)}>Delete Playlist</DropdownItem>
                    </DropdownContent>
                  </Dropdown>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={creating} onClose={() => setCreating(false)} title="New Playlist" width={480}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createPlaylist(name.trim(), desc.trim() || undefined);
              toast(`Playlist “${name.trim()}” created`);
              setName(""); setDesc(""); setCreating(false);
            }}
            className="space-y-3"
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" aria-label="Playlist name" />
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" rows={3} aria-label="Description" />
            <div className="flex justify-end gap-2 pt-1">
              <Button onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="cyan" type="submit" disabled={!name.trim()}>Create</Button>
            </div>
          </form>
        </Modal>
        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => { if (deleting) { deletePlaylist(deleting); toast("Playlist deleted"); } }}
          title="Delete playlist?"
          body="The clips remain on their original recordings."
          confirmLabel="Delete"
          destructive
        />
      </LibraryPage>
    </AppShell>
  );
}
