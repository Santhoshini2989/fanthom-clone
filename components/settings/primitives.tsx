import { cn } from "@/lib/utils";

/** Uppercase gray section heading ("RECORDING", "VIDEO CONFERENCING", "INTEGRATIONS"). */
export function SettingSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mb-10", className)}>
      <h2 className="mb-3 text-[19px] font-bold uppercase tracking-wide text-white/40">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/**
 * Settings card (verified): #26252a surface, 12px radius, leading icon column,
 * bold title + gray description, control on the right, optional nested rows.
 */
export function SettingCard({
  icon,
  title,
  description,
  control,
  children,
  badge,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  control?: React.ReactNode;
  children?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-app-card px-5 py-5 sm:px-6", className)}>
      <div className="flex items-start gap-5">
        {icon && <span className="mt-1 flex w-8 shrink-0 items-center justify-center text-white/85 [&_svg]:size-7">{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[19px] font-bold leading-6 text-off-white">{title}</h3>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-[15px] leading-6 text-white/55">{description}</p>}
        </div>
        {control && <div className="shrink-0 self-center">{control}</div>}
      </div>
      {children && <div className={cn("mt-4", icon && "sm:pl-[52px]")}>{children}</div>}
    </div>
  );
}

/** Row inside a card: label left, control right, divider between rows. */
export function SettingRow({ label, control, description }: { label: React.ReactNode; control: React.ReactNode; description?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[16px] font-semibold text-off-white">{label}</p>
        {description && <p className="text-[13px] text-white/50">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export function IntegrationStatus({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="flex items-center gap-1.5 text-[17px] font-medium text-white/80">Connected <span className="text-emerald-400">✓</span></span>
  ) : (
    <span className="text-[17px] font-medium text-fathom">Connect</span>
  );
}
