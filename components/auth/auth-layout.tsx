import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { FathomWordmark } from "@/components/brand/logo";
import { AUTH_TESTIMONIAL } from "@/data/marketing";

/**
 * Auth page frame (verified from live sign-in/sign-up pages): #0a0a0a body,
 * centered 176px wordmark, 463px card (rounded-3xl, off-white/25 border,
 * neutral-900/80 with backdrop blur, 56/20/32 padding), right-hand testimonial
 * with 19%-opacity quote marks and an orange→yellow gradient emphasis, then a
 * footer band with the G2 rating, "Used at over 290K+ companies" and logo tiles.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-off-white">
      <header className="flex justify-center pt-11">
        <Link href="/" aria-label="Fathom">
          <FathomWordmark className="gap-2.5" textClassName="text-[22px] tracking-[0.22em]" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 pt-[104px] lg:flex-row lg:items-start lg:justify-center lg:px-[180px]">
        <div className="relative flex w-full max-w-lg flex-col items-center rounded-3xl border border-off-white/25 bg-neutral-900/80 px-5 pb-8 pt-14 backdrop-blur-sm lg:w-[463px]">
          {children}
        </div>

        <div className="flex flex-1 items-center justify-center px-14 pb-14 pt-32 lg:py-0 lg:pt-[198px]">
          <div className="relative max-w-md">
            <QuoteMark className="absolute -left-6 -top-10 w-20" />
            <p className="text-[20px] leading-7">
              {AUTH_TESTIMONIAL.quote}{" "}
              <span className="font-semibold gradient-text-warm">{AUTH_TESTIMONIAL.emphasis}</span>
            </p>
            <p className="mt-5 text-[12px] font-medium text-[#f8f4f4]/75">{AUTH_TESTIMONIAL.name}</p>
            <p className="text-[12px] text-white/50">{AUTH_TESTIMONIAL.title}</p>
            <QuoteMark className="absolute -bottom-10 -right-6 w-20 rotate-180" />
          </div>
        </div>
      </main>

      <footer className="px-5 pb-8 pt-8 lg:px-[180px]">
        <div className="flex w-full flex-col items-start gap-6 overflow-hidden rounded-3xl bg-black/10 px-10 py-5 lg:h-28 lg:flex-row lg:items-center lg:px-8 lg:py-0">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#ff492c] text-[13px] font-black text-white">G2</span>
            <div>
              <div className="flex items-center gap-1 text-white">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="size-3.5" fill="currentColor" strokeWidth={0} />
                ))}
                <span className="ml-1 text-[13px] font-semibold">5.0/5.0</span>
              </div>
              <p className="text-[10px] text-white/55">
                {AUTH_TESTIMONIAL.rating} · {AUTH_TESTIMONIAL.reviews}
              </p>
            </div>
          </div>
          <p className="max-w-[130px] text-[12px] leading-4 text-white/60 lg:ml-8">{AUTH_TESTIMONIAL.usedAt}</p>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            {AUTH_TESTIMONIAL.logos.map((l) => (
              <span
                key={l}
                className="flex h-10 min-w-[84px] items-center justify-center rounded-lg bg-[#161616] px-4 text-[13px] font-bold tracking-tight text-white/75"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 85 68" fill="none" className={className} aria-hidden>
      <g opacity="0.19">
        <path
          d="M85 0v19.2h-7c-3.2 0-5.8.4-7.8 1.3-2 .8-3.5 2-4.6 3.6-1 1.6-1.6 3.6-1.6 6v1.7H85v35.8H49.8V32.3c0-7.6 1.4-13.8 4.2-18.6 2.9-4.7 6.9-8.2 12.1-10.4C71.4 1.1 77.4 0 84.4 0H85ZM35.2 0v19.2h-7c-3.2 0-5.8.4-7.8 1.3-2 .8-3.5 2-4.6 3.6-1 1.6-1.6 3.6-1.6 6v1.7h21v35.8H0V32.3c0-7.6 1.4-13.8 4.2-18.6 2.9-4.7 6.9-8.2 12.1-10.4C21.6 1.1 27.6 0 34.6 0h.6Z"
          fill="#fff"
        />
      </g>
    </svg>
  );
}

export function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" fill="#34A853" />
      <path d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
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
