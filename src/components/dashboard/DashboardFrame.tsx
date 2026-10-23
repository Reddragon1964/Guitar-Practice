import React, { useState } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Columns,
  Sparkles,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { MoveableResizableFrame } from "../ui/MoveableResizableFrame";
import { cn } from "../../lib/utils";

export type FrameWidth = "one-third" | "half" | "two-thirds" | "full";
export type NeonColor = "cyan" | "magenta" | "emerald" | "amber" | "violet" | "crimson";

export interface DashboardFrameProps {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  width?: FrameWidth;
  onWidthChange?: (width: FrameWidth) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onPopOut?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  onActivate?: () => void;
  neonColor?: NeonColor;
}

const NEON_THEMES = {
  cyan: {
    glowClass: "neon-glow-cyan",
    border: "border-2 border-cyan-400",
    ring: "ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-cyan-950/90 via-slate-900 to-cyan-950/80 border-b border-cyan-400/70 shadow-[0_2px_12px_rgba(6,182,212,0.3)]",
    badgeBg:
      "bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.85)]",
    dotPing: "bg-cyan-400",
    laserLine:
      "via-cyan-300 shadow-[0_0_14px_#22d3ee,0_0_28px_#06b6d4]",
    cornerBorder: "border-cyan-300 drop-shadow-[0_0_8px_#22d3ee]",
    handleBg:
      "bg-cyan-950/80 border-cyan-400/80 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    iconBox:
      "bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    hoverPreview:
      "hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/40",
  },
  magenta: {
    glowClass: "neon-glow-magenta",
    border: "border-2 border-pink-400",
    ring: "ring-2 ring-pink-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-pink-950/90 via-slate-900 to-pink-950/80 border-b border-pink-400/70 shadow-[0_2px_12px_rgba(236,72,153,0.3)]",
    badgeBg:
      "bg-pink-950/90 text-pink-300 border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.85)]",
    dotPing: "bg-pink-400",
    laserLine:
      "via-pink-300 shadow-[0_0_14px_#f472b6,0_0_28px_#ec4899]",
    cornerBorder: "border-pink-300 drop-shadow-[0_0_8px_#f472b6]",
    handleBg:
      "bg-pink-950/80 border-pink-400/80 text-pink-200 shadow-[0_0_8px_rgba(236,72,153,0.4)]",
    iconBox:
      "bg-pink-500/20 text-pink-300 border-pink-400/60 shadow-[0_0_8px_rgba(236,72,153,0.4)]",
    hoverPreview:
      "hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-950/40",
  },
  emerald: {
    glowClass: "neon-glow-emerald",
    border: "border-2 border-emerald-400",
    ring: "ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/80 border-b border-emerald-400/70 shadow-[0_2px_12px_rgba(16,185,129,0.3)]",
    badgeBg:
      "bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.85)]",
    dotPing: "bg-emerald-400",
    laserLine:
      "via-emerald-300 shadow-[0_0_14px_#34d399,0_0_28px_#10b981]",
    cornerBorder: "border-emerald-300 drop-shadow-[0_0_8px_#34d399]",
    handleBg:
      "bg-emerald-950/80 border-emerald-400/80 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    iconBox:
      "bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    hoverPreview:
      "hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/40",
  },
  amber: {
    glowClass: "neon-glow-amber",
    border: "border-2 border-amber-400",
    ring: "ring-2 ring-amber-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 border-b border-amber-400/70 shadow-[0_2px_12px_rgba(245,158,11,0.3)]",
    badgeBg:
      "bg-amber-950/90 text-amber-300 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.85)]",
    dotPing: "bg-amber-400",
    laserLine:
      "via-amber-300 shadow-[0_0_14px_#fbbf24,0_0_28px_#f59e0b]",
    cornerBorder: "border-amber-300 drop-shadow-[0_0_8px_#fbbf24]",
    handleBg:
      "bg-amber-950/80 border-amber-400/80 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    iconBox:
      "bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
    hoverPreview:
      "hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-950/40",
  },
  violet: {
    glowClass: "neon-glow-violet",
    border: "border-2 border-purple-400",
    ring: "ring-2 ring-purple-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-purple-950/90 via-slate-900 to-purple-950/80 border-b border-purple-400/70 shadow-[0_2px_12px_rgba(168,85,247,0.3)]",
    badgeBg:
      "bg-purple-950/90 text-purple-300 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.85)]",
    dotPing: "bg-purple-400",
    laserLine:
      "via-purple-300 shadow-[0_0_14px_#c084fc,0_0_28px_#a855f7]",
    cornerBorder: "border-purple-300 drop-shadow-[0_0_8px_#c084fc]",
    handleBg:
      "bg-purple-950/80 border-purple-400/80 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]",
    iconBox:
      "bg-purple-500/20 text-purple-300 border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.4)]",
    hoverPreview:
      "hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-950/40",
  },
  crimson: {
    glowClass: "neon-glow-crimson",
    border: "border-2 border-rose-500",
    ring: "ring-2 ring-rose-500/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/80 border-b border-rose-500/70 shadow-[0_2px_12px_rgba(244,63,94,0.3)]",
    badgeBg:
      "bg-rose-950/90 text-rose-300 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.85)]",
    dotPing: "bg-rose-500",
    laserLine:
      "via-rose-300 shadow-[0_0_14px_#fb7185,0_0_28px_#f43f5e]",
    cornerBorder: "border-rose-400 drop-shadow-[0_0_8px_#fb7185]",
    handleBg:
      "bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    iconBox:
      "bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
    hoverPreview:
      "hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/40",
  },
};

export const DashboardFrame: React.FC<DashboardFrameProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  width = "full",
  onWidthChange,
  isMinimized = false,
  onToggleMinimize,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  headerActions,
  children,
  className,
  isActive = false,
  onActivate,
  neonColor = "cyan",
}) => {
  const [isPoppedOut, setIsPoppedOut] = useState(false);

  const validWidths: FrameWidth[] = ["one-third", "half", "two-thirds", "full"];
  const currentWidth: FrameWidth =
    typeof width === "string" && validWidths.includes(width as FrameWidth)
      ? (width as FrameWidth)
      : "full";
  const neon = NEON_THEMES[neonColor] || NEON_THEMES.cyan;

  // Width CSS mappings based on 12-column responsive grid
  const getColSpanClass = (w: FrameWidth) => {
    switch (w) {
      case "one-third":
        return "col-span-12 md:col-span-6 lg:col-span-4";
      case "half":
        return "col-span-12 md:col-span-6 lg:col-span-6";
      case "two-thirds":
        return "col-span-12 lg:col-span-8";
      case "full":
      default:
        return "col-span-12";
    }
  };

  const cycleWidth = () => {
    if (!onWidthChange) return;
    const widths: FrameWidth[] = ["one-third", "half", "two-thirds", "full"];
    const currentIdx = widths.indexOf(currentWidth);
    const nextIdx = (currentIdx + 1) % widths.length;
    onWidthChange(widths[nextIdx]);
  };

  return (
    <>
      {/* 1. Main Dashboard Card Container */}
      <div
        className={cn(
          "transition-all duration-300 flex flex-col group/frame relative",
          getColSpanClass(currentWidth),
          className
        )}
      >
        <Card
          onClick={(e) => {
            if ((e.target as HTMLElement)?.closest?.('[data-column-resize-handle="true"]')) {
              return;
            }
            if (!isActive) {
              onActivate?.();
            }
          }}
          onFocusCapture={(e) => {
            if ((e.target as HTMLElement)?.closest?.('[data-column-resize-handle="true"]')) {
              return;
            }
            if (!isActive) {
              onActivate?.();
            }
          }}
          tabIndex={0}
          role="region"
          aria-label={`${title} frame${isActive ? " (Active Frame with Neon Highlight)" : ""}`}
          className={cn(
            "h-full flex flex-col bg-slate-950/98 rounded-2xl overflow-hidden transition-all duration-300 relative focus:outline-none",
            isActive
              ? cn(
                  neon.border,
                  neon.glowClass,
                  neon.ring,
                  "z-10 ring-2"
                )
              : cn(
                  "border border-slate-900/95 shadow-2xl bg-slate-950/98",
                  neon.hoverPreview
                )
          )}
        >
          {/* Cyber Neon Top Laser Tube Line when Active */}
          {isActive && (
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent to-transparent pointer-events-none z-20",
                neon.laserLine
              )}
            />
          )}

          {/* Cyber Neon Corner Brackets when Active */}
          {isActive && (
            <>
              <div
                className={cn(
                  "absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 pointer-events-none z-20 transition-colors",
                  neon.cornerBorder
                )}
              />
              <div
                className={cn(
                  "absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 pointer-events-none z-20 transition-colors",
                  neon.cornerBorder
                )}
              />
              <div
                className={cn(
                  "absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 pointer-events-none z-20 transition-colors",
                  neon.cornerBorder
                )}
              />
              <div
                className={cn(
                  "absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 pointer-events-none z-20 transition-colors",
                  neon.cornerBorder
                )}
              />
            </>
          )}

          {/* Frame Tool Bar Header with Move & Resize Controls */}
          <div
            className={cn(
              "shrink-0 px-3.5 py-2.5 flex items-center justify-between gap-2 select-none transition-colors duration-300 relative z-10",
              isActive
                ? neon.headerBg
                : "bg-gradient-to-r from-slate-950 via-slate-900/95 to-slate-950 border-b border-slate-900/90"
            )}
          >
            {/* Left: Move & Title info */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Move Handle / Order Controls */}
              <div
                className={cn(
                  "flex items-center gap-0.5 shrink-0 rounded-lg p-0.5 transition-colors",
                  isActive
                    ? neon.handleBg
                    : "bg-slate-900/90 border border-slate-800/80 text-slate-400"
                )}
              >
                {canMoveUp && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp?.();
                    }}
                    className="p-1 hover:text-white hover:bg-indigo-800/80 rounded transition-colors"
                    title="Move frame up"
                    aria-label="Move frame up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {canMoveDown && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown?.();
                    }}
                    className="p-1 hover:text-white hover:bg-indigo-800/80 rounded transition-colors"
                    title="Move frame down"
                    aria-label="Move frame down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <div
                  className="px-1 text-[10px] font-mono uppercase tracking-wider font-medium flex items-center gap-0.5 cursor-grab"
                  title="Moveable frame handle"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Frame</span>
                </div>
              </div>

              {icon && (
                <div
                  className={cn(
                    "p-1.5 rounded-lg shrink-0 border transition-colors",
                    isActive
                      ? neon.iconBox
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-400/20"
                  )}
                >
                  {icon}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                    {title}
                  </h3>
                  {badge}

                  {/* Highlighting Active Frame like Neon Badge */}
                  {isActive && (
                    <div
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 shrink-0",
                        neon.badgeBg
                      )}
                      title="This is the currently active frame highlighted in neon"
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            neon.dotPing
                          )}
                        />
                        <span
                          className={cn(
                            "relative inline-flex rounded-full h-2 w-2 shadow-[0_0_6px_currentColor]",
                            neon.dotPing
                          )}
                        />
                      </span>
                      <span>ACTIVE</span>
                    </div>
                  )}
                </div>
                {subtitle && (
                  <p className="text-[10px] text-indigo-300/80 truncate hidden sm:block">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Resize, Pop Out, Minimize, & Custom Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {headerActions}

              {/* Resize Width Selector */}
              {onWidthChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleWidth();
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono font-medium bg-indigo-950/80 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 hover:text-white transition-colors flex items-center gap-1"
                  title={`Current size: ${currentWidth}. Click to resize frame width.`}
                >
                  <Columns className="w-3 h-3 text-indigo-300" />
                  <span className="capitalize">{currentWidth.replace("-", " ")}</span>
                </button>
              )}

              {/* Pop-Out to Floating Window */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPoppedOut(true);
                }}
                className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/70 border border-transparent hover:border-indigo-700/50 transition-colors"
                title="Pop out into floating movable & resizable window"
                aria-label="Pop out into floating movable & resizable window"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Minimize / Expand Toggle */}
              {onToggleMinimize && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMinimize();
                  }}
                  className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/70 border border-transparent hover:border-indigo-700/50 transition-colors"
                  title={isMinimized ? "Expand frame content" : "Minimize frame content"}
                  aria-label={isMinimized ? "Expand frame content" : "Minimize frame content"}
                >
                  {isMinimized ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Frame Content Body */}
          {!isMinimized && (
            <div className="p-3 sm:p-5 flex-1 flex flex-col min-h-0 overflow-visible relative z-10">
              {children}

              {/* Visual Resize Affordance at bottom right */}
              {onWidthChange && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleWidth();
                  }}
                  className="absolute bottom-1 right-1 p-1 text-indigo-500/60 hover:text-indigo-300 cursor-pointer transition-colors"
                  title="Click to cycle frame width"
                >
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="w-1 h-0.5 bg-indigo-500/50 rounded-full" />
                    <div className="w-2 h-0.5 bg-indigo-500/60 rounded-full" />
                    <div className="w-3 h-0.5 bg-indigo-400 rounded-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* 2. Floating Pop-Out Window (When user pops out frame) */}
      {isPoppedOut && (
        <MoveableResizableFrame
          isOpen={true}
          onClose={() => setIsPoppedOut(false)}
          title={title}
          subtitle={subtitle}
          icon={icon}
          initialWidth={880}
          initialHeight={680}
          minWidth={400}
          minHeight={300}
          ariaLabel={title}
          isNeonActive={true}
          neonColor={neonColor}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-xs text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Floating neon frame mode active. You can drag and resize this window anywhere.</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPoppedOut(false)}
                className="h-7 text-xs text-cyan-200 hover:text-white"
              >
                Dock back to dashboard
              </Button>
            </div>
            {children}
          </div>
        </MoveableResizableFrame>
      )}
    </>
  );
};
