"use client";

import { Eye, EyeOff, Lock, Users } from "lucide-react";
import type { Visibility } from "@/data/types";
import { Tooltip } from "@/components/ui/tooltip";
import { PillSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Verified icon → tooltip map (release notes table). */
export const VISIBILITY_META: Record<Visibility, { label: string; tooltip: string; icon: React.ReactNode; color: string }> = {
  private: { label: "Only you", tooltip: "Only you can view", icon: <Lock />, color: "text-fathom-warn" },
  no_teams: { label: "No Team Visibility", tooltip: "Not visible to any teams", icon: <EyeOff />, color: "text-fathom-warn" },
  some_teams: { label: "Visible to Multiple Teams", tooltip: "Visible to some teams", icon: <Users />, color: "text-white/80" },
  all_teams: { label: "Visible to All Teams", tooltip: "Visible to all teams", icon: <Eye />, color: "text-white/80" },
};

export function VisibilityBadge({ visibility, className }: { visibility: Visibility; className?: string }) {
  const meta = VISIBILITY_META[visibility];
  return (
    <Tooltip label={meta.tooltip} side="bottom">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-md bg-black/70 backdrop-blur-sm [&_svg]:size-3.5",
          meta.color,
          className,
        )}
        aria-label={meta.tooltip}
      >
        {meta.icon}
      </span>
    </Tooltip>
  );
}

const OPTIONS: { value: Visibility; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "no_teams", label: "No Team Visibility", description: "Only people you share with can view", icon: <EyeOff /> },
  { value: "some_teams", label: "Visible to Multiple Teams", description: "Product, Engineering", icon: <Users /> },
  { value: "all_teams", label: "Visible to All Teams", description: "Everyone at Brightline", icon: <Eye /> },
  { value: "private", label: "Only you", description: "Not shared with anyone", icon: <Lock /> },
];

export function VisibilitySelect({ value, onChange, size = "sm" }: { value: Visibility; onChange: (v: Visibility) => void; size?: "sm" | "md" }) {
  return <PillSelect value={value} options={OPTIONS} onChange={onChange} size={size} variant="ghost" align="end" width={300} />;
}
