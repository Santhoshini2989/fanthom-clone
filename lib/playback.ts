"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Playback clock shared by the player, transcript, summary, highlights and
 * timeline. When the meeting has a real recording (`src` given) the clock is
 * driven by an HTMLAudioElement streaming from /api/recordings/:id. Without a
 * recording (seeded demo meetings) it falls back to a simulated
 * requestAnimationFrame clock so the UI still behaves as a whole.
 */
export interface Playback {
  time: number;
  duration: number;
  playing: boolean;
  rate: number;
  volume: number;
  muted: boolean;
  real: boolean;
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

export function usePlayback(duration: number, initialTime = 0, src?: string | null): Playback {
  const [time, setTime] = useState(Math.min(initialTime, duration));
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const timeRef = useRef(time);
  const rateRef = useRef(rate);
  const audio = useRef<HTMLAudioElement | null>(null);
  const real = !!src;
  const total = real && mediaDuration && Number.isFinite(mediaDuration) ? mediaDuration : duration;

  useEffect(() => {
    timeRef.current = time;
    rateRef.current = rate;
  });

  // Real media element -----------------------------------------------------
  useEffect(() => {
    if (!src) {
      audio.current = null;
      return;
    }
    const el = new Audio();
    el.preload = "metadata";
    el.src = src;
    el.currentTime = Math.min(initialTime, duration);
    audio.current = el;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setMediaDuration(el.duration);
    const onEnd = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("pause", onPause);
    el.addEventListener("play", onPlay);
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("play", onPlay);
      el.src = "";
      audio.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    el.playbackRate = rate;
    el.volume = volume;
    el.muted = muted;
  }, [rate, volume, muted, src]);

  // Simulated clock (no recording) -----------------------------------------
  useEffect(() => {
    if (real) return;
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
  }, [playing, duration, real]);

  const play = useCallback(() => {
    if (audio.current) {
      if (audio.current.ended || timeRef.current >= total) audio.current.currentTime = 0;
      void audio.current.play().catch(() => setPlaying(false));
      return;
    }
    if (timeRef.current >= duration) setTime(0);
    setPlaying(true);
  }, [duration, total]);
  const pause = useCallback(() => {
    if (audio.current) audio.current.pause();
    setPlaying(false);
  }, []);
  const toggle = useCallback(() => {
    if (audio.current) {
      if (audio.current.paused) play();
      else pause();
      return;
    }
    setPlaying((p) => (timeRef.current >= duration ? (setTime(0), true) : !p));
  }, [duration, play, pause]);
  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(total, t));
      if (audio.current) audio.current.currentTime = clamped;
      setTime(clamped);
    },
    [total],
  );
  const seekBy = useCallback((d: number) => seek(timeRef.current + d), [seek]);
  const setRate = useCallback((r: number) => setRateState(r), []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    if (v > 0) setMuted(false);
  }, []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  return useMemo(
    () => ({ time, duration: total, playing, rate, volume, muted, real, play, pause, toggle, seek, seekBy, setRate, setVolume, toggleMute }),
    [time, total, playing, rate, volume, muted, real, play, pause, toggle, seek, seekBy, setRate, setVolume, toggleMute],
  );
}
