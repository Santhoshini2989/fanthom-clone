import { cn, initials } from "@/lib/utils";
import type { User } from "@/data/types";

const sizes = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-lg",
};

export function Avatar({
  user,
  name,
  color,
  size = "md",
  className,
  ring,
}: {
  user?: Pick<User, "name" | "avatarColor" | "avatarUrl">;
  name?: string;
  color?: string;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
}) {
  const label = user?.name ?? name ?? "?";
  const bg = user?.avatarColor ?? color ?? "#525252";
  return (
    <span
      title={label}
      aria-label={label}
      style={{ backgroundColor: bg }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold uppercase text-white",
        sizes[size],
        ring && "ring-2 ring-app-bg",
        className,
      )}
    >
      {initials(label)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 4,
  size = "sm",
  className,
}: {
  users: Pick<User, "name" | "avatarColor">[];
  max?: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <span className={cn("inline-flex items-center -space-x-1.5", className)}>
      {shown.map((u, i) => (
        <Avatar key={u.name + i} user={u} size={size} ring />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-white/15 font-medium text-white ring-2 ring-app-bg",
            sizes[size],
          )}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
