import { useState, useRef, useEffect } from "react";

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
      {/* CRT monitor shell */}
      <div
        className="relative p-4 md:p-6 bg-cyber-panel border-4 border-neon-cyan"
        style={{ boxShadow: '8px 8px 0px #000, 0 0 30px rgba(0,240,255,0.15)' }}
      >
        {/* Pixel antennas */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-10">
          <div className="w-1 h-8 bg-neon-cyan/40 -rotate-12 origin-bottom" />
          <div className="w-1 h-8 bg-neon-cyan/40 rotate-12 origin-bottom" />
        </div>

        {/* Corner brackets */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-neon-cyan" />
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-neon-cyan" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-neon-cyan" />
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-neon-cyan" />

        {/* Screen */}
        <div
          className="relative w-full aspect-[8/5] md:aspect-[16/9] min-h-[240px] md:min-h-[380px] overflow-hidden bg-black border-2 border-neon-cyan/40"
          style={{ boxShadow: 'inset 0 0 20px rgba(0,240,255,0.06)' }}
        >
          <VideoLayer
            videoRef={videoRef}
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onPlayingChange={setIsPlaying}
          />
        </div>

        {/* Monitor label */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-px flex-1 bg-neon-cyan/20" />
          <p className="font-pixel text-[7px] text-neon-cyan/50 tracking-widest">COUP-TV · HOW TO PLAY</p>
          <div className="h-px flex-1 bg-neon-cyan/20" />
        </div>
      </div>
    </div>
  );
}

function VideoLayer({ videoRef, isPlaying, onPlayPause, onPlayingChange }) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="absolute inset-0 bg-cyber-bg flex flex-col group">
      {/* Scanlines on video */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)' }}
      />

      <div className="relative flex-1 min-h-0">
        <video
          ref={videoRef}
          src="/howToPlay.mp4"
          className="w-full h-full object-cover"
          playsInline
          loop
          onPlay={() => onPlayingChange(true)}
          onPause={() => onPlayingChange(false)}
          onTimeUpdate={updateProgress}
          onLoadedMetadata={updateProgress}
          onSeeked={updateProgress}
        />

        {/* REC indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none z-20">
          <div className="w-2.5 h-2.5 bg-neon-red animate-pulse" style={{ boxShadow: '0 0 6px var(--neon-red)' }} />
          <span className="font-pixel text-[8px] text-neon-red glow-red">REC</span>
        </div>

        {/* Timestamp */}
        <div className="absolute top-3 right-3 font-mono text-[10px] text-neon-green/80 bg-black/70 px-2 py-0.5 pointer-events-none z-20"
          style={{ border: '1px solid rgba(0,255,65,0.3)' }}>
          {timestamp.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}{' '}
          {timestamp.toLocaleTimeString('en-US', { hour12: false })}
        </div>

        {/* Camera label */}
        <div className="absolute bottom-3 left-3 font-mono text-[9px] text-neon-cyan/70 bg-black/70 px-2 py-0.5 pointer-events-none z-20"
          style={{ border: '1px solid rgba(0,240,255,0.3)' }}>
          CAM-01 · COUP HQ
        </div>

        {/* Play/Pause button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
          className="absolute inset-0 flex items-center justify-center focus:outline-none z-20"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span
            className={`flex items-center justify-center w-14 h-14 bg-black/60 border-2 border-neon-cyan text-neon-cyan transition-opacity
              ${isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}
            style={{ boxShadow: isPlaying ? 'none' : '0 0 16px rgba(0,240,255,0.4)' }}
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6 ml-0.5" />
            )}
          </span>
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-black/70 border-t border-neon-cyan/20 cursor-pointer"
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
          if (step) { e.preventDefault(); v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + step)); }
        }}
      >
        <span className="font-mono text-[9px] text-neon-green/70 tabular-nums min-w-[2.5rem]">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1 h-1.5 bg-cyber-border cursor-pointer overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-[width] duration-75"
            style={{ width: `${progress}%`, boxShadow: '0 0 4px var(--neon-cyan)' }}
          />
        </div>
        <span className="font-mono text-[9px] text-neon-green/70 tabular-nums min-w-[2.5rem] text-right">
          {formatTime(duration)}
        </span>
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
