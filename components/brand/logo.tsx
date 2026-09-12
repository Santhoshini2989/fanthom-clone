import { cn } from "@/lib/utils";

/**
 * Fathom mark: two cyan diagonal bars with a darker teal tail. Redrawn as an
 * original SVG approximating the public wordmark geometry.
 */
export function FathomMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" fill="none" className={cn("size-6", className)} aria-hidden>
      <path d="M2.5 17.6v5c0 1.3.8 2.5 2 2.9 2.1.7 4-.9 4-2.9v-1.9l-6-3.1Z" fill="#007299" />
      <path
        d="M23.3 15.6c-.5 0-.9-.1-1.4-.3L4.2 6.4C2.7 5.7 2 3.9 2.7 2.4 3.4.8 5.3.1 6.8.9l17.7 9c1.5.8 2.2 2.6 1.4 4.2-.5 1-1.6 1.5-2.6 1.5Z"
        fill="#00BEFF"
      />
      <path
        d="M14.4 20.1c-.5 0-.9-.1-1.4-.3L4.2 15.4c-1.5-.7-2.2-2.5-1.5-4 .7-1.6 2.6-2.2 4.1-1.5l8.8 4.5c1.5.7 2.2 2.5 1.5 4-.5 1.1-1.6 1.7-2.7 1.7Z"
        fill="#00BEFF"
      />
    </svg>
  );
}

/** "FATHOM" wordmark + mark, as used in the app top bar and auth pages. */
export function FathomWordmark({
  className,
  textClassName,
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-sans text-[19px] font-semibold uppercase leading-none tracking-[0.18em] text-off-white",
          textClassName,
        )}
      >
        Fathom
      </span>
      <FathomMark className="size-[22px]" />
    </span>
  );
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
