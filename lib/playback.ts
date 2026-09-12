"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Simulated playback clock. The clone has no real media file, so the "player"
 * advances a time cursor with requestAnimationFrame at the chosen rate. Every
 * consumer (transcript, summary, highlights, timeline) reads from this one
 * clock so the page behaves as an integrated system.
 */
export interface Playback {
  time: number;
  duration: number;
  playing: boolean;
  rate: number;
  volume: number;
  muted: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (t: number) => void;
  seekBy: (delta: number) => void;
  setRate: (r: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function usePlayback(duration: number, initialTime = 0): Playback {
  const [time, setTime] = useState(Math.min(initialTime, duration));
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const timeRef = useRef(time);
  const rateRef = useRef(rate);
  useEffect(() => {
    timeRef.current = time;
    rateRef.current = rate;
  });

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
      return;
    }
    last.current = performance.now();
    const step = (now: number) => {
      const dt = (now - last.current) / 1000;
      last.current = now;
      const next = timeRef.current + dt * rateRef.current;
      if (next >= duration) {
        setTime(duration);
        setPlaying(false);
        return;
      }
      setTime(next);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, duration]);

  const play = useCallback(() => {
    if (timeRef.current >= duration) setTime(0);
    setPlaying(true);
  }, [duration]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => (timeRef.current >= duration ? (setTime(0), true) : !p)), [duration]);
  const seek = useCallback((t: number) => setTime(Math.max(0, Math.min(duration, t))), [duration]);
  const seekBy = useCallback((d: number) => setTime((t) => Math.max(0, Math.min(duration, t + d))), [duration]);
  const setRate = useCallback((r: number) => setRateState(r), []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    if (v > 0) setMuted(false);
  }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return useMemo(
    () => ({ time, duration, playing, rate, volume, muted, play, pause, toggle, seek, seekBy, setRate, setVolume, toggleMute }),
    [time, duration, playing, rate, volume, muted, play, pause, toggle, seek, seekBy, setRate, setVolume, toggleMute],
  );
}
