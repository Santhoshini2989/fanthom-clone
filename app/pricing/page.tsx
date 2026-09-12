"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, Minus } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { Starfield } from "@/components/marketing/starfield";
import { CtaPill } from "@/components/marketing/cta";
import { Segmented } from "@/components/ui/tabs";
import { PLANS, PRICING_EXTRAS, type PlanAudience } from "@/data/marketing";
import { cn } from "@/lib/utils";

/**
 * fathom.ai/pricing (verified): "Pricing to supercharge every meeting",
 * Individuals / Teams segmented control, Monthly / Annually (save 25%+)
 * toggle, "Free plan" banner, three plan cards (yellow primary CTA, cyan and
 * purple accented cards), "More ways to get started", feature comparison
 * table, contact sales, FAQ.
 */
export default function PricingPage() {
  return (
    <div className="bg-black font-sans text-off-white">
      <MarketingNav />
      <Suspense fallback={null}>
        <PricingBody />
      </Suspense>
      <MarketingFooter />
    </div>
  );
}

function PricingBody() {
  const params = useSearchParams();
  const initial = (params.get("plan") as PlanAudience | null) ?? "teams";
  const [aud, setAud] = useState<PlanAudience>(initial === "individuals" ? "individuals" : "teams");
  const [annual, setAnnual] = useState(true);
  const plans = PLANS.filter((p) => p.audience === aud);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <section className="relative overflow-hidden">
        <Starfield density={0.0003} />
        <div className="relative mx-auto max-w-[1400px] px-6 pb-10 pt-12 text-center lg:px-11">
          <h1 className="text-balance font-light leading-[1.1] tracking-[-0.03em]" style={{ fontSize: "var(--text-h1-fluid)" }}>
            Pricing to <span className="font-medium">supercharge every meeting</span>
          </h1>
          <div className="mt-8 flex justify-center">
            <Segmented items={[{ id: "individuals", label: "Individuals" }, { id: "teams", label: "Teams" }]} value={aud} onChange={(v) => setAud(v as PlanAudience)} />
          </div>
          <div className="mt-5 flex items-center justify-center gap-3 text-[14px]">
            <span className={cn(!annual ? "text-off-white" : "text-white/55")}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={annual}
              aria-label="Bill annually"
              onClick={() => setAnnual((v) => !v)}
              className={cn("relative h-6 w-11 rounded-full border border-fathom/60 transition-colors", annual ? "bg-fathom" : "bg-white/10")}
            >
              <span className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow transition-transform", annual ? "translate-x-[22px]" : "translate-x-0.5")} />
            </button>
            <span className={cn(annual ? "font-semibold text-off-white" : "text-white/55")}>
              Annually <span className="font-normal text-white/60">(save 25%+)</span>
            </span>
          </div>
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-11">
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/12 bg-[#0d0d0f] px-6 py-4 sm:flex-row sm:items-center">
            <span className="text-[14px] font-semibold text-off-white">{PRICING_EXTRAS.freeBanner.label}</span>
            <span className="text-[14px] text-white/75">{PRICING_EXTRAS.freeBanner.text}</span>
            <Link href="/users/sign_up" className="text-[14px] font-medium text-off-white hover:text-fathom sm:ml-auto">{PRICING_EXTRAS.freeBanner.cta}</Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col rounded-3xl border bg-[#0d0d0f] p-7",
                  p.accent === "cyan" ? "border-fathom/70" : p.accent === "purple" ? "border-brand-purple/80" : "border-white/15",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">{p.eyebrow}</p>
                <h2 className="mt-2 text-[24px] font-normal">{p.name}</h2>
                <div className="my-5 h-px bg-white/12" />
                <div className="flex items-end gap-2">
                  <span className="text-[44px] font-normal leading-none">${annual ? p.priceAnnual : p.priceMonthly}</span>
                  <span className="pb-1 text-[13px] leading-4 text-white/70">
                    {p.seatNote && <span className="block">{p.seatNote}</span>}
                    {p.priceNote && <span className="block">{p.priceNote}</span>}
                  </span>
                </div>
                <Link href={p.ctaKind === "yellow" ? "/users/sign_up" : p.id === "enterprise" ? "/book-a-demo" : "/users/sign_up"} className="mt-6 block">
                  <span
                    className={cn(
                      "flex h-11 w-full items-center justify-center rounded-full text-[13px] font-semibold uppercase tracking-[0.06em] transition-[filter,background-color]",
                      p.ctaKind === "yellow" ? "bg-brand-yellow text-black hover:brightness-105" : "border border-white/40 text-off-white hover:bg-white/8",
                    )}
                  >
                    {p.cta}
                  </span>
                </Link>
                <p className="mt-3 text-center text-[12px] text-white/60">{p.guarantee}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={f} className={cn("flex gap-2.5 text-[14px] leading-5", i === 0 && p.accent !== "none" ? "font-semibold text-brand-yellow" : "text-white/85")}>
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[14px] text-white/75">
            <Link href="/book-a-demo" className="hover:text-fathom">{PRICING_EXTRAS.talkToSales}</Link>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-11">
        <h2 className="font-light tracking-[-0.02em]" style={{ fontSize: "var(--text-h3-fluid)" }}>{PRICING_EXTRAS.moreWays.title}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PRICING_EXTRAS.moreWays.cards.map((c) => (
            <div key={c.title} className="flex flex-col rounded-3xl border border-white/12 bg-[#0d0d0f] p-7">
              <h3 className="text-[20px]">{c.title}</h3>
              <p className="mt-3 flex-1 text-[14px] leading-6 text-white/70">{c.body}</p>
              <Link href="/book-a-demo" className="mt-6 text-[12px] font-semibold uppercase tracking-[0.1em] text-off-white hover:text-fathom">{c.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-11">
        <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-fathom">Features</p>
        <h2 className="mt-3 font-light tracking-[-0.02em]" style={{ fontSize: "var(--text-h2-fluid)" }}>{PRICING_EXTRAS.featureTable.title}</h2>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
            <thead>
              <tr>
                <th className="w-[34%] pb-4" />
                {PRICING_EXTRAS.featureTable.plans.map((p, i) => (
                  <th key={p} className="px-3 pb-4 text-center align-bottom">
                    <p className="text-[18px] font-normal">{p}</p>
                    <Link href={i === 4 ? "/book-a-demo" : "/users/sign_up"} className="mt-2 inline-block">
                      <span className="inline-flex h-9 items-center rounded-full border border-white/35 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] hover:bg-white/8">{PRICING_EXTRAS.featureTable.ctas[i]}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_EXTRAS.featureTable.groups.map((g) => (
                <GroupRows key={g.title} group={g} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-11">
        <div className="rounded-3xl border border-white/12 bg-[#0d0d0f] p-10 text-center">
          <h2 className="font-light tracking-[-0.02em]" style={{ fontSize: "var(--text-h3-fluid)" }}>{PRICING_EXTRAS.contact.title}</h2>
          <p className="mx-auto mt-4 max-w-[640px] text-[16px] leading-7 text-white/75">{PRICING_EXTRAS.contact.body}</p>
          <Link href="/book-a-demo" className="mt-8 inline-block"><CtaPill>{PRICING_EXTRAS.contact.cta}</CtaPill></Link>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 pb-24 lg:px-11">
        <h2 className="text-center font-light tracking-[-0.02em]" style={{ fontSize: "var(--text-h3-fluid)" }}>Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-white/12 border-y border-white/12">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px]">
                {f.q}
                <ChevronDown className={cn("size-5 shrink-0 transition-transform duration-200", openFaq === i && "rotate-180")} />
              </button>
              <div className={cn("grid transition-[grid-template-rows] duration-200 ease-[var(--ease-fathom)]", openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <p className="overflow-hidden text-[15px] leading-7 text-white/70">{openFaq === i ? <span className="block pb-5">{f.a}</span> : null}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function GroupRows({ group }: { group: (typeof PRICING_EXTRAS)["featureTable"]["groups"][number] }) {
  return (
    <>
      <tr>
        <td colSpan={6} className="pb-3 pt-10 text-[12px] font-semibold uppercase tracking-[0.14em] text-fathom">{group.title}</td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.label} className="border-t border-white/10">
          <td className="py-3 pr-4 text-[14px] text-white/85">
            {r.label}
            {"note" in r && r.note && <span className="block text-[11px] text-white/45">{r.note}</span>}
          </td>
          {r.cells.map((c, i) => (
            <td key={i} className="px-3 py-3 text-center">
              {c === true ? (
                <Check className="mx-auto size-4 text-emerald-400" strokeWidth={2.5} />
              ) : c === false ? (
                <Minus className="mx-auto size-4 text-white/25" />
              ) : (
                <span className="text-[12px] leading-4 text-white/70">{c}</span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

const FAQ = [
  { q: "Is Fathom really free?", a: "Yes. The Free plan includes unlimited recordings and transcriptions, instant AI summaries, clips, playlists and search. Premium and Team plans add advanced summaries, AI action items, the conversational assistant and collaboration features." },
  { q: "Do I need a bot in my meetings?", a: "No. Fathom can capture bot-free from the desktop app (transcript only or audio + transcript), or join with a visible notetaker bot that records full audio and video. You choose per meeting type." },
  { q: "Which platforms does Fathom work with?", a: "Zoom, Google Meet and Microsoft Teams, plus Slack Huddles with bot-free capture. Summaries sync to Slack, Salesforce, HubSpot, Notion, Asana, Zapier and more." },
  { q: "What is the 90 day guarantee?", a: "If Fathom isn’t working for your team within the first 90 days of a paid plan, contact support for a full refund." },
  { q: "How is my data protected?", a: "Fathom is SOC 2 Type II, GDPR and HIPAA compliant. Enterprise plans add SSO/SCIM, custom retention, organization-wide security controls and the option to exclude your data from model improvement." },
];
