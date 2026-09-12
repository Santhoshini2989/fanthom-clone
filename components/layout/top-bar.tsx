"use client";

import Link from "next/link";
import { useState } from "react";
import { Gift, LifeBuoy, Menu, Search, Settings, Star, X } from "lucide-react";
import { FathomWordmark } from "@/components/brand/logo";
import { AiSearch } from "@/components/search/ai-search";
import { NotificationsMenu } from "./notifications";
import { UserMenu } from "./user-menu";
import { ORG } from "@/data/users";
import { cn } from "@/lib/utils";

/**
 * App top bar (verified): wordmark · "Search with AI..." · bell · Refer ·
 * Settings · Help & Feedback · ★ points · avatar. 44px tall, #222124.
 */
export function TopBar({ className }: { className?: string }) {
  const [mobileSearch, setMobileSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-11 items-center gap-3 border-b border-black/40 bg-app-topbar px-3 sm:px-4",
        className,
      )}
    >
      {mobileSearch ? (
        <div className="flex flex-1 items-center gap-2 md:hidden">
          <AiSearch className="flex-1" autoFocus />
          <button type="button" aria-label="Close search" onClick={() => setMobileSearch(false)} className="p-1 text-white/70">
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <>
          <Link href="/my_calls" className="shrink-0" aria-label="Fathom home">
            <FathomWordmark textClassName="text-[17px]" />
          </Link>

          <div className="hidden flex-1 items-center gap-2 md:flex">
            <AiSearch className="w-full max-w-[340px]" />
            <NotificationsMenu />
          </div>

          <div className="ml-auto flex items-center gap-1 md:hidden">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setMobileSearch(true)}
              className="flex size-8 items-center justify-center rounded-md text-white/80 hover:bg-white/8"
            >
              <Search className="size-[18px]" />
            </button>
            <NotificationsMenu />
            <UserMenu />
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMobileMenu((v) => !v)}
              className="flex size-8 items-center justify-center rounded-md text-white/80 hover:bg-white/8"
            >
              {mobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Account">
            <TopLink href="/refer" icon={<Gift />}>Refer</TopLink>
            <TopLink href="/customize" icon={<Settings />}>Settings</TopLink>
            <TopLink href="https://help.fathom.video/" external icon={<LifeBuoy />}>Help & Feedback</TopLink>
            <Link
              href="/refer"
              className="ml-1 flex items-center gap-1 rounded-md px-1.5 py-1 text-[15px] font-bold text-fathom-warn transition-colors hover:bg-white/6"
              aria-label={`${ORG.referralPoints} referral points`}
            >
              <span className="flex size-[18px] items-center justify-center rounded-full bg-fathom-warn text-black">
                <Star className="size-[11px]" fill="currentColor" strokeWidth={0} />
              </span>
              {ORG.referralPoints}
            </Link>
            <span className="ml-1.5">
              <UserMenu />
            </span>
          </nav>
        </>
      )}

      {mobileMenu && (
        <div className="absolute inset-x-0 top-full border-b border-white/10 bg-app-topbar p-2 shadow-xl animate-slide-up md:hidden">
          <MobileLink href="/refer" icon={<Gift />} onClick={() => setMobileMenu(false)}>Refer</MobileLink>
          <MobileLink href="/customize" icon={<Settings />} onClick={() => setMobileMenu(false)}>Settings</MobileLink>
          <MobileLink href="https://help.fathom.video/" icon={<LifeBuoy />} onClick={() => setMobileMenu(false)}>Help & Feedback</MobileLink>
        </div>
      )}
    </header>
  );
}

function TopLink({
  href,
  icon,
  children,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls =
    "flex items-center gap-1.5 rounded-md px-2 py-1 text-[14px] font-medium text-white/85 transition-colors hover:bg-white/6 hover:text-white [&_svg]:size-4 [&_svg]:text-white/60";
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {icon}
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {icon}
      {children}
    </Link>
  );
}

function MobileLink({ href, icon, children, onClick }: { href: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] text-white/90 hover:bg-white/6 [&_svg]:size-4 [&_svg]:text-white/60"
    >
      {icon}
      {children}
    </Link>
  );
}
