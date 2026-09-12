import { Check, Sparkles } from "lucide-react";
import { FathomMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Product vignettes used on the marketing hero (the real site shows a
 * desktop-app "Project check-in" summary card, an "Ask Fathom" bubble and an
 * "Audio & video" capture picker floating around an astronaut). Recreated as
 * lightweight UI rather than copying the site's imagery.
 */
export function HeroVignettes({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className="absolute left-[8%] top-0 w-[46%] rounded-2xl border border-white/15 bg-[#151517]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/50">Capture</p>
        <div className="space-y-1.5">
          {[
            ["Audio & video", "Bot", true],
            ["Transcript only", "Bot-free", false],
            ["Audio only", "Bot-free", false],
          ].map(([l, s, on]) => (
            <div key={l as string} className={cn("flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px]", on ? "bg-fathom/15 text-fathom" : "bg-white/5 text-white/70")}>
              <span>{l as string}</span>
              <span className="text-[9px] uppercase tracking-wide opacity-70">{s as string}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-[6%] w-[56%] rounded-2xl border border-white/15 bg-[#151517]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          <FathomMark className="size-4" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">Ask Fathom</p>
        </div>
        <p className="mt-2 rounded-xl bg-[#2a3b45] px-2.5 py-1.5 text-[11px] text-off-white">Fathom, what follow-ups did I commit to this week?</p>
        <p className="mt-2 text-[11px] leading-4 text-white/75">
          You committed to two: send the revised proposal to Northwind by Friday, and share the dashboard beta invite with Halcyon.
        </p>
        <div className="mt-2 flex gap-1.5">
          <span className="rounded bg-fathom/15 px-1.5 py-0.5 text-[9px] text-fathom">12:41</span>
          <span className="rounded bg-fathom/15 px-1.5 py-0.5 text-[9px] text-fathom">27:03</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-[18%] w-[62%] rounded-2xl border border-white/15 bg-[#151517]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-off-white">Project check-in</p>
          <span className="flex -space-x-1">
            {["#6d3df5", "#0ea5e9", "#f59e0b", "#ec4899"].map((c) => (
              <span key={c} className="size-4 rounded-full border border-[#151517]" style={{ backgroundColor: c }} />
            ))}
          </span>
        </div>
        <div className="mt-2 flex gap-4 border-b border-white/10 text-[10px] font-medium">
          <span className="border-b-2 border-fathom pb-1 text-fathom">✦ Summary</span>
          <span className="pb-1 text-white/50">✎ Scratchpad</span>
        </div>
        <ul className="mt-2 space-y-1 text-[10px] leading-4 text-white/75">
          <li className="flex gap-1.5"><Check className="mt-0.5 size-2.5 shrink-0 text-emerald-400" /> Launch stays on July 14; QA starts June 30.</li>
          <li className="flex gap-1.5"><Check className="mt-0.5 size-2.5 shrink-0 text-emerald-400" /> Priya delivers the empty-state design Monday.</li>
          <li className="flex gap-1.5"><Sparkles className="mt-0.5 size-2.5 shrink-0 text-fathom" /> Live summary updating as the meeting goes.</li>
        </ul>
      </div>

      {/* astronaut-ish orb */}
      <div className="absolute left-[2%] top-[42%] size-[22%] rounded-full bg-[radial-gradient(circle_at_35%_35%,#8be3ff,#0b6f9b_45%,#062836_75%)] shadow-[0_0_60px_rgba(0,190,255,0.35)]" />
      <div className="absolute bottom-[4%] right-[4%] size-[16%] rounded-full bg-[radial-gradient(circle_at_40%_40%,#3fa2ff,#1c3f8a_50%,#0b1a3b_80%)] shadow-[0_0_50px_rgba(63,162,255,0.35)]" />
    </div>
  );
}

/** Small logo tile row ("Used at 300K+ companies"). Names only, no third-party marks. */
export function LogoStrip({ names, className }: { names: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {names.map((n) => (
        <span key={n} className="flex h-11 min-w-[110px] items-center justify-center rounded-lg bg-[#161616] px-5 text-[14px] font-bold tracking-tight text-white/70">
          {n}
        </span>
      ))}
    </div>
  );
}
