import React, { useEffect, useRef, useState } from "react";
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function AudioMessagePlayer({
  src,
  duration: initialDuration = 0,
  fileName = "",
  mine = false,
  compact = false,
}) {
  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(Number(initialDuration || 0));
  const [current, setCurrent] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (!Number.isNaN(audio.duration)) setDuration(audio.duration || 0);
    };

    const onTime = () => setCurrent(audio.currentTime || 0);
    const onEnded = () => {
      setPlaying(false);
      setCurrent(audio.duration || 0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error("Audio play failed:", err);
    }
  }

  function onSeek(e) {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Number(e.target.value || 0);
    audio.currentTime = t;
    setCurrent(t);
  }

  function cycleRate() {
    setRate((prev) => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={[
        "w-full rounded-2xl border px-3 py-3",
        mine
          ? "bg-white/12 border-white/15"
          : "bg-base-100/60 backdrop-blur border-white/10",
        compact ? "max-w-[280px]" : "",
      ].join(" ")}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className={[
            "shrink-0 grid place-items-center rounded-full",
            "w-10 h-10 border shadow-sm transition",
            mine
              ? "bg-white text-black border-white/20 hover:bg-white/90"
              : "bg-base-100/80 border-white/10 hover:bg-base-100",
          ].join(" ")}
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <FiPause className="text-lg" /> : <FiPlay className="text-lg ml-0.5" />}
        </button>

        {/* Center */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold opacity-80 truncate">
              {fileName || "Voice message"}
            </div>

            <button
              type="button"
              onClick={cycleRate}
              className={[
                "text-[11px] font-semibold rounded-full px-2 py-1 border shrink-0",
                mine
                  ? "border-white/15 bg-white/10"
                  : "border-white/10 bg-base-100/60",
              ].join(" ")}
              title="Playback speed"
            >
              {rate}x
            </button>
          </div>

          {/* Progress */}
          <div className="mt-2">
            <div className="relative">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(current, duration || 0)}
                onChange={onSeek}
                className="range range-xs w-full"
              />
              <div
                className={[
                  "pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full",
                  mine ? "bg-white/80" : "bg-primary/70",
                ].join(" ")}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-1 flex items-center justify-between text-[11px] opacity-65">
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>

        {/* Mute */}
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className={[
            "shrink-0 grid place-items-center rounded-full",
            "w-9 h-9 border transition",
            mine
              ? "border-white/15 bg-white/10"
              : "border-white/10 bg-base-100/60",
          ].join(" ")}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted ? <FiVolumeX className="text-base" /> : <FiVolume2 className="text-base" />}
        </button>
      </div>
    </div>
  );
}