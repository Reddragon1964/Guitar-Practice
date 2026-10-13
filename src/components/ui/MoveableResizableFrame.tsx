import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Maximize2, Minimize2, GripHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

export interface MoveableResizableFrameProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  bodyClassName?: string;
  hideBackdrop?: boolean;
  initialMaximized?: boolean;
  isNeonActive?: boolean;
  neonColor?: "cyan" | "magenta" | "emerald";
}

export type NeonFrameColor = "cyan" | "magenta" | "emerald";

const NEON_WINDOW_THEMES = {
  cyan: {
    glowClass: "neon-glow-cyan",
    border: "border-2 border-cyan-400",
    ring: "ring-2 ring-cyan-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-cyan-950/95 via-slate-900 to-cyan-950/90 border-b border-cyan-400/70 shadow-[0_2px_12px_rgba(6,182,212,0.3)]",
    badgeBg:
      "bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.85)]",
    dotPing: "bg-cyan-400",
    laserLine:
      "via-cyan-300 shadow-[0_0_16px_#22d3ee,0_0_32px_#06b6d4]",
    cornerBorder: "border-cyan-300 drop-shadow-[0_0_8px_#22d3ee]",
    handleBg:
      "bg-cyan-950/80 border-cyan-400/80 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    iconBox:
      "bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]",
    resizeHover: "hover:bg-cyan-500/60",
  },
  magenta: {
    glowClass: "neon-glow-magenta",
    border: "border-2 border-pink-400",
    ring: "ring-2 ring-pink-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-pink-950/95 via-slate-900 to-pink-950/90 border-b border-pink-400/70 shadow-[0_2px_12px_rgba(236,72,153,0.3)]",
    badgeBg:
      "bg-pink-950/90 text-pink-300 border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.85)]",
    dotPing: "bg-pink-400",
    laserLine:
      "via-pink-300 shadow-[0_0_16px_#f472b6,0_0_32px_#ec4899]",
    cornerBorder: "border-pink-300 drop-shadow-[0_0_8px_#f472b6]",
    handleBg:
      "bg-pink-950/80 border-pink-400/80 text-pink-200 shadow-[0_0_8px_rgba(236,72,153,0.4)]",
    iconBox:
      "bg-pink-500/20 text-pink-300 border-pink-400/60 shadow-[0_0_8px_rgba(236,72,153,0.4)]",
    resizeHover: "hover:bg-pink-500/60",
  },
  emerald: {
    glowClass: "neon-glow-emerald",
    border: "border-2 border-emerald-400",
    ring: "ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-slate-950",
    headerBg:
      "bg-gradient-to-r from-emerald-950/95 via-slate-900 to-emerald-950/90 border-b border-emerald-400/70 shadow-[0_2px_12px_rgba(16,185,129,0.3)]",
    badgeBg:
      "bg-emerald-950/90 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.85)]",
    dotPing: "bg-emerald-400",
    laserLine:
      "via-emerald-300 shadow-[0_0_16px_#34d399,0_0_32px_#10b981]",
    cornerBorder: "border-emerald-300 drop-shadow-[0_0_8px_#34d399]",
    handleBg:
      "bg-emerald-950/80 border-emerald-400/80 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    iconBox:
      "bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    resizeHover: "hover:bg-emerald-500/60",
  },
};

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const MoveableResizableFrame: React.FC<MoveableResizableFrameProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  headerActions,
  initialMaximized = false,
  initialWidth = 780,
  initialHeight = 680,
  minWidth = 360,
  minHeight = 260,
  maxWidth,
  maxHeight,
  children,
  ariaLabel = "Window Frame",
  className,
  bodyClassName,
  hideBackdrop = false,
  isNeonActive = true,
  neonColor = "cyan",
}) => {
  const neon = NEON_WINDOW_THEMES[neonColor] || NEON_WINDOW_THEMES.cyan;
  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 20 });
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: initialWidth,
    height: initialHeight,
  });

  // Track restore geometry before maximize
  const restoreRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 20,
    y: 20,
    width: initialWidth,
    height: initialHeight,
  });

  const frameRef = useRef<HTMLDivElement>(null);

  // Active interaction tracking refs for global window listeners
  const dragInteractionRef = useRef<{
    isDragging: boolean;
    pointerX: number;
    pointerY: number;
    frameX: number;
    frameY: number;
  }>({
    isDragging: false,
    pointerX: 0,
    pointerY: 0,
    frameX: 0,
    frameY: 0,
  });

  const resizeInteractionRef = useRef<{
    isResizing: boolean;
    dir: ResizeDirection | null;
    pointerX: number;
    pointerY: number;
    frameX: number;
    frameY: number;
    width: number;
    height: number;
  }>({
    isResizing: false,
    dir: null,
    pointerX: 0,
    pointerY: 0,
    frameX: 0,
    frameY: 0,
    width: initialWidth,
    height: initialHeight,
  });

  // Center frame on screen on initial open
  useEffect(() => {
    if (!isOpen) return;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    const safeW = Math.min(initialWidth, Math.max(minWidth, viewportW - 32));
    const safeH = Math.min(initialHeight, Math.max(minHeight, viewportH - 40));

    const posX = Math.max(16, Math.round((viewportW - safeW) / 2));
    const posY = Math.max(16, Math.round((viewportH - safeH) / 2));

    setPosition({ x: posX, y: posY });
    setSize({ width: safeW, height: safeH });
    restoreRef.current = { x: posX, y: posY, width: safeW, height: safeH };
    setIsMaximized(Boolean(initialMaximized));
  }, [isOpen, initialMaximized, initialWidth, initialHeight, minWidth, minHeight]);

  // Global window listeners for moving and resizing — ensures zero slip
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      // 1. Handle Window Drag Move
      if (dragInteractionRef.current.isDragging) {
        const deltaX = e.clientX - dragInteractionRef.current.pointerX;
        const deltaY = e.clientY - dragInteractionRef.current.pointerY;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const rawX = dragInteractionRef.current.frameX + deltaX;
        const rawY = dragInteractionRef.current.frameY + deltaY;

        // Keep header within reachable viewport
        const clampedX = Math.max(-size.width + 120, Math.min(viewportW - 120, rawX));
        const clampedY = Math.max(8, Math.min(viewportH - 60, rawY));

        setPosition({ x: clampedX, y: clampedY });
        return;
      }

      // 2. Handle Window Resize
      if (resizeInteractionRef.current.isResizing && resizeInteractionRef.current.dir) {
        const dir = resizeInteractionRef.current.dir;
        const deltaX = e.clientX - resizeInteractionRef.current.pointerX;
        const deltaY = e.clientY - resizeInteractionRef.current.pointerY;

        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const currentMaxWidth = maxWidth ?? viewportW - 20;
        const currentMaxHeight = maxHeight ?? viewportH - 20;

        let newWidth = resizeInteractionRef.current.width;
        let newHeight = resizeInteractionRef.current.height;
        let newX = resizeInteractionRef.current.frameX;
        let newY = resizeInteractionRef.current.frameY;

        // Horizontal resize
        if (dir.includes("e")) {
          newWidth = Math.min(
            currentMaxWidth,
            Math.max(minWidth, resizeInteractionRef.current.width + deltaX)
          );
        } else if (dir.includes("w")) {
          const potentialWidth = resizeInteractionRef.current.width - deltaX;
          const clampedWidth = Math.min(currentMaxWidth, Math.max(minWidth, potentialWidth));
          newX = resizeInteractionRef.current.frameX + (resizeInteractionRef.current.width - clampedWidth);
          newWidth = clampedWidth;
        }

        // Vertical resize
        if (dir.includes("s")) {
          newHeight = Math.min(
            currentMaxHeight,
            Math.max(minHeight, resizeInteractionRef.current.height + deltaY)
          );
        } else if (dir.includes("n")) {
          const potentialHeight = resizeInteractionRef.current.height - deltaY;
          const clampedHeight = Math.min(currentMaxHeight, Math.max(minHeight, potentialHeight));
          newY = resizeInteractionRef.current.frameY + (resizeInteractionRef.current.height - clampedHeight);
          newHeight = clampedHeight;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleGlobalPointerUp = () => {
      if (dragInteractionRef.current.isDragging) {
        dragInteractionRef.current.isDragging = false;
      }
      if (resizeInteractionRef.current.isResizing) {
        resizeInteractionRef.current.isResizing = false;
        resizeInteractionRef.current.dir = null;
      }
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerup", handleGlobalPointerUp);
    window.addEventListener("pointercancel", handleGlobalPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
      window.removeEventListener("pointercancel", handleGlobalPointerUp);
    };
  }, [isOpen, size.width, minWidth, minHeight, maxWidth, maxHeight]);

  // Handle Drag Move (Pointer down on header)
  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("a")
    ) {
      return;
    }

    if (isMaximized) return;

    e.preventDefault();
    dragInteractionRef.current = {
      isDragging: true,
      pointerX: e.clientX,
      pointerY: e.clientY,
      frameX: position.x,
      frameY: position.y,
    };
  };

  // Handle Resizing (8 directions)
  const startResize = (dir: ResizeDirection) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;

    e.preventDefault();
    e.stopPropagation();

    resizeInteractionRef.current = {
      isResizing: true,
      dir,
      pointerX: e.clientX,
      pointerY: e.clientY,
      frameX: position.x,
      frameY: position.y,
      width: size.width,
      height: size.height,
    };
  };

  // Toggle Maximize / Restore
  const toggleMaximize = () => {
    if (!isMaximized) {
      restoreRef.current = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };
      setIsMaximized(true);
    } else {
      setIsMaximized(false);
      setPosition({ x: restoreRef.current.x, y: restoreRef.current.y });
      setSize({ width: restoreRef.current.width, height: restoreRef.current.height });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden pointer-events-none"
      role="dialog"
      aria-label={ariaLabel}
    >
      {/* Semi-transparent Backdrop */}
      {!hideBackdrop && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs pointer-events-auto transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Moveable & Resizable Window Container */}
      <div
        ref={frameRef}
        style={
          isMaximized
            ? {
                position: "fixed",
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                zIndex: 60,
              }
            : {
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
                zIndex: 60,
              }
        }
        className={cn(
          "pointer-events-auto flex flex-col rounded-2xl bg-slate-950/98 shadow-2xl backdrop-blur-md overflow-hidden select-none transition-all duration-300 relative",
          isMaximized
            ? "rounded-none border-none"
            : isNeonActive
            ? cn(neon.border, neon.glowClass, neon.ring, "ring-2")
            : "border-2 border-indigo-600/90 shadow-indigo-950/90 hover:shadow-indigo-800/60",
          className
        )}
      >
        {/* Top Cyber Neon Laser Beam */}
        {isNeonActive && !isMaximized && (
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent to-transparent pointer-events-none z-20",
              neon.laserLine
            )}
          />
        )}

        {/* 4 Neon Cyber Corner Brackets */}
        {isNeonActive && !isMaximized && (
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

        {/* Title Bar / Drag Zone */}
        <div
          onPointerDown={handleHeaderPointerDown}
          className={cn(
            "shrink-0 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none transition-colors duration-300 relative z-10",
            isMaximized
              ? "cursor-default bg-slate-900 border-b border-indigo-800/60"
              : isNeonActive
              ? neon.headerBg
              : "bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-700/80"
          )}
          title={isMaximized ? undefined : "Click and drag to move frame"}
        >
          {/* Left: Move Icon, App Icon, Title & Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
            {!isMaximized && (
              <div
                className={cn(
                  "p-1.5 rounded-lg flex items-center gap-1 transition-colors",
                  isNeonActive
                    ? neon.handleBg
                    : "bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 hover:text-white"
                )}
                title="Move frame anywhere"
              >
                <GripHorizontal className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold hidden sm:inline">
                  Move
                </span>
              </div>
            )}
            {icon && (
              <div
                className={cn(
                  "p-1.5 rounded-lg shrink-0 border transition-colors",
                  isNeonActive
                    ? neon.iconBox
                    : "bg-indigo-500/20 border border-indigo-400/30 text-indigo-300"
                )}
              >
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {title}
                </h3>
                {isNeonActive && !isMaximized && (
                  <div
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 shrink-0",
                      neon.badgeBg
                    )}
                    title="Active floating frame"
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
                    <span>ACTIVE FRAME</span>
                  </div>
                )}
              </div>
              {subtitle && (
                <p className="text-[11px] text-indigo-300/80 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Custom Actions & Window Control Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
            {headerActions}

            {/* Maximize / Restore */}
            <button
              type="button"
              onClick={toggleMaximize}
              className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 border border-transparent hover:border-indigo-700/50 transition-colors"
              title={isMaximized ? "Restore window size" : "Maximize window full screen"}
              aria-label={isMaximized ? "Restore window size" : "Maximize window full screen"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-indigo-300 hover:text-rose-200 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/50 transition-colors"
              title="Close frame"
              aria-label="Close frame"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Frame Body */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 dialog-scrollbar select-text bg-slate-950/90",
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* 8 Generous Resize Handles (Active only when not maximized) */}
        {!isMaximized && (
          <>
            {/* North Edge */}
            <div
              onPointerDown={startResize("n")}
              className={cn(
                "absolute top-0 left-3 right-3 h-3 cursor-ns-resize transition-colors z-20",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/50"
              )}
              title="Drag to resize vertically"
            />
            {/* South Edge */}
            <div
              onPointerDown={startResize("s")}
              className={cn(
                "absolute bottom-0 left-3 right-3 h-3 cursor-ns-resize transition-colors z-20",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/50"
              )}
              title="Drag to resize vertically"
            />
            {/* East Edge */}
            <div
              onPointerDown={startResize("e")}
              className={cn(
                "absolute top-3 bottom-3 right-0 w-3 cursor-ew-resize transition-colors z-20",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/50"
              )}
              title="Drag to resize horizontally"
            />
            {/* West Edge */}
            <div
              onPointerDown={startResize("w")}
              className={cn(
                "absolute top-3 bottom-3 left-0 w-3 cursor-ew-resize transition-colors z-20",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/50"
              )}
              title="Drag to resize horizontally"
            />

            {/* Corners (Large 20x20px hit targets) */}
            {/* North-East */}
            <div
              onPointerDown={startResize("ne")}
              className={cn(
                "absolute top-0 right-0 w-5 h-5 cursor-nesw-resize z-30 transition-colors",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/60"
              )}
              title="Drag to resize diagonally"
            />
            {/* North-West */}
            <div
              onPointerDown={startResize("nw")}
              className={cn(
                "absolute top-0 left-0 w-5 h-5 cursor-nwse-resize z-30 transition-colors",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/60"
              )}
              title="Drag to resize diagonally"
            />
            {/* South-West */}
            <div
              onPointerDown={startResize("sw")}
              className={cn(
                "absolute bottom-0 left-0 w-5 h-5 cursor-nesw-resize z-30 transition-colors",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/60"
              )}
              title="Drag to resize diagonally"
            />
            {/* South-East: Prominent corner grip handle with tactile lines */}
            <div
              onPointerDown={startResize("se")}
              className={cn(
                "absolute bottom-0 right-0 w-7 h-7 cursor-nwse-resize flex items-end justify-end p-1 rounded-tl-xl transition-all z-30 group",
                isNeonActive ? neon.resizeHover : "hover:bg-indigo-500/40"
              )}
              title="Click and drag to resize frame"
            >
              <div className="flex flex-col gap-0.5 items-end justify-end pr-0.5 pb-0.5">
                <div
                  className={cn(
                    "w-1.5 h-0.5 rounded-full transition-colors",
                    isNeonActive ? "bg-cyan-300 group-hover:bg-white" : "bg-indigo-400 group-hover:bg-white"
                  )}
                />
                <div
                  className={cn(
                    "w-2.5 h-0.5 rounded-full transition-colors",
                    isNeonActive ? "bg-cyan-300 group-hover:bg-white" : "bg-indigo-400 group-hover:bg-white"
                  )}
                />
                <div
                  className={cn(
                    "w-3.5 h-0.5 rounded-full transition-colors",
                    isNeonActive ? "bg-cyan-300 group-hover:bg-white" : "bg-indigo-400 group-hover:bg-white"
                  )}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
