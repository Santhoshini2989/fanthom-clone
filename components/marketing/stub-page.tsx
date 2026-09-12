import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "./nav";
import { MarketingFooter } from "./footer";
import { Starfield } from "./starfield";
import { CtaPill } from "./cta";

export interface MarketingSection {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
}

/**
 * Shared template for secondary marketing routes (overview, solutions,
 * integrations, resources, company, comparisons, legal). The real pages'
 * detailed layouts were NOT fully inspected; this keeps the verified header,
 * hero typography, card language and footer so navigation never dead-ends.
 */
export function MarketingStubPage({
  eyebrow,
  title,
  intro,
  sections,
  cta = { label: "GET STARTED - FREE FOREVER", href: "/users/sign_up" },
  related,
  legal,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  sections?: MarketingSection[];
  cta?: { label: string; href: string } | null;
  related?: { label: string; href: string }[];
  legal?: boolean;
}) {
  return (
    <div className="bg-black font-sans text-off-white">
      <MarketingNav />
      <section className="relative overflow-hidden">
        {!legal && <Starfield density={0.0003} />}
        <div className="relative mx-auto max-w-[1000px] px-6 pb-16 pt-14 text-center lg:px-11">
          {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-fathom">{eyebrow}</p>}
          <h1 className="mt-4 text-balance font-light leading-[1.1] tracking-[-0.03em]" style={{ fontSize: legal ? "var(--text-h2-fluid)" : "var(--text-h1-fluid)" }}>
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-[680px] text-[18px] leading-8 text-white/80">{intro}</p>
          {cta && !legal && (
            <Link href={cta.href} className="mt-8 inline-block">
              <CtaPill>{cta.label}</CtaPill>
            </Link>
          )}
        </div>
      </section>

      {sections && (
        <section className={legal ? "mx-auto max-w-[820px] px-6 pb-24 lg:px-11" : "mx-auto max-w-[1400px] px-6 pb-24 lg:px-11"}>
          <div className={legal ? "space-y-10" : "grid gap-5 md:grid-cols-2 lg:grid-cols-3"}>
            {sections.map((s) => (
              <div key={s.title} className={legal ? "" : "flex flex-col rounded-3xl border border-white/12 bg-[#0d0d0f] p-7"}>
                {s.eyebrow && <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-fathom">{s.eyebrow}</p>}
                <h2 className={legal ? "mt-1 text-[22px] font-medium" : "mt-2 text-[22px] font-light leading-7"}>{s.title}</h2>
                <p className={legal ? "mt-3 text-[15px] leading-7 text-white/75" : "mt-3 flex-1 text-[15px] leading-6 text-white/70"}>{s.body}</p>
                {s.bullets && (
                  <ul className="mt-4 space-y-1.5 text-[14px] leading-6 text-white/75">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex gap-2"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-fathom" />{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {related && related.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-6 pb-24 lg:px-11">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-white/50">Keep exploring</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.href} href={r.href} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-[14px] text-off-white transition-colors hover:border-fathom hover:text-fathom">
                {r.label} <ArrowRight className="size-3.5" />
              </Link>
            ))}
          </div>
        </section>
      )}
      <MarketingFooter />
    </div>
  );
}
