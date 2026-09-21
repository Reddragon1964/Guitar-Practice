import React from "react";
import { Flame, Trophy, Calendar, CheckCircle2, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { StreakInfo } from "../../utils/streakCalculator";
import { PrintMode } from "../../types";
import { cn } from "../../lib/utils";

interface StreakCardProps {
  streakInfo: StreakInfo;
  onLogSession: () => void;
  printMode?: PrintMode;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streakInfo,
  onLogSession,
  printMode,
}) => {
  const {
    currentStreak,
    longestStreak,
    totalPracticeDays,
    hasPracticedToday,
    recentDays,
  } = streakInfo;

  const isHiddenForPrint = printMode && printMode !== "all";

  return (
    <Card
      className={cn(
        "border-indigo-800/60 bg-gradient-to-r from-indigo-950/60 via-slate-950/50 to-indigo-950/60 backdrop-blur-sm overflow-hidden relative shadow-[0_0_25px_rgba(99,102,241,0.08)]",
        isHiddenForPrint && "print:hidden"
      )}
    >
      {/* Subtle Background Glow for Active Streak */}
      {currentStreak > 0 && (
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Streak Counter & Status */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div
              className={cn(
                "p-3.5 rounded-2xl flex items-center justify-center border transition-all duration-300 shrink-0",
                currentStreak > 0
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                  : "bg-indigo-900/30 border-indigo-700/50 text-indigo-400"
              )}
            >
              <Flame
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10",
                  currentStreak > 0 ? "fill-amber-400 text-orange-400 animate-pulse" : "text-indigo-400"
                )}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
                  {currentStreak}
                </span>
                <span className="text-base sm:text-lg font-semibold text-indigo-200">
                  {currentStreak === 1 ? "Day Streak" : "Days Consecutive"}
                </span>
              </div>

              {/* Status Message & Action */}
              <div className="flex flex-wrap items-center gap-2">
                {hasPracticedToday ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Practiced today! Streak secured
                  </span>
                ) : currentStreak > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/40 text-amber-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Practice today to reach {currentStreak + 1} days!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/40 border border-indigo-700/50 text-indigo-300">
                    Play today to start your streak
                  </span>
                )}

                {!hasPracticedToday && (
                  <button
                    onClick={onLogSession}
                    className="text-xs text-indigo-300 hover:text-white underline underline-offset-2 flex items-center gap-1 transition-colors print:hidden ml-1"
                  >
                    <span>Log session now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: 7-Day Activity Timeline & Secondary Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-indigo-900/60">
            {/* 7-Day Activity Bar */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-300/80 flex items-center justify-between">
                <span>Last 7 Days</span>
                {hasPracticedToday && (
                  <span className="text-emerald-400 font-normal">Active Today</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {recentDays.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1 group relative cursor-default"
                    title={`${day.fullDateLabel}: ${day.practiced ? "Practiced" : "No practice logged"}`}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all",
                        day.practiced
                          ? "bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          : day.isToday
                          ? "bg-indigo-900/30 border-2 border-dashed border-indigo-500 text-indigo-400"
                          : "bg-indigo-950/60 border border-indigo-900/80 text-indigo-500"
                      )}
                    >
                      {day.practiced ? (
                        <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-300" />
                      ) : (
                        <span className="text-[10px] text-indigo-400/60">
                          {day.isToday ? "•" : "—"}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        day.isToday ? "text-indigo-200 font-bold" : "text-indigo-400/70"
                      )}
                    >
                      {day.dayLabel.slice(0, 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics: Best Streak & Total Days */}
            <div className="flex items-center gap-4 sm:gap-6 border-l border-indigo-850 pl-0 sm:pl-6">
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>Best Streak</span>
                </div>
                <div className="text-lg font-bold font-mono text-indigo-100">
                  {longestStreak} <span className="text-xs font-normal text-indigo-300">days</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Total Active</span>
                </div>
                <div className="text-lg font-bold font-mono text-indigo-100">
                  {totalPracticeDays} <span className="text-xs font-normal text-indigo-300">days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
