"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Folder } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { MeetingGrid } from "@/components/meetings/meeting-grid";
import { FathomSpinner } from "@/components/brand/logo";
import { useAppStore, useHydrated } from "@/lib/store";

export default function FolderPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const folder = useAppStore((s) => s.folders.find((f) => f.id === id));
  const meetings = useAppStore((s) => s.meetings.filter((m) => m.folderId === id));

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={meetings} askLabel={folder?.name ?? "Folder"}>
        <div className="mb-5 flex items-center gap-3">
          <Link href="/folders" className="flex items-center gap-1 text-[13px] text-white/60 hover:text-white">
            <ArrowLeft className="size-4" /> Folders
          </Link>
        </div>
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : !folder ? (
          <div className="py-24 text-center text-white/60">This folder doesn’t exist or was deleted.</div>
        ) : (
          <>
            <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold">
              <Folder className="size-5 text-fathom" /> {folder.name}
              <span className="text-sm font-normal text-white/50">· {meetings.length} recording{meetings.length === 1 ? "" : "s"}</span>
            </h1>
            <MeetingGrid
              meetings={meetings}
              showOwner
              emptyTitle="This folder is empty"
              emptyBody="Open a recording and use “Add to Folder” to file it here."
            />
          </>
        )}
      </LibraryPage>
    </AppShell>
  );
}
