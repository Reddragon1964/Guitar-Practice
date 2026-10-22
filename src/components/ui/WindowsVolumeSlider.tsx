import React, { useState, useEffect } from "react";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { cn } from "../../lib/utils";
import { masterAudio } from "../../utils/masterAudioController";

interface WindowsVolumeSliderProps {
  variant?: "header" | "toolbar" | "compact";
  className?: string;
  showLabel?: boolean;
}

export const WindowsVolumeSlider: React.FC<WindowsVolumeSliderProps> = ({
  variant = "toolbar",
  className,
  showLabel = true,
}) => {
  const [volume, setVolumeState] = useState<number>(() => masterAudio.getVolume());
  const [isMuted, setIsMutedState] = useState<boolean>(() => masterAudio.isMuted());

  // Subscribe to global master audio updates
  useEffect(() => {
    const unsubscribe = masterAudio.subscribe((state) => {
      setVolumeState(state.volume);
      setIsMutedState(state.isMuted);
    });
    return unsubscribe;
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    masterAudio.setVolume(newVol, true);
  };

  const handleSliderCommit = () => {
    masterAudio.playWindowsFeedbackChime(true);
  };

  const toggleMute = () => {
    masterAudio.toggleMute();
    if (isMuted) {
      masterAudio.playWindowsFeedbackChime(true);
    }
  };

  const displayVolume = isMuted ? 0 : volume;

  const VolumeIcon = isMuted || displayVolume === 0 ? VolumeX : displayVolume < 50 ? Volume1 : Volume2;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-200 shadow-sm",
          className
        )}
        title={`Windows Volume: ${displayVolume}% ${isMuted ? "(Muted)" : ""}`}
      >
        <button
          type="button"
          onClick={toggleMute}
          className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
          title={isMuted ? "Unmute Windows volume" : "Mute Windows volume"}
          aria-label={isMuted ? "Unmute volume" : "Mute volume"}
        >
          <VolumeIcon className="w-3.5 h-3.5" />
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={displayVolume}
          onChange={handleVolumeChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          aria-label="Windows volume slider"
        />
        <span className="text-[10px] font-mono font-bold text-cyan-300 min-w-[28px] text-right">
          {displayVolume}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-md backdrop-blur-sm transition-all",
        isMuted
          ? "border-rose-900/60 bg-rose-950/20"
          : "hover:border-cyan-500/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        className
      )}
      title={`Windows System & Practice Audio Volume: ${displayVolume}% ${isMuted ? "(Muted)" : ""}`}
    >
      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        className={cn(
          "p-1 rounded-md transition-colors flex items-center justify-center cursor-pointer",
          isMuted
            ? "text-rose-400 hover:text-rose-300 hover:bg-rose-950/60"
            : "text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/50"
        )}
        title={isMuted ? "Click to unmute Windows volume" : "Click to mute Windows volume"}
        aria-label={isMuted ? "Unmute Windows volume" : "Mute Windows volume"}
      >
        <VolumeIcon className="w-4 h-4" />
      </button>

      {/* Label */}
      {showLabel && (
        <span className="text-[11px] font-semibold tracking-wide text-slate-300 hidden sm:inline select-none">
          Windows Vol
        </span>
      )}

      {/* Interactive Volume Slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={displayVolume}
          onChange={handleVolumeChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none"
          aria-label="Windows volume control"
        />

        {/* Numeric Readout */}
        <span
          className={cn(
            "text-xs font-mono font-bold min-w-[34px] text-right select-none",
            isMuted ? "text-rose-400 line-through" : "text-cyan-300"
          )}
        >
          {displayVolume}%
        </span>
      </div>
    </div>
  );
};
