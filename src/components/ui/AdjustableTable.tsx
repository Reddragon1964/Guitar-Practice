import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Rows,
  Columns,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type TableRowDensity = "compact" | "default" | "spacious";

export interface RowDensityStyle {
  paddingY: string;
  paddingX: string;
  headerPaddingY: string;
  fontSize: string;
  lineHeight: string;
  badgeSize: string;
  label: string;
  estimatedRowHeight: number;
}

export const ROW_DENSITY_CONFIG: Record<TableRowDensity, RowDensityStyle> = {
  compact: {
    paddingY: "py-1.5",
    paddingX: "px-3",
    headerPaddingY: "py-2",
    fontSize: "text-xs",
    lineHeight: "leading-4",
    badgeSize: "text-[10px] px-1.5 py-0.5",
    label: "Compact",
    estimatedRowHeight: 32,
  },
  default: {
    paddingY: "py-2.5",
    paddingX: "px-4",
    headerPaddingY: "py-3",
    fontSize: "text-xs",
    lineHeight: "leading-5",
    badgeSize: "text-xs px-2 py-0.5",
    label: "Standard",
    estimatedRowHeight: 44,
  },
  spacious: {
    paddingY: "py-4",
    paddingX: "px-4",
    headerPaddingY: "py-3.5",
    fontSize: "text-sm",
    lineHeight: "leading-6",
    badgeSize: "text-xs px-2.5 py-1",
    label: "Spacious",
    estimatedRowHeight: 58,
  },
};

export interface UseResizableColumnsOptions {
  tableId: string;
  defaultWidths: Record<string, number>;
  minWidth?: number;
  maxWidth?: number;
  defaultDensity?: TableRowDensity;
}

/**
 * Safely extract horizontal clientX coordinate from any mouse, pointer, touch, or numeric input.
 */
export function extractSafeClientX(eventOrX: unknown): number | null {
  if (typeof eventOrX === "number") {
    return Number.isFinite(eventOrX) ? eventOrX : null;
  }
  if (!eventOrX || typeof eventOrX !== "object") {
    return null;
  }
  const ev = eventOrX as any;
  if (typeof ev.clientX === "number" && Number.isFinite(ev.clientX)) {
    return ev.clientX;
  }
  if (ev.touches && typeof ev.touches.length === "number" && ev.touches.length > 0) {
    const t = ev.touches[0];
    if (t && typeof t.clientX === "number" && Number.isFinite(t.clientX)) {
      return t.clientX;
    }
  }
  if (
    ev.changedTouches &&
    typeof ev.changedTouches.length === "number" &&
    ev.changedTouches.length > 0
  ) {
    const t = ev.changedTouches[0];
    if (t && typeof t.clientX === "number" && Number.isFinite(t.clientX)) {
      return t.clientX;
    }
  }
  if (ev.nativeEvent && ev.nativeEvent !== ev) {
    return extractSafeClientX(ev.nativeEvent);
  }
  return null;
}

export function useResizableColumns({
  tableId,
  defaultWidths,
  minWidth = 50,
  maxWidth = 600,
  defaultDensity = "default",
}: UseResizableColumnsOptions) {
  const widthsKey = `table_widths_${tableId}_v3`;
  const densityKey = `table_density_${tableId}_v3`;

  const sanitizeWidths = useCallback(
    (raw: unknown, fallback: Record<string, number>): Record<string, number> => {
      const result: Record<string, number> = {};
      for (const [k, defVal] of Object.entries(fallback)) {
        const safeDef = Number.isFinite(defVal) ? defVal : 120;
        result[k] = Math.max(minWidth, Math.min(maxWidth, Math.round(safeDef)));
      }
      if (raw && typeof raw === "object") {
        for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
          if (!k || k === "undefined" || k === "null") continue;
          const num = typeof v === "number" ? v : Number(v);
          if (Number.isFinite(num) && num >= minWidth && num <= maxWidth) {
            result[k] = Math.round(num);
          }
        }
      }
      return result;
    },
    [minWidth, maxWidth]
  );

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(widthsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeWidths(parsed, defaultWidths);
      }
    } catch (e) {
      console.warn("Failed to load saved column widths", e);
    }
    return sanitizeWidths(null, defaultWidths);
  });

  const widthsRef = useRef<Record<string, number>>(widths);
  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  const defaultWidthsRef = useRef<Record<string, number>>(defaultWidths);
  useEffect(() => {
    defaultWidthsRef.current = defaultWidths;
  }, [defaultWidths]);

  const [density, setDensity] = useState<TableRowDensity>(() => {
    try {
      const saved = localStorage.getItem(densityKey) as TableRowDensity;
      if (saved === "compact" || saved === "default" || saved === "spacious") {
        return saved;
      }
    } catch (e) {
      console.warn("Failed to load saved row density", e);
    }
    return defaultDensity;
  });

  const [activeResizingColumn, setActiveResizingColumn] = useState<string | null>(null);
  const lastResizeEndTimeRef = useRef<number>(0);

  const dragInfoRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const rafIdRef = useRef<number | null>(null);

  const persistWidths = useCallback(
    (nextWidths: Record<string, number>) => {
      try {
        localStorage.setItem(widthsKey, JSON.stringify(nextWidths));
      } catch (e) {
        console.warn("Failed to save column widths", e);
      }
    },
    [widthsKey]
  );

  // Sync density changes to localStorage
  const changeDensity = useCallback(
    (newDensity: TableRowDensity) => {
      if (newDensity !== "compact" && newDensity !== "default" && newDensity !== "spacious") {
        return;
      }
      setDensity(newDensity);
      try {
        localStorage.setItem(densityKey, newDensity);
      } catch (e) {
        console.warn("Failed to save row density", e);
      }
    },
    [densityKey]
  );

  // Set single column width with bounds and persistence
  const setColumnWidth = useCallback(
    (colId: string, newWidth: number) => {
      if (!colId || typeof newWidth !== "number" || !Number.isFinite(newWidth)) return;
      const clamped = Math.round(Math.max(minWidth, Math.min(maxWidth, newWidth)));
      const updated = { ...widthsRef.current, [colId]: clamped };
      widthsRef.current = updated;
      setWidths(updated);
      persistWidths(updated);
    },
    [minWidth, maxWidth, persistWidths]
  );

  // Scale all columns uniformly by delta pixels
  const adjustAllColumns = useCallback(
    (deltaPx: number) => {
      if (typeof deltaPx !== "number" || !Number.isFinite(deltaPx)) return;
      const current = widthsRef.current;
      const keys = Object.keys({ ...defaultWidthsRef.current, ...current });
      const updated: Record<string, number> = { ...current };
      for (const k of keys) {
        const base =
          typeof current[k] === "number" && Number.isFinite(current[k])
            ? current[k]
            : defaultWidthsRef.current[k] ?? 120;
        updated[k] = Math.round(Math.max(minWidth, Math.min(maxWidth, base + deltaPx)));
      }
      widthsRef.current = updated;
      setWidths(updated);
      persistWidths(updated);
    },
    [minWidth, maxWidth, persistWidths]
  );

  // Reset all widths back to default
  const resetWidths = useCallback(() => {
    const cleanDefaults = sanitizeWidths(null, defaultWidthsRef.current);
    widthsRef.current = cleanDefaults;
    setWidths(cleanDefaults);
    persistWidths(cleanDefaults);
  }, [sanitizeWidths, persistWidths]);

  // Reset single column
  const resetColumn = useCallback(
    (colId: string) => {
      if (!colId) return;
      const defaultW = defaultWidthsRef.current[colId];
      if (typeof defaultW === "number" && Number.isFinite(defaultW)) {
        setColumnWidth(colId, defaultW);
      }
    },
    [setColumnWidth]
  );

  // Reset both rows & columns to factory defaults
  const resetAll = useCallback(() => {
    resetWidths();
    changeDensity(defaultDensity);
  }, [resetWidths, changeDensity, defaultDensity]);

  const activeListenersRef = useRef<{
    cleanup: () => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (activeListenersRef.current) {
        activeListenersRef.current.cleanup();
        activeListenersRef.current = null;
      }
    };
  }, []);

  // Handle drag resizing cleanly with RAF throttling and zero state-updater side effects
  const startResize = useCallback(
    (columnId: string, eventOrClientX: unknown) => {
      if (!columnId || typeof columnId !== "string") return;
      const clientX = extractSafeClientX(eventOrClientX);
      if (clientX === null) return;

      // Clean up any previous drag session
      if (activeListenersRef.current) {
        activeListenersRef.current.cleanup();
        activeListenersRef.current = null;
      }

      const rawCurrent =
        widthsRef.current[columnId] ?? defaultWidthsRef.current[columnId] ?? 120;
      const startWidth =
        typeof rawCurrent === "number" && Number.isFinite(rawCurrent)
          ? Math.max(minWidth, Math.min(maxWidth, rawCurrent))
          : 120;

      dragInfoRef.current = {
        columnId,
        startX: clientX,
        startWidth,
      };
      setActiveResizingColumn(columnId);

      const onMove = (e: Event) => {
        const dragInfo = dragInfoRef.current;
        if (!dragInfo) return;

        const currentX = extractSafeClientX(e);
        if (currentX === null) return;

        const delta = currentX - dragInfo.startX;
        const nextWidth = Math.round(
          Math.max(minWidth, Math.min(maxWidth, dragInfo.startWidth + delta))
        );
        const targetColId = dragInfo.columnId;

        if (widthsRef.current[targetColId] === nextWidth) {
          return;
        }

        const nextWidths = {
          ...widthsRef.current,
          [targetColId]: nextWidth,
        };
        widthsRef.current = nextWidths;

        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            setWidths({ ...widthsRef.current });
          });
        }
      };

      const cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onUp);
        window.removeEventListener("touchcancel", onUp);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onUp = () => {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (dragInfoRef.current) {
          const finalWidths = { ...widthsRef.current };
          setWidths(finalWidths);
          persistWidths(finalWidths);
        }
        dragInfoRef.current = null;
        lastResizeEndTimeRef.current = Date.now();
        setActiveResizingColumn(null);
        cleanup();
        activeListenersRef.current = null;
      };

      activeListenersRef.current = { cleanup };

      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onUp);
      window.addEventListener("touchcancel", onUp);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [minWidth, maxWidth, persistWidths]
  );

  // Helper to check if a resize just finished (to prevent accidental header sort clicks)
  const isRecentlyResized = useCallback(() => {
    return (
      activeResizingColumn !== null || Date.now() - lastResizeEndTimeRef.current < 250
    );
  }, [activeResizingColumn]);

  return {
    widths,
    density,
    densityStyle: ROW_DENSITY_CONFIG[density] || ROW_DENSITY_CONFIG.default,
    activeResizingColumn,
    setDensity: changeDensity,
    setColumnWidth,
    adjustAllColumns,
    resetWidths,
    resetColumn,
    resetAll,
    startResize,
    isRecentlyResized,
  };
}

export interface ColumnResizeHandleProps {
  onResizeStart: (e: any) => void;
  onDoubleClick?: () => void;
  isResizing?: boolean;
}

export const ColumnResizeHandle: React.FC<ColumnResizeHandleProps> = ({
  onResizeStart,
  onDoubleClick,
  isResizing,
}) => {
  const handleStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    if ("preventDefault" in e && e.type === "mousedown") {
      e.preventDefault();
    }
    const clientX = extractSafeClientX(e);
    if (clientX === null) return;

    // Provide a normalized event-like object that always has both `.clientX` and `.touches[0].clientX`
    // so any caller pattern (`e.clientX` or `"touches" in e ? e.touches[0].clientX : e.clientX`) is 100% safe.
    const safeEvent = {
      clientX,
      touches: [{ clientX }],
      changedTouches: [{ clientX }],
      preventDefault: () => {},
      stopPropagation: () => {},
    };
    onResizeStart(safeEvent);
  };

  return (
    <div
      data-column-resize-handle="true"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick?.();
      }}
      className={cn(
        "absolute right-0 top-0 bottom-0 w-3.5 cursor-col-resize select-none flex items-center justify-center group/resize z-20 transition-colors",
        isResizing ? "bg-cyan-500/40" : "hover:bg-cyan-500/20"
      )}
      title="Drag left or right to adjust column width (Double-click to reset)"
      aria-hidden="true"
    >
      <div
        className={cn(
          "w-[2px] h-3/5 rounded-full transition-all pointer-events-none",
          isResizing
            ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee] scale-y-125"
            : "bg-indigo-700/60 group-hover/resize:bg-cyan-400 group-hover/resize:shadow-[0_0_6px_#22d3ee]"
        )}
      />
    </div>
  );
};

export interface AdjustableTableToolbarProps {
  density: TableRowDensity;
  onDensityChange: (density: TableRowDensity) => void;
  onResetColumns: () => void;
  onAdjustAllColumns?: (deltaPx: number) => void;
  onResetAll?: () => void;
  rowCount?: number;
  columnCount?: number;
  className?: string;
  isMaximizedHeight?: boolean;
  onToggleMaximizeHeight?: () => void;
  extraActions?: React.ReactNode;
}

export const AdjustableTableToolbar: React.FC<AdjustableTableToolbarProps> = ({
  density,
  onDensityChange,
  onResetColumns,
  onAdjustAllColumns,
  rowCount,
  columnCount,
  className,
  isMaximizedHeight,
  onToggleMaximizeHeight,
  extraActions,
}) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-slate-950/90 border-b border-indigo-900/60 text-xs select-none backdrop-blur rounded-lg",
        className
      )}
    >
      {/* Left: Row Density & Column Width Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold uppercase tracking-wider text-[11px]">
            <Rows className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rows:</span>
          </div>
          <div className="inline-flex rounded-lg bg-indigo-950/70 p-0.5 border border-indigo-800/60">
            {(["compact", "default", "spacious"] as TableRowDensity[]).map((d) => {
              const isSelected = density === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDensityChange(d);
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all capitalize cursor-pointer",
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm"
                      : "text-slate-400 hover:text-indigo-200"
                  )}
                  title={`Set row height to ${ROW_DENSITY_CONFIG[d].label}`}
                >
                  {ROW_DENSITY_CONFIG[d].label}
                </button>
              );
            })}
          </div>
        </div>

        {onAdjustAllColumns && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-indigo-300 font-semibold uppercase tracking-wider text-[11px]">
              <Columns className="w-3.5 h-3.5 text-cyan-400" />
              <span>Col Width:</span>
            </div>
            <div className="inline-flex items-center rounded-lg bg-indigo-950/70 p-0.5 border border-indigo-800/60 gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustAllColumns(-20);
                }}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-indigo-200 hover:text-white hover:bg-indigo-800/60 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Narrow all columns (-20px)"
              >
                <Minus className="w-3 h-3 text-cyan-400" />
                <span>Narrow</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjustAllColumns(20);
                }}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium text-indigo-200 hover:text-white hover:bg-indigo-800/60 transition-colors flex items-center gap-0.5 cursor-pointer"
                title="Widen all columns (+20px)"
              >
                <Plus className="w-3 h-3 text-cyan-400" />
                <span>Widen</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Columns & Reset actions */}
      <div className="flex items-center gap-2">
        {(rowCount !== undefined || columnCount !== undefined) && (
          <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
            {rowCount !== undefined && `${rowCount} rows`}
            {rowCount !== undefined && columnCount !== undefined && " · "}
            {columnCount !== undefined && `${columnCount} cols`}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onResetColumns();
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 transition-colors cursor-pointer"
          title="Reset column widths to standard size"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          Reset Widths
        </button>

        {onToggleMaximizeHeight && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximizeHeight();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-indigo-900/50 transition-colors cursor-pointer"
            title={isMaximizedHeight ? "Standard table height" : "Expand table viewport"}
          >
            {isMaximizedHeight ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {extraActions}
      </div>
    </div>
  );
};
