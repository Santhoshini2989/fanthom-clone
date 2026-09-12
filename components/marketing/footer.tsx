import Link from "next/link";
import { FOOTER } from "@/data/marketing";
import { FathomWordmark } from "@/components/brand/logo";

/** Marketing footer: column links captured from fathom.ai plus the legal row. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 pb-10 pt-16 text-off-white lg:px-11">
      <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div>
          <FathomWordmark textClassName="text-[19px] tracking-[0.2em]" />
          <p className="mt-4 max-w-[260px] text-[14px] leading-6 text-white/55">
            Fathom summarizes your meetings so you can focus on the conversation.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wide text-white/50">
            <span className="rounded-full border border-white/15 px-2.5 py-1">SOC 2 Type II</span>
            <span className="rounded-full border border-white/15 px-2.5 py-1">GDPR</span>
            <span className="rounded-full border border-white/15 px-2.5 py-1">HIPAA</span>
          </div>
        </div>
        {FOOTER.columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noreferrer" className="text-[14px] text-white/80 transition-colors hover:text-white">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-[14px] text-white/80 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 flex max-w-[1400px] flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Fathom Video Inc.</p>
        <div className="flex gap-5">
          {FOOTER.legal.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
          <a href="https://trust.fathom.video/" target="_blank" rel="noreferrer" className="hover:text-white">
            Security & Compliance
          </a>
          <a href="https://status.fathom.video/" target="_blank" rel="noreferrer" className="hover:text-white">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}
