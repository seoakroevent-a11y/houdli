"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Lecteur de l'appel. Les fichiers WebM de MediaRecorder n'indiquent pas leur durée :
 * on la prend de la base, puis on la corrige si le navigateur finit par la connaître.
 */
export function ConversationAudio({ src, fallbackDuration }: { src: string; fallbackDuration: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(fallbackDuration);

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const sync = () => {
      setTime(element.currentTime);
      if (Number.isFinite(element.duration) && element.duration > 0) setDuration(element.duration);
    };
    const stop = () => setPlaying(false);
    const start = () => setPlaying(true);
    const events = [
      ["timeupdate", sync],
      ["durationchange", sync],
      ["ended", stop],
      ["pause", stop],
      ["play", start],
    ] as const;
    events.forEach(([name, handler]) => element.addEventListener(name, handler));
    return () => events.forEach(([name, handler]) => element.removeEventListener(name, handler));
  }, []);

  const progress = duration ? Math.min(1, time / duration) : 0;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
      <audio ref={audio} src={src} preload="metadata" />
      <button
        type="button"
        onClick={() => {
          const element = audio.current;
          if (!element) return;
          if (element.paused) void element.play();
          else element.pause();
        }}
        aria-label={playing ? "Mettre en pause" : "Écouter l'appel"}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2d66d2] text-white transition hover:bg-[#4A82EA]"
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="translate-x-px" />}
      </button>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        onChange={(event) => {
          const element = audio.current;
          if (!element || !duration) return;
          element.currentTime = (Number(event.target.value) / 1000) * duration;
          setTime(element.currentTime);
        }}
        aria-label="Position dans l'appel"
        className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#4A82EA]"
        style={{ background: `linear-gradient(to right, #4A82EA ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)` }}
      />
      <span className="shrink-0 text-xs tabular-nums text-white/55">
        {clock(time)} / {clock(duration)}
      </span>
    </div>
  );
}
