import { useState, useRef } from "react";

export default function AuthMediaStack() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="w-full max-w-5xl md:max-w-6xl mx-auto md:mx-0">
      <div className="relative w-full aspect-[8/5] md:aspect-[16/9] min-h-[320px] md:min-h-[480px] rounded-xl overflow-hidden">
        <VideoLayer
          videoRef={videoRef}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onPlayingChange={setIsPlaying}
        />
      </div>
    </div>
  );
}

function VideoLayer({ videoRef, isPlaying, onPlayPause, onPlayingChange }) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const updateProgress = () => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration;
    const cur = v.currentTime;
    if (Number.isFinite(dur) && dur > 0) {
      setDuration(dur);
      setCurrentTime(cur);
      setProgress((cur / dur) * 100);
    }
  };

  const handleTimeUpdate = () => updateProgress();
  const handleLoadedMetadata = () => updateProgress();
  const handleSeeked = () => updateProgress();

  const handleSeek = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
    setCurrentTime(v.currentTime);
  };

  const formatTime = (s) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 bg-slate-900 rounded-xl group flex flex-col">
      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          src="/howToPlay.mp4"
          className="w-full h-full object-cover rounded-t-xl"
          playsInline
          loop
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
        />
        <div className="absolute inset-0 bg-slate/20 rounded-t-xl pointer-events-none" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          className="absolute inset-0 flex items-center justify-center rounded-t-xl focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span
            className={`flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/50 text-white transition-opacity ${
              isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
          >
            {isPlaying ? (
              <PauseIcon className="w-7 h-7 md:w-8 md:h-8 ml-0.5" />
            ) : (
              <PlayIcon className="w-7 h-7 md:w-8 md:h-8 ml-1" />
            )}
          </span>
        </button>
      </div>
      <div
        className="flex items-center gap-2 px-2 py-2 bg-black/40 rounded-b-xl"
        onClick={handleSeek}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        tabIndex={0}
        onKeyDown={(e) => {
          const v = videoRef.current;
          if (!v || !Number.isFinite(v.duration)) return;
          const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -5 : 0;
          if (step) {
            e.preventDefault();
            v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + step));
          }
        }}
      >
        <span className="text-xs text-white/90 tabular-nums min-w-[2.5rem]">{formatTime(currentTime)}</span>
        <div className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-white/90 tabular-nums min-w-[2.5rem]">{formatTime(duration)}</span>
      </div>
    </div>
  );
}

function PlayIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}
function PauseIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
