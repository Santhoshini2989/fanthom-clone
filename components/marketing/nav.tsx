"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ANNOUNCEMENT, NAV } from "@/data/marketing";
import { FathomMarketingLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * fathom.ai header, built from the live DOM: gradient announcement banner
 * (pink→purple) with the "SEE WHAT'S NEW" pill and the site's close icon;
 * 88px nav row with the wordmark SVG, a `.glass_wrapper.menu` pill (1px
 * gradient border, black inner, 24px radius, 0 40px padding, 54px tall)
 * holding Overview · Solutions ⌄ · Integrations ⌄ · Resources ⌄ · Pricing,
 * then Book a Demo, Log In, and the cyan "SIGN UP FREE" button.
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

  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setMobile(false);
    setOpen(null);
  }

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
        <div className="relative flex items-center justify-center gap-6 bg-[linear-gradient(90deg,#ffa8bb,#9600ff)] px-12 py-2.5 text-center font-sans text-[10.5px] font-normal uppercase tracking-[0.06em] text-black sm:text-[12.5px]">
          <span className="text-balance">{ANNOUNCEMENT.text}</span>
          <Link
            href={ANNOUNCEMENT.href}
            className="hidden shrink-0 rounded-full bg-black/25 px-4 py-2 text-[10.5px] font-medium tracking-wide text-black transition-colors hover:bg-black/35 sm:inline-block"
          >
            {ANNOUNCEMENT.cta}
          </Link>
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => setAnnounce(false)}
            className="absolute right-4 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full hover:bg-black/15"
          >
            <img src="/fathom/close-x.svg" alt="" className="size-3" />
          </button>
        </div>
      )}

      <header className="mk-container mk-pad flex h-[88px] items-center justify-between">
        <Link href="/" aria-label="Fathom home" className="shrink-0">
          <FathomMarketingLogo className="h-[14px]" />
        </Link>

        <div className="mk-glass-wrap hidden !w-auto lg:inline-block" onMouseLeave={leave}>
          <nav className="mk-glass flex h-[54px] items-center gap-[4rem] px-10" aria-label="Primary">
            {NAV.primary.map((item) =>
              "items" in item && item.items ? (
                <div key={item.label} className="relative" onMouseEnter={() => enter(item.label)}>
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open === item.label}
                    onClick={() => setOpen(open === item.label ? null : item.label)}
                    className={cn("flex items-center gap-2 py-5 text-[13.8px] font-normal leading-none text-off-white transition-colors hover:text-fathom", open === item.label && "text-fathom")}
                  >
                    {item.label}
                    <img src="/fathom/menu-chevron.svg" alt="" className={cn("h-[6px] w-[9px] transition-transform duration-200", open === item.label && "rotate-180")} />
                  </button>
                  {open === item.label && (
                    <div
                      role="menu"
                      onMouseEnter={() => enter(item.label)}
                      className="absolute left-1/2 top-full mt-2 min-w-[240px] -translate-x-1/2 rounded-2xl border border-white/15 bg-black p-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-pop-in"
                    >
                      {item.items.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          target={"external" in sub && sub.external ? "_blank" : undefined}
                          role="menuitem"
                          className="block rounded-xl px-3.5 py-2.5 text-[15px] text-off-white transition-colors hover:bg-white/8 hover:text-fathom"
                        >
                          {sub.label}
                        </Link>
                      ))}
                      {"footer" in item && item.footer && (
                        <Link href={item.footer.href} role="menuitem" className="mt-1 block border-t border-white/10 px-3.5 pb-1.5 pt-3 text-[13px] text-fathom hover:underline">
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
                  className={cn("py-5 text-[13.8px] font-normal leading-none text-off-white transition-colors hover:text-fathom", pathname === item.href && "text-fathom")}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          {NAV.secondary.map((l) => (
            <Link key={l.label} href={l.href} className="text-[13.8px] font-normal leading-none text-off-white transition-colors hover:text-fathom">
              {l.label}
            </Link>
          ))}
          <Link href={NAV.cta.href} className="mk-btn !px-6 !py-3.5">
            <span className="mk-btn__text !text-[13.8px]">{NAV.cta.label}</span>
            <span className="mk-btn__grad" aria-hidden />
          </Link>
        </div>

        <button type="button" aria-label="Menu" onClick={() => setMobile((v) => !v)} className="flex size-10 items-center justify-center text-off-white lg:hidden">
          <span className="relative block h-[14px] w-6">
            <span className={cn("absolute left-0 top-0 h-[2px] w-6 bg-current transition-transform", mobile && "translate-y-[6px] rotate-45")} />
            <span className={cn("absolute left-0 top-[6px] h-[2px] w-6 bg-current transition-opacity", mobile && "opacity-0")} />
            <span className={cn("absolute left-0 top-[12px] h-[2px] w-6 bg-current transition-transform", mobile && "-translate-y-[6px] -rotate-45")} />
          </span>
        </button>
      </header>

      {mobile && (
        <div className="min-h-[100dvh] bg-black px-6 pb-10 pt-8 lg:hidden animate-slide-up" style={{ backgroundImage: "url(/fathom/flow-product.svg)", backgroundPosition: "100% 100%", backgroundRepeat: "no-repeat", backgroundSize: "200px 200px" }}>
          {NAV.primary.map((item) =>
            "items" in item && item.items ? (
              <details key={item.label} className="group border-b border-white/10 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[24px] text-off-white">
                  {item.label} <img src="/fathom/menu-chevron.svg" alt="" className="h-[8px] w-[12px] transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 flex flex-col">
                  {item.items.map((sub) => (
                    <Link key={sub.label} href={sub.href} className="py-2 pl-3 text-[17px] text-white/75">
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : (
              <Link key={item.label} href={item.href!} className="block border-b border-white/10 py-4 text-[24px] text-off-white">
                {item.label}
              </Link>
            ),
          )}
          <div className="mt-6 flex flex-col gap-4">
            {NAV.secondary.map((l) => (
              <Link key={l.label} href={l.href} className="text-[17px] text-off-white/90">
                {l.label}
              </Link>
            ))}
            <Link href={NAV.cta.href} className="mk-btn mt-2 justify-center">
              <span className="mk-btn__text">{NAV.cta.label}</span>
              <span className="mk-btn__grad" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
