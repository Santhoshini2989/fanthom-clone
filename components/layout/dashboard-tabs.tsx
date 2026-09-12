"use client";

import { usePathname } from "next/navigation";
import { UnderlineTabs } from "@/components/ui/tabs";

/** Second-level nav under the top bar: My Calls · Team Calls · Folders · Playlists · Alerts (verified). */
export const DASHBOARD_TABS = [
  { id: "my_calls", label: "My Calls", href: "/my_calls" },
  { id: "team_calls", label: "Team Calls", href: "/team_calls" },
  { id: "folders", label: "Folders", href: "/folders" },
  { id: "playlists", label: "Playlists", href: "/playlists" },
  { id: "alerts", label: "Alerts", href: "/alerts" },
];

export function DashboardTabs() {
  const pathname = usePathname();
  const active = DASHBOARD_TABS.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`))?.id ?? "my_calls";
  return (
    <div className="sticky top-11 z-40 border-b border-black/40 bg-app-topbar px-3 sm:px-4">
      <UnderlineTabs items={DASHBOARD_TABS} value={active} size="lg" ariaLabel="Library" className="-mb-px" />
    </div>
  );
}
