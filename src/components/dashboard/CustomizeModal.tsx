import React from "react";
import {
  Sliders,
  X,
  Sparkles,
  Check,
  Grid,
  RotateCcw,
  Palette,
  Layout,
  Sun,
  Flame,
} from "lucide-react";
import { Button } from "../ui/button";
import { NeonColor, GridDarkness } from "../../types/theme";
import { cn } from "../../lib/utils";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNeonColor: NeonColor;
  onSelectNeonColor: (color: NeonColor) => void;
  activeFrameId: string;
  onSelectActiveFrame: (frameId: any) => void;
  activeGridDarkness: GridDarkness;
  onSelectGridDarkness: (darkness: GridDarkness) => void;
}

interface GlowColorOption {
  id: NeonColor;
  name: string;
  tone: string;
  hex: string;
  glowClass: string;
  borderClass: string;
  description: string;
}

const GLOW_COLORS: GlowColorOption[] = [
  {
    id: "cyan",
    name: "Electric Cyan",
    tone: "Studio Laser",
    hex: "#22d3ee",
    glowClass: "shadow-[0_0_20px_#22d3ee]",
    borderClass: "border-cyan-400",
    description: "Cool electric blue with laser sharp luminescence",
  },
  {
    id: "magenta",
    name: "Synthwave Pink",
    tone: "80s Arcade",
    hex: "#ec4899",
    glowClass: "shadow-[0_0_20px_#ec4899]",
    borderClass: "border-pink-400",
    description: "Vibrant high-contrast arcade neon magenta",
  },
  {
    id: "emerald",
    name: "Electric Emerald",
    tone: "Stage Focus",
    hex: "#10b981",
    glowClass: "shadow-[0_0_20px_#10b981]",
    borderClass: "border-emerald-400",
    description: "Lush botanical mint and bright emerald glow",
  },
  {
    id: "amber",
    name: "Vintage Amber",
    tone: "Tube Amp Warmth",
    hex: "#f59e0b",
    glowClass: "shadow-[0_0_20px_#f59e0b]",
    borderClass: "border-amber-400",
    description: "Warm golden lacquer and vacuum tube filament warmth",
  },
  {
    id: "violet",
    name: "Cosmic Violet",
    tone: "Ultraviolet",
    hex: "#a855f7",
    glowClass: "shadow-[0_0_20px_#a855f7]",
    borderClass: "border-purple-400",
    description: "Deep galactic purple and ultraviolet stage beam",
  },
  {
    id: "crimson",
    name: "Ruby Crimson",
    tone: "Heavy Rock",
    hex: "#f43f5e",
    glowClass: "shadow-[0_0_20px_#f43f5e]",
    borderClass: "border-rose-400",
    description: "Bold incandescent fire and stadium rock red",
  },
];

const FRAME_OPTIONS = [
  { id: "streak", label: "Daily Practice Streak & Consistency", icon: Flame },
  { id: "recentTrend", label: "Last 7 Sessions Trend (Duration & Accuracy)", icon: Sparkles },
  { id: "goals", label: "Weekly Practice Goals & Targets", icon: Layout },
  { id: "trends", label: "30-Day Practice Trends & Progression", icon: Sliders },
  { id: "milestones", label: "Milestones & Repertoire Goals", icon: Sparkles },
  { id: "weeklyChart", label: "Weekly Practice Hours Distribution", icon: Layout },
  { id: "accuracyChart", label: "Historical Accuracy Progression", icon: Sliders },
  { id: "sessions", label: "Recent Practice Sessions Log", icon: Layout },
];

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  activeNeonColor,
  onSelectNeonColor,
  activeFrameId,
  onSelectActiveFrame,
  activeGridDarkness,
  onSelectGridDarkness,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="customize-dialog-title"
                className="text-xl font-bold tracking-tight text-white flex items-center gap-2"
              >
                Customize
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                  Glow & Layout
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set frame glow color, choose highlighted active frame, and adjust grid lines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            aria-label="Close customize dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. SET GLOW COLOR SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Set Glow Color
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the luminous neon glow tint applied to the active dashboard frame
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-cyan-300">
                Current: {GLOW_COLORS.find((c) => c.id === activeNeonColor)?.name}
              </span>
            </div>

            {/* Glow Color Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GLOW_COLORS.map((color) => {
                const isSelected = activeNeonColor === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onSelectNeonColor(color.id)}
                    className={cn(
                      "group p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer",
                      isSelected
                        ? cn(
                            "bg-slate-950/90 ring-2 ring-offset-2 ring-offset-slate-950",
                            color.borderClass,
                            color.glowClass
                          )
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full transition-transform shadow-md",
                            isSelected && "scale-110 shadow-lg"
                          )}
                          style={{
                            backgroundColor: color.hex,
                            boxShadow: `0 0 12px ${color.hex}`,
                          }}
                        />
                        <span className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                          {color.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-950"
                          style={{ backgroundColor: color.hex }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                        {color.tone}
                      </span>
                      <p className="text-[11px] text-slate-400/90 line-clamp-1 mt-0.5">
                        {color.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ACTIVE NEON FRAME SELECTOR */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layout className="w-4 h-4 text-indigo-400" />
                Active Neon Frame
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Select which dashboard card displays the glowing animated neon frame border
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FRAME_OPTIONS.map((frame) => {
                const isSelected = activeFrameId === frame.id;
                const IconComponent = frame.icon;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => onSelectActiveFrame(frame.id)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between gap-2 cursor-pointer",
                      isSelected
                        ? "bg-slate-950 border-cyan-500/80 text-white ring-1 ring-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <IconComponent
                        className={cn(
                          "w-4 h-4 shrink-0",
                          isSelected ? "text-cyan-400" : "text-slate-500"
                        )}
                      />
                      <span className="truncate">{frame.label}</span>
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. GRID LINES & DARKNESS */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Grid className="w-4 h-4 text-emerald-400" />
                Grid Line Darkness
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure chart and dashboard background grid line intensity
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "deep", label: "Deep Dark", desc: "Default studio" },
                { id: "obsidian", label: "Obsidian", desc: "Ultra dark contrast" },
                { id: "charcoal", label: "Charcoal", desc: "Medium subtle lines" },
                { id: "white", label: "White", desc: "High visibility lines" },
              ].map((g) => {
                const isSelected = activeGridDarkness === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => onSelectGridDarkness(g.id as GridDarkness)}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      isSelected
                        ? "bg-slate-950 border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-sm"
                        : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                    )}
                  >
                    <div className="text-xs font-bold text-white">{g.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{g.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelectNeonColor("cyan");
              onSelectActiveFrame("streak");
              onSelectGridDarkness("deep");
            }}
            className="text-xs text-slate-400 hover:text-white gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </Button>

          <Button
            type="button"
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs px-5 h-8 shadow-md shadow-cyan-600/20"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
