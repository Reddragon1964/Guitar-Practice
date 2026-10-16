import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  ColorScheme,
  ColorSchemeId,
  DEFAULT_COLOR_SCHEMES,
} from "../types/theme";

interface ColorSchemeContextType {
  currentScheme: ColorScheme;
  schemeId: ColorSchemeId;
  setSchemeId: (id: ColorSchemeId) => void;
  colorSchemes: ColorScheme[];
  resetToDefaultScheme: () => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

const STORAGE_KEY = "guitar_dashboard_color_scheme";
const DEFAULT_SCHEME_ID: ColorSchemeId = "cyber-indigo";

function applySchemeToDOM(scheme: ColorScheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.setAttribute("data-color-scheme", scheme.id);

  // Set CSS Custom Properties for dynamic styling
  root.style.setProperty("--theme-bg-base", scheme.bgBase);
  root.style.setProperty("--theme-bg-gradient", scheme.bgGradient);
  root.style.setProperty("--theme-bg-card", scheme.bgCard);
  root.style.setProperty("--theme-bg-header", scheme.bgHeader);
  root.style.setProperty("--theme-primary", scheme.primaryColor);
  root.style.setProperty("--theme-primary-hover", scheme.primaryHover);
  root.style.setProperty("--theme-accent", scheme.accentColor);
  root.style.setProperty("--theme-border", scheme.borderColor);
  root.style.setProperty("--theme-border-subtle", scheme.borderSubtle);
}

export const ColorSchemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schemeId, setSchemeIdState] = useState<ColorSchemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_SCHEME_ID;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ColorSchemeId | null;
      if (saved && DEFAULT_COLOR_SCHEMES.some((s) => s.id === saved)) {
        return saved;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SCHEME_ID;
  });

  const currentScheme = useMemo(() => {
    return (
      DEFAULT_COLOR_SCHEMES.find((s) => s.id === schemeId) || DEFAULT_COLOR_SCHEMES[0]
    );
  }, [schemeId]);

  useEffect(() => {
    applySchemeToDOM(currentScheme);
    try {
      localStorage.setItem(STORAGE_KEY, schemeId);
    } catch {
      // Ignore storage quota
    }
  }, [schemeId, currentScheme]);

  const setSchemeId = (id: ColorSchemeId) => {
    if (DEFAULT_COLOR_SCHEMES.some((s) => s.id === id)) {
      setSchemeIdState(id);
    }
  };

  const resetToDefaultScheme = () => {
    setSchemeIdState(DEFAULT_SCHEME_ID);
  };

  const value = useMemo(
    () => ({
      currentScheme,
      schemeId,
      setSchemeId,
      colorSchemes: DEFAULT_COLOR_SCHEMES,
      resetToDefaultScheme,
    }),
    [currentScheme, schemeId]
  );

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
};

export function useColorScheme(): ColorSchemeContextType {
  const context = useContext(ColorSchemeContext);
  if (!context) {
    throw new Error("useColorScheme must be used within a ColorSchemeProvider");
  }
  return context;
}
