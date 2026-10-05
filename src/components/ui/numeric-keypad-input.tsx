import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Calculator, Delete, Check, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface QuickPresetItem {
  label: string;
  value: string;
}

export interface NumericKeypadInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string | number;
  onChange: (newValue: string) => void;
  label?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  allowColon?: boolean;
  step?: number;
  stepLabel?: string;
  onCustomStep?: (direction: 1 | -1) => void;
  quickPresets?: QuickPresetItem[];
  inputClassName?: string;
  containerClassName?: string;
  /** Compact mode for small filter inputs */
  compact?: boolean;
}

export const NumericKeypadInput: React.FC<NumericKeypadInputProps> = ({
  value,
  onChange,
  label = "Numeric Input",
  min,
  max,
  maxLength = 15,
  allowColon = false,
  step = 1,
  stepLabel,
  onCustomStep,
  quickPresets,
  inputClassName,
  containerClassName,
  compact = false,
  disabled,
  onBlur,
  onFocus,
  placeholder,
  required,
  id,
  ...rest
}) => {
  const propStrValue = value === undefined || value === null ? "" : String(value);
  const [draft, setDraft] = useState<string>(propStrValue);
  const [isOpen, setIsOpen] = useState(false);
  const [replaceOnNextKey, setReplaceOnNextKey] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: "bottom" | "top" }>({
    top: 0,
    left: 0,
    placement: "bottom",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  // Sync draft with external prop changes
  useEffect(() => {
    setDraft(propStrValue);
  }, [propStrValue]);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const keypadWidth = 252;
    const estimatedHeight = quickPresets && quickPresets.length > 0 ? 320 : 276;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = rect.bottom + 6;
    let placement: "bottom" | "top" = "bottom";

    if (rect.bottom + estimatedHeight > viewportH - 12 && rect.top > estimatedHeight + 12) {
      top = rect.top - estimatedHeight - 6;
      placement = "top";
    } else if (rect.bottom + estimatedHeight > viewportH - 12) {
      top = Math.max(12, viewportH - estimatedHeight - 12);
    }

    const centeredLeft = rect.left + rect.width / 2 - keypadWidth / 2;
    const left = Math.max(12, Math.min(centeredLeft, viewportW - keypadWidth - 12));

    setCoords({ top, left, placement });
  }, [quickPresets]);

  const openKeypad = useCallback(() => {
    if (disabled) return;
    updatePosition();
    isOpenRef.current = true;
    setIsOpen(true);
    setReplaceOnNextKey(true);
  }, [disabled, updatePosition]);

  const commitValue = useCallback(
    (valToCommit: string) => {
      if (valToCommit === "" && typeof value === "number") {
        const fallback = String(min ?? 0);
        setDraft(fallback);
        onChange(fallback);
      } else if (!allowColon && valToCommit !== "" && min !== undefined) {
        const n = parseInt(valToCommit, 10);
        if (!isNaN(n) && n < min) {
          const clamped = String(min);
          setDraft(clamped);
          onChange(clamped);
        }
      }
    },
    [value, min, allowColon, onChange]
  );

  const closeKeypad = useCallback(() => {
    if (isOpenRef.current) {
      isOpenRef.current = false;
      setIsOpen(false);
      setReplaceOnNextKey(false);
      commitValue(draft);
      if (onBlur && inputRef.current) {
        const syntheticEvent = {
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as React.FocusEvent<HTMLInputElement>;
        onBlur(syntheticEvent);
      }
    }
  }, [draft, commitValue, onBlur]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        if (e.key === "Escape") {
          e.stopPropagation();
        }
        closeKeypad();
      }
    };
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        closeKeypad();
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
    };
  }, [isOpen, updatePosition, closeKeypad]);

  const applyNewValue = (nextVal: string) => {
    setDraft(nextVal);
    if (nextVal !== "" || typeof value !== "number") {
      onChange(nextVal);
    }
  };

  const clampNumericString = (raw: string): string => {
    if (allowColon) {
      return raw.slice(0, maxLength);
    }
    const cleaned = raw.replace(/[^\d]/g, "").slice(0, maxLength);
    if (cleaned === "") return "";
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return "";
    if (max !== undefined && num > max) {
      return String(max);
    }
    return String(num);
  };

  const handleDigitPress = (digit: string) => {
    if (disabled) return;
    let base = replaceOnNextKey ? "" : draft;

    if (digit === ":") {
      if (!allowColon) return;
      if (base === "") base = "0";
      if (base.includes(":")) return;
      const next = `${base}:`;
      applyNewValue(next);
      setReplaceOnNextKey(false);
      return;
    }

    const candidate = `${base}${digit}`;
    const nextVal = clampNumericString(candidate);
    applyNewValue(nextVal);
    setReplaceOnNextKey(false);
  };

  const handleBackspace = () => {
    if (disabled) return;
    setReplaceOnNextKey(false);
    if (!draft || draft.length <= 1) {
      applyNewValue("");
      return;
    }
    applyNewValue(draft.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    setReplaceOnNextKey(false);
    applyNewValue("");
  };

  const handleStep = (direction: 1 | -1) => {
    if (disabled) return;
    setReplaceOnNextKey(false);
    if (onCustomStep) {
      onCustomStep(direction);
      return;
    }
    const current = parseInt(draft, 10);
    const base = isNaN(current) ? (min ?? 0) : current;
    let next = base + direction * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    applyNewValue(String(next));
  };

  const handleDirectInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceOnNextKey(false);
    const raw = e.target.value;
    if (allowColon) {
      const filtered = raw.replace(/[^\d:.]/g, "").slice(0, maxLength);
      applyNewValue(filtered);
      return;
    }
    if (raw === "") {
      applyNewValue("");
      return;
    }
    const cleaned = raw.replace(/[^\d]/g, "").slice(0, maxLength);
    if (cleaned === "") {
      applyNewValue("");
      return;
    }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) {
        applyNewValue(String(max));
        return;
      }
      applyNewValue(String(num));
    }
  };

  const incLabel = stepLabel ? `+${stepLabel}` : `+${step}`;
  const decLabel = stepLabel ? `-${stepLabel}` : `-${step}`;

  return (
    <div ref={containerRef} className={cn("relative", containerClassName)}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode={allowColon ? "text" : "numeric"}
        disabled={disabled}
        required={required}
        value={draft}
        placeholder={placeholder}
        onChange={handleDirectInputChange}
        onFocus={(e) => {
          openKeypad();
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (!isOpen) {
            commitValue(draft);
            onBlur?.(e);
          }
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-indigo-700 bg-indigo-950/60 text-indigo-50 px-3 py-2 pr-7 text-sm placeholder:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield]",
          isOpen && "ring-2 ring-emerald-400/80 border-emerald-400",
          inputClassName
        )}
        {...rest}
      />

      {/* Keypad Trigger Button */}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            closeKeypad();
          } else {
            openKeypad();
            inputRef.current?.focus();
          }
        }}
        title={disabled ? undefined : `Open keypad for ${label}`}
        aria-label={`Open keypad for ${label}`}
        className={cn(
          "absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
          disabled
            ? "text-indigo-600/30 cursor-not-allowed"
            : isOpen
            ? "text-emerald-300 bg-emerald-500/20"
            : "text-indigo-400/80 hover:text-indigo-200 hover:bg-indigo-800/50",
          compact && "right-1 p-0.5"
        )}
      >
        <Calculator className={cn("w-3.5 h-3.5", compact && "w-3 h-3")} />
      </button>

      {/* Pop-out Keypad Portal */}
      {isOpen &&
        !disabled &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: coords.top, left: coords.left, width: 252 }}
            onMouseDown={(e) => {
              // Prevent blurring the active input when clicking inside the keypad
              e.preventDefault();
            }}
            className="fixed z-[100] rounded-xl border border-indigo-600/90 bg-slate-950/98 backdrop-blur-xl shadow-2xl shadow-black/80 p-3 text-indigo-50 animate-in fade-in zoom-in-95 duration-150 select-none"
          >
            {/* Header & Live Readout */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-indigo-800/70">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 truncate">
                  {label}
                </div>
                {(min !== undefined || max !== undefined) && !allowColon && (
                  <div className="text-[10px] text-indigo-400 font-mono">
                    {min !== undefined && max !== undefined
                      ? `Range: ${min}–${max}`
                      : min !== undefined
                      ? `Min: ${min}`
                      : `Max: ${max}`}
                  </div>
                )}
                {allowColon && (
                  <div className="text-[10px] text-emerald-400/90 font-mono">Format: m:ss</div>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className={cn(
                    "px-2 py-1 rounded-md font-mono font-bold text-sm min-w-[54px] text-center border",
                    replaceOnNextKey && draft
                      ? "bg-indigo-500/25 border-indigo-400 text-white"
                      : "bg-indigo-950/90 border-indigo-700/80 text-emerald-300"
                  )}
                >
                  {draft || placeholder || "0"}
                </div>
                <button
                  type="button"
                  onClick={closeKeypad}
                  className="p-1 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-900/60 transition-colors"
                  title="Close keypad"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Quick Presets Row */}
            {quickPresets && quickPresets.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-indigo-900/60">
                {quickPresets.map((preset) => {
                  const isSelected = draft === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        applyNewValue(preset.value);
                        setReplaceOnNextKey(false);
                      }}
                      className={cn(
                        "flex-1 min-w-[38px] py-1 px-1.5 rounded-md text-[11px] font-mono font-semibold border transition-all active:scale-95",
                        isSelected
                          ? "bg-emerald-600/30 border-emerald-400 text-emerald-200"
                          : "bg-indigo-900/40 hover:bg-indigo-800/70 text-indigo-200 border-indigo-800/70"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4x4 Tactile Keypad Grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {/* Row 1 */}
              {["7", "8", "9"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitPress(d)}
                  className="h-10 rounded-lg bg-indigo-950/90 hover:bg-indigo-800/80 active:scale-95 border border-indigo-800/80 font-mono font-bold text-base text-white transition-all shadow-sm"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                title="Backspace"
                className="h-10 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 active:scale-95 border border-rose-800/60 flex items-center justify-center text-rose-200 transition-all"
              >
                <Delete className="w-4 h-4" />
              </button>

              {/* Row 2 */}
              {["4", "5", "6"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitPress(d)}
                  className="h-10 rounded-lg bg-indigo-950/90 hover:bg-indigo-800/80 active:scale-95 border border-indigo-800/80 font-mono font-bold text-base text-white transition-all shadow-sm"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                title="Clear"
                className="h-10 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 active:scale-95 border border-amber-800/60 font-mono font-bold text-xs text-amber-200 transition-all"
              >
                CLR
              </button>

              {/* Row 3 */}
              {["1", "2", "3"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitPress(d)}
                  className="h-10 rounded-lg bg-indigo-950/90 hover:bg-indigo-800/80 active:scale-95 border border-indigo-800/80 font-mono font-bold text-base text-white transition-all shadow-sm"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleStep(1)}
                title={`Increment (${incLabel})`}
                className="h-10 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 active:scale-95 border border-indigo-700/70 font-mono font-semibold text-xs text-indigo-200 transition-all"
              >
                {incLabel}
              </button>

              {/* Row 4 */}
              {allowColon ? (
                <button
                  type="button"
                  onClick={() => handleDigitPress(":")}
                  title="Colon separator (minutes:seconds)"
                  className="h-10 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 active:scale-95 border border-emerald-700/70 font-mono font-bold text-lg text-emerald-300 transition-all"
                >
                  :
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDigitPress("00")}
                  className="h-10 rounded-lg bg-indigo-950/70 hover:bg-indigo-800/80 active:scale-95 border border-indigo-800/80 font-mono font-bold text-sm text-indigo-200 transition-all"
                >
                  00
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDigitPress("0")}
                className="h-10 rounded-lg bg-indigo-950/90 hover:bg-indigo-800/80 active:scale-95 border border-indigo-800/80 font-mono font-bold text-base text-white transition-all shadow-sm"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleStep(-1)}
                title={`Decrement (${decLabel})`}
                className="h-10 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 active:scale-95 border border-indigo-700/70 font-mono font-semibold text-xs text-indigo-200 transition-all"
              >
                {decLabel}
              </button>

              <button
                type="button"
                onClick={closeKeypad}
                title="Done"
                className="h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 border border-emerald-400/80 flex items-center justify-center gap-1 font-semibold text-xs text-white shadow-md shadow-emerald-900/50 transition-all"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
