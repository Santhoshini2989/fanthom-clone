"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UnderlineTabs } from "@/components/ui/tabs";
import { FathomSpinner } from "@/components/brand/logo";
import { PersonalSettings } from "@/components/settings/personal-settings";
import { MeetingTypesSettings, OrganizationSettings, TeamSettings, UsersSettings } from "@/components/settings/admin-settings";
import { useHydrated } from "@/lib/store";

const TABS = [
  { id: "settings", label: "Settings" },
  { id: "organization", label: "Organization Settings" },
  { id: "team", label: "Team Settings" },
  { id: "users", label: "Users" },
  { id: "meeting_types", label: "Meeting Types" },
];

/**
 * /customize (verified route). Personal settings plus the admin tabs
 * (Organization Settings · Team Settings · Users · Meeting Types, verified)
 * as a tab bar in the same style as the library tabs.
 */
export default function CustomizePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><FathomSpinner /></div>}>
        <SettingsBody />
      </Suspense>
    </AppShell>
  );
}

function SettingsBody() {
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const tab = params.get("tab") ?? "settings";

  return (
    <>
      <div className="sticky top-11 z-40 border-b border-black/40 bg-app-topbar px-3 sm:px-4">
        <UnderlineTabs
          items={TABS}
          value={TABS.some((t) => t.id === tab) ? tab : "settings"}
          onChange={(id) => router.replace(id === "settings" ? "/customize" : `/customize?tab=${id}`)}
          size="lg"
          className="-mb-px"
          ariaLabel="Settings sections"
        />
      </div>
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-8">
        {!hydrated ? (
          <div className="flex h-64 items-center justify-center"><FathomSpinner /></div>
        ) : tab === "organization" ? (
          <OrganizationSettings />
        ) : tab === "team" ? (
          <TeamSettings />
        ) : tab === "users" ? (
          <UsersSettings />
        ) : tab === "meeting_types" ? (
          <MeetingTypesSettings />
        ) : (
          <PersonalSettings />
        )}
      </div>
    </>
  );
}
