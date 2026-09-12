import { cn } from "@/lib/utils";

/** Cyan pill CTA (verified: 56px radius, 16×32 padding, uppercase 17.4px, black text). */
export function CtaPill({ children, small, className }: { children: React.ReactNode; small?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[56px] bg-fathom font-normal uppercase text-black transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.99]",
        small ? "px-6 py-3 text-[14px] tracking-[0.01em]" : "px-8 py-4 text-[17.4px] tracking-[0.01em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
