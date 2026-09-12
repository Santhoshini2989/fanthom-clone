"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  href?: string;
  count?: number;
  icon?: React.ReactNode;
}

/**
 * Underline tabs used across Fathom: text turns cyan and a 2px cyan bar sits
 * under the active tab (My Calls / Team Calls..., SUMMARY / TRANSCRIPT...,
 * Organization Settings / Team Settings...).
 */
export function UnderlineTabs({
  items,
  value,
  onChange,
  className,
  size = "md",
  uppercase,
  ariaLabel,
}: {
  items: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  uppercase?: boolean;
  ariaLabel?: string;
}) {
  const text = { sm: "text-[13px] px-2.5 py-2", md: "text-[15px] px-3 py-2.5", lg: "text-[17px] px-3.5 py-3" }[size];
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex items-end gap-1 overflow-x-auto no-scrollbar", className)}>
      {items.map((t) => {
        const active = t.id === value;
        const cls = cn(
          "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-fathom/60 rounded-t-md",
          text,
          uppercase && "uppercase tracking-wide",
          active ? "text-fathom" : "text-white/75 hover:text-white",
        );
        const inner = (
          <>
            {t.icon && <span className="[&_svg]:size-4">{t.icon}</span>}
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[11px] font-semibold text-white">
                {t.count}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-fathom transition-opacity duration-150",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        );
        return t.href ? (
          <Link key={t.id} href={t.href} role="tab" aria-selected={active} className={cls} onClick={() => onChange?.(t.id)}>
            {inner}
          </Link>
        ) : (
          <button key={t.id} type="button" role="tab" aria-selected={active} className={cls} onClick={() => onChange?.(t.id)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

/** Pill segmented control (Individuals / Teams on pricing, Fathom for teams / individuals). */
export function Segmented({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-full border border-white/20 bg-white/5 p-1", className)} role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded-full px-5 py-1.5 text-sm font-medium transition-colors duration-150",
            value === t.id ? "bg-[#2a3b45] text-white" : "text-white/70 hover:text-white",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
