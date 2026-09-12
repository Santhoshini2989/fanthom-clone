"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { LibraryPage } from "@/components/layout/library-page";
import { MeetingGrid } from "@/components/meetings/meeting-grid";
import { FathomSpinner } from "@/components/brand/logo";
import { PillSelect } from "@/components/ui/select";
import { useAppStore, useHydrated } from "@/lib/store";
import { TEAMS } from "@/data/users";

/**
 * Team Calls: recordings shared with teams. Verified: the "Team Calls dropdown"
 * exposes view-access options; team filter is inferred from folder/team structure.
 */
export default function TeamCallsPage() {
  const hydrated = useHydrated();
  const meetings = useAppStore((s) => s.meetings);
  const [team, setTeam] = useState<string>("all");
  const [access, setAccess] = useState<"view" | "shared_by_me">("view");

  const shared = meetings.filter((m) => m.visibility === "all_teams" || m.visibility === "some_teams");
  const filtered = shared.filter((m) => {
    if (access === "shared_by_me" && m.ownerId !== "u_nancy") return false;
    if (team === "all") return true;
    const t = TEAMS.find((x) => x.id === team);
    return t ? m.attendeeIds.some((id) => t.memberIds.includes(id)) : true;
  });

  return (
    <AppShell tabs>
      <LibraryPage askMeetings={shared} askLabel="Team Calls">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <PillSelect
            value={team}
            onChange={setTeam}
            align="start"
            size="sm"
            options={[
              { value: "all", label: "All Teams", icon: <Users /> },
              ...TEAMS.map((t) => ({ value: t.id, label: t.name, description: `${t.memberIds.length} people` })),
            ]}
          />
          <PillSelect
            value={access}
            onChange={setAccess}
            align="start"
            size="sm"
            variant="outline"
            options={[
              { value: "view", label: "Calls I can view", description: "Shared with a team you belong to" },
              { value: "shared_by_me", label: "Shared by me", description: "Recordings you made visible to teams" },
            ]}
          />
          <span className="ml-auto flex items-center gap-1 text-[13px] text-white/50">
            {filtered.length} recording{filtered.length === 1 ? "" : "s"} <ChevronDown className="size-3.5 opacity-0" />
          </span>
        </div>
        {hydrated ? (
          <MeetingGrid
            meetings={filtered}
            showOwner
            emptyTitle="No team calls yet"
            emptyBody="Recordings your teammates make visible to the team will show up here. Change a recording’s team visibility from its call page."
          />
        ) : (
          <div className="flex h-64 items-center justify-center">
            <FathomSpinner />
          </div>
        )}
      </LibraryPage>
    </AppShell>
  );
}
