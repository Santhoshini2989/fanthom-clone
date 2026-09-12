"use client";

import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { MeetingGrid } from "@/components/meetings/meeting-grid";
import { useAppStore, useHydrated } from "@/lib/store";
import { CURRENT_USER_ID } from "@/data/users";
import { FathomSpinner } from "@/components/brand/logo";

export default function MyCallsPage() {
  const hydrated = useHydrated();
  const meetings = useAppStore((s) => s.meetings);
  // My Calls = recordings you own, attended, or that were shared directly with you
  const mine = meetings.filter(
    (m) => m.ownerId === CURRENT_USER_ID || m.attendeeIds.includes(CURRENT_USER_ID) || m.shares.some((s) => s.target === CURRENT_USER_ID),
  );

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={mine} askLabel="My Calls">
        {hydrated ? (
          <MeetingGrid meetings={mine} />
        ) : (
          <div className="flex h-64 items-center justify-center">
            <FathomSpinner />
          </div>
        )}
      </LibraryPage>
    </AppShell>
  );
}
