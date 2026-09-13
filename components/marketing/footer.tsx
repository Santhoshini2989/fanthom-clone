/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { MkButton } from "./cta";

/**
 * fathom.ai footer, from the live DOM: #191919 background, the footer logo
 * (Group 93.svg, 143×21) top-left, six link columns at 176px pitch (Product +
 * Company stacked · Solutions · Integrations · Competitors · Resources), a
 * two-line "TRY FATHOM TODAY" pill on the right, then the legal row with
 * "Fathom © All Rights Reserved 2026".
 */
const COLS: { title: string; links: { label: string; href: string }[] }[][] = [
  [
    {
      title: "Product",
      links: [
        { label: "Overview", href: "/overview" },
        { label: "Pricing", href: "/pricing" },
        { label: "What's New", href: "/whats-new" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Careers", href: "https://jobs.ashbyhq.com/fathom.video" },
      ],
    },
  ],
  [
    {
      title: "Solutions",
      links: [
        { label: "For Sales", href: "/solutions/sales" },
        { label: "For Marketing", href: "/solutions/marketing" },
        { label: "For Customer Success", href: "/solutions/customer-success" },
        { label: "For Teams", href: "/solutions/teams" },
      ],
    },
  ],
  [
    {
      title: "Integrations",
      links: [
        { label: "Asana", href: "/integrations/asana" },
        { label: "ChatGPT", href: "/integrations/chatgpt" },
        { label: "Claude", href: "/integrations/claude" },
        { label: "HubSpot", href: "/integrations/hubspot" },
        { label: "Salesforce", href: "/integrations/salesforce" },
        { label: "Zapier", href: "/integrations/zapier" },
        { label: "Public API & MCP", href: "https://developers.fathom.ai/" },
        { label: "All Integrations", href: "/integrations" },
      ],
    },
  ],
  [
    {
      title: "Competitors",
      links: [
        { label: "Competitor Overview", href: "/vs/others" },
        { label: "Fathom vs. Fireflies", href: "/vs/fireflies" },
        { label: "Fathom vs. Granola", href: "/vs/granola" },
        { label: "Fathom vs. Gong", href: "/vs/gong" },
        { label: "Fathom vs. Otter", href: "/vs/otter" },
        { label: "Fathom vs. Read AI", href: "/vs/read-ai" },
        { label: "Fathom vs. ZoomMate", href: "/vs/zoom" },
        { label: "Fathom vs. Google Meet's Gemini", href: "/vs/google-meet" },
        { label: "Fathom vs. Built-In Solutions", href: "/vs/built-in" },
      ],
    },
  ],
  [
    {
      title: "Resources",
      links: [
        { label: "Resource Hub", href: "/resource-hub" },
        { label: "Help Center", href: "https://help.fathom.video/" },
        { label: "Partner Program", href: "/partner-programs" },
      ],
    },
  ],
];

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "text-[13.8px] font-normal text-white transition-colors duration-300 hover:text-fathom";
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-[#191919] text-off-white">
      <div className="mk-container mk-pad pb-12 pt-[43px]">
        <Link href="/" aria-label="Fathom" className="inline-block">
          <img src="/fathom/footer-mark.svg" alt="Fathom" className="h-[21px] w-auto" />
        </Link>
        <div className="mt-9 flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-3 lg:flex lg:gap-0">
            {COLS.map((stack, i) => (
              <div key={i} className="flex flex-col gap-10 lg:w-[176px]">
                {stack.map((col) => (
                  <div key={col.title}>
                    <div className="text-[13.8px] text-white/50">{col.title}</div>
                    <ul className="mt-4 space-y-4">
                      {col.links.map((l) => (
                        <li key={l.label} className="max-w-[160px] leading-5">
                          <FooterLink href={l.href}>{l.label}</FooterLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="shrink-0">
            <MkButton href="/users/sign_up" className="!h-auto !max-w-[123px] !whitespace-normal !py-4 text-center [&_.mk-btn__text]:leading-[1.1]">
              Try Fathom today
            </MkButton>
          </div>
        </div>
      </div>
      <div className="mk-container mk-pad flex flex-col gap-4 pb-8 pt-16 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13.8px] text-off-white">
          <Link href="/terms" className="py-5 hover:text-fathom">Terms of Service</Link>
          <Link href="/privacy" className="py-5 hover:text-fathom">Privacy Policy</Link>
          <a href="https://trust.fathom.video/" target="_blank" rel="noreferrer" className="py-5 hover:text-fathom">Security & Compliance</a>
          <a href="https://status.fathom.video/" target="_blank" rel="noreferrer" className="py-5 hover:text-fathom">Status</a>
        </div>
        <p className="mk-tiny text-off-white">
          Fathom © All Rights Reserved <span>{new Date().getFullYear()}</span>
        </p>
      </div>
    </footer>
  );
}
