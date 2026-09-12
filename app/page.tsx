"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Lock, Star } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { Starfield } from "@/components/marketing/starfield";
import { HeroVignettes, LogoStrip } from "@/components/marketing/mock-ui";
import { CtaPill } from "@/components/marketing/cta";
import { Segmented } from "@/components/ui/tabs";
import {
  AUDIENCE,
  CAPTURE_SECTION,
  FINAL_CTA,
  HERO,
  LOGO_STRIP,
  PILLARS,
  STATS,
  TEAMS_FLOW,
  WORKS_WHERE,
} from "@/data/marketing";
import { cn } from "@/lib/utils";

/**
 * fathom.ai landing page. Copy verbatim; structure and type scale from the
 * live site (Sora 300 hero at clamp(3.5rem–5.5rem), −2.5px tracking, cyan
 * pill CTAs with 56px radius and uppercase 17px labels, black canvas).
 */
export default function LandingPage() {
  const [aud, setAud] = useState<"teams" | "individuals">("teams");
  const a = AUDIENCE[aud];

  return (
    <div className="bg-black font-sans text-off-white">
      <MarketingNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <Starfield className="h-full" />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:px-11 lg:pb-28 lg:pt-16">
          <div>
            <h1 className="text-balance font-light leading-[1.1] tracking-[-0.032em] text-off-white" style={{ fontSize: "var(--text-h1-fluid)" }}>
              {HERO.title}
            </h1>
            <p className="mt-7 max-w-[560px] text-[17px] leading-7 text-off-white/90">
              {HERO.subtitle} <b className="font-semibold text-off-white">{HERO.subtitleStrong}</b>
            </p>
            <Link href="/users/sign_up" className="mt-8 inline-block">
              <CtaPill>{HERO.cta}</CtaPill>
            </Link>
            <p className="mt-6 flex flex-wrap items-center gap-x-2 text-[13px] text-white/70">
              <Lock className="size-3.5" />
              {HERO.trust.map((t, i) => (
                <span key={t} className="flex items-center gap-2">
                  {t}
                  {i < HERO.trust.length - 1 && <span aria-hidden className="text-white/40">|</span>}
                </span>
              ))}
            </p>
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-[560px]">
            <HeroVignettes className="absolute inset-0" />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-6 pb-14 lg:flex-row lg:items-center lg:px-11">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#ff492c] text-[13px] font-black text-white">G2</span>
            <div>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-4 text-white" fill="currentColor" strokeWidth={0} />)}
                <span className="ml-1 text-[14px] font-semibold">{HERO.rating.score}</span>
              </div>
              <p className="text-[11px] text-white/55">{HERO.rating.label} · {HERO.rating.reviews}</p>
            </div>
          </div>
          <p className="max-w-[140px] text-[13px] leading-5 text-white/60 lg:ml-6">{HERO.usedAt}</p>
          <LogoStrip names={LOGO_STRIP} className="lg:ml-auto" />
        </div>
      </section>

      {/* CAPTURE */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11 lg:py-28">
        <h2 className="max-w-[900px] text-balance font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>
          {CAPTURE_SECTION.title}
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {CAPTURE_SECTION.cards.map((c, i) => (
            <div key={c.title} className="rounded-3xl border border-white/12 bg-[#0d0d0f] p-7">
              <div className="mb-8 h-[180px] rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(0,190,255,0.25),transparent_60%)]">
                <CaptureArt kind={c.kind} index={i} />
              </div>
              <p className="text-[18px] leading-7 text-off-white">{c.title}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <p key={i} className="text-[15px] text-white/55">Move work forward faster</p>
          ))}
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11">
        <h2 className="text-balance text-center font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>
          {AUDIENCE.title}
        </h2>
        <div className="mt-8 flex justify-center">
          <Segmented items={[{ id: "teams", label: AUDIENCE.tabs[0]! }, { id: "individuals", label: AUDIENCE.tabs[1]! }]} value={aud} onChange={(v) => setAud(v as typeof aud)} />
        </div>
        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div key={aud} className="animate-fade-in">
            <h3 className="font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h3-fluid)" }}>{a.headline}</h3>
            <p className="mt-5 text-[17px] leading-7 text-white/80">{a.body}</p>
            <p className="mt-4 text-[17px] leading-7 text-white/80">{a.body2}</p>
            <Link href={a.ctaHref} className="mt-7 inline-block"><CtaPill>{a.cta}</CtaPill></Link>
          </div>
          <ul className="space-y-3">
            {a.points.map((p) => (
              <li key={p} className="flex gap-3 rounded-2xl border border-white/12 bg-[#0d0d0f] p-5 text-[15px] leading-6 text-off-white/90">
                <Check className="mt-1 size-4 shrink-0 text-fathom" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* PILLARS */}
      <section className="mx-auto max-w-[1400px] space-y-24 px-6 py-20 lg:px-11">
        {PILLARS.map((p, i) => (
          <div key={p.eyebrow} className={cn("grid items-center gap-12 lg:grid-cols-2", i % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
            <div>
              <p className={cn("text-[13px] font-semibold uppercase tracking-[0.18em]", p.accent === "cyan" ? "text-fathom" : p.accent === "purple" ? "text-[#c86bff]" : "text-brand-pink")}>{p.eyebrow}</p>
              <h3 className="mt-4 text-balance font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{p.title}</h3>
              <p className="mt-5 max-w-[540px] text-[17px] leading-7 text-white/80">{p.body}</p>
              <Link href="/users/sign_up" className="mt-7 inline-block"><CtaPill>{p.cta}</CtaPill></Link>
            </div>
            <PillarArt accent={p.accent} index={i} />
          </div>
        ))}
      </section>

      {/* STATS */}
      <section className="border-y border-white/10 bg-[#070708]">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11">
          <h2 className="text-center font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{STATS.title}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STATS.items.map((s) => (
              <div key={s.value} className="rounded-3xl border border-white/12 p-8 text-center">
                <p className="font-light tracking-[-0.02em] text-fathom" style={{ fontSize: "var(--text-h3-fluid)" }}>{s.value}</p>
                <p className="mt-3 text-[15px] leading-6 text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-14 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-white/50">{STATS.tagline}</p>
          <h3 className="mt-3 text-center font-light tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{STATS.headline}</h3>
          <div className="mt-8 text-center"><Link href="/users/sign_in/?for_team_edition=1"><CtaPill>{STATS.cta}</CtaPill></Link></div>
        </div>
      </section>

      {/* WORKS WHERE */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-fathom">{WORKS_WHERE.eyebrow}</p>
        <h2 className="mt-4 font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{WORKS_WHERE.title}</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {WORKS_WHERE.apps.map((app) => (
            <div key={app} className="flex h-24 items-center justify-center rounded-2xl border border-white/12 bg-[#0d0d0f] text-[15px] font-semibold text-white/85">{app}</div>
          ))}
        </div>
        <p className="mt-8 text-[17px] text-white/70">{WORKS_WHERE.body}</p>
      </section>

      {/* TEAMS FLOW */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11">
        <h2 className="max-w-[900px] text-balance font-light leading-[1.15] tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{TEAMS_FLOW.title}</h2>
        <div className="mt-6 flex flex-wrap items-center gap-6">
          <p className="text-[17px] text-white/70">{TEAMS_FLOW.subtitle}</p>
          <Link href="/users/sign_up"><CtaPill small>{TEAMS_FLOW.cta}</CtaPill></Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TEAMS_FLOW.roles.map((r) => (
            <div key={r.name} className="flex flex-col rounded-3xl border border-white/12 bg-[#0d0d0f] p-7 transition-colors hover:border-white/25">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-fathom">{r.name}</p>
              <h3 className="mt-3 text-[24px] font-light leading-8 tracking-[-0.01em]">{r.title}</h3>
              <p className="mt-3 flex-1 text-[15px] leading-6 text-white/70">{r.body}</p>
              <Link href={r.href} className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-off-white hover:text-fathom">
                {r.cta} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <Starfield density={0.00025} />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 text-center lg:px-11">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/55">{FINAL_CTA.eyebrow}</p>
          <h2 className="mt-4 text-balance font-light leading-[1.1] tracking-[-0.03em]" style={{ fontSize: "var(--text-h1-fluid)" }}>{FINAL_CTA.title}</h2>
          <p className="mt-3 text-[20px] text-white/75">{FINAL_CTA.subtitle}</p>
          <Link href="/users/sign_up" className="mt-9 inline-block"><CtaPill>{FINAL_CTA.cta}</CtaPill></Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function CaptureArt({ kind, index }: { kind: string; index: number }) {
  if (kind === "summary")
    return (
      <div className="p-5">
        <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-[11px]">
          <p className="font-semibold text-off-white">Q3 Strategy · Summary</p>
          <ul className="mt-2 space-y-1 text-white/70">
            <li>▪ Launch holds at July 14</li>
            <li>▪ New tier approved</li>
            <li>▪ Responsive web first</li>
          </ul>
        </div>
      </div>
    );
  if (kind === "llm")
    return (
      <div className="flex h-full items-center justify-center gap-3">
        {["ChatGPT", "Claude", "Fathom"].map((n, i) => (
          <span key={n} className={cn("rounded-full border px-3 py-1.5 text-[11px] font-semibold", i === 2 ? "border-fathom bg-fathom/15 text-fathom" : "border-white/20 text-white/75")}>{n}</span>
        ))}
      </div>
    );
  return (
    <div className="p-5">
      <div className="rounded-xl border border-white/10 bg-black/60 p-3 text-[11px]">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-white/45">Keyword alert · {index}</p>
        <p className="mt-1 text-off-white">“competitor” mentioned in <span className="text-fathom">Northwind – Discovery</span></p>
        <p className="mt-1 text-white/55">Ben: “…mention of competitors or alternative solutions?”</p>
      </div>
    </div>
  );
}

function PillarArt({ accent, index }: { accent: string; index: number }) {
  const color = accent === "cyan" ? "rgba(0,190,255,0.3)" : accent === "purple" ? "rgba(150,0,255,0.35)" : "rgba(255,168,187,0.3)";
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border border-white/12 bg-[#0d0d0f]" style={{ backgroundImage: `radial-gradient(circle at ${30 + index * 20}% 30%, ${color}, transparent 60%)` }}>
      <div className="absolute inset-x-8 top-8 rounded-xl border border-white/10 bg-black/70 p-4 text-[12px]">
        {index === 0 && (
          <>
            <p className="font-semibold">Transcript</p>
            <p className="mt-2 rounded-lg bg-[#3e3f3f] px-2.5 py-1.5 text-white/85">Let’s lock July 14th for the dashboard launch.</p>
            <p className="mt-1 text-[10px] text-white/50">Nancy Liang (she/her)</p>
            <p className="mt-2 rounded-lg bg-[#0f5d80] px-2.5 py-1.5 text-white">Two weeks of QA feels right.</p>
          </>
        )}
        {index === 1 && (
          <>
            <p className="font-semibold">Ask Fathom</p>
            <p className="mt-2 rounded-xl bg-[#2a3b45] px-2.5 py-1.5">What did Ben say about retention?</p>
            <p className="mt-2 text-white/75">Ben needs retention controls, SSO and the SOC 2 report in writing. <span className="rounded bg-fathom/15 px-1 text-fathom">4:12</span></p>
          </>
        )}
        {index === 2 && (
          <div className="grid grid-cols-3 gap-2">
            {["Slack", "Salesforce", "HubSpot", "Notion", "Asana", "Zapier"].map((n) => (
              <span key={n} className="rounded-lg border border-white/10 bg-white/5 py-2 text-center text-[11px] text-white/80">{n}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
