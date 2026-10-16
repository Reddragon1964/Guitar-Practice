import React, { useState } from "react";
import {
  Settings,
  X,
  Palette,
  Sparkles,
  Grid,
  Check,
  RotateCcw,
  Sliders,
  Type,
  Layout,
  Sun,
  Flame,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { useColorScheme } from "../../context/ColorSchemeContext";
import {
  ColorScheme,
  ColorSchemeId,
  NeonColor,
  GridDarkness,
} from "../../types/theme";
import { useTextScale, TEXT_SCALE_PRESETS } from "../../context/TextScaleContext";
import { cn } from "../../lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Peripherals to allow customizing from Settings
  activeNeonColor: NeonColor;
  onSelectNeonColor: (color: NeonColor) => void;
  activeGridDarkness: GridDarkness;
  onSelectGridDarkness: (darkness: GridDarkness) => void;
  onResetLayout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  activeNeonColor,
  onSelectNeonColor,
  activeGridDarkness,
  onSelectGridDarkness,
  onResetLayout,
}) => {
  const { currentScheme, schemeId, setSchemeId, colorSchemes, resetToDefaultScheme } =
    useColorScheme();
  const { scale, setScale, resetScale } = useTextScale();

  const [activeTab, setActiveTab] = useState<"schemes" | "accents" | "display">("schemes");
  const [resetConfirm, setResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleApplyScheme = (scheme: ColorScheme) => {
    setSchemeId(scheme.id);
    // Also auto-sync matching neon color and grid darkness for a cohesive default look
    onSelectNeonColor(scheme.defaultNeon);
    onSelectGridDarkness(scheme.defaultGrid);
  };

  const handleFullReset = () => {
    resetToDefaultScheme();
    onSelectNeonColor("cyan");
    onSelectGridDarkness("deep");
    resetScale();
    if (onResetLayout) onResetLayout();
    setResetConfirm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Dialog Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Settings
                <span className="text-[11px] font-semibold tracking-normal px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/50 text-indigo-300">
                  Appearance & Preferences
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your color scheme, neon accents, grid density, and interface display
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Settings (Esc)"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 pb-1 border-b border-slate-800 bg-slate-950/30 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("schemes")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer",
              activeTab === "schemes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            <Palette className="w-4 h-4" />
            <span>Color Schemes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/80 text-indigo-200 border border-indigo-700/40">
              {colorSchemes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("accents")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer",
              activeTab === "accents"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>Neons & Grids</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("display")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer",
              activeTab === "display"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            <Sliders className="w-4 h-4" />
            <span>Text Scaling & Layout</span>
          </button>
        </div>

        {/* Dialog Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: COLOR SCHEMES */}
          {activeTab === "schemes" && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-800 shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Default Color Schemes</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      Select one of our curated themes built specifically for guitarists, audio engineers, and practice routines. Changes apply immediately in real-time.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaultScheme}
                  className="shrink-0 gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
                  title="Reset to default Cyber Indigo scheme"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default Scheme</span>
                </Button>
              </div>

              {/* Color Scheme Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colorSchemes.map((scheme) => {
                  const isActive = scheme.id === schemeId;
                  return (
                    <div
                      key={scheme.id}
                      onClick={() => handleApplyScheme(scheme)}
                      className={cn(
                        "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between",
                        isActive
                          ? "bg-slate-950 border-2 border-indigo-500 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500/50"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900/90"
                      )}
                    >
                      <div>
                        {/* Top Row: Name, Badge, Active Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-base group-hover:text-indigo-200 transition-colors">
                                {scheme.name}
                              </h4>
                              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                                {scheme.category}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-indigo-400/90 mt-0.5">
                              {scheme.tagline}
                            </p>
                          </div>

                          {isActive ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-sm shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <span className="opacity-0 group-hover:opacity-100 text-[11px] font-medium text-slate-400 transition-opacity">
                              Click to apply
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                          {scheme.description}
                        </p>
                      </div>

                      {/* Bottom Palette Swatch Preview */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-400 mr-1">Palette:</span>
                          {scheme.previewColors.map((colorHex, idx) => (
                            <span
                              key={idx}
                              className="w-5 h-5 rounded-md border border-slate-700/80 shadow-inner"
                              style={{ backgroundColor: colorHex }}
                              title={`Color ${idx + 1}: ${colorHex}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400">
                            Neon: <strong className="text-slate-200 capitalize">{scheme.defaultNeon}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Live Active Scheme Preview ({currentScheme.name})
                  </span>
                  <span className="text-xs text-slate-400">
                    Instant real-time preview across dashboard
                  </span>
                </div>

                <div
                  className="p-4 rounded-xl border transition-all"
                  style={{
                    backgroundColor: currentScheme.bgCard,
                    borderColor: currentScheme.borderColor,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Sample Practice Frame</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: currentScheme.primaryColor + "33",
                            color: currentScheme.accentColor,
                            border: `1px solid ${currentScheme.primaryColor}88`,
                          }}
                        >
                          98.5% Accuracy
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {currentScheme.tagline} • Theme styling is synchronized with cards, headers, and buttons.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity shadow-sm"
                        style={{ backgroundColor: currentScheme.primaryColor }}
                      >
                        Action Button
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{
                          borderColor: currentScheme.borderColor,
                          color: currentScheme.accentColor,
                          backgroundColor: "rgba(0,0,0,0.3)",
                        }}
                      >
                        Secondary
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEONS & GRIDS */}
          {activeTab === "accents" && (
            <div className="space-y-6">
              {/* Active Neon Glow Frame Selector */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Active Frame Neon Highlight Color
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Choose the luminous neon glow color applied to the currently active dashboard frame
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
                    Active: {activeNeonColor}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                  {(
                    [
                      { id: "cyan", label: "Electric Cyan", hex: "#22d3ee", ring: "ring-cyan-400" },
                      { id: "magenta", label: "Synthwave Pink", hex: "#ec4899", ring: "ring-pink-400" },
                      { id: "emerald", label: "Electric Emerald", hex: "#10b981", ring: "ring-emerald-400" },
                      { id: "amber", label: "Vintage Amber", hex: "#f59e0b", ring: "ring-amber-400" },
                      { id: "violet", label: "Cosmic Violet", hex: "#a855f7", ring: "ring-purple-400" },
                      { id: "crimson", label: "Ruby Crimson", hex: "#f43f5e", ring: "ring-rose-400" },
                    ] as const
                  ).map((c) => {
                    const isSelected = activeNeonColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectNeonColor(c.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer text-center",
                          isSelected
                            ? "bg-slate-900 border-2 border-white/80 shadow-lg"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full shadow-md transition-transform",
                            isSelected && "scale-110 ring-2 ring-offset-2 ring-offset-slate-950 " + c.ring
                          )}
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-xs font-semibold text-slate-200">{c.label}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Line Color & Darkness */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Grid className="w-4 h-4 text-slate-400" />
                      Chart & Background Grid Color
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust the contrast of Cartesian grid lines across charts and technical background overlays
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-200">
                    Grid: {activeGridDarkness}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {(
                    [
                      {
                        id: "deep",
                        label: "Deep Dark",
                        tag: "Default",
                        desc: "Subtle indigo-tinted dark lines",
                        swatch: "#1e1b4b",
                      },
                      {
                        id: "obsidian",
                        label: "Obsidian",
                        tag: "Ultra Dark",
                        desc: "Nearly invisible dark slate lines",
                        swatch: "#0f172a",
                      },
                      {
                        id: "charcoal",
                        label: "Charcoal",
                        tag: "Balanced",
                        desc: "Medium charcoal lines for clear visibility",
                        swatch: "#1e293b",
                      },
                      {
                        id: "white",
                        label: "White",
                        tag: "High Contrast",
                        desc: "Crisp white lines for maximum clarity",
                        swatch: "#ffffff",
                      },
                    ] as const
                  ).map((g) => {
                    const isSelected = activeGridDarkness === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => onSelectGridDarkness(g.id)}
                        className={cn(
                          "flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? "bg-slate-900 border-2 border-indigo-400 shadow-md ring-1 ring-indigo-400/40"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-900"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-white">{g.label}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {g.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{g.desc}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <span
                            className="w-5 h-3 rounded border border-slate-600"
                            style={{ backgroundColor: g.swatch }}
                          />
                          {isSelected && (
                            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPLAY & TEXT SCALING */}
          {activeTab === "display" && (
            <div className="space-y-6">
              {/* Text Scaling Slider & Presets */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Type className="w-4 h-4 text-indigo-400" />
                      Application-Wide Text Scaling
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scale all text proportionally across every page, chart, and modal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-mono font-bold text-indigo-300">
                      {scale}%
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={75}
                    max={160}
                    step={5}
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    aria-label="Text scaling percentage"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>75% (Min)</span>
                    <span>100% (Standard)</span>
                    <span>160% (Max)</span>
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {TEXT_SCALE_PRESETS.map((preset) => {
                    const isSelected = scale === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setScale(preset.value)}
                        className={cn(
                          "px-2.5 py-2 rounded-lg border text-center transition-all cursor-pointer",
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-400 font-bold shadow-md"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                      >
                        <div className="text-xs">{preset.label}</div>
                        <div className="text-[10px] opacity-75">{preset.value}%</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Reset Card */}
              {onResetLayout && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layout className="w-4 h-4 text-slate-400" />
                      Dashboard Frames Layout
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reset movable and resizable frame positions to their standard factory order
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetLayout}
                    className="gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Frame Layout</span>
                  </Button>
                </div>
              )}

              {/* Full Settings Reset */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    Reset All Preferences
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Restore the Cyber Indigo color scheme, 100% font scale, and default neon highlight
                  </p>
                </div>
                {resetConfirm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleFullReset}
                      className="text-xs"
                    >
                      Confirm Reset
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResetConfirm(false)}
                      className="text-xs text-slate-400"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResetConfirm(true)}
                    className="border-rose-900/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/60 text-xs"
                  >
                    Reset All to Defaults
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden sm:inline">Preferences automatically persist in browser storage.</span>
            <span className="sm:hidden">Auto-saved to device.</span>
          </div>

          <Button
            onClick={onClose}
            className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
