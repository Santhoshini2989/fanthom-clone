"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Hover/focus tooltip like the "Customize" bubble over the summary gear:
 * gray rounded label with a small caret.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  className,
  delay = 150,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const id = useId();

  const show = () => {
    if (timer) window.clearTimeout(timer);
    setTimer(window.setTimeout(() => setOpen(true), delay));
  };
  const hide = () => {
    if (timer) window.clearTimeout(timer);
    setOpen(false);
  };

  const pos = {
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
  }[side];
  const caret = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[#4b4b50] border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#4b4b50] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[#4b4b50] border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[#4b4b50] border-y-transparent border-l-transparent",
  }[side];

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute z-[95] whitespace-nowrap rounded-md bg-[#4b4b50] px-2.5 py-1.5 text-[13px] font-medium leading-4 text-white shadow-lg animate-fade-in",
            pos,
          )}
        >
          {label}
          <span className={cn("absolute border-[5px]", caret)} />
        </span>
      )}
    </span>
  );
}
