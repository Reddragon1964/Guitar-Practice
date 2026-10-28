import React from "react";
import { Flame, Trophy, Calendar, CheckCircle2, Zap, ArrowRight, Award, Guitar } from "lucide-react";
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
    totalSessionsLogged = 0,
    todaySessionCount = 0,
    hasPracticedToday,
    nextMilestoneDays = 7,
    milestoneProgressPct = 0,
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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Main Practice Streak Counter & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-1">
            <div className="flex items-center gap-4">
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
                    currentStreak > 0
                      ? "fill-amber-400 text-orange-400 animate-pulse"
                      : "text-indigo-400"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300/90 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    Practice Streak Counter
                  </span>
                  <span className="text-[11px] font-mono text-indigo-300/80">
                    Consecutive days with ≥ 1 logged session
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight text-white">
                    {currentStreak}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-indigo-200">
                    {currentStreak === 1 ? "Consecutive Day" : "Consecutive Days"}
                  </span>
                </div>

                {/* Status Message & Action */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {hasPracticedToday ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono tabular-nums">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Practiced today ({todaySessionCount}{" "}
                      {todaySessionCount === 1 ? "session" : "sessions"} logged)
                    </span>
                  ) : currentStreak > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950/60 border border-amber-500/40 text-amber-300">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Log 1 session today to extend your streak to {currentStreak + 1} days!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-900/40 border border-indigo-700/50 text-indigo-300">
                      Log a guitar session today to start your consecutive day streak
                    </span>
                  )}

                  {!hasPracticedToday && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={onLogSession}
                      className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold gap-1 print:hidden cursor-pointer"
                    >
                      <span>Log Session Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Next Streak Milestone Progress Bar */}
            <div className="sm:ml-auto lg:ml-4 w-full sm:w-52 p-3 rounded-xl bg-slate-900/80 border border-indigo-800/70 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-indigo-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Next Streak Goal
                </span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {currentStreak} / {nextMilestoneDays}d
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-indigo-950 overflow-hidden border border-indigo-800/80">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${milestoneProgressPct}%` }}
                />
              </div>
              <div className="text-[10px] text-indigo-300/80 font-mono tabular-nums flex items-center justify-between">
                <span>
                  {Math.max(0, nextMilestoneDays - currentStreak)} more{" "}
                  {nextMilestoneDays - currentStreak === 1 ? "day" : "days"} to go
                </span>
                <span>{milestoneProgressPct}%</span>
              </div>
            </div>
          </div>

          {/* Right Section: 7-Day Activity Timeline & Secondary Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 lg:gap-7 border-t xl:border-t-0 pt-4 xl:pt-0 border-indigo-900/60">
            {/* 7-Day Activity Bar */}
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-300/80 flex items-center justify-between gap-2">
                <span>Last 7 Days Activity</span>
                {hasPracticedToday && (
                  <span className="text-emerald-400 font-mono text-[10px] font-semibold">
                    ● Active Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {recentDays.map((day) => (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1 group relative cursor-default"
                    title={`${day.fullDateLabel}: ${
                      day.practiced
                        ? `${day.sessionCount} ${
                            day.sessionCount === 1 ? "session" : "sessions"
                          } logged${day.bestAccuracy !== null ? ` • Best Acc: ${day.bestAccuracy}%` : ""}`
                        : "No practice session logged"
                    }`}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex flex-col items-center justify-center text-xs font-mono tabular-nums transition-all relative",
                        day.practiced
                          ? "bg-amber-500/20 border border-amber-400/70 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          : day.isToday
                          ? "bg-indigo-900/30 border-2 border-dashed border-indigo-500 text-indigo-400"
                          : "bg-indigo-950/60 border border-indigo-900/80 text-indigo-500"
                      )}
                    >
                      {day.practiced ? (
                        <>
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-300" />
                          {day.sessionCount > 1 && (
                            <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center border border-slate-950">
                              {day.sessionCount}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-indigo-400/60">
                          {day.isToday ? "•" : "—"}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-semibold font-mono",
                        day.isToday ? "text-indigo-200 font-bold" : "text-indigo-400/70"
                      )}
                    >
                      {day.dayLabel.slice(0, 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Metrics: Best Streak, Active Days & Total Firestore Sessions */}
            <div className="flex items-center gap-4 sm:gap-5 border-l border-indigo-800/60 pl-0 sm:pl-5">
              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>Best Streak</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-indigo-100">
                  {longestStreak} <span className="text-xs font-normal text-indigo-300">days</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Active Days</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-indigo-100">
                  {totalPracticeDays}{" "}
                  <span className="text-xs font-normal text-indigo-300">days</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Guitar className="w-3 h-3 text-emerald-400" />
                  <span>Logged</span>
                </div>
                <div className="text-lg font-bold font-mono tabular-nums text-indigo-100">
                  {totalSessionsLogged}{" "}
                  <span className="text-xs font-normal text-indigo-300">sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

