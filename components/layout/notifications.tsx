"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckSquare, MessageSquare, Share2, Sparkles } from "lucide-react";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/dropdown";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { userById } from "@/data/users";

interface Notice {
  id: string;
  icon: React.ReactNode;
  text: React.ReactNode;
  when: string;
  href: string;
}

export function NotificationsMenu() {
  const meetings = useAppStore((s) => s.meetings);
  const [read, setRead] = useState(false);

  const ready = meetings.filter((m) => m.status === "ready");
  const withComments = ready.filter((m) => m.comments.length);
  const notices: Notice[] = [
    ...(meetings.find((m) => m.status === "processing")
      ? [
          {
            id: "processing",
            icon: <Sparkles className="text-fathom" />,
            text: (
              <>
                <b className="font-semibold">{meetings.find((m) => m.status === "processing")!.title}</b> is being processed. Your summary will be ready shortly.
              </>
            ),
            when: "Just now",
            href: `/calls/${meetings.find((m) => m.status === "processing")!.id}`,
          },
        ]
      : []),
    ...withComments.map((m) => ({
      id: `c_${m.id}`,
      icon: <MessageSquare className="text-brand-pink" />,
      text: (
        <>
          <b className="font-semibold">{userById(m.comments[0]!.authorId).name}</b> commented on <b className="font-semibold">{m.title}</b>
        </>
      ),
      when: "2h ago",
      href: `/calls/${m.id}`,
    })),
    ...ready
      .filter((m) => m.actionItems.some((a) => a.assigneeId === "u_nancy" && !a.done))
      .slice(0, 2)
      .map((m) => ({
        id: `a_${m.id}`,
        icon: <CheckSquare className="text-emerald-400" />,
        text: (
          <>
            You have an open action item from <b className="font-semibold">{m.title}</b>
          </>
        ),
        when: "1d ago",
        href: `/calls/${m.id}`,
      })),
    ...ready
      .filter((m) => m.ownerId !== "u_nancy")
      .slice(0, 2)
      .map((m) => ({
        id: `s_${m.id}`,
        icon: <Share2 className="text-fathom-warn" />,
        text: (
          <>
            <b className="font-semibold">{userById(m.ownerId).name}</b> shared <b className="font-semibold">{m.title}</b> with your team
          </>
        ),
        when: "3d ago",
        href: `/calls/${m.id}`,
      })),
  ];

  return (
    <Dropdown onOpenChange={(o) => o && setRead(true)}>
      <DropdownTrigger>
        <span
          aria-label="Notifications"
          className="relative flex size-8 items-center justify-center rounded-md bg-[#1c1b20] text-fathom transition-colors hover:bg-[#26252a]"
        >
          <Bell className="size-[17px]" fill="currentColor" strokeWidth={0} />
          {!read && notices.length > 0 && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#f05252] ring-2 ring-[#1c1b20]" />
          )}
        </span>
      </DropdownTrigger>
      <DropdownContent align="start" width={380} className="p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[15px] font-semibold">Notifications</span>
          <span className="text-xs text-white/50">{notices.length} recent</span>
        </div>
        <div className="h-px bg-white/10" />
        {notices.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-white/50">You’re all caught up.</div>
        ) : (
          <ul className="max-h-[400px] overflow-y-auto py-1 scrollbar-thin">
            {notices.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href}
                  className={cn("flex items-start gap-3 px-4 py-3 transition-colors hover:bg-app-menu-hover")}
                >
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/8 [&_svg]:size-3.5">
                    {n.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] leading-5 text-white/85">{n.text}</span>
                    <span className="block text-xs text-white/45">{n.when}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
