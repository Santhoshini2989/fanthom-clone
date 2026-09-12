import { cn } from "@/lib/utils";

type Kind = "new" | "beta" | "recommended" | "most-common" | "internal" | "count" | "muted" | "warn";

const kinds: Record<Kind, string> = {
  new: "bg-[#a98d4d] text-black",
  beta: "bg-fathom/15 text-fathom",
  recommended: "bg-white/10 text-white/70",
  "most-common": "bg-emerald-500/20 text-emerald-400",
  internal: "bg-fathom-warn/15 text-fathom-warn",
  count: "bg-white/15 text-white",
  muted: "bg-white/8 text-white/60",
  warn: "bg-fathom-warn/15 text-fathom-warn",
};

export function Badge({
  kind = "muted",
  children,
  className,
}: {
  kind?: Kind;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-3 tracking-wide",
        kind === "count" && "rounded-full px-1.5 text-[11px] normal-case tracking-normal",
        kinds[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}
