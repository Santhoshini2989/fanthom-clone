"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import type { Meeting } from "@/data/types";
import type { Playback } from "@/lib/playback";
import { RATES } from "@/lib/playback";
import { cn, formatClock, initials } from "@/lib/utils";
import { PlatformWordmark } from "@/components/meetings/platform-icon";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Recording player. Verified controls: volume, elapsed time, cyan progress
 * bar, platform wordmark, current speaker name under the frame, "1x" speed
 * pill (3.0). Play/pause, ±10s, fullscreen and keyboard shortcuts follow
 * standard player conventions (NOT VERIFIED beyond the above).
 *
 * The "video" is a simulated gallery view driven by the transcript: whoever
 * is speaking at the current time is lit up, so the player and transcript are
 * visibly the same timeline.
 */
export function MeetingPlayer({
  meeting,
  playback,
  highlightMarkers,
  className,
}: {
  meeting: Meeting;
  playback: Playback;
  highlightMarkers?: { at: number; end: number; color: string; label: string }[];
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [fs, setFs] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const current = useMemo(
    () => meeting.transcript.find((s) => playback.time >= s.start && playback.time < s.end) ?? null,
    [meeting.transcript, playback.time],
  );
  const activeSpeaker = current ? meeting.speakers.find((s) => s.id === current.speakerId) : null;
  const tiles = meeting.speakers.slice(0, 6);

  const pct = playback.duration ? (playback.time / playback.duration) * 100 : 0;

  const timeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
      const el = bar.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const x = "touches" in e ? (e.touches[0]?.clientX ?? r.left) : (e as MouseEvent).clientX;
      const ratio = Math.max(0, Math.min(1, (x - r.left) / r.width));
      return ratio * playback.duration;
    },
    [playback.duration],
  );

  useEffect(() => {
    if (!scrubbing) return;
    const move = (e: MouseEvent | TouchEvent) => playback.seek(timeFromEvent(e));
    const up = () => setScrubbing(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [scrubbing, playback, timeFromEvent]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFs = () => {
    if (!wrap.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.current.requestFullscreen?.();
  };

  const bump = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (playback.playing) hideTimer.current = window.setTimeout(() => setShowControls(false), 2200);
  };
  useEffect(() => {
    if (!playback.playing) setShowControls(true);
    else bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.playing]);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        playback.toggle();
        break;
      case "ArrowLeft":
      case "j":
        e.preventDefault();
        playback.seekBy(-10);
        break;
      case "ArrowRight":
      case "l":
        e.preventDefault();
        playback.seekBy(10);
        break;
      case "m":
        playback.toggleMute();
        break;
      case "f":
        toggleFs();
        break;
    }
  };

  const VolumeIcon = playback.muted || playback.volume === 0 ? VolumeX : playback.volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn("select-none", className)}>
      <div
        ref={wrap}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseMove={bump}
        onMouseLeave={() => playback.playing && setShowControls(false)}
        className={cn("group relative aspect-video w-full overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-fathom/60", fs && "flex flex-col justify-center")}
        aria-label="Recording"
      >
        {/* simulated gallery view */}
        <div
          className={cn(
            "grid h-full w-full gap-1 p-1",
            tiles.length <= 1 ? "grid-cols-1" : tiles.length <= 2 ? "grid-cols-2" : tiles.length <= 4 ? "grid-cols-2" : "grid-cols-3",
          )}
          onClick={playback.toggle}
        >
          {tiles.map((s) => {
            const active = activeSpeaker?.id === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden rounded-sm transition-[box-shadow,filter] duration-200",
                  active ? "shadow-[inset_0_0_0_2px_#22c55e] brightness-110" : "brightness-[0.7]",
                )}
                style={{ background: `radial-gradient(ellipse at 50% 35%, ${s.color}55, #101013 70%)` }}
              >
                <span
                  className={cn("flex items-center justify-center rounded-full font-semibold text-white/90 transition-transform duration-200", active && "scale-105")}
                  style={{ backgroundColor: s.color, width: "34%", aspectRatio: "1", fontSize: "clamp(12px, 3.5vw, 34px)" }}
                >
                  {initials(s.name)}
                </span>
                <span className="absolute bottom-1.5 left-2 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white/90">
                  {active && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />}
                  {s.name}
                </span>
                {active && playback.playing && (
                  <span className="absolute right-2 top-2 flex items-end gap-[2px]" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-[3px] rounded-sm bg-emerald-400" style={{ height: `${6 + ((Math.floor(playback.time * 6) + i * 2) % 4) * 3}px` }} />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* big play affordance when paused */}
        {!playback.playing && (
          <button
            type="button"
            onClick={playback.toggle}
            aria-label="Play"
            className="absolute inset-0 m-auto flex size-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
          >
            <Play className="ml-1 size-7" fill="currentColor" />
          </button>
        )}

        {/* in-frame control overlay (fullscreen) */}
        {fs && (
          <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 transition-opacity", showControls ? "opacity-100" : "opacity-0")}>
            <Controls />
          </div>
        )}
      </div>

      {!fs && <div className="mt-1.5"><Controls /></div>}
      <p className="mt-1 truncate text-[11px] font-medium text-white/70">{activeSpeaker ? `${activeSpeaker.name}${activeSpeaker.pronouns ? "" : ""}` : " "}</p>
    </div>
  );

  function Controls() {
    return (
      <div className="flex items-center gap-2">
        <Tooltip label={playback.playing ? "Pause (space)" : "Play (space)"}>
          <button type="button" onClick={playback.toggle} aria-label={playback.playing ? "Pause" : "Play"} className="flex size-7 items-center justify-center rounded text-white/85 hover:bg-white/10">
            {playback.playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4" fill="currentColor" />}
          </button>
        </Tooltip>
        <Tooltip label="Back 10s (←)" className="hidden sm:inline-flex">
          <button type="button" onClick={() => playback.seekBy(-10)} aria-label="Back 10 seconds" className="flex size-7 items-center justify-center rounded text-white/70 hover:bg-white/10">
            <RotateCcw className="size-3.5" />
          </button>
        </Tooltip>
        <Tooltip label="Forward 10s (→)" className="hidden sm:inline-flex">
          <button type="button" onClick={() => playback.seekBy(10)} aria-label="Forward 10 seconds" className="flex size-7 items-center justify-center rounded text-white/70 hover:bg-white/10">
            <RotateCw className="size-3.5" />
          </button>
        </Tooltip>

        <div className="group/vol flex items-center">
          <button type="button" onClick={playback.toggleMute} aria-label={playback.muted ? "Unmute" : "Mute"} className="flex size-7 items-center justify-center rounded text-white/85 hover:bg-white/10">
            <VolumeIcon className="size-4" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={playback.muted ? 0 : playback.volume}
            onChange={(e) => playback.setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-0 cursor-pointer accent-white opacity-0 transition-[width,opacity] duration-200 group-hover/vol:w-16 group-hover/vol:opacity-100 focus:w-16 focus:opacity-100"
          />
        </div>

        <span className="w-[46px] shrink-0 font-inter sm:w-[62px] text-[12px] tabular-nums text-white/85">
          {formatClock(playback.time)}
        </span>

        <div
          ref={bar}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={playback.duration}
          aria-valuenow={Math.round(playback.time)}
          tabIndex={0}
          onMouseDown={(e) => {
            setScrubbing(true);
            playback.seek(timeFromEvent(e));
          }}
          onTouchStart={(e) => {
            setScrubbing(true);
            playback.seek(timeFromEvent(e));
          }}
          onMouseMove={(e) => setHover(timeFromEvent(e))}
          onMouseLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") playback.seekBy(-5);
            if (e.key === "ArrowRight") playback.seekBy(5);
          }}
          className="relative h-5 min-w-[80px] flex-1 cursor-pointer"
        >
          <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-white/25">
            <div className="h-full rounded-full bg-fathom" style={{ width: `${pct}%` }} />
          </div>
          {highlightMarkers?.map((m, i) => (
            <span
              key={i}
              title={m.label}
              className="absolute top-1/2 h-[9px] -translate-y-1/2 rounded-sm opacity-90"
              style={{
                left: `${(m.at / playback.duration) * 100}%`,
                width: `${Math.max(0.4, ((m.end - m.at) / playback.duration) * 100)}%`,
                backgroundColor: m.color,
              }}
            />
          ))}
          <span
            className="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fathom shadow transition-transform group-hover:scale-110"
            style={{ left: `${pct}%` }}
          />
          {hover !== null && (
            <span
              className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 font-inter text-[11px] tabular-nums text-white"
              style={{ left: `${(hover / playback.duration) * 100}%` }}
            >
              {formatClock(hover)}
            </span>
          )}
        </div>

        <Dropdown>
          <DropdownTrigger>
            <span aria-label="Playback speed" className="flex h-7 min-w-8 items-center justify-center rounded-full bg-white/10 px-2 font-inter text-[12px] font-semibold text-white/90 hover:bg-white/15">
              {playback.rate}x
            </span>
          </DropdownTrigger>
          <DropdownContent align="end" side="top" width={110}>
            {RATES.map((r) => (
              <DropdownItem key={r} selected={r === playback.rate} onSelect={() => playback.setRate(r)} className="py-1.5 text-[14px]">
                {r}x
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>

        <Tooltip label={fs ? "Exit fullscreen (f)" : "Fullscreen (f)"}>
          <button type="button" onClick={toggleFs} aria-label="Fullscreen" className="flex size-7 items-center justify-center rounded text-white/70 hover:bg-white/10">
            {fs ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </Tooltip>

        <PlatformWordmark platform={meeting.platform} className="ml-1 hidden sm:inline" />
      </div>
    );
  }
}
