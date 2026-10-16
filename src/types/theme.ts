export type ColorSchemeId =
  | "cyber-indigo"
  | "emerald-groove"
  | "synthwave-sunset"
  | "sunburst-tweed"
  | "electric-ocean"
  | "crimson-rock"
  | "midnight-carbon";

export type NeonColor = "cyan" | "magenta" | "emerald" | "amber" | "violet" | "crimson";
export type GridDarkness = "deep" | "obsidian" | "charcoal" | "white";

export interface ColorScheme {
  id: ColorSchemeId;
  name: string;
  tagline: string;
  description: string;
  category: "Standard" | "Stage & Studio" | "Retro" | "Vintage" | "Studio";
  primaryColor: string; // e.g. #6366f1
  primaryHover: string;
  accentColor: string; // secondary highlight
  bgBase: string; // root container background color
  bgGradient: string; // CSS background gradient or radial atmosphere
  bgCard: string; // card container background
  bgHeader: string; // header bar background
  borderColor: string; // card / section border
  borderSubtle: string; // subtle inner border
  textAccent: string; // Tailwind text accent class e.g. text-indigo-300
  defaultNeon: NeonColor;
  defaultGrid: GridDarkness;
  previewColors: [string, string, string, string]; // [Background, Surface, Primary Accent, Neon Accent]
}

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "cyber-indigo",
    name: "Cyber Indigo",
    tagline: "High-tech studio & electric blue highlights",
    description: "The signature studio theme. Deep midnight indigo space with sharp electric cyan accents and cool ambient lighting.",
    category: "Standard",
    primaryColor: "#6366f1",
    primaryHover: "#4f46e5",
    accentColor: "#22d3ee",
    bgBase: "#020617",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(49, 46, 129, 0.25) 0%, rgba(2, 6, 23, 1) 75%)",
    bgCard: "rgba(15, 23, 42, 0.95)",
    bgHeader: "rgba(30, 27, 75, 0.65)",
    borderColor: "#312e81",
    borderSubtle: "#1e1b4b",
    textAccent: "text-indigo-300",
    defaultNeon: "cyan",
    defaultGrid: "deep",
    previewColors: ["#020617", "#0f172a", "#6366f1", "#22d3ee"],
  },
  {
    id: "emerald-groove",
    name: "Emerald Groove",
    tagline: "Organic forest tones & luminous mint",
    description: "Deep lush pine & dark forest backgrounds paired with vibrant emerald accents for natural focus and calm endurance.",
    category: "Stage & Studio",
    primaryColor: "#10b981",
    primaryHover: "#059669",
    accentColor: "#34d399",
    bgBase: "#02140e",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(6, 78, 59, 0.3) 0%, rgba(2, 20, 14, 1) 75%)",
    bgCard: "rgba(4, 34, 25, 0.95)",
    bgHeader: "rgba(4, 46, 33, 0.7)",
    borderColor: "#065f46",
    borderSubtle: "#042f22",
    textAccent: "text-emerald-300",
    defaultNeon: "emerald",
    defaultGrid: "deep",
    previewColors: ["#02140e", "#042219", "#10b981", "#34d399"],
  },
  {
    id: "synthwave-sunset",
    name: "Synthwave Sunset",
    tagline: "80s retro neon pink & velvet purple",
    description: "Electrifying 80s arcade and hair-metal aesthetic. Deep dark plum velvet backdrop with neon magenta and glowing pink pulses.",
    category: "Retro",
    primaryColor: "#ec4899",
    primaryHover: "#db2777",
    accentColor: "#d946ef",
    bgBase: "#0e0319",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(134, 25, 143, 0.3) 0%, rgba(14, 3, 25, 1) 75%)",
    bgCard: "rgba(28, 9, 48, 0.95)",
    bgHeader: "rgba(45, 12, 75, 0.7)",
    borderColor: "#86198f",
    borderSubtle: "#4a044e",
    textAccent: "text-pink-300",
    defaultNeon: "magenta",
    defaultGrid: "charcoal",
    previewColors: ["#0e0319", "#1c0930", "#ec4899", "#d946ef"],
  },
  {
    id: "sunburst-tweed",
    name: "Sunburst Tweed",
    tagline: "Warm vintage tube amp & golden lacquer",
    description: "Classic vintage lacquer sunburst and warm tweed amp cabinet feel. Espresso brown undertones with golden bronze and rich amber glows.",
    category: "Vintage",
    primaryColor: "#f59e0b",
    primaryHover: "#d97706",
    accentColor: "#fbbf24",
    bgBase: "#120a05",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(146, 64, 14, 0.28) 0%, rgba(18, 10, 5, 1) 75%)",
    bgCard: "rgba(33, 20, 11, 0.95)",
    bgHeader: "rgba(48, 27, 14, 0.7)",
    borderColor: "#78350f",
    borderSubtle: "#451a03",
    textAccent: "text-amber-300",
    defaultNeon: "amber",
    defaultGrid: "charcoal",
    previewColors: ["#120a05", "#21140b", "#f59e0b", "#fbbf24"],
  },
  {
    id: "electric-ocean",
    name: "Electric Ocean",
    tagline: "Deep oceanic navy & arctic blue clarity",
    description: "High-contrast oceanic abyss backdrop with vibrant sky blue and aquamarine accents for crystal-clear readability.",
    category: "Stage & Studio",
    primaryColor: "#0284c7",
    primaryHover: "#0369a1",
    accentColor: "#38bdf8",
    bgBase: "#031120",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(3, 105, 161, 0.28) 0%, rgba(3, 17, 32, 1) 75%)",
    bgCard: "rgba(6, 28, 50, 0.95)",
    bgHeader: "rgba(7, 38, 70, 0.7)",
    borderColor: "#0369a1",
    borderSubtle: "#072b4a",
    textAccent: "text-sky-300",
    defaultNeon: "cyan",
    defaultGrid: "deep",
    previewColors: ["#031120", "#061c32", "#0284c7", "#38bdf8"],
  },
  {
    id: "crimson-rock",
    name: "Crimson Rock",
    tagline: "Heavy rock bloodwood & fiery crimson lights",
    description: "Aggressive heavy rock concert styling. Deep dark ruby obsidian background with fiery red laser lines and blazing crimson accents.",
    category: "Stage & Studio",
    primaryColor: "#f43f5e",
    primaryHover: "#e11d48",
    accentColor: "#ef4444",
    bgBase: "#140307",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(159, 18, 57, 0.3) 0%, rgba(20, 3, 7, 1) 75%)",
    bgCard: "rgba(35, 7, 14, 0.95)",
    bgHeader: "rgba(48, 9, 19, 0.7)",
    borderColor: "#9f1239",
    borderSubtle: "#4c0519",
    textAccent: "text-rose-300",
    defaultNeon: "crimson",
    defaultGrid: "charcoal",
    previewColors: ["#140307", "#23070e", "#f43f5e", "#ef4444"],
  },
  {
    id: "midnight-carbon",
    name: "Midnight Carbon",
    tagline: "Minimalist carbon console & high-contrast silver",
    description: "Precision distraction-free carbon black finish inspired by audio mixing consoles, pairing pure zinc neutrals with crisp high-contrast white grids.",
    category: "Studio",
    primaryColor: "#e4e4e7",
    primaryHover: "#d4d4d8",
    accentColor: "#ffffff",
    bgBase: "#09090b",
    bgGradient: "radial-gradient(ellipse at 50% 0%, rgba(63, 63, 70, 0.25) 0%, rgba(9, 9, 11, 1) 80%)",
    bgCard: "rgba(24, 24, 27, 0.95)",
    bgHeader: "rgba(39, 39, 42, 0.7)",
    borderColor: "#3f3f46",
    borderSubtle: "#27272a",
    textAccent: "text-zinc-200",
    defaultNeon: "cyan",
    defaultGrid: "white",
    previewColors: ["#09090b", "#18181b", "#e4e4e7", "#ffffff"],
  },
];
