"use client";

import Link from "next/link";
import { useState } from "react";
import { Folder, FolderPlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useAppStore, useHydrated } from "@/lib/store";
import { TEAMS, userById } from "@/data/users";
import { Thumbnail } from "@/components/meetings/thumbnail";
import { FathomSpinner } from "@/components/brand/logo";

export default function FoldersPage() {
  const hydrated = useHydrated();
  const folders = useAppStore((s) => s.folders);
  const meetings = useAppStore((s) => s.meetings);
  const createFolder = useAppStore((s) => s.createFolder);
  const renameFolder = useAppStore((s) => s.renameFolder);
  const deleteFolder = useAppStore((s) => s.deleteFolder);
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    if (renaming) {
      renameFolder(renaming, n);
      toast("Folder renamed");
    } else {
      createFolder(n);
      toast(`Folder “${n}” created`);
    }
    setName("");
    setCreating(false);
    setRenaming(null);
  };

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={meetings} askLabel="Folders">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[15px] font-semibold">Folders</h1>
          <Button variant="share" size="sm" onClick={() => setCreating(true)}>
            <FolderPlus className="size-4" /> New Folder
          </Button>
        </div>

        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <Folder className="mb-4 size-10 text-white/30" />
            <h2 className="text-lg font-semibold">No folders yet</h2>
            <p className="mt-1 max-w-sm text-sm text-white/55">Group recordings by customer, project, or team. Add a call to a folder from its call page.</p>
            <Button className="mt-5" variant="share" onClick={() => setCreating(true)}>Create your first folder</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {folders.map((f) => {
              const inFolder = meetings.filter((m) => m.folderId === f.id);
              const team = TEAMS.find((t) => t.id === f.teamId);
              return (
                <div key={f.id} className="group relative rounded-xl border border-white/10 bg-app-card p-3 transition-colors hover:border-white/20">
                  <Link href={`/folders/${f.id}`} className="block outline-none focus-visible:ring-2 focus-visible:ring-fathom/60 rounded-lg">
                    <div className="grid grid-cols-3 gap-1.5">
                      {inFolder.slice(0, 3).map((m) => (
                        <Thumbnail key={m.id} meeting={m} className="rounded" />
                      ))}
                      {Array.from({ length: Math.max(0, 3 - inFolder.length) }).map((_, i) => (
                        <div key={i} className="aspect-video rounded border border-dashed border-white/15" />
                      ))}
                    </div>
                    <div className="mt-3 flex items-start gap-2.5">
                      <Folder className="mt-0.5 size-4 shrink-0 text-fathom" />
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold">{f.name}</h3>
                        <p className="text-[13px] text-white/55">
                          {inFolder.length} recording{inFolder.length === 1 ? "" : "s"}
                          {team ? ` · ${team.name}` : ` · ${userById(f.ownerId).name}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Dropdown>
                      <DropdownTrigger>
                        <span aria-label="Folder options" className="flex size-7 items-center justify-center rounded-md bg-black/50 text-white/80 hover:bg-black/70">
                          <MoreHorizontal className="size-4" />
                        </span>
                      </DropdownTrigger>
                      <DropdownContent align="end" width={200}>
                        <DropdownItem icon={<Pencil />} onSelect={() => { setRenaming(f.id); setName(f.name); setCreating(true); }}>Rename</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem icon={<Trash2 />} destructive onSelect={() => setDeleting(f.id)}>Delete Folder</DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={creating} onClose={() => { setCreating(false); setRenaming(null); setName(""); }} title={renaming ? "Rename Folder" : "New Folder"} width={460}>
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" aria-label="Folder name" />
            <div className="flex justify-end gap-2">
              <Button onClick={() => { setCreating(false); setRenaming(null); setName(""); }}>Cancel</Button>
              <Button variant="cyan" type="submit" disabled={!name.trim()}>{renaming ? "Save" : "Create"}</Button>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          open={!!deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => { if (deleting) { deleteFolder(deleting); toast("Folder deleted"); } }}
          title="Delete folder?"
          body="Recordings in this folder are not deleted; they simply won’t be grouped anymore."
          confirmLabel="Delete"
          destructive
        />
      </LibraryPage>
    </AppShell>
  );
}
