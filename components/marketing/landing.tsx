"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { MkButton } from "./cta";
import { Starfield } from "./starfield";
import { AUDIENCE, HERO, PILLARS, STATS, TEAMS_FLOW } from "@/data/marketing";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Section 1 — hero (`section_hero-3 padding-hero banner`)             */
/* ------------------------------------------------------------------ */
const HERO_LOGOS = [
  { src: "/fathom/logo-hubspot.svg", alt: "HubSpot", w: 30, h: 9 },
  { src: "/fathom/logo-adobe.svg", alt: "Adobe", w: 23, h: 32 },
  { src: "/fathom/logo-zapier.svg", alt: "Zapier", w: 30, h: 8 },
  { src: "/fathom/logo-grubhub.svg", alt: "Grubhub", w: 30, h: 9 },
  { src: "/fathom/logo-ea.svg", alt: "EA", w: 30, h: 30 },
  { src: "/fathom/logo-calendly.svg", alt: "Calendly", w: 30, h: 7 },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black">
      <Starfield className="opacity-[0.45]" />
      <div className="mk-pad relative pt-[72px] lg:pt-[128px]">
        <div className="mk-container relative">
          <div className="grid items-center gap-16 lg:grid-cols-[1.5fr_0.75fr] lg:gap-0">
            <div className="flex flex-col items-start gap-8 pb-10 lg:pb-[232px]">
              <h1 className="mk-h1 text-off-white">
                <span className="font-normal">AI notetaking</span> that is out of this world
              </h1>
              <div className="max-w-[570px]">
                <p className="mk-p text-off-white">
                  {HERO.subtitle} <strong className="font-medium">{HERO.subtitleStrong}</strong>
                </p>
              </div>
              <MkButton href="/users/sign_up">Get started - free forever</MkButton>
              <div className="-mt-[0.3rem] flex items-center gap-2">
                <img src="/fathom/compliance-lock.svg" alt="" className="h-[10px] w-[9px]" />
                <div className="mk-tiny text-off-white opacity-75">
                  SOC 2 Type II&nbsp;&nbsp;|&nbsp;&nbsp;GDPR&nbsp;&nbsp;|&nbsp;&nbsp;HIPAA Compliant&nbsp;&nbsp;|&nbsp;&nbsp;SSO / SCIM
                </div>
              </div>
            </div>
            <div className="relative w-full lg:h-[592px]">
              <img
                src="/fathom/hero.avif"
                alt=""
                className="relative mx-auto w-full max-w-[560px] rounded-2xl lg:absolute lg:bottom-[10%] lg:left-[-36%] lg:mb-[114px] lg:w-[140%] lg:max-w-none"
              />
            </div>
          </div>

          {/* glass rows: G2 + logos */}
          <div className="mt-6 grid gap-5 pb-[108px] lg:-mt-[108px] lg:grid-cols-[278px_1fr]">
            <div className="mk-glass-wrap !rounded-[2rem]">
              <div className="mk-glass flex !rounded-[2rem] flex-col items-center justify-center gap-3 px-10 py-5">
                <img src="/fathom/g2.svg" alt="G2 — 5.0/5.0 — #1 rated — 6,500+ reviews" className="h-16 w-[198px]" />
              </div>
            </div>
            <div className="mk-glass-wrap !rounded-[2rem]">
              <div className="mk-glass grid !rounded-[2rem] grid-cols-1 items-stretch gap-3 px-10 py-5 sm:grid-cols-[90px_1fr]">
                <p className="mk-p-small max-w-[90px] text-off-white">{HERO.usedAt}</p>
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                  {HERO_LOGOS.map((l) => (
                    <div key={l.alt} className="flex min-h-16 flex-col items-center justify-center rounded-lg bg-white/15 px-5 py-4">
                      <img src={l.src} alt={l.alt} style={{ width: l.w, height: l.h }} className="max-w-none opacity-90" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — marquee "Move work forward faster" with the ship        */
/* ------------------------------------------------------------------ */
export function MarqueeSection() {
  const item = (
    <div className="flex items-center">
      <p className="relative z-10 mr-[28px] whitespace-nowrap text-[4rem] font-light leading-[1.2] tracking-[-0.36px] text-off-white md:text-[7rem]">
        Move <span className="mk-gradient-yellow-orange">work</span> forward faster
      </p>
      <img src="/fathom/ship.svg" alt="" className="w-[18rem] max-w-[18rem] [transform:rotateY(-180deg)]" />
    </div>
  );
  return (
    <section className="w-full overflow-hidden pt-12">
      <div className="pb-16">
        <div className="mk-marquee">
          {item}
          {item}
          {item}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — plans tabs with the planet video (`section_plans`)       */
/* ------------------------------------------------------------------ */
const TEAM_ICONS = ["/fathom/team-icon-1.svg", "/fathom/team-icon-2.svg", "/fathom/team-icon-3.svg", "/fathom/team-icon-4.svg"];
const IND_ICONS = ["/fathom/team-icon-1.svg", "/fathom/team-icon-2.svg", "/fathom/ind-icon-3.svg", "/fathom/ind-icon-4.svg"];

export function PlansSection() {
  const [tab, setTab] = useState<"teams" | "individuals">("teams");
  const a = AUDIENCE[tab];
  const icons = tab === "teams" ? TEAM_ICONS : IND_ICONS;
  return (
    <section className="relative overflow-hidden">
      <div className="mk-pad pb-20">
        <div className="relative mx-auto max-w-[1216px]">
          <div className="pointer-events-none absolute -left-[304px] top-0 hidden w-[480px] lg:block" aria-hidden>
            <video src="/fathom/planet.mp4" autoPlay muted loop playsInline className="h-[480px] w-[480px] object-contain" />
          </div>
          <h2 className="mk-h2 relative text-center text-off-white">{AUDIENCE.title}</h2>
          <div className="mk-glass-wrap relative mt-16 !rounded-[2rem]">
            <div className="mk-glass !rounded-[2rem] !bg-black/60 px-6 py-8 backdrop-blur-sm md:px-16 md:py-12 lg:px-24 lg:py-16">
              <div className="flex items-center justify-center border-b border-[#faf5f580]" role="tablist">
                {(["teams", "individuals"] as const).map((id, i) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "relative -mb-px px-6 pb-4 pt-[9px] text-center text-[var(--text-p-regular)] transition-colors md:px-12 md:pb-6 md:text-[var(--text-h4-fluid)]",
                      tab === id ? "border-b-2 border-brand-yellow text-brand-yellow" : "border-b-2 border-transparent text-off-white hover:text-brand-yellow",
                    )}
                  >
                    {AUDIENCE.tabs[i]}
                  </button>
                ))}
              </div>
              <div key={tab} className="grid gap-10 pt-[62px] animate-fade-in lg:grid-cols-2 lg:gap-5">
                <div className="flex flex-col items-start">
                  <h2 className="mk-h4 text-off-white">{a.headline}</h2>
                  <p className="mk-p mt-9 text-off-white">{a.body}</p>
                  <p className="mk-p mt-4 text-off-white">{a.body2}</p>
                  <MkButton href={a.ctaHref} className="mt-6">{a.cta}</MkButton>
                </div>
                <div className="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2">
                  {a.points.map((p, i) => (
                    <div key={p} className="flex max-w-[188px] flex-col gap-2">
                      <img src={icons[i]} alt="" className="h-[33px] w-[33px]" />
                      <p className="mk-p-small text-off-white">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — sticky tabs Clarity / Momentum / Ease (`section_tabs`)   */
/* ------------------------------------------------------------------ */
const TAB_IMAGES = ["/fathom/tab-clarity.avif", "/fathom/tab-momentum.avif", "/fathom/tab-ease.avif"];
const TAB_ACCENT = ["text-fathom", "text-brand-yellow", "text-brand-pink"] as const;
const TAB_BTN = ["cyan", "yellow", "pink"] as const;

export function StickyTabsSection() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative overflow-clip">
      <div className="mk-pad pb-20">
        <div className="mk-container relative">
          <div className="grid items-start gap-12 pt-20 lg:grid-cols-[440px_1fr] lg:gap-20">
            <div className="flex flex-col gap-24 py-[10vh] lg:min-w-[27.5rem]">
              {PILLARS.map((p, i) => (
                <div
                  key={p.eyebrow}
                  data-i={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  className={cn("transition-opacity duration-300", active === i ? "opacity-100" : "opacity-40 lg:opacity-30")}
                >
                  <h3 className="mk-h3 text-off-white">{p.eyebrow}</h3>
                  <div className={cn("mt-2.5 flex items-center gap-1", TAB_ACCENT[i])}>
                    <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" style={{ filter: i === 0 ? "none" : undefined }} />
                    <div className="mk-tiny">{p.title}</div>
                  </div>
                  <p className="mk-p mt-5 text-off-white">{p.body}</p>
                  <MkButton href="/users/sign_up" variant={TAB_BTN[i]} className="mt-[18px]">
                    {p.cta}
                  </MkButton>
                </div>
              ))}
            </div>
            <div className="relative lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center">
              <div className="relative mx-auto aspect-square w-full max-w-[588px]">
                <div
                  className="mk-gradient-pink-purple absolute inset-y-0 left-[6px] -z-10 w-[192%] rounded-l-full"
                  aria-hidden
                />
                <div className="relative aspect-square w-full overflow-clip rounded-full border-[6px] border-off-white bg-fathom">
                  {TAB_IMAGES.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", active === i ? "opacity-100" : "opacity-0")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 5 — stats on off-white (`section_teams grid-section`)        */
/* ------------------------------------------------------------------ */
const STAT_STYLE = [
  { circle: "bg-brand-orange", trail: "h-[10.4375rem] bg-[linear-gradient(#f55200,#faf5f500)]" },
  { circle: "bg-brand-pink", trail: "h-[17.4375rem] bg-[linear-gradient(0deg,#faf5f500,#ffa8bb)]" },
  { circle: "bg-fathom", trail: "h-[24.3125rem] bg-[linear-gradient(0deg,#faf5f500,#00beff)]" },
];

export function StatsSection() {
  return (
    <section className="relative bg-off-white text-black">
      <div className="mk-grid-canvas pointer-events-none absolute inset-0" aria-hidden />
      <div className="mk-pad relative">
        <div className="mk-container">
          <div className="flex flex-col justify-between pb-20 pt-32">
            <h2 className="mk-h2 text-center">
              Fathom teams
              <br />
              <span className="font-normal">work smarter</span>
            </h2>
            <div className="mt-[166px] flex items-end justify-center gap-6 sm:gap-[46px]">
              {STATS.items.map((s, i) => (
                <div key={s.value} className="relative w-full max-w-[11.625rem]">
                  <div className={cn("relative z-[2] flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-full px-4 py-[0.6rem]", STAT_STYLE[i]!.circle)}>
                    <p className="mk-stat-num">{s.value}</p>
                    <p className="mk-tiny text-center font-normal leading-[1.2] text-black">{s.label}</p>
                  </div>
                  <div className={cn("relative z-[1] -mt-[90px] w-full opacity-[0.31]", STAT_STYLE[i]!.trail)} aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 6 — "Make your team unstoppable" + product overview image    */
/* ------------------------------------------------------------------ */
export function UnstoppableSection() {
  return (
    <section className="relative overflow-clip">
      <Starfield className="opacity-[0.45]" />
      <div className="mk-pad relative pb-20 pt-24">
        <div className="mx-auto max-w-[828px]">
          <div className="flex items-center justify-center gap-1 text-fathom">
            <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
            <p className="mk-tiny">{STATS.tagline}</p>
          </div>
          <h2 className="mk-h2 mt-3 text-center text-off-white">
            Make your team <span className="font-normal">unstoppable</span>
          </h2>
          <img src="/fathom/overview-3.png" alt="Fathom team calls dashboard" className="mx-auto mt-16 w-full max-w-[828px]" />
          <div className="mt-16 flex justify-center">
            <MkButton href="/users/sign_in/?for_team_edition=1">{STATS.cta}</MkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 7 — integrations bubbles (`section_integrations`)            */
/* ------------------------------------------------------------------ */
const BUBBLES = [
  { label: "Google Meet", icon: "/fathom/int-google-meet.svg", side: "left", top: 0 },
  { label: "Zoom", icon: "/fathom/int-zoom.png", side: "left", top: 160 },
  { label: "Gmail", icon: "/fathom/int-gmail.svg", side: "left", top: 342 },
  { label: "Slack", icon: "/fathom/int-slack.png", side: "right", top: -63 },
  { label: "Microsoft Teams", icon: "/fathom/int-teams.svg", side: "right", top: 140 },
  { label: "Asana", icon: "/fathom/int-asana.svg", side: "right", top: 352 },
] as const;

export function IntegrationsSection() {
  return (
    <section className="relative overflow-clip">
      <Starfield className="opacity-[0.45]" />
      <div className="mk-pad relative pb-20 pt-[94px]">
        <div className="mk-container">
          <div className="flex items-center justify-center gap-1 text-fathom">
            <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
            <p className="mk-tiny">Zero friction, maximum flexibility.</p>
          </div>
          <h3 className="mk-h3 mt-3 text-center text-off-white">
            Works where <span className="font-normal">you meet</span>
          </h3>

          <div className="relative mx-auto mt-16 h-[520px] max-w-[1000px]">
            <img src="/fathom/grid-radial.svg" alt="" className="pointer-events-none absolute left-1/2 top-0 w-[1440px] max-w-none -translate-x-1/2 opacity-90" />
            <div className="absolute left-1/2 top-[110px] flex size-[224px] -translate-x-1/2 items-center justify-center rounded-full bg-black [filter:drop-shadow(0_4px_60px_#ac49cc66)]">
              <img src="/fathom/logotype.svg" alt="Fathom" className="w-[90px]" />
            </div>
            {BUBBLES.map((b) => (
              <div
                key={b.label}
                className={cn("absolute hidden items-center md:flex", b.side === "left" ? "left-[8%] flex-row" : "right-[8%] flex-row-reverse")}
                style={{ top: 60 + b.top }}
              >
                <span className="mk-bubble">
                  <img src={b.icon} alt="" className="w-[15px]" />
                  <span className="text-[var(--text-p-regular)] font-normal">{b.label}</span>
                </span>
                <span className={cn("h-[2px] bg-off-white", b.side === "left" ? "w-[60px] md:w-[110px]" : "w-[60px] md:w-[110px]")} />
                <span className="size-2 rotate-45 rounded-full bg-off-white" />
              </div>
            ))}
            <div className="flex flex-wrap justify-center gap-3 pt-[420px] md:hidden">
              {BUBBLES.map((b) => (
                <span key={b.label} className="mk-bubble">
                  <img src={b.icon} alt="" className="w-[15px]" />
                  <span className="text-[15px]">{b.label}</span>
                </span>
              ))}
            </div>
          </div>

          <h3 className="mk-h3 mx-auto mt-20 max-w-[720px] text-center text-off-white">Fathom adapts to your workflow, not the other way around.</h3>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 8 — "Every team in flow" role slider (`section_flow`)        */
/* ------------------------------------------------------------------ */
const FLOW_IMAGES = ["/fathom/flow-sales.svg", "/fathom/flow-cs.svg", "/fathom/flow-marketing.svg", "/fathom/flow-ops.svg", "/fathom/flow-hr.svg", "/fathom/flow-product.svg"];

export function RolesSliderSection() {
  const track = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 512, behavior: "smooth" });
  return (
    <section className="relative overflow-clip">
      <Starfield className="opacity-[0.45]" />
      <div className="relative pb-16 pt-[94px]">
        <div className="mk-pad mk-container">
          <div className="flex items-center justify-center gap-1 text-fathom">
            <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
            <p className="mk-tiny">{TEAMS_FLOW.subtitle}</p>
          </div>
          <h3 className="mk-h3 mt-3 text-center text-off-white">
            Every team <span className="font-normal">in flow</span>
          </h3>
          <div className="mt-8 flex justify-center">
            <MkButton href="/users/sign_up">{TEAMS_FLOW.cta}</MkButton>
          </div>
          <div className="mt-16 flex justify-end gap-4">
            <button type="button" aria-label="Previous" onClick={() => scrollBy(-1)} className="size-8 text-off-white transition-colors hover:text-fathom">
              <img src="/fathom/slider-arrow.svg" alt="" className="size-8" />
            </button>
            <button type="button" aria-label="Next" onClick={() => scrollBy(1)} className="size-8 rotate-180 text-off-white transition-colors hover:text-fathom">
              <img src="/fathom/slider-arrow.svg" alt="" className="size-8" />
            </button>
          </div>
        </div>
        <div ref={track} className="no-scrollbar mt-3 flex snap-x gap-8 overflow-x-auto px-[56px] pb-4 max-md:px-5">
          {TEAMS_FLOW.roles.map((r, i) => (
            <div
              key={r.name}
              className="relative flex h-[504px] w-[480px] max-w-[86vw] shrink-0 snap-start flex-col items-center overflow-hidden rounded-[48px] border border-off-white px-6 py-16"
            >
              <img src={FLOW_IMAGES[i]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="mk-slider-overlay" />
              <div className="relative flex h-full flex-col items-center">
                <div className="flex items-center gap-1 text-off-white">
                  <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
                  <h3 className="text-[1.63rem] font-light leading-[1.2]">{r.name}</h3>
                </div>
                <p className="mk-p mt-6 w-[80%] text-center text-off-white">{r.body}</p>
                <div className="mt-auto">
                  <MkButton href={r.href} variant="purple">
                    {r.cta}
                  </MkButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 9 — final CTA on the pink→purple gradient (`section_cta`)    */
/* ------------------------------------------------------------------ */
export function FinalCtaSection() {
  return (
    <section className="mk-gradient-pink-purple relative flex min-h-[37.5rem] flex-col items-center justify-center overflow-clip !bg-[linear-gradient(0deg,#9600ff,#ffa8bb)]">
      <img src="/fathom/cta-bg.png" alt="" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover" />
      <div className="relative z-[1] flex flex-col items-center px-6 text-center">
        <div className="flex items-center gap-1 text-black">
          <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
          <p className="mk-tiny font-normal">
            Never <span className="mk-gradient-pink-purple-text">miss what matters</span>
          </p>
        </div>
        <h3 className="mk-h3 mt-4 text-off-white">
          Stop guessing. Ask Fathom.
          <br />
          <span className="font-normal">Start today, for free.</span>
        </h3>
        <MkButton href="/users/sign_up" variant="yellow" className="mt-8">
          Get Started. It’s Free.
        </MkButton>
      </div>
    </section>
  );
}
