import type { Platform } from "@/data/types";
import { cn } from "@/lib/utils";

export const PLATFORM_LABEL: Record<Platform, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  slack_huddle: "Slack Huddle",
  in_person: "In person",
};

/** Simple original glyphs standing in for the conferencing platform marks. */
export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const c = cn("size-4", className);
  switch (platform) {
    case "zoom":
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="Zoom">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="#2D8CFF" />
          <path d="M6 9.2c0-.7.5-1.2 1.2-1.2h6.1c.7 0 1.2.5 1.2 1.2v5.6c0 .7-.5 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2V9.2Zm9.5 1.6 2.6-1.9c.4-.3.9 0 .9.4v5.4c0 .5-.5.7-.9.4l-2.6-1.9v-2.4Z" fill="#fff" />
        </svg>
      );
    case "google_meet":
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="Google Meet">
          <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6H14v12H5.5A1.5 1.5 0 0 1 4 16.5v-9Z" fill="#00832D" />
          <path d="M14 6h1.5A1.5 1.5 0 0 1 17 7.5V12l-3 2V6Z" fill="#0066DA" />
          <path d="M14 12v6h1.5a1.5 1.5 0 0 0 1.5-1.5V12l-3 0Z" fill="#E94235" />
          <path d="M17 10.2 21 7.4v9.2l-4-2.8v-3.6Z" fill="#FFBA00" />
          <path d="M4 12h5v6H5.5A1.5 1.5 0 0 1 4 16.5V12Z" fill="#2684FC" />
        </svg>
      );
    case "microsoft_teams":
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="Microsoft Teams">
          <rect x="3" y="7" width="12" height="11" rx="2" fill="#5059C9" />
          <circle cx="17.5" cy="7.5" r="2.5" fill="#7B83EB" />
          <path d="M15.5 11h4.3c.7 0 1.2.5 1.2 1.2v3.3a3.5 3.5 0 0 1-5.5 2.9V11Z" fill="#7B83EB" />
          <path d="M6.5 10h5v1.6H9.8V16H8.2v-4.4H6.5V10Z" fill="#fff" />
        </svg>
      );
    case "slack_huddle":
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="Slack Huddle">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="#4A154B" />
          <path d="M9 7.5a1.5 1.5 0 1 1 3 0V11H9V7.5ZM7.5 12a1.5 1.5 0 1 1 0 3H4v-1.5A1.5 1.5 0 0 1 5.5 12h2Zm4.5 4.5a1.5 1.5 0 1 1-3 0V13h3v3.5Zm4.5-4.5a1.5 1.5 0 1 1 0-3H20v1.5a1.5 1.5 0 0 1-1.5 1.5h-2Z" fill="#fff" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={c} aria-label="In person">
          <circle cx="12" cy="8" r="4" fill="#9ca3af" />
          <path d="M4 20a8 8 0 0 1 16 0H4Z" fill="#9ca3af" />
        </svg>
      );
  }
}

/** Wordmark shown on the player (e.g. "zoom" in the bottom right of the recording). */
export function PlatformWordmark({ platform, className }: { platform: Platform; className?: string }) {
  const label = platform === "zoom" ? "zoom" : platform === "google_meet" ? "Google Meet" : platform === "microsoft_teams" ? "Teams" : PLATFORM_LABEL[platform];
  return (
    <span className={cn("font-inter text-[15px] font-bold lowercase tracking-tight text-white/60", platform !== "zoom" && "normal-case text-[12px] font-semibold", className)}>
      {label}
    </span>
  );
}
