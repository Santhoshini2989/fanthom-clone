"use client";

import { useState } from "react";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import type { Meeting } from "@/data/types";
import { AskPanel } from "@/components/ask/ask-panel";
import { cn } from "@/lib/utils";

/**
 * Library page frame: content column plus the Ask Fathom panel on the right
 * (verified: "a panel on the right-hand side of the page" on My Calls / Team
 * Calls). Collapsible; stacks under the content on smaller viewports.
 */
export function LibraryPage({
  children,
  askMeetings,
  askLabel,
  className,
}: {
  children: React.ReactNode;
  askMeetings: Meeting[];
  askLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={cn("mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6", className)}>
      <div className="min-w-0 flex-1">{children}</div>
      <aside
        className={cn(
          "hidden shrink-0 lg:block",
          open ? "w-[320px] xl:w-[360px]" : "w-10",
        )}
      >
        <div className="sticky top-[104px] flex h-[calc(100vh-128px)] flex-col rounded-xl border border-white/10 bg-[#1f1f22]">
          <div className="flex items-center justify-between px-3 py-2">
            {open ? (
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white/80">
                <Sparkles className="size-3.5 text-fathom" /> Ask Fathom
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Collapse Ask Fathom" : "Expand Ask Fathom"}
              className="ml-auto flex size-7 items-center justify-center rounded-md text-white/60 hover:bg-white/8 hover:text-white"
            >
              {open ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
            </button>
          </div>
          {open && (
            <div className="min-h-0 flex-1 px-3 pb-3">
              <AskPanel meetings={askMeetings} scope="all" scopeLabel={askLabel} compact />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
