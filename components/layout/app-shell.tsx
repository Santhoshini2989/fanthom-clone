"use client";

import { useEffect } from "react";
import { TopBar } from "./top-bar";
import { DashboardTabs } from "./dashboard-tabs";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * Authenticated app frame: top bar, optional library tabs, page body on the
 * #1a1a1a canvas. Applies the persisted theme class to <html>.
 */
export function AppShell({
  children,
  tabs = false,
  className,
}: {
  children: React.ReactNode;
  tabs?: boolean;
  className?: string;
}) {
  const theme = useAppStore((s) => s.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-off-white">
      <TopBar />
      {tabs && <DashboardTabs />}
      <main className={cn("flex-1", className)}>{children}</main>
    </div>
  );
}
