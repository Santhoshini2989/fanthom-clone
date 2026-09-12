"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Download, FolderPlus, Link2, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Meeting } from "@/data/types";
import { userById } from "@/data/users";
import { useAppStore } from "@/lib/store";
import { cn, copyText, formatDate, formatDurationShort } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/avatar";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Thumbnail } from "./thumbnail";
import { VisibilityBadge } from "./visibility";
import { PlatformIcon } from "./platform-icon";

/**
 * Recording card from the My Calls grid: 16:9 thumbnail, visibility badge in the
 * top-right, title, date · duration, attendee avatars, hover ⋯ menu
 * (Delete Recording verified; the rest mirror the call page menu).
 */
export function MeetingCard({ meeting, showOwner }: { meeting: Meeting; showOwner?: boolean }) {
  const deleteMeeting = useAppStore((s) => s.deleteMeeting);
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(false);
  const attendees = meeting.attendeeIds.map(userById);
  const href = `/calls/${meeting.id}`;

  return (
    <div className="group relative">
      <Link href={href} className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-fathom/60">
        <div className="relative">
          <Thumbnail meeting={meeting} className="transition-[filter] duration-150 group-hover:brightness-110" />
          <div className="absolute right-1.5 top-1.5">
            <VisibilityBadge visibility={meeting.visibility} />
          </div>
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium leading-4 text-white/90">
            {meeting.status === "ready" ? formatDurationShort(meeting.duration) : meeting.status === "processing" ? "Processing" : "Failed"}
          </span>
          {meeting.status === "processing" && (
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
              <Loader2 className="size-6 animate-spin text-fathom" />
            </span>
          )}
          {meeting.status === "failed" && (
            <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60">
              <AlertTriangle className="size-6 text-[#f05252]" />
            </span>
          )}
        </div>
        <div className="mt-2 pr-8">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-off-white" title={meeting.title}>
            {meeting.title}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] leading-4 text-white/55">
            <PlatformIcon platform={meeting.platform} className="size-3.5" />
            <span>{formatDate(meeting.startedAt)}</span>
            {showOwner && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{userById(meeting.ownerId).name}</span>
              </>
            )}
          </p>
        </div>
      </Link>
      <div className="mt-1.5 flex items-center justify-between pr-1">
        <AvatarStack users={attendees} max={4} size="xs" />
      </div>

      <div className={cn("absolute right-0 top-[calc(56.25%+8px)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100")}>
        <Dropdown>
          <DropdownTrigger>
            <span aria-label="More" className="flex size-7 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white">
              <MoreHorizontal className="size-4" />
            </span>
          </DropdownTrigger>
          <DropdownContent align="end" width={220}>
            <DropdownItem
              icon={<Link2 />}
              onSelect={async () => {
                await copyText(`${location.origin}/share/${meeting.id}`);
                toast("Share link copied to clipboard");
              }}
            >
              Copy Share Link
            </DropdownItem>
            <DropdownItem icon={<FolderPlus />} onSelect={() => toast("Choose a folder from the call page", "info")}>
              Add to Folder
            </DropdownItem>
            <DropdownItem icon={<Pencil />} onSelect={() => toast("Rename from the call page by clicking the title", "info")}>
              Rename
            </DropdownItem>
            {meeting.status === "ready" && (
              <DropdownItem icon={<Download />} onSelect={() => toast(`Preparing ${meeting.title}.mp4…`, "info")}>
                Download Video
              </DropdownItem>
            )}
            <DropdownSeparator />
            <DropdownItem icon={<Trash2 />} destructive onSelect={() => setConfirm(true)}>
              Delete Recording
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          deleteMeeting(meeting.id);
          toast("Recording deleted");
        }}
        title="Delete recording?"
        body={
          <>
            Deleting <b className="text-off-white">{meeting.title}</b> will also remove all associated notes. Once deleted, a call cannot be recovered.
          </>
        }
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
