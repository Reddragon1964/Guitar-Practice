import React, { useState, useRef, useEffect } from "react";
import {
  ALargeSmall,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
} from "lucide-react";
import { useTextScale, MIN_TEXT_SCALE, MAX_TEXT_SCALE, DEFAULT_TEXT_SCALE } from "../../context/TextScaleContext";
import { Button } from "./button";
import { cn } from "../../lib/utils";

interface TextScaleControlProps {
  variant?: "header" | "toolbar" | "minimal";
  className?: string;
}

export const TextScaleControl: React.FC<TextScaleControlProps> = ({
  variant = "header",
  className,
}) => {
  const { scale, setScale, increaseScale, decreaseScale, resetScale, presets } = useTextScale();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isDefault = scale === DEFAULT_TEXT_SCALE;

  // Active preset label if exactly matched
  const currentPreset = presets.find((p) => p.value === scale);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Trigger Button */}
      {variant === "minimal" ? (
        <div className="flex items-center gap-1 bg-indigo-950/70 border border-indigo-800/80 rounded-xl p-0.5">
          <button
            type="button"
            onClick={decreaseScale}
            disabled={scale <= MIN_TEXT_SCALE}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 disabled:opacity-40 transition-colors"
            title="Decrease text size (A-)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="px-2 py-0.5 text-xs font-mono font-semibold text-indigo-200 hover:text-white transition-colors"
            title="Text scaling settings"
          >
            {scale}%
          </button>
          <button
            type="button"
            onClick={increaseScale}
            disabled={scale >= MAX_TEXT_SCALE}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 disabled:opacity-40 transition-colors"
            title="Increase text size (A+)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : variant === "toolbar" ? (
        <Button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 border-indigo-700/80 bg-indigo-950/60 hover:bg-indigo-800 text-indigo-200 transition-colors",
            !isDefault && "border-indigo-500 bg-indigo-900/70 text-white font-medium"
          )}
          title="Adjust app-wide text scaling and readability"
        >
          <ALargeSmall className="w-4 h-4 text-indigo-400" />
          <span>Text: {scale}%</span>
          <ChevronDown className="w-3 h-3 text-indigo-400 ml-0.5" />
        </Button>
      ) : (
        /* Header Variant */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-indigo-700/80 bg-indigo-900/40 hover:bg-indigo-800 text-indigo-200 hover:text-white text-xs font-medium transition-all shadow-xs whitespace-nowrap",
            !isDefault && "border-indigo-400/80 bg-indigo-800/60 text-white ring-1 ring-indigo-400/30"
          )}
          title="Scale text app-wide (change font size)"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <ALargeSmall className="w-4 h-4 text-indigo-300" />
          <span className="font-mono font-semibold">{scale}%</span>
          <span className="hidden md:inline text-[11px] text-indigo-300/80">Text</span>
          <ChevronDown
            className={cn("w-3 h-3 text-indigo-400 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
      )}

      {/* Floating Scale Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-slate-950/95 border-2 border-indigo-600/90 shadow-2xl shadow-indigo-950/90 backdrop-blur-md p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                <ALargeSmall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">App-Wide Text Scaling</h4>
                <p className="text-[11px] text-indigo-300/80">Scales all fonts, labels, and dialogs</p>
              </div>
            </div>

            {!isDefault && (
              <button
                type="button"
                onClick={resetScale}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-900/50 hover:bg-indigo-800/80 px-2 py-1 rounded-lg border border-indigo-700/60 transition-colors"
                title="Reset text size to standard 100%"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Stepper & Current Readout */}
          <div className="py-3 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Scale Level
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decreaseScale}
                disabled={scale <= MIN_TEXT_SCALE}
                className="w-8 h-8 rounded-lg bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 hover:text-white disabled:opacity-40 border border-indigo-700/70 flex items-center justify-center transition-colors active:scale-95"
                title="Decrease font size (-5%)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="min-w-16 text-center">
                <span className="text-lg font-mono font-bold text-white tracking-tight">
                  {scale}%
                </span>
                {currentPreset && (
                  <span className="block text-[10px] text-indigo-300 font-medium -mt-0.5">
                    {currentPreset.label}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={increaseScale}
                disabled={scale >= MAX_TEXT_SCALE}
                className="w-8 h-8 rounded-lg bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 hover:text-white disabled:opacity-40 border border-indigo-700/70 flex items-center justify-center transition-colors active:scale-95"
                title="Increase font size (+5%)"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-1.5 pb-3">
            <div className="flex justify-between text-[11px] text-indigo-400 font-mono">
              <span>{MIN_TEXT_SCALE}% (Compact)</span>
              <span>100%</span>
              <span>{MAX_TEXT_SCALE}% (Max)</span>
            </div>
            <input
              type="range"
              min={MIN_TEXT_SCALE}
              max={MAX_TEXT_SCALE}
              step={5}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-indigo-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5 pt-2 border-t border-indigo-800/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
              Presets
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {presets.map((preset) => {
                const isActive = scale === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setScale(preset.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all",
                      isActive
                        ? "bg-indigo-600 border-indigo-400 text-white font-bold shadow-md shadow-indigo-950"
                        : "bg-indigo-950/60 border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/70 hover:text-white"
                    )}
                    title={preset.description}
                  >
                    <span className="text-[11px] leading-tight">{preset.label}</span>
                    <span className="text-[10px] font-mono opacity-80">{preset.value}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-indigo-800/70 space-y-1">
            <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-indigo-400 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Live Reading Preview</span>
            </div>
            <p className="text-sm text-slate-100 font-medium leading-snug">
              Guitar practice tracker: <span className="text-emerald-400 font-bold">96% Accuracy</span> at <span className="text-amber-300 font-bold">120 BPM</span>.
            </p>
            <p className="text-xs text-indigo-300/80">
              Changes apply instantly and are saved for future visits.
            </p>
          </div>

          {/* Footer Close */}
          <div className="mt-3 pt-2 flex items-center justify-between border-t border-indigo-800/60 text-[11px] text-indigo-400">
            <span>Saved in browser storage</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-indigo-300 hover:text-white font-semibold hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
