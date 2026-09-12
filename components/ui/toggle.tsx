"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Switch as seen in Fathom settings: cyan pill with a white knob carrying a
 * check mark when on; gray pill with an "x" knob when off.
 */
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  className,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? { track: "h-5 w-9", knob: "size-4", travel: "translate-x-4" } : { track: "h-[26px] w-[46px]", knob: "size-[22px]", travel: "translate-x-5" };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-[var(--ease-fathom)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fathom/60 disabled:cursor-not-allowed disabled:opacity-50",
        dims.track,
        checked ? "bg-[#3aa9e8]" : "bg-[#4a4a4f]",
        className,
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-[#1a1a1a] shadow transition-transform duration-200 ease-[var(--ease-fathom)]",
          dims.knob,
          checked ? cn(dims.travel, "bg-white text-[#3aa9e8]") : "translate-x-0 text-white/60",
        )}
      >
        {checked ? <Check className="size-3" strokeWidth={3.5} /> : <X className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}
