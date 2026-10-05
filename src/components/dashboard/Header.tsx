import React from "react";
import { Guitar, LogOut, Flame, HelpCircle } from "lucide-react";
import { Button } from "../ui/button";

interface HeaderProps {
  userEmail?: string | null;
  onSignOut: () => void;
  onOpenHelp?: () => void;
  currentStreak?: number;
  hasPracticedToday?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userEmail,
  onSignOut,
  onOpenHelp,
  currentStreak = 0,
  hasPracticedToday = false,
}) => {
  return (
    <header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10 print:hidden">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 text-indigo-300">
          <Guitar className="w-6 h-6" />
          <h1 className="font-bold text-lg tracking-tight">Practice Tracker</h1>

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

