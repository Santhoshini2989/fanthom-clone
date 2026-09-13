/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/**
 * Fathom's own wordmark, served from /public/fathom (downloaded from the
 * public marketing CDN and the app's sign-in page). The mark alone is the
 * right-hand group of the wordmark SVG (viewBox cropped to it).
 */
export function FathomMark({ className }: { className?: string }) {
  return (
    <svg viewBox="857 0 143 143" fill="none" className={cn("size-6", className)} aria-hidden>
      <path fill="#007299" d="M857.29,95.62v29.43c0,7.72,4.89,14.71,12.24,17.03,12.49,3.93,23.96-5.29,23.96-17.19v-11.08l-36.2-18.19Z" />
      <path fill="#00beff" d="M981.98,89.53c-2.72,0-5.48-.61-8.08-1.91l-106.23-53.09c-8.8-4.4-12.89-14.99-8.79-23.93,4.28-9.36,15.42-13.24,24.55-8.68l106.21,53.08c8.91,4.45,12.99,15.6,8.53,24.51-3.17,6.35-9.56,10.02-16.21,10.02Z" />
      <path fill="#00beff" d="M928.66,116.35c-2.72,0-5.48-.61-8.08-1.91l-52.91-26.44c-8.8-4.4-12.89-14.99-8.79-23.93,4.28-9.36,15.42-13.24,24.56-8.68l52.89,26.43c8.91,4.45,12.99,15.6,8.53,24.51-3.17,6.35-9.56,10.02-16.21,10.02Z" />
    </svg>
  );
}

/** App wordmark (sign-in page inline SVG): "FATHOM" letterforms + mark, 1000×143. */
export function FathomWordmark({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <img
      src="/fathom/app-wordmark.svg"
      alt="Fathom"
      className={cn("h-[18px] w-auto", className, textClassName)}
      draggable={false}
    />
  );
}

/** Marketing wordmark (fathom.ai nav), 166×25. */
export function FathomMarketingLogo({ className }: { className?: string }) {
  return <img src="/fathom/logo-wordmark.svg" alt="Fathom" className={cn("h-[14px] w-auto", className)} draggable={false} />;
}

/** Animated loading spinner made from the mark (infinite scroll on My Calls). */
export function FathomSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-7", className)} aria-label="Loading">
      <FathomMark className="size-7 animate-pulse-slow opacity-40" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="size-2 rounded-full bg-brand-purple animate-pulse-slow" />
      </span>
    </div>
  );
}
