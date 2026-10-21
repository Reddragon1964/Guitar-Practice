import React from "react";
import { Guitar, LogOut, Flame, HelpCircle, Settings, Sliders } from "lucide-react";
import { Button } from "../ui/button";
import { TextScaleControl } from "../ui/TextScaleControl";
import { SiteNavButton } from "./SiteNavButton";
import { useColorScheme } from "../../context/ColorSchemeContext";

interface HeaderProps {
  userEmail?: string | null;
  onSignOut: () => void;
  onOpenHelp?: () => void;
  onOpenSettings?: () => void;
  onOpenCustomize?: () => void;
  onNavigateHome?: () => void;
  currentStreak?: number;
  hasPracticedToday?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onSignOut,
  onOpenHelp,
  onOpenSettings,
  onOpenCustomize,
  onNavigateHome,
  currentStreak = 0,
  hasPracticedToday = false,
}) => {
  const { currentScheme } = useColorScheme();

  return (
    <header
      className="backdrop-blur-md border-b sticky top-0 z-10 print:hidden transition-colors duration-300"
      style={{
        backgroundColor: currentScheme.bgHeader,
        borderColor: currentScheme.borderColor,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 text-indigo-300">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left text-indigo-300 hover:text-white transition-colors cursor-pointer group focus:outline-none"
            title="Return to Dashboard Home"
          >
            <Guitar className="w-6 h-6 group-hover:scale-105 transition-transform text-indigo-400 group-hover:text-indigo-300" />
            <h1 className="font-bold text-lg tracking-tight group-hover:text-white">Practice Tracker</h1>
          </button>

          {/* Streak Pill in Header */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              currentStreak > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                : "bg-indigo-900/30 border-indigo-700/40 text-indigo-400"
            }`}
            title={`Current practice streak: ${currentStreak} day${currentStreak !== 1 ? "s" : ""}${
              hasPracticedToday ? " (Practiced today!)" : " (Pending today)"
            }`}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                currentStreak > 0 ? "fill-amber-400 text-amber-400 animate-pulse" : "text-indigo-400"
              }`}
            />
            <span>
              {currentStreak} {currentStreak === 1 ? "day streak" : "days"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Site Navigation Button at the Top */}
          <SiteNavButton variant="header" />

          {/* App-Wide Text Scaling Control */}
          <TextScaleControl variant="header" />

          {onOpenCustomize && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCustomize}
              className="gap-1.5 border-cyan-700/80 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/60 hover:text-white"
              title="Customize Glow Colors & Active Frame"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Customize</span>
            </Button>
          )}

          {onOpenSettings && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="gap-1.5 border-indigo-700/80 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800 hover:text-white"
              title="Open Settings & Color Schemes"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Settings</span>
            </Button>
          )}

          {onOpenHelp && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHelp}
              className="gap-1.5 border-indigo-700/80 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800 hover:text-white"
              title="Open Help Files & User Guide"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Help</span>
            </Button>
          )}

          <span className="text-sm text-indigo-400 hidden md:inline-block">{userEmail}</span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline-block">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

