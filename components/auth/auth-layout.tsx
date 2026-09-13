/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AUTH_TESTIMONIAL } from "@/data/marketing";

/**
 * fathom.video sign-in / sign-up frame, rebuilt from the live page with its
 * own assets: the inline wordmark SVG (176×25), the 19%-opacity quote-mark
 * SVG, the G2 rating badge, and the partner logos rendered at 45% opacity in
 * the footer band. Card: 463px, rounded-3xl, off-white/25 border,
 * neutral-900/80 with backdrop blur, 56/20/32 padding.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-off-white">
      <header className="flex justify-center pt-11">
        <Link href="/" aria-label="Fathom">
          <img src="/fathom/app-wordmark.svg" alt="Fathom" className="h-[25px] w-44" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pt-[104px] lg:flex-row lg:items-start lg:justify-center lg:px-[180px]">
        <div className="relative flex w-full max-w-lg flex-col items-center rounded-3xl border border-off-white/25 bg-neutral-900/80 px-5 pb-8 pt-14 backdrop-blur-sm lg:w-[463px]">
          {children}
        </div>

        <div className="flex flex-1 items-center justify-center px-14 pb-14 pt-32 lg:py-0 lg:pt-[198px]">
          <div className="relative max-w-md">
            <img src="/fathom/quote-mark.svg" alt="" className="absolute -left-6 -top-10 w-20" />
            <p className="text-[20px] leading-7">
              {AUTH_TESTIMONIAL.quote}{" "}
              <span className="font-semibold gradient-text-warm">{AUTH_TESTIMONIAL.emphasis}</span>
            </p>
            <p className="mt-5 text-[12px] font-medium text-[#f8f4f4]/75">{AUTH_TESTIMONIAL.name}</p>
            <p className="text-[12px] text-white/50">{AUTH_TESTIMONIAL.title}</p>
            <img src="/fathom/quote-mark.svg" alt="" className="absolute -bottom-4 -right-4 w-20 rotate-180" />
          </div>
        </div>
      </main>

      <footer className="px-5 pb-8 pt-8 lg:px-[180px]">
        <div className="flex w-full flex-col items-start gap-6 overflow-hidden rounded-3xl bg-black/10 px-10 py-5 lg:h-28 lg:flex-row lg:items-center lg:px-8 lg:py-0">
          <img src="/fathom/g2.svg" alt="G2 — 5.0/5.0 — #1 rated — 6,500+ reviews" className="h-11 w-auto" />
          <p className="max-w-[130px] text-[12px] leading-4 text-white/60 lg:ml-8">{AUTH_TESTIMONIAL.usedAt}</p>
          <div className="flex flex-wrap items-center gap-6 opacity-45 lg:ml-auto lg:flex-nowrap lg:gap-10">
            <img src="/fathom/logo-hubspot.svg" alt="HubSpot" className="h-6 w-auto" />
            <img src="/fathom/logo-adobe.svg" alt="Adobe" className="h-8 w-auto" />
            <img src="/fathom/logo-zapier.svg" alt="Zapier" className="h-6 w-auto" />
            <img src="/fathom/logo-grubhub.svg" alt="Grubhub" className="h-6 w-auto" />
            <img src="/fathom/logo-ea.svg" alt="EA" className="h-8 w-auto" />
            <img src="/fathom/logo-calendly.svg" alt="Calendly" className="h-6 w-auto" />
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Google "G" (the app serves it as a PNG). */
export function GoogleG({ className }: { className?: string }) {
  return <img src="/fathom/google.png" alt="" className={className} />;
}

export function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function AuthButton({
  children,
  icon,
  onClick,
  pending,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-[#d9dbe0] bg-white text-base font-medium text-black transition-[background-color,transform] duration-150 hover:bg-[#f3f4f6] active:scale-[0.99] disabled:opacity-80"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
