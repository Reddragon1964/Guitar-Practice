import React from "react";
import {
  Target,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Music,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { WeeklyGoal, PrintMode } from "../../types";
import {
  GoalProgress,
  formatTimeMinutes,
} from "../../utils/goalCalculator";
import { cn } from "../../lib/utils";

interface WeeklyGoalsSectionProps {
  overallProgress?: GoalProgress;
  songProgresses: GoalProgress[];
  weekRangeLabel: string;
  daysRemainingInWeek: number;
  onOpenAddGoalModal: (goal?: WeeklyGoal) => void;
  onDeleteGoal: (id: string) => void;
  onQuickAdjust: (id: string, deltaMinutes: number) => void;
  printMode?: PrintMode;
}

export const WeeklyGoalsSection: React.FC<WeeklyGoalsSectionProps> = ({
  overallProgress,
  songProgresses,
  weekRangeLabel,
  daysRemainingInWeek,
  onOpenAddGoalModal,
  onDeleteGoal,
  onQuickAdjust,
  printMode,
}) => {
  const isHiddenForPrint = printMode && printMode !== "all";
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // Trigger smooth fill animation on initial load and mount
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  const renderGoalCard = (progress: GoalProgress, isOverall: boolean = false) => {
    const percentClamped = Math.min(100, Math.max(0, progress.percentage));
    const isCompleted = progress.isAchieved;
    const currentWidthPercent = isMounted ? percentClamped : 0;

    return (
      <div
        key={progress.goalId}
        className={cn(
          "p-4 sm:p-5 rounded-xl border transition-all relative overflow-hidden",
          isOverall
            ? "bg-gradient-to-br from-indigo-950/70 via-slate-950/60 to-purple-950/70 border-indigo-700/60 shadow-lg shadow-indigo-950/30"
            : "bg-indigo-950/40 border-indigo-800/50 hover:border-indigo-700/60"
        )}
      >
        {/* Glow effect on completion */}
        {isCompleted && (
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "p-2 rounded-lg border shrink-0",
                isCompleted
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : isOverall
                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                  : "bg-purple-600/20 border-purple-500/40 text-purple-300"
              )}
            >
              {isOverall ? (
                <Target className="w-4 h-4" />
              ) : (
                <Music className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {progress.title}
                </h4>
                {isOverall && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                    Main Target
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300/80">
                Target:{" "}
                <span className="font-semibold text-indigo-100">
                  {formatTimeMinutes(progress.targetMinutes)}
                </span>{" "}
                / week
              </p>
            </div>
          </div>

          {/* Action buttons (Edit, Delete, Quick Adjust) */}
          <div className="flex items-center gap-1.5 self-end sm:self-center print:hidden">
            <div className="hidden sm:flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={() => onQuickAdjust(progress.goalId, -15)}
                className="px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/40 transition-colors"
                title="Decrease target by 15 minutes"
              >
                -15m
              </button>
              <button
                type="button"
                onClick={() => onQuickAdjust(progress.goalId, 15)}
                className="px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-900/50 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/40 transition-colors"
                title="Increase target by 15 minutes"
              >
                +15m
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onOpenAddGoalModal({
                  id: progress.goalId,
                  userId: "",
                  title: progress.title,
                  songTitle: progress.songTitle,
                  targetMinutes: progress.targetMinutes,
                  createdAt: 0,
                })
              }
              className="h-7 w-7 p-0 text-indigo-300 hover:text-white hover:bg-indigo-800/50"
              title="Edit goal target"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>

            {!isOverall && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteGoal(progress.goalId)}
                className="h-7 w-7 p-0 text-indigo-400 hover:text-red-400 hover:bg-red-950/40"
                title="Delete target"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Metrics & Bar */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-white">
                {formatTimeMinutes(progress.loggedMinutes)}
              </span>
              <span className="text-xs text-indigo-300">
                logged of {formatTimeMinutes(progress.targetMinutes)}
              </span>
            </div>

            <span
              className={cn(
                "font-mono font-bold text-sm px-2 py-0.5 rounded",
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
              )}
            >
              {progress.percentage}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="relative h-3.5 w-full bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-indigo-800/80 shadow-inner">
            {/* Smooth animated progress fill */}
            <div
              className={cn(
                "relative h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[width] overflow-hidden",
                isCompleted
                  ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-progress-glow"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              )}
              style={{ width: `${currentWidthPercent}%` }}
            >
              {/* Subtle traveling light shimmer across the fill */}
              {currentWidthPercent > 0 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-progress-shimmer" />
                </div>
              )}

              {/* Leading edge light highlight */}
              {currentWidthPercent > 0 && currentWidthPercent < 100 && (
                <div className="absolute top-0 right-0 bottom-0 w-1.5 rounded-r-full bg-white/60 blur-[0.5px] pointer-events-none" />
              )}
            </div>
          </div>

          {/* Time Remaining / Achievement Indicator (Core user request) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            {isCompleted ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Goal Reached for the Week!</span>
                {progress.extraMinutes > 0 && (
                  <span className="text-emerald-200 font-normal">
                    (+{formatTimeMinutes(progress.extraMinutes)} bonus)
                  </span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong>{formatTimeMinutes(progress.remainingMinutes)}</strong> left
                  to reach goal
                </span>
              </div>
            )}

            {/* Daily Pace Recommendation */}
            {!isCompleted && progress.remainingMinutes > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-indigo-300/90 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Pace: ~<strong>{progress.paceNeededMinutes}m/day</strong> over{" "}
                  {progress.daysRemainingInWeek}{" "}
                  {progress.daysRemainingInWeek === 1 ? "day" : "days"} left
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasAnyGoals = Boolean(overallProgress || songProgresses.length > 0);

  return (
    <Card
      className={cn(
        "border-indigo-800/60 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-950 text-indigo-50 shadow-xl shadow-indigo-950/20 overflow-hidden",
        isHiddenForPrint && "print:hidden"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-indigo-800/40 bg-indigo-950/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 text-indigo-300 shadow-sm">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl text-white font-bold">
                Weekly Practice Goals
              </CardTitle>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-900/40 border border-indigo-700/50 text-indigo-300">
                <Calendar className="w-3 h-3 text-indigo-400" />
                {weekRangeLabel}
              </span>
            </div>
            <p className="text-xs text-indigo-300/80 mt-0.5">
              Track your weekly targets with real-time practice duration progress bars.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <Button
            size="sm"
            onClick={() => onOpenAddGoalModal()}
            className="h-8 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs gap-1.5 border border-indigo-500/40 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Target</span>
            <span className="sm:hidden">Target</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Week Summary Pill on Mobile */}
        <div className="sm:hidden flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-800/50 text-indigo-300">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            {weekRangeLabel}
          </span>
          <span className="font-semibold text-indigo-200">
            {daysRemainingInWeek} {daysRemainingInWeek === 1 ? "day" : "days"} left
          </span>
        </div>

        {/* Goals List */}
        {hasAnyGoals ? (
          <div className="space-y-4">
            {/* Main Overall Weekly Goal */}
            {overallProgress && renderGoalCard(overallProgress, true)}

            {/* Song Specific Goals Grid */}
            {songProgresses.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-indigo-900/60 pb-1.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    Song Practice Targets ({songProgresses.length})
                  </h5>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {songProgresses.map((songProg) => renderGoalCard(songProg, false))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Quick Setup State */
          <div className="p-6 rounded-xl border border-dashed border-indigo-800/70 bg-indigo-950/20 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-900/30 border border-indigo-700/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-bold text-white">
                Set Your First Weekly Practice Target
              </h4>
              <p className="text-xs text-indigo-300/80">
                Establish a consistent routine by defining how many hours you plan to play
                this week. Watch your progress bar fill as you log sessions.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Button
                size="sm"
                onClick={() =>
                  onOpenAddGoalModal({
                    id: "",
                    userId: "",
                    title: "Overall Weekly Practice",
                    targetMinutes: 120,
                    createdAt: 0,
                  })
                }
                className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 text-xs"
              >
                2 Hours / week
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  onOpenAddGoalModal({
                    id: "",
                    userId: "",
                    title: "Overall Weekly Practice",
                    targetMinutes: 180,
                    createdAt: 0,
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30"
              >
                3 Hours / week (Recommended)
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  onOpenAddGoalModal({
                    id: "",
                    userId: "",
                    title: "Overall Weekly Practice",
                    targetMinutes: 300,
                    createdAt: 0,
                  })
                }
                className="bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 text-xs"
              >
                5 Hours / week
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenAddGoalModal()}
                className="border-indigo-700 text-indigo-300 hover:bg-indigo-900/50 text-xs"
              >
                Custom Target...
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
