"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Minus } from "lucide-react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { Starfield } from "@/components/marketing/starfield";
import { MkButton } from "@/components/marketing/cta";
import { PLANS, PRICING_EXTRAS, type PlanAudience } from "@/data/marketing";
import { cn } from "@/lib/utils";

/**
 * fathom.ai/pricing from the live DOM: Individuals / Teams pill tabs,
 * Monthly / Annually toggle, "Free plan" glass banner, three #191919 cards
 * (24px radius; gradient-orange, border-blue, border-purple for teams;
 * border-gray ×2 + gradient-orange for individuals), "More ways" CTA cards,
 * the feature table, a pink→purple contact block with the astronaut PNG, and
 * the "Stop guessing Ask Fathom" CTA flanked by the product screenshots.
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

const CARD_STYLE: Record<string, string> = {
  free: "border border-[#faf5f54d]",
  premium: "border border-[#faf5f54d]",
  team_ind: "border border-transparent [background:linear-gradient(#191919,#191919)_padding-box,linear-gradient(135deg,#f55200,#fff58c)_border-box]",
  team: "border border-transparent [background:linear-gradient(#191919,#191919)_padding-box,linear-gradient(135deg,#f55200,#fff58c)_border-box]",
  business: "border border-fathom",
  enterprise: "border border-brand-purple",
};

function PricingBody() {
  const params = useSearchParams();
  const initial = (params.get("plan") as PlanAudience | null) ?? "teams";
  const [aud, setAud] = useState<PlanAudience>(initial === "individuals" ? "individuals" : "teams");
  const [annual, setAnnual] = useState(true);
  const plans = PLANS.filter((p) => p.audience === aud);

  return (
    <>
      <section className="relative overflow-hidden">
        <Starfield className="opacity-[0.45]" density={0.0003} />
        <div className="mk-pad relative">
          <div className="mk-container pb-10 pt-[96px] text-center">
            <h1 className="mk-h2 text-balance">
              Pricing to <span className="font-normal">supercharge every meeting</span>
            </h1>
            <div className="mt-9 flex justify-center">
              <div className="mk-glass-wrap !w-auto">
                <div className="mk-glass flex p-1" role="tablist">
                  {(["individuals", "teams"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={aud === id}
                      onClick={() => setAud(id)}
                      className={cn("rounded-full px-5 py-2 text-[13.8px] capitalize transition-colors", aud === id ? "bg-[#2a3b45] text-off-white" : "text-off-white/80 hover:text-off-white")}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-3 text-[13.8px]">
              <span className={cn(!annual ? "text-off-white" : "text-off-white/60")}>Monthly</span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                aria-label="Bill annually"
                onClick={() => setAnnual((v) => !v)}
                className={cn("relative h-6 w-11 rounded-full border border-fathom/60 transition-colors", annual ? "bg-fathom" : "bg-white/10")}
              >
                <span className={cn("absolute left-0 top-0.5 size-[18px] rounded-full bg-white shadow transition-transform", annual ? "translate-x-[24px]" : "translate-x-0.5")} />
              </button>
              <span className={cn(annual ? "font-medium text-off-white" : "text-off-white/60")}>
                Annually <span className="font-light text-off-white/70">(save 25%+)</span>
              </span>
            </div>

            <div className="mk-glass-wrap mt-9 text-left">
              <div className="mk-glass flex flex-col items-start gap-3 px-6 py-4 sm:flex-row sm:items-center">
                <span className="text-[13.8px] font-medium text-off-white">{PRICING_EXTRAS.freeBanner.label}</span>
                <span className="text-[13.8px] font-light text-off-white/80">{PRICING_EXTRAS.freeBanner.text}</span>
                <Link href="/users/sign_up" className="text-[13.8px] font-medium text-off-white hover:text-fathom sm:ml-auto">{PRICING_EXTRAS.freeBanner.cta}</Link>
              </div>
            </div>

            <div className="mt-6 grid gap-6 text-left md:grid-cols-3 md:gap-9">
              {plans.map((p) => (
                <div key={p.id} className={cn("flex flex-col overflow-hidden rounded-3xl bg-[#191919] pb-8 backdrop-blur-[1px]", CARD_STYLE[p.id])}>
                  <div className="px-6 pt-6">
                    <p className="text-[10px] font-normal uppercase tracking-[0.1em] text-off-white/70">{p.eyebrow}</p>
                    <h2 className="mt-2 text-[24px] font-light">{p.name}</h2>
                    <div className="my-5 h-px bg-[#faf5f533]" />
                    <div className="flex items-end gap-2">
                      <span className="mk-stat-num !text-[44px]">${annual ? p.priceAnnual : p.priceMonthly}</span>
                      <span className="pb-1 text-[12.5px] font-light leading-4 text-off-white/80">
                        {p.seatNote && <span className="block">{p.seatNote}</span>}
                        {p.priceNote && <span className="block">{p.priceNote}</span>}
                      </span>
                    </div>
                    <div className="mt-6 flex justify-center">
                      <MkButton
                        href={p.id === "enterprise" ? "/book-a-demo" : "/users/sign_up"}
                        variant={p.ctaKind === "yellow" ? "yellow" : "outline"}
                        className="w-full !px-4 [&_.mk-btn__text]:!text-[13px]"
                      >
                        {p.cta}
                      </MkButton>
                    </div>
                    <p className="mt-3 text-center text-[11px] font-light text-off-white/70">{p.guarantee}</p>
                    <ul className="mt-6 space-y-3">
                      {p.features.map((f, i) => (
                        <li key={f} className={cn("flex gap-2.5 text-[13.8px] font-light leading-5", i === 0 && p.accent !== "none" ? "font-normal text-brand-yellow" : "text-off-white")}>
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[13.8px] font-light text-off-white/80">
              <Link href="/book-a-demo" className="hover:text-fathom">{PRICING_EXTRAS.talkToSales}</Link>
            </p>

            <div className="mx-auto mt-12 grid max-w-[758px] gap-6 text-center sm:grid-cols-3 sm:gap-12">
              {PRICING_EXTRAS.moreWays.cards.map((c) => (
                <div key={c.title} className="flex flex-col items-center">
                  <h3 className="text-[15px] font-normal text-off-white">{c.title}</h3>
                  <p className="mt-2 text-[13px] font-light leading-5 text-off-white/75">{c.body}</p>
                  <Link href="/book-a-demo" className="mt-3 text-[13px] font-normal text-fathom hover:underline">{c.cta}</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mk-pad pb-20 pt-24">
        <div className="mk-container">
          <h2 className="mk-h2 text-center">
            Meet your brilliant <span className="font-normal">AI meeting partner</span>
          </h2>
          <div className="mt-14 overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
              <thead>
                <tr>
                  <th className="w-[30%] pb-4" />
                  {PRICING_EXTRAS.featureTable.plans.map((p, i) => (
                    <th key={p} className="px-3 pb-4 text-center align-bottom">
                      <p className="text-[18px] font-light">{p}</p>
                      <div className="mt-3 flex justify-center">
                        <MkButton href={i === 4 ? "/book-a-demo" : "/users/sign_up"} variant="outline" className="!px-4 !py-2.5 [&_.mk-btn__text]:!text-[11px]">
                          {PRICING_EXTRAS.featureTable.ctas[i]}
                        </MkButton>
                      </div>
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
        </div>
      </section>

      {/* contact block with the astronaut */}
      <section className="mk-pad pb-24">
        <div className="mk-container">
          <div className="relative flex flex-col items-center gap-8 overflow-visible rounded-3xl bg-[linear-gradient(0deg,#9600ff,#ffa8bb)] px-6 pb-12 pt-[74px] lg:flex-row lg:justify-end lg:gap-[38px] lg:pr-[106px]">
            <img
              src="/fathom/pricing-astronaut.png"
              alt=""
              className="w-[240px] object-contain lg:absolute lg:-top-[15%] lg:left-0 lg:h-[115%] lg:w-auto lg:max-w-[50%]"
            />
            <div className="max-w-[560px] text-center lg:text-left">
              <h2 className="mk-h2 text-off-white">{PRICING_EXTRAS.contact.title}</h2>
              <p className="mk-p mt-6 text-off-white">{PRICING_EXTRAS.contact.body}</p>
              <div className="mt-8">
                <MkButton href="/book-a-demo" variant="yellow">{PRICING_EXTRAS.contact.cta}</MkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* final CTA with product screenshots */}
      <section className="relative overflow-clip pb-28 pt-16">
        <Starfield className="opacity-[0.45]" density={0.0003} />
        <img src="/fathom/pricing-image-7.png" alt="" className="pointer-events-none absolute -left-[284px] top-[300px] hidden w-[200px] xl:block" />
        <img src="/fathom/pricing-m3u8.png" alt="" className="pointer-events-none absolute -left-[52px] top-[180px] hidden w-[326px] lg:block" />
        <img src="/fathom/pricing-frame-79.png" alt="" className="pointer-events-none absolute right-[36px] top-[180px] hidden w-[304px] lg:block" />
        <img src="/fathom/pricing-frame-80.png" alt="" className="pointer-events-none absolute -right-[10px] top-[120px] hidden w-[320px] xl:block" />
        <div className="relative mx-auto max-w-[520px] px-6 text-center">
          <div className="flex items-center justify-center gap-1 text-fathom">
            <img src="/fathom/star.svg" alt="" className="h-[10px] w-[10px]" />
            <p className="mk-tiny">Never miss what matters</p>
          </div>
          <h3 className="mk-h3 mt-4 text-off-white">
            Stop guessing
            <br />
            <span className="font-normal">Ask Fathom</span>
          </h3>
          <MkButton href="/users/sign_up" className="mt-8">Get Started. It’s Free.</MkButton>
        </div>
      </section>

    </>
  );
}

function GroupRows({ group }: { group: (typeof PRICING_EXTRAS)["featureTable"]["groups"][number] }) {
  return (
    <>
      <tr>
        <td colSpan={6} className="pb-3 pt-10 text-[12px] font-normal uppercase tracking-[0.14em] text-fathom">{group.title}</td>
      </tr>
      {group.rows.map((r) => (
        <tr key={r.label} className="border-t border-white/10">
          <td className="py-3 pr-4 text-[13.8px] font-light text-off-white">
            {r.label}
            {"note" in r && r.note && <span className="block text-[11px] text-off-white/50">{r.note}</span>}
          </td>
          {r.cells.map((c, i) => (
            <td key={i} className="px-3 py-3 text-center">
              {c === true ? <Check className="mx-auto size-4 text-emerald-400" strokeWidth={2.5} /> : c === false ? <Minus className="mx-auto size-4 text-white/25" /> : <span className="text-[12px] leading-4 text-off-white/70">{c}</span>}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
