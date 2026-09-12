import { cn, initials } from "@/lib/utils";
import type { Meeting } from "@/data/types";
import { userById } from "@/data/users";

/**
 * Generated 16:9 recording thumbnail: a "gallery view" of attendee tiles (or a
 * shared-screen frame) rendered from the meeting's data, so no proprietary or
 * placeholder imagery is needed. Layout varies by seed so the grid looks alive.
 */
export function Thumbnail({ meeting, className }: { meeting: Meeting; className?: string }) {
  const seed = meeting.thumbnailSeed;
  const attendees = meeting.attendeeIds.map(userById);
  const variant = seed % 3; // 0 gallery, 1 speaker + strip, 2 screen share
  const tiles = variant === 0 ? attendees.slice(0, seed % 2 ? 4 : 6) : attendees.slice(0, 1);

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-md bg-[#0d0d0f]",
        className,
      )}
      aria-hidden
    >
      {variant === 0 && (
        <div className={cn("grid h-full gap-[3px] p-[3px]", tiles.length > 4 ? "grid-cols-3" : "grid-cols-2")}>
          {tiles.map((u, i) => (
            <Tile key={u.id} color={u.avatarColor} name={u.name} muted={(seed + i) % 4 === 0} />
          ))}
        </div>
      )}
      {variant === 1 && (
        <div className="relative h-full">
          <Tile color={attendees[0]?.avatarColor ?? "#333"} name={attendees[0]?.name ?? ""} big />
          <div className="absolute right-[3px] top-[3px] flex flex-col gap-[3px]">
            {attendees.slice(1, 4).map((u) => (
              <div key={u.id} className="w-[26%] min-w-[44px]">
                <Tile color={u.avatarColor} name={u.name} small />
              </div>
            ))}
          </div>
        </div>
      )}
      {variant === 2 && (
        <div className="relative h-full p-[3px]">
          <div className="flex h-full flex-col overflow-hidden rounded-[3px] bg-[#f3f4f6]">
            <div className="flex h-[10%] items-center gap-1 bg-white px-1.5">
              <span className="size-[5px] rounded-full bg-[#ff5f57]" />
              <span className="size-[5px] rounded-full bg-[#febc2e]" />
              <span className="size-[5px] rounded-full bg-[#28c840]" />
              <span className="ml-1 h-[4px] w-1/3 rounded bg-[#e5e7eb]" />
            </div>
            <div className="flex flex-1 gap-1.5 p-1.5">
              <div className="w-[22%] space-y-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[6px] rounded bg-[#d1d5db]" style={{ width: `${60 + ((seed * (i + 3)) % 40)}%` }} />
                ))}
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-[8px] w-2/3 rounded bg-[#9ca3af]" />
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-[22px] rounded bg-white shadow-sm">
                      <div className="mx-1 mt-1.5 h-[4px] w-1/2 rounded bg-[#d1d5db]" />
                      <div className="mx-1 mt-1 h-[7px] w-2/3 rounded bg-fathom/50" />
                    </div>
                  ))}
                </div>
                <div className="mt-1 h-[28px] rounded bg-white shadow-sm">
                  <svg viewBox="0 0 100 24" className="h-full w-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#00beff"
                      strokeWidth="1.5"
                      points={Array.from({ length: 12 })
                        .map((_, i) => `${i * 9},${18 - ((seed * (i + 1) * 7) % 14)}`)
                        .join(" ")}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-[6px] right-[6px] w-[28%] min-w-[48px]">
            <Tile color={attendees[0]?.avatarColor ?? "#333"} name={attendees[0]?.name ?? ""} small />
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ color, name, big, small, muted }: { color: string; name: string; big?: boolean; small?: boolean; muted?: boolean }) {
  return (
    <div
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden rounded-[3px]", small && "aspect-video")}
      style={{ background: `linear-gradient(160deg, ${color}55, #151517 70%)` }}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white/90",
          big ? "size-[38%] text-[clamp(10px,3vw,28px)]" : small ? "size-[46%] text-[9px]" : "size-[42%] text-[clamp(8px,1.6vw,16px)]",
        )}
        style={{ backgroundColor: color }}
      >
        {initials(name)}
      </span>
      {!small && (
        <span className="absolute bottom-[4px] left-[5px] max-w-[85%] truncate rounded-sm bg-black/50 px-1 text-[7px] leading-[11px] text-white/85">
          {name}
        </span>
      )}
      {muted && <span className="absolute right-[4px] top-[4px] size-[7px] rounded-full bg-red-500/80" />}
    </div>
  );
}
