"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { ANNOUNCEMENT, NAV } from "@/data/marketing";
import { FathomWordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Marketing header (verified): gradient announcement bar with "SEE WHAT'S NEW"
 * pill and close; then logo, a pill-shaped nav (Overview · Solutions ⌄ ·
 * Integrations ⌄ · Resources ⌄ · Pricing), Book a Demo, Log In, cyan
 * "SIGN UP FREE" pill. Dropdowns open on hover/click. Collapses to a hamburger
 * under 992px (Webflow tablet breakpoint).
 */
export function MarketingNav() {
  const pathname = usePathname();
  const [announce, setAnnounce] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobile(false);
    setOpen(null);
  }, [pathname]);

  const enter = (id: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(id);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(null), 120);
  };

  return (
    <div className={cn("sticky top-0 z-50 transition-colors duration-200", scrolled ? "bg-black/85 backdrop-blur-md" : "bg-transparent")}>
      {announce && (
        <div className="relative flex items-center justify-center gap-4 bg-gradient-to-r from-brand-pink via-[#c86bff] to-brand-purple px-12 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.06em] text-black sm:text-[12px]">
          <span className="text-balance">{ANNOUNCEMENT.text}</span>
          <Link
            href={ANNOUNCEMENT.href}
            className="hidden shrink-0 rounded-full border border-black/60 bg-black/15 px-4 py-1.5 text-[11px] font-semibold tracking-wide text-black transition-colors hover:bg-black/25 sm:inline-block"
          >
            {ANNOUNCEMENT.cta}
          </Link>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnounce(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/70 hover:bg-black/15 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <header className="mx-auto flex h-[88px] max-w-[1400px] items-center justify-between px-6 lg:px-11">
        <Link href="/" aria-label="Fathom home" className="shrink-0">
          <FathomWordmark textClassName="text-[19px] tracking-[0.2em]" />
        </Link>

        <nav className="hidden items-center rounded-full border border-white/20 bg-black/40 px-3 py-1.5 lg:flex" aria-label="Primary" onMouseLeave={leave}>
          {NAV.primary.map((item) =>
            "items" in item && item.items ? (
              <div key={item.label} className="relative" onMouseEnter={() => enter(item.label)}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open === item.label}
                  onClick={() => setOpen(open === item.label ? null : item.label)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-2 text-[14px] font-medium tracking-wide text-off-white/90 transition-colors hover:text-white",
                    open === item.label && "text-white",
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn("size-3.5 transition-transform duration-200", open === item.label && "rotate-180")} />
                </button>
                {open === item.label && (
                  <div
                    role="menu"
                    onMouseEnter={() => enter(item.label)}
                    className="absolute left-0 top-full mt-3 min-w-[260px] rounded-2xl border border-white/15 bg-[#0d0d0f] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-pop-in"
                  >
                    {item.items.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        target={"external" in sub && sub.external ? "_blank" : undefined}
                        role="menuitem"
                        className="block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-white/8"
                      >
                        <span className="block text-[15px] text-off-white">{sub.label}</span>
                        {"blurb" in sub && sub.blurb && <span className="block text-[12px] text-white/50">{sub.blurb}</span>}
                      </Link>
                    ))}
                    {"footer" in item && item.footer && (
                      <Link href={item.footer.href} role="menuitem" className="mt-1 block border-t border-white/10 px-3.5 pb-1.5 pt-3 text-[13px] font-medium text-fathom hover:underline">
                        {item.footer.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className={cn(
                  "rounded-full px-4 py-2 text-[14px] font-medium tracking-wide text-off-white/90 transition-colors hover:text-white",
                  pathname === item.href && "text-fathom",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {NAV.secondary.map((l) => (
            <Link key={l.label} href={l.href} className="text-[14px] font-medium tracking-wide text-off-white/90 hover:text-white">
              {l.label}
            </Link>
          ))}
          <Link
            href={NAV.cta.href}
            className="rounded-full bg-fathom px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-black transition-[filter] hover:brightness-110"
          >
            {NAV.cta.label}
          </Link>
        </div>

        <button type="button" aria-label="Menu" onClick={() => setMobile((v) => !v)} className="rounded-md p-2 text-off-white lg:hidden">
          {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {mobile && (
        <div className="border-t border-white/10 bg-black px-6 pb-8 pt-2 lg:hidden animate-slide-up">
          {NAV.primary.map((item) =>
            "items" in item && item.items ? (
              <details key={item.label} className="group border-b border-white/10 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[17px] text-off-white">
                  {item.label} <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 flex flex-col">
                  {item.items.map((sub) => (
                    <Link key={sub.label} href={sub.href} className="py-2 pl-3 text-[15px] text-white/75">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={item.label} href={item.href!} className="block border-b border-white/10 py-3 text-[17px] text-off-white">
                {item.label}
              </Link>
            ),
          )}
          <div className="mt-5 flex flex-col gap-3">
            {NAV.secondary.map((l) => (
              <Link key={l.label} href={l.href} className="text-[15px] text-off-white/90">
                {l.label}
              </Link>
            ))}
            <Link href={NAV.cta.href} className="mt-2 rounded-full bg-fathom px-6 py-3 text-center text-[13px] font-semibold uppercase tracking-[0.06em] text-black">
              {NAV.cta.label}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
