import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * fathom.ai `.button.grad`: cyan pill (3.5rem radius, 1rem 2rem padding),
 * uppercase label set in TT Rounds Neue Cond 500, with the gradient sweep
 * layer that slides across on hover.
 */
export function MkButton({
  children,
  href,
  variant = "cyan",
  className,
  onClick,
  type,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "cyan" | "yellow" | "pink" | "purple" | "outline";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = cn(
    "mk-btn",
    variant === "yellow" && "mk-btn--yellow",
    variant === "pink" && "mk-btn--pink",
    variant === "purple" && "mk-btn--purple",
    variant === "outline" && "mk-btn--outline",
    className,
  );
  const inner = (
    <>
      <span className="mk-btn__text">{children}</span>
      <span className="mk-btn__grad" aria-hidden />
    </>
  );
  if (href) {
    const external = href.startsWith("http");
    return external ? (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type ?? "button"} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/** Kept for existing imports: same pill without the sweep. */
export function CtaPill({ children, small, className }: { children: React.ReactNode; small?: boolean; className?: string }) {
  return (
    <span className={cn("mk-btn", small && "px-6 py-3", className)}>
      <span className="mk-btn__text">{children}</span>
      <span className="mk-btn__grad" aria-hidden />
    </span>
  );
}
