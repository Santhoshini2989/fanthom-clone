"use client";

import { useEffect } from "react";
import { TopBar } from "./top-bar";
import { DashboardTabs } from "./dashboard-tabs";
import { cn } from "@/lib/utils";

/**
 * Authenticated app frame: top bar, optional library tabs, page body on the
 * #1a1a1a canvas. The product is dark-only in every observed screenshot, so
 * no theme switch is exposed (light tokens exist in globals.css for parity
 * with the real stylesheet).
 */
export function AppShell({
  children,
  tabs = false,
  className,
  title = "Fathom",
}: {
  children: React.ReactNode;
  tabs?: boolean;
  className?: string;
  title?: string;
}) {
  // The real app titles every page "Fathom" (verified on the auth pages).
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-off-white">
      <TopBar />
      {tabs && <DashboardTabs />}
      <main className={cn("flex-1", className)}>{children}</main>
    </div>
  );
}
