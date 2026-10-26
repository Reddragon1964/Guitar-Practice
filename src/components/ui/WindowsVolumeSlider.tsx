import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Volume1, VolumeX, Minus, Plus } from "lucide-react";
import { masterAudio, MasterAudioState } from "../../utils/masterAudioController";
import { cn } from "../../lib/utils";

interface WindowsVolumeSliderProps {
  variant?: "toolbar" | "compact" | "header";
  className?: string;
  showLabel?: boolean;
}

export const WindowsVolumeSlider: React.FC<WindowsVolumeSliderProps> = ({
  variant = "toolbar",
  className,
  showLabel = true,
}) => {
  const [audioState, setAudioState] = useState<MasterAudioState>(() =>
    masterAudio.getState()
  );
  const [isDragging, setIsDragging] = useState(false);
  const trackWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return masterAudio.subscribe((newState) => {
      setAudioState(newState);
    });
  }, []);

  const { volume, isMuted } = audioState;
  const displayVolume = isMuted ? 0 : volume;

  const updateVolumeFromClientX = useCallback(
    (clientX: number, playFeedback: boolean) => {
      const el = trackWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = (clientX - rect.left) / rect.width;
      const newVol = Math.max(0, Math.min(100, Math.round(ratio * 100)));
      masterAudio.setVolume(newVol, playFeedback);
    },
    []
  );

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = Number(e.target.value);
    if (!Number.isNaN(val)) {
      masterAudio.setVolume(val, true);
    }
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported
    }
    setIsDragging(true);
    updateVolumeFromClientX(e.clientX, false);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    updateVolumeFromClientX(e.clientX, true);
  };

  const handleTrackPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setIsDragging(false);
    updateVolumeFromClientX(e.clientX, true);
    masterAudio.playWindowsFeedbackChime(true);
  };

  const handleStepVolume = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const base = isMuted ? 0 : volume;
    const nextVol = Math.max(0, Math.min(100, base + delta));
    masterAudio.setVolume(nextVol, true);
    masterAudio.playWindowsFeedbackChime(true);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    masterAudio.toggleMute(true);
  };

  const handleTestTone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMuted || volume === 0) {
      masterAudio.setVolume(volume === 0 ? 50 : volume, false);
      masterAudio.setMuted(false, false);
    }
    masterAudio.playWindowsFeedbackChime(true);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 5 : -5;
    const base = isMuted ? 0 : volume;
    const nextVol = Math.max(0, Math.min(100, base + delta));
    masterAudio.setVolume(nextVol, true);
  };

  const getSpeakerIcon = () => {
    if (isMuted || displayVolume === 0) {
      return <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    if (displayVolume < 50) {
      return <Volume1 className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    return <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />;
  };

  const isCompact = variant === "compact";

  return (
    <div
      data-no-frame-drag="true"
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={handleWheel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/80 bg-slate-950/95 px-2 py-1 shadow-sm select-none print:hidden",
        isCompact ? "h-8" : "h-9 px-2.5",
        className
      )}
      title={`Master App Volume: ${
        isMuted ? `Muted (${volume}%)` : `${volume}%`
      } — Drag slider, click -/+, or scroll wheel to adjust`}
    >
      {/* Mute / Unmute Speaker Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer shrink-0",
          isMuted || displayVolume === 0
            ? "bg-rose-950/80 text-rose-300 hover:bg-rose-900/90 border border-rose-700/60"
            : "bg-indigo-950/90 text-cyan-200 hover:bg-indigo-900/90 border border-indigo-700/60"
        )}
        title={isMuted ? "Unmute application sound" : "Mute application sound"}
        aria-label={isMuted ? "Unmute sound" : "Mute sound"}
      >
        {getSpeakerIcon()}
        {showLabel && !isCompact && (
          <span className="text-[11px] font-semibold tracking-tight text-indigo-100 hidden sm:inline">
            Vol
          </span>
        )}
      </button>

      {/* Volume Down (-5%) Step Button */}
      <button
        type="button"
        onClick={(e) => handleStepVolume(-5, e)}
        disabled={!isMuted && displayVolume <= 0}
        className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-indigo-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        title="Decrease volume by 5%"
        aria-label="Decrease volume"
      >
        <Minus className="w-3 h-3" />
      </button>

      {/* Interactive Slider Track + Native Range Input */}
      <div
        ref={trackWrapperRef}
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
        className={cn(
          "relative flex items-center h-6 cursor-pointer touch-none shrink-0",
          isCompact ? "w-20 sm:w-24" : "w-24 sm:w-32"
        )}
      >
        {/* Custom Visual Track Background & Active Fill */}
        <div className="pointer-events-none w-full h-2 rounded-full bg-slate-800 border border-indigo-900/80 overflow-hidden relative">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-75",
              isMuted || displayVolume === 0
                ? "bg-rose-500/70"
                : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
            )}
            style={{ width: `${displayVolume}%` }}
          />
        </div>

        {/* Native Range Input overlaid for keyboard accessibility & standard dragging */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={displayVolume}
          onChange={handleRangeChange}
          onInput={handleRangeChange}
          aria-label="Application master volume slider"
          className="windows-volume-slider-input absolute inset-0 w-full h-full m-0 p-0 z-10 cursor-pointer"
        />
      </div>

      {/* Volume Up (+5%) Step Button */}
      <button
        type="button"
        onClick={(e) => handleStepVolume(5, e)}
        disabled={!isMuted && displayVolume >= 100}
        className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-indigo-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        title="Increase volume by 5%"
        aria-label="Increase volume"
      >
        <Plus className="w-3 h-3" />
      </button>

      {/* Percentage Readout & Click-to-Test Audio Button */}
      <button
        type="button"
        onClick={handleTestTone}
        className={cn(
          "text-[11px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded transition-colors cursor-pointer shrink-0",
          isMuted || displayVolume === 0
            ? "bg-rose-950/60 text-rose-400 hover:text-rose-200"
            : "bg-slate-900/90 text-cyan-300 hover:text-white"
        )}
        title="Click to play a test chime at the current volume level"
      >
        {isMuted ? "MUTE" : `${displayVolume}%`}
      </button>
    </div>
  );
};
