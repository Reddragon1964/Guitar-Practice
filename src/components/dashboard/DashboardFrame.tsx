import React, { useState } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  SlidersHorizontal,
  Columns,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { MoveableResizableFrame } from "../ui/MoveableResizableFrame";
import { cn } from "../../lib/utils";

export type FrameWidth = "one-third" | "half" | "two-thirds" | "full";

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
}

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
}) => {
  const [isPoppedOut, setIsPoppedOut] = useState(false);

  const currentWidth: FrameWidth = (width as FrameWidth) || "full";

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
          "transition-all duration-200 flex flex-col group/frame relative",
          getColSpanClass(currentWidth),
          className
        )}
      >
        <Card className="h-full flex flex-col border border-indigo-800/70 bg-slate-950/90 shadow-xl hover:border-indigo-600/80 transition-colors rounded-2xl overflow-hidden">
          {/* Frame Tool Bar Header with Move & Resize Controls */}
          <div className="shrink-0 px-3.5 py-2.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/80 border-b border-indigo-800/60 flex items-center justify-between gap-2 select-none">
            {/* Left: Move & Title info */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Move Handle / Order Controls */}
              <div className="flex items-center gap-0.5 shrink-0 bg-indigo-950/70 border border-indigo-700/60 rounded-lg p-0.5 text-indigo-300">
                {canMoveUp && (
                  <button
                    type="button"
                    onClick={onMoveUp}
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
                    onClick={onMoveDown}
                    className="p-1 hover:text-white hover:bg-indigo-800/80 rounded transition-colors"
                    title="Move frame down"
                    aria-label="Move frame down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}
                <div
                  className="px-1 text-[10px] font-mono uppercase tracking-wider text-indigo-300/90 font-medium flex items-center gap-0.5 cursor-grab"
                  title="Moveable frame handle"
                >
                  <GripVertical className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Frame</span>
                </div>
              </div>

              {icon && (
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0 border border-indigo-400/20">
                  {icon}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                    {title}
                  </h3>
                  {badge}
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
                  onClick={cycleWidth}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono font-medium bg-indigo-950/80 hover:bg-indigo-800 border border-indigo-700/60 text-indigo-200 hover:text-white transition-colors flex items-center gap-1"
                  title={`Current size: ${width}. Click to resize frame width.`}
                >
                  <Columns className="w-3 h-3 text-indigo-300" />
                  <span className="capitalize">{width.replace("-", " ")}</span>
                </button>
              )}

              {/* Pop-Out to Floating Window */}
              <button
                type="button"
                onClick={() => setIsPoppedOut(true)}
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
                  onClick={onToggleMinimize}
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
            <div className="p-3 sm:p-5 flex-1 flex flex-col min-h-0 overflow-visible relative">
              {children}

              {/* Visual Resize Affordance at bottom right */}
              {onWidthChange && (
                <div
                  onClick={cycleWidth}
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
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-300">
              <span>Floating frame mode active. You can drag and resize this window anywhere.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPoppedOut(false)}
                className="h-7 text-xs text-indigo-200 hover:text-white"
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
