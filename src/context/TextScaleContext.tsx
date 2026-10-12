import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export interface TextScalePreset {
  label: string;
  value: number;
  description: string;
}

export const TEXT_SCALE_PRESETS: TextScalePreset[] = [
  { label: "Compact", value: 85, description: "More content on screen" },
  { label: "Default", value: 100, description: "Standard 100% text" },
  { label: "Large", value: 115, description: "Comfortable reading" },
  { label: "X-Large", value: 130, description: "High visibility" },
  { label: "Maximum", value: 145, description: "Max accessibility" },
];

export const MIN_TEXT_SCALE = 75;
export const MAX_TEXT_SCALE = 160;
export const DEFAULT_TEXT_SCALE = 100;

interface TextScaleContextType {
  scale: number;
  setScale: (newScale: number) => void;
  increaseScale: () => void;
  decreaseScale: () => void;
  resetScale: () => void;
  presets: TextScalePreset[];
}

const TextScaleContext = createContext<TextScaleContextType | undefined>(undefined);

const STORAGE_KEY = "guitar_tracker_text_scale";

function applyScaleToDOM(scaleVal: number) {
  if (typeof document === "undefined") return;

  const safeScale = Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, scaleVal));
  // Apply root font-size percentage (e.g. 100%, 115%, 130%)
  // This smoothly scales all Tailwind rem-based typography (text-xs, text-sm, text-base, text-lg, etc.)
  document.documentElement.style.fontSize = `${safeScale}%`;

  // Apply CSS custom property for arbitrary pixel classes and fine-grained math
  document.documentElement.style.setProperty("--app-text-scale", String(safeScale / 100));

  // Set data attribute for targeted CSS selectors
  document.documentElement.setAttribute("data-text-scale", String(safeScale));
}

export const TextScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScaleState] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_TEXT_SCALE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= MIN_TEXT_SCALE && parsed <= MAX_TEXT_SCALE) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_TEXT_SCALE;
  });

  useEffect(() => {
    applyScaleToDOM(scale);
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch {
      // ignore storage quota errors
    }
  }, [scale]);

  const setScale = (newScale: number) => {
    const clamped = Math.min(MAX_TEXT_SCALE, Math.max(MIN_TEXT_SCALE, Math.round(newScale)));
    setScaleState(clamped);
  };

  const increaseScale = () => {
    setScaleState((prev) => Math.min(MAX_TEXT_SCALE, prev + 5));
  };

  const decreaseScale = () => {
    setScaleState((prev) => Math.max(MIN_TEXT_SCALE, prev - 5));
  };

  const resetScale = () => {
    setScaleState(DEFAULT_TEXT_SCALE);
  };

  const value = useMemo(
    () => ({
      scale,
      setScale,
      increaseScale,
      decreaseScale,
      resetScale,
      presets: TEXT_SCALE_PRESETS,
    }),
    [scale]
  );

  return <TextScaleContext.Provider value={value}>{children}</TextScaleContext.Provider>;
};

export function useTextScale(): TextScaleContextType {
  const context = useContext(TextScaleContext);
  if (!context) {
    throw new Error("useTextScale must be used within a TextScaleProvider");
  }
  return context;
}
