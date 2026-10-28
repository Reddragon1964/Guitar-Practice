import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  Printer,
  Calendar,
  Award,
  Activity,
  Maximize2,
  Gauge,
  Trophy,
  Target,
  Sparkles,
  Flag,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  subDays,
  subMonths,
  startOfMonth,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Practice, Song, Goal, WeeklyGoal, PrintMode } from "../../types";
import { getSessionDurationMinutes } from "./DurationTrendsPage";
import { cn } from "../../lib/utils";

export interface WeeklyTrendPoint {
  weekKey: string;
  weekLabel: string;
  weekRange: string;
  accuracy: number | null;
  accuracyDelta: number | null;
  weeklyHours: number;
  cumulativeHours: number;
  weeklyMinutes: number;
  cumulativeMinutes: number;
  sessionCount: number;
}

export type ProgressTimeframe = "weekly" | "monthly" | "yearly";

export interface MilestoneEventItem {
  id: string;
  date: string;
  title: string;
  category: "goal-achieved" | "weekly-target" | "accuracy-mastery" | "speed-breakthrough";
  songTitle?: string;
  detail: string;
}

export interface AdvancedProgressPoint {
  date: string; // YYYY-MM-DD
  dateLabel: string; // e.g. "Mon Oct 20" or "Oct 20"
  fullDateLabel: string; // e.g. "Oct 20, 2026"
  dailyAccuracy: number | null;
  peakAccuracy: number | null;
  accuracyDelta: number | null;
  dailySpeed: number | null;
  peakSpeed: number | null;
  speedDelta: number | null;
  practiceMinutes: number;
  sessionCount: number;
  songsPracticed: string[];
  milestones: MilestoneEventItem[];
  hasMilestone: boolean;
  milestoneMarkerY: number | null;
}

interface PracticeTrendsSectionProps {
  practices: Practice[];
  activeSongs: Song[];
  goals?: Goal[];
  weeklyGoals?: WeeklyGoal[];
  usageLogs?: { date: string; minutes: number }[];
  printMode: PrintMode;
  onPrint: (mode: "trends") => void;
  onOpenFullTrends?: () => void;
  gridStroke?: string;
}

type WeeksRangeOption = "4w" | "8w" | "12w" | "24w" | "all";
type ChartModeOption = "advanced-progress" | "weekly-hours";

function formatHoursAndMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

function normalizeDateKey(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;
  const part = raw.trim().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  try {
    const parsed = parseISO(raw.trim());
    if (!isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
  } catch {}
  return null;
}

export function buildWeeklyTrendsData(
  practices: Practice[],
  usageLogs: { date: string; minutes: number }[] = [],
  weeksRange: WeeksRangeOption = "12w",
  songFilter: string = ""
): WeeklyTrendPoint[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  let numWeeks = 12;
  if (weeksRange === "4w") numWeeks = 4;
  else if (weeksRange === "8w") numWeeks = 8;
  else if (weeksRange === "12w") numWeeks = 12;
  else if (weeksRange === "24w") numWeeks = 24;
  else if (weeksRange === "all") {
    if (practices.length > 0) {
      const earliestDateStr = practices.reduce(
        (min, p) => (p.date < min ? p.date : min),
        practices[0].date
      );
      try {
        const earliestDate = parseISO(earliestDateStr);
        const diffMs =
          currentWeekStart.getTime() - startOfWeek(earliestDate, { weekStartsOn: 1 }).getTime();
        const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
        numWeeks = Math.max(4, Math.min(52, diffWeeks));
      } catch {
        numWeeks = 12;
      }
    } else {
      numWeeks = 8;
    }
  }

  const filteredPractices = songFilter
    ? practices.filter((p) => p.songTitle === songFilter)
    : practices;

  const points: WeeklyTrendPoint[] = [];
  let runningTotalMinutes = 0;
  let previousValidAccuracy: number | null = null;

  for (let i = numWeeks - 1; i >= 0; i--) {
    const wStart = subWeeks(currentWeekStart, i);
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
    const weekKey = format(wStart, "yyyy-MM-dd");
    const weekLabel = format(wStart, "MMM d");
    const weekRange = `${format(wStart, "MMM d")} – ${format(wEnd, "MMM d, yyyy")}`;

    const weekPractices = filteredPractices.filter((p) => {
      try {
        const pDate = parseISO(p.date);
        return isWithinInterval(pDate, { start: wStart, end: wEnd });
      } catch {
        return false;
      }
    });

    const accuracySessions = weekPractices.filter(
      (p) => !p.isTestSession || p.correctNotes > 0
    );
    const accuracy =
      accuracySessions.length > 0
        ? Math.round(
            accuracySessions.reduce((sum, p) => sum + p.accuracy, 0) /
              accuracySessions.length
          )
        : null;

    const accuracyDelta =
      accuracy !== null && previousValidAccuracy !== null
        ? accuracy - previousValidAccuracy
        : null;

    if (accuracy !== null) {
      previousValidAccuracy = accuracy;
    }

    let weeklyMinutes = 0;
    if (songFilter) {
      weeklyMinutes = weekPractices.reduce((sum, p) => {
        if (typeof p.duration === "number" && p.duration > 0) {
          return sum + p.duration / 60;
        }
        return sum + getSessionDurationMinutes(p).minutes;
      }, 0);
    } else {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(wStart);
        dayDate.setDate(dayDate.getDate() + d);
        const dateStr = format(dayDate, "yyyy-MM-dd");
        const usageMins = usageLogs.find((u) => u.date === dateStr)?.minutes || 0;
        const dayPractices = weekPractices.filter((p) => p.date === dateStr);
        const practiceMins = dayPractices.reduce((sum, p) => {
          if (typeof p.duration === "number" && p.duration > 0) {
            return sum + p.duration / 60;
          }
          return sum + getSessionDurationMinutes(p).minutes;
        }, 0);
        weeklyMinutes += Math.max(usageMins, practiceMins);
      }
    }

    runningTotalMinutes += weeklyMinutes;

    const weeklyHours = Number((weeklyMinutes / 60).toFixed(2));
    const cumulativeHours = Number((runningTotalMinutes / 60).toFixed(2));

    points.push({
      weekKey,
      weekLabel,
      weekRange,
      accuracy,
      accuracyDelta,
      weeklyHours,
      cumulativeHours,
      weeklyMinutes: Math.round(weeklyMinutes),
      cumulativeMinutes: Math.round(runningTotalMinutes),
      sessionCount: weekPractices.length,
    });
  }

  return points;
}

/**
 * Builds daily accuracy scores, practice speed trends, and goal/milestone markers
 * across Weekly (7 days), Monthly (30 days), or Yearly (365 days) timeframes.
 */
export function buildAdvancedProgressData(
  practices: Practice[],
  goals: Goal[] = [],
  weeklyGoals: WeeklyGoal[] = [],
  timeframe: ProgressTimeframe = "monthly",
  songFilter: string = ""
): AdvancedProgressPoint[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const daysCount = timeframe === "weekly" ? 7 : timeframe === "monthly" ? 30 : 365;
  const startDate = subDays(now, daysCount - 1);
  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(now, "yyyy-MM-dd");

  const filteredPractices = songFilter
    ? practices.filter(
        (p) => p.songTitle && p.songTitle.trim().toLowerCase() === songFilter.trim().toLowerCase()
      )
    : practices;

  const filteredGoals = songFilter
    ? goals.filter(
        (g) =>
          !g.songTitle ||
          g.songTitle.trim().toLowerCase() === songFilter.trim().toLowerCase()
      )
    : goals;

  // Group sessions by normalized YYYY-MM-DD date
  const sessionsByDate = new Map<string, Practice[]>();
  filteredPractices.forEach((p) => {
    const dKey = normalizeDateKey(p.date);
    if (!dKey) return;
    if (dKey < startDateStr || dKey > endDateStr) return;
    const list = sessionsByDate.get(dKey) || [];
    list.push(p);
    sessionsByDate.set(dKey, list);
  });

  // Map milestones & goals met by date
  const milestonesByDate = new Map<string, MilestoneEventItem[]>();
  const addMilestone = (dateKey: string, item: MilestoneEventItem) => {
    if (dateKey < startDateStr || dateKey > endDateStr) return;
    const existing = milestonesByDate.get(dateKey) || [];
    if (!existing.some((e) => e.title === item.title && e.category === item.category)) {
      existing.push(item);
      milestonesByDate.set(dateKey, existing);
    }
  };

  // 1. Custom User Goals & Milestones from Firestore `goals`
  filteredGoals.forEach((g) => {
    const targetKey = normalizeDateKey(g.targetDate);
    const createdKey = g.createdAt ? format(new Date(g.createdAt), "yyyy-MM-dd") : null;
    if (g.achieved) {
      // Place on targetDate if within range, otherwise on latest matching session date or createdKey
      let eventDate = targetKey;
      if (!eventDate || eventDate < startDateStr || eventDate > endDateStr) {
        const matchingSessions = filteredPractices.filter(
          (p) => !g.songTitle || p.songTitle === g.songTitle
        );
        const latestSessionDate =
          matchingSessions.length > 0 ? normalizeDateKey(matchingSessions[0].date) : null;
        eventDate = latestSessionDate || createdKey || endDateStr;
      }
      if (eventDate) {
        addMilestone(eventDate, {
          id: `goal-${g.id}`,
          date: eventDate,
          title: g.title,
          category: "goal-achieved",
          songTitle: g.songTitle,
          detail: g.songTitle
            ? `Milestone Achieved for "${g.songTitle}"`
            : "Practice Milestone Achieved",
        });
      }
    } else if (targetKey && targetKey >= startDateStr && targetKey <= endDateStr) {
      // If a session was logged on the target date with >= 85% accuracy, highlight it
      const daySessions = sessionsByDate.get(targetKey) || [];
      if (daySessions.length > 0) {
        addMilestone(targetKey, {
          id: `goal-target-${g.id}`,
          date: targetKey,
          title: g.title,
          category: "goal-achieved",
          songTitle: g.songTitle,
          detail: `Target Date Reached (${daySessions.length} session${
            daySessions.length === 1 ? "" : "s"
          })`,
        });
      }
    }
  });

  // 2. Weekly Practice Target Completions (`weeklyGoals`)
  const primaryWeeklyTarget = weeklyGoals.find((wg) =>
    songFilter ? wg.songTitle === songFilter : !wg.songTitle
  );
  const weeklyTargetMins = primaryWeeklyTarget ? primaryWeeklyTarget.targetMinutes : 180;
  const weeklyAccumulated = new Map<string, number>();
  const weeklyTargetMetWeeks = new Set<string>();

  // Sort dates chronologically to detect weekly goal completions and performance breakthroughs
  const allDatesChronological: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    allDatesChronological.push(format(subDays(now, i), "yyyy-MM-dd"));
  }

  let runningBestAccuracy = 0;
  let runningBestSpeed = 0;

  allDatesChronological.forEach((dateKey) => {
    const daySessions = sessionsByDate.get(dateKey) || [];
    if (daySessions.length === 0) return;

    const parsedDate = parseISO(dateKey);
    const weekStartKey = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const dayMinutes = daySessions.reduce(
      (sum, p) => sum + getSessionDurationMinutes(p).minutes,
      0
    );
    const newWeekTotal = (weeklyAccumulated.get(weekStartKey) || 0) + dayMinutes;
    weeklyAccumulated.set(weekStartKey, newWeekTotal);

    if (newWeekTotal >= weeklyTargetMins && !weeklyTargetMetWeeks.has(weekStartKey)) {
      weeklyTargetMetWeeks.add(weekStartKey);
      addMilestone(dateKey, {
        id: `weekly-goal-${weekStartKey}`,
        date: dateKey,
        title: primaryWeeklyTarget?.title || "Weekly Practice Goal Met",
        category: "weekly-target",
        detail: `Reached ${Math.round(newWeekTotal)}m / ${weeklyTargetMins}m weekly target`,
      });
    }

    // 3. Performance Milestones (100% Accuracy, 95%+ Mastery, Speed Breakthroughs)
    const accSessions = daySessions.filter((p) => !p.isTestSession || p.correctNotes > 0);
    const bestDayAcc =
      accSessions.length > 0 ? Math.max(...accSessions.map((p) => p.accuracy)) : 0;
    const bestDaySession = accSessions.find((p) => p.accuracy === bestDayAcc);
    const bestDaySpeed = Math.max(...daySessions.map((p) => p.speed || 0));
    const fastestSession = daySessions.find((p) => (p.speed || 0) === bestDaySpeed);

    if (bestDayAcc === 100) {
      addMilestone(dateKey, {
        id: `perf-100-${dateKey}`,
        date: dateKey,
        title: "100% Perfect Accuracy!",
        category: "accuracy-mastery",
        songTitle: bestDaySession?.songTitle,
        detail: bestDaySession
          ? `Flawless 100% accuracy on "${bestDaySession.songTitle}"`
          : "Achieved 100% note accuracy",
      });
    } else if (bestDayAcc >= 95 && bestDayAcc > runningBestAccuracy) {
      addMilestone(dateKey, {
        id: `perf-95-${dateKey}`,
        date: dateKey,
        title: `${bestDayAcc}% High-Accuracy Milestone`,
        category: "accuracy-mastery",
        songTitle: bestDaySession?.songTitle,
        detail: bestDaySession
          ? `Reached ${bestDayAcc}% accuracy on "${bestDaySession.songTitle}"`
          : `Reached ${bestDayAcc}% accuracy`,
      });
    }

    if (bestDaySpeed >= 100 && bestDaySpeed > runningBestSpeed && bestDayAcc >= 85) {
      addMilestone(dateKey, {
        id: `speed-${dateKey}`,
        date: dateKey,
        title: `${bestDaySpeed}% Tempo Speed Milestone`,
        category: "speed-breakthrough",
        songTitle: fastestSession?.songTitle,
        detail: fastestSession
          ? `Played "${fastestSession.songTitle}" at ${bestDaySpeed}% speed (${bestDayAcc}% acc)`
          : `Reached ${bestDaySpeed}% practice speed`,
      });
    }

    if (bestDayAcc > runningBestAccuracy) runningBestAccuracy = bestDayAcc;
    if (bestDaySpeed > runningBestSpeed) runningBestSpeed = bestDaySpeed;
  });

  // Decide which dates to include on the X-axis:
  // - For weekly (7d) and monthly (30d), include every single calendar day so daily continuity is exact.
  // - For yearly (365d), include every date that has a practice session OR a milestone, PLUS the 1st of each month and today so the 12-month axis is clean and every single daily session/milestone is plotted accurately.
  const monthlyAnchorDates = new Set<string>();
  if (timeframe === "yearly") {
    for (let m = 11; m >= 0; m--) {
      const mStart = startOfMonth(subMonths(now, m));
      monthlyAnchorDates.add(format(mStart, "yyyy-MM-dd"));
    }
    monthlyAnchorDates.add(startDateStr);
    monthlyAnchorDates.add(endDateStr);
  }

  const points: AdvancedProgressPoint[] = [];
  let prevAccuracy: number | null = null;
  let prevSpeed: number | null = null;

  allDatesChronological.forEach((dateKey) => {
    const daySessions = sessionsByDate.get(dateKey) || [];
    const dayMilestones = milestonesByDate.get(dateKey) || [];

    if (
      timeframe === "yearly" &&
      daySessions.length === 0 &&
      dayMilestones.length === 0 &&
      !monthlyAnchorDates.has(dateKey)
    ) {
      return;
    }

    const parsedDate = parseISO(dateKey);
    const dateLabel =
      timeframe === "weekly"
        ? format(parsedDate, "EEE MMM d")
        : timeframe === "monthly"
        ? format(parsedDate, "MMM d")
        : format(parsedDate, "MMM d, yy");
    const fullDateLabel = format(parsedDate, "EEEE, MMM d, yyyy");

    const accSessions = daySessions.filter((p) => !p.isTestSession || p.correctNotes > 0);
    const dailyAccuracy =
      accSessions.length > 0
        ? Math.round(accSessions.reduce((s, p) => s + p.accuracy, 0) / accSessions.length)
        : null;
    const peakAccuracy =
      accSessions.length > 0 ? Math.max(...accSessions.map((p) => p.accuracy)) : null;

    const dailySpeed =
      daySessions.length > 0
        ? Math.round(daySessions.reduce((s, p) => s + (p.speed || 100), 0) / daySessions.length)
        : null;
    const peakSpeed =
      daySessions.length > 0 ? Math.max(...daySessions.map((p) => p.speed || 100)) : null;

    const accuracyDelta =
      dailyAccuracy !== null && prevAccuracy !== null ? dailyAccuracy - prevAccuracy : null;
    const speedDelta =
      dailySpeed !== null && prevSpeed !== null ? dailySpeed - prevSpeed : null;

    if (dailyAccuracy !== null) prevAccuracy = dailyAccuracy;
    if (dailySpeed !== null) prevSpeed = dailySpeed;

    const practiceMinutes = Math.round(
      daySessions.reduce((sum, p) => sum + getSessionDurationMinutes(p).minutes, 0)
    );

    const songsPracticed = Array.from(
      new Set(daySessions.map((p) => p.songTitle).filter(Boolean))
    );

    const hasMilestone = dayMilestones.length > 0;
    const milestoneMarkerY = hasMilestone
      ? dailyAccuracy !== null
        ? dailyAccuracy
        : prevAccuracy !== null
        ? prevAccuracy
        : 90
      : null;

    points.push({
      date: dateKey,
      dateLabel,
      fullDateLabel,
      dailyAccuracy,
      peakAccuracy,
      accuracyDelta,
      dailySpeed,
      peakSpeed,
      speedDelta,
      practiceMinutes,
      sessionCount: daySessions.length,
      songsPracticed,
      milestones: dayMilestones,
      hasMilestone,
      milestoneMarkerY,
    });
  });

  return points;
}

export const PracticeTrendsSection: React.FC<PracticeTrendsSectionProps> = ({
  practices,
  activeSongs,
  goals = [],
  weeklyGoals = [],
  usageLogs = [],
  printMode,
  onPrint,
  onOpenFullTrends,
  gridStroke = "#1e1b4b",
}) => {
  const [chartMode, setChartMode] = useState<ChartModeOption>("advanced-progress");
  const [timeframe, setTimeframe] = useState<ProgressTimeframe>("monthly");
  const [songFilter, setSongFilter] = useState<string>("");
  const [showPeakLines, setShowPeakLines] = useState<boolean>(false);
  const [showMilestonesOnChart, setShowMilestonesOnChart] = useState<boolean>(true);
  const [weeksRange, setWeeksRange] = useState<WeeksRangeOption>("8w");

  React.useEffect(() => {
    if (
      songFilter &&
      !activeSongs.some((s) => s.title.trim().toLowerCase() === songFilter.trim().toLowerCase())
    ) {
      setSongFilter("");
    }
  }, [activeSongs, songFilter]);

  const isHiddenForPrint = printMode && printMode !== "trends" && printMode !== "all";

  // Build Advanced Progress Data (Daily Accuracy, Speed Trends, Goals/Milestones Met)
  const progressData = useMemo(() => {
    return buildAdvancedProgressData(practices, goals, weeklyGoals, timeframe, songFilter);
  }, [practices, goals, weeklyGoals, timeframe, songFilter]);

  // Build Weekly Hours Data for secondary mode
  const weeklyData = useMemo(() => {
    return buildWeeklyTrendsData(practices, usageLogs, weeksRange, songFilter);
  }, [practices, usageLogs, weeksRange, songFilter]);

  // All milestones achieved in the selected timeframe
  const milestonesInTimeframe = useMemo(() => {
    const list: MilestoneEventItem[] = [];
    progressData.forEach((pt) => {
      pt.milestones.forEach((m) => list.push(m));
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [progressData]);

  // Summary KPIs for the selected timeframe
  const summary = useMemo(() => {
    const activePoints = progressData.filter((p) => p.sessionCount > 0);
    const accPoints = progressData.filter((p) => p.dailyAccuracy !== null);
    const speedPoints = progressData.filter((p) => p.dailySpeed !== null);

    const avgAccuracy =
      accPoints.length > 0
        ? Math.round(
            accPoints.reduce((s, p) => s + (p.dailyAccuracy || 0), 0) / accPoints.length
          )
        : null;
    const peakAccuracy =
      accPoints.length > 0
        ? Math.max(...accPoints.map((p) => p.peakAccuracy ?? p.dailyAccuracy ?? 0))
        : null;
    const accuracyGain =
      accPoints.length >= 2
        ? (accPoints[accPoints.length - 1].dailyAccuracy || 0) -
          (accPoints[0].dailyAccuracy || 0)
        : null;

    const avgSpeed =
      speedPoints.length > 0
        ? Math.round(
            speedPoints.reduce((s, p) => s + (p.dailySpeed || 0), 0) / speedPoints.length
          )
        : null;
    const peakSpeed =
      speedPoints.length > 0
        ? Math.max(...speedPoints.map((p) => p.peakSpeed ?? p.dailySpeed ?? 0))
        : null;
    const speedGain =
      speedPoints.length >= 2
        ? (speedPoints[speedPoints.length - 1].dailySpeed || 0) -
          (speedPoints[0].dailySpeed || 0)
        : null;

    const totalSessions = activePoints.reduce((s, p) => s + p.sessionCount, 0);
    const totalMinutes = activePoints.reduce((s, p) => s + p.practiceMinutes, 0);

    return {
      avgAccuracy,
      peakAccuracy,
      accuracyGain,
      avgSpeed,
      peakSpeed,
      speedGain,
      totalSessions,
      totalMinutes,
      milestoneCount: milestonesInTimeframe.length,
    };
  }, [progressData, milestonesInTimeframe]);

  // Custom dot renderer for accuracy line that renders a glowing trophy/star badge on dates when goals/milestones were met
  const renderAccuracyDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;
    const point = payload as AdvancedProgressPoint;

    if (showMilestonesOnChart && point.hasMilestone) {
      return (
        <g key={`dot-milestone-${point.date}`}>
          <circle
            cx={cx}
            cy={cy}
            r={9}
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#fbbf24"
            strokeWidth={2}
          />
          <polygon
            points={`${cx},${cy - 6} ${cx + 1.8},${cy - 1.8} ${cx + 6},${cy - 1.5} ${
              cx + 2.6
            },${cy + 1.5} ${cx + 3.8},${cy + 5.8} ${cx},${cy + 3.2} ${cx - 3.8},${
              cy + 5.8
            } ${cx - 2.6},${cy + 1.5} ${cx - 6},${cy - 1.5} ${cx - 1.8},${cy - 1.8}`}
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth={0.8}
          />
        </g>
      );
    }

    if (point.dailyAccuracy === null) return null;

    return (
      <circle
        key={`dot-acc-${point.date}`}
        cx={cx}
        cy={cy}
        r={timeframe === "weekly" ? 4.5 : 3.5}
        fill="#10b981"
        stroke="#064e3b"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <Card
      className={cn(
        "border-indigo-700/70 bg-slate-950/60 shadow-lg shadow-indigo-950/40",
        isHiddenForPrint ? "print:hidden" : ""
      )}
    >
      <CardHeader className="flex flex-col gap-4 pb-3 border-b border-indigo-900/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2 flex-wrap">
                <span>Advanced Progress Chart</span>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  {timeframe === "weekly"
                    ? "Weekly View (7 Days)"
                    : timeframe === "monthly"
                    ? "Monthly View (30 Days)"
                    : "Yearly View (365 Days)"}
                </span>
              </CardTitle>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Daily accuracy scores (%), practice speed trends (%), and goal &amp; milestone achievements across timeframes
              </p>
            </div>
          </div>

          {/* Primary Controls: Timeframe (Weekly / Monthly / Yearly), Song Filter, Milestone Markers */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Timeframe Selector: Weekly / Monthly / Yearly */}
            {chartMode === "advanced-progress" && (
              <div
                className="inline-flex items-center h-9 rounded-lg bg-indigo-950/90 p-1 border border-indigo-700/80 gap-1"
                role="group"
                aria-label="Select chart timeframe"
              >
                {(
                  [
                    { id: "weekly", label: "Weekly" },
                    { id: "monthly", label: "Monthly" },
                    { id: "yearly", label: "Yearly" },
                  ] as { id: ProgressTimeframe; label: string }[]
                ).map((tf) => (
                  <Button
                    key={tf.id}
                    type="button"
                    size="sm"
                    variant={timeframe === tf.id ? "default" : "ghost"}
                    onClick={() => setTimeframe(tf.id)}
                    className={cn(
                      "h-7 px-3 text-xs font-semibold rounded-md transition-all cursor-pointer",
                      timeframe === tf.id
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        : "text-indigo-200 hover:text-white"
                    )}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Song Filter Listbox */}
            <Select
              value={songFilter}
              onChange={(e) => setSongFilter(e.target.value)}
              className="h-9 text-xs py-1 w-40"
              title="Filter chart by song or view all active songs"
            >
              <option value="">All Songs</option>
              {activeSongs.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </Select>

            {/* Toggle Goal & Milestone Indicators */}
            {chartMode === "advanced-progress" && (
              <button
                type="button"
                onClick={() => setShowMilestonesOnChart((prev) => !prev)}
                className={cn(
                  "h-9 px-2.5 rounded-lg text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer",
                  showMilestonesOnChart
                    ? "bg-amber-950/80 border-amber-500/60 text-amber-200"
                    : "bg-indigo-950/60 border-indigo-800 text-indigo-300"
                )}
                title="Show or hide Goal & Milestone achievement markers on the chart"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Goals &amp; Milestones ({milestonesInTimeframe.length})</span>
              </button>
            )}

            {/* Toggle Peak Daily Lines */}
            {chartMode === "advanced-progress" && (
              <button
                type="button"
                onClick={() => setShowPeakLines((prev) => !prev)}
                className={cn(
                  "h-9 px-2.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 cursor-pointer",
                  showPeakLines
                    ? "bg-cyan-950/80 border-cyan-500/60 text-cyan-200"
                    : "bg-indigo-950/60 border-indigo-800 text-indigo-300"
                )}
                title="Overlay daily peak accuracy and peak speed alongside daily averages"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Peak Overlay</span>
              </button>
            )}

            {/* Mode Switcher: Advanced Progress vs Weekly Hours */}
            <div className="inline-flex items-center h-9 rounded-lg bg-indigo-950/80 p-1 border border-indigo-800/80 gap-1">
              <button
                type="button"
                onClick={() => setChartMode("advanced-progress")}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer",
                  chartMode === "advanced-progress"
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-300 hover:text-white"
                )}
                title="View Daily Accuracy Scores, Practice Speed Trends & Milestones"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Accuracy &amp; Speed</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode("weekly-hours")}
                className={cn(
                  "h-7 px-2.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer",
                  chartMode === "weekly-hours"
                    ? "bg-sky-600 text-white"
                    : "text-indigo-300 hover:text-white"
                )}
                title="View Weekly Practice Hours & Cumulative Time"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Weekly Hours</span>
              </button>
            </div>

            {onOpenFullTrends && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-indigo-300 hover:text-white"
                onClick={onOpenFullTrends}
                title="Open full Trends view"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={() => onPrint("trends")}
              title="Print Advanced Progress Chart"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </Button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Daily Accuracy Score Summary */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">
                Avg / Peak Daily Accuracy
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-300">
                  {summary.avgAccuracy !== null ? `${summary.avgAccuracy}%` : "—"}
                </span>
                {summary.peakAccuracy !== null && (
                  <span className="text-xs font-mono tabular-nums text-emerald-400/80">
                    (Peak {summary.peakAccuracy}%)
                  </span>
                )}
                {summary.accuracyGain !== null && (
                  <span
                    className={cn(
                      "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded",
                      summary.accuracyGain > 0
                        ? "bg-emerald-950 text-emerald-300"
                        : summary.accuracyGain < 0
                        ? "bg-rose-950 text-rose-300"
                        : "bg-indigo-900/70 text-indigo-300"
                    )}
                  >
                    {summary.accuracyGain > 0
                      ? `+${summary.accuracyGain}%`
                      : `${summary.accuracyGain}%`}
                  </span>
                )}
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/80 shrink-0" />
          </div>

          {/* 2. Practice Speed Trend Summary */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">
                Practice Speed Trend
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold font-mono tabular-nums text-amber-300">
                  {summary.avgSpeed !== null ? `${summary.avgSpeed}%` : "—"}
                </span>
                {summary.peakSpeed !== null && (
                  <span className="text-xs font-mono tabular-nums text-amber-400/80">
                    (Max {summary.peakSpeed}%)
                  </span>
                )}
                {summary.speedGain !== null && (
                  <span
                    className={cn(
                      "text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded",
                      summary.speedGain > 0
                        ? "bg-amber-950 text-amber-300"
                        : summary.speedGain < 0
                        ? "bg-rose-950 text-rose-300"
                        : "bg-indigo-900/70 text-indigo-300"
                    )}
                  >
                    {summary.speedGain > 0 ? `+${summary.speedGain}%` : `${summary.speedGain}%`}
                  </span>
                )}
              </div>
            </div>
            <Gauge className="w-4 h-4 text-amber-400/80 shrink-0" />
          </div>

          {/* 3. Goals & Milestones Met */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">
                Goals &amp; Milestones Met
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono tabular-nums text-amber-200">
                  {summary.milestoneCount}
                </span>
                <span className="text-[11px] text-indigo-300 font-mono">
                  achieved in {timeframe} view
                </span>
              </div>
            </div>
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          {/* 4. Total Sessions & Time in Timeframe */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">
                Timeframe Volume
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono tabular-nums text-sky-300">
                  {summary.totalSessions}
                </span>
                <span className="text-xs text-indigo-300">sessions</span>
                <span className="text-[11px] text-indigo-400 font-mono tabular-nums">
                  ({formatHoursAndMinutes(summary.totalMinutes)})
                </span>
              </div>
            </div>
            <Calendar className="w-4 h-4 text-sky-400/80 shrink-0" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {chartMode === "advanced-progress" ? (
          <>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={progressData}
                  margin={{ top: 16, right: 28, bottom: 22, left: 10 }}
                >
                  <defs>
                    <linearGradient id="advAccuracyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridStroke}
                    strokeOpacity={0.85}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="dateLabel"
                    stroke="#818cf8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={timeframe === "weekly" ? 8 : 18}
                    label={{
                      value:
                        timeframe === "weekly"
                          ? "Daily Progression (Last 7 Days)"
                          : timeframe === "monthly"
                          ? "Daily Progression (Last 30 Days)"
                          : "Yearly Progression (Last 365 Days)",
                      position: "insideBottom",
                      offset: -14,
                      fill: "#a5b4fc",
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    yAxisId="accuracy"
                    stroke="#10b981"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 90, 100]}
                    tickFormatter={(val) => `${val}%`}
                    label={{
                      value: "Daily Accuracy (%)",
                      angle: -90,
                      position: "insideLeft",
                      offset: 0,
                      fill: "#10b981",
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    yAxisId="speed"
                    orientation="right"
                    stroke="#f59e0b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, (dataMax: number) => Math.max(120, (dataMax || 100) + 15)]}
                    tickFormatter={(val) => `${val}%`}
                    label={{
                      value: "Practice Speed (%)",
                      angle: 90,
                      position: "insideRight",
                      offset: -4,
                      fill: "#f59e0b",
                      fontSize: 11,
                    }}
                  />

                  {/* Vertical Milestone Reference Lines when goals or milestones were met */}
                  {showMilestonesOnChart &&
                    progressData
                      .filter((pt) => pt.hasMilestone)
                      .map((pt) => (
                        <ReferenceLine
                          key={`milestone-line-${pt.date}`}
                          x={pt.dateLabel}
                          yAxisId="accuracy"
                          stroke="#fbbf24"
                          strokeDasharray="3 3"
                          strokeWidth={1.5}
                          strokeOpacity={0.75}
                          label={{
                            value: "★ Goal/Milestone",
                            position: "top",
                            fill: "#fde68a",
                            fontSize: 10,
                          }}
                        />
                      ))}

                  {/* 90% Mastery Reference Threshold */}
                  <ReferenceLine
                    yAxisId="accuracy"
                    y={90}
                    stroke="#10b981"
                    strokeDasharray="2 4"
                    strokeOpacity={0.35}
                  />

                  <Tooltip
                    cursor={{ stroke: "#6366f1", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const pt = payload[0].payload as AdvancedProgressPoint;
                      return (
                        <div className="rounded-xl border border-indigo-700 bg-slate-950/95 p-3.5 shadow-2xl text-xs text-indigo-100 space-y-2.5 min-w-[250px] max-w-[330px]">
                          <div className="font-semibold text-white border-b border-indigo-800/80 pb-1.5 flex items-center justify-between gap-3">
                            <span>{pt.fullDateLabel}</span>
                            <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200">
                              {pt.sessionCount} {pt.sessionCount === 1 ? "session" : "sessions"}
                            </span>
                          </div>

                          <div className="space-y-1.5 font-mono tabular-nums">
                            {/* Daily Accuracy */}
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-emerald-300 font-sans">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                Daily Accuracy:
                              </span>
                              <span className="font-bold text-emerald-300">
                                {pt.dailyAccuracy !== null ? `${pt.dailyAccuracy}%` : "No session"}
                                {pt.peakAccuracy !== null &&
                                  pt.peakAccuracy !== pt.dailyAccuracy && (
                                    <span className="text-[10px] text-emerald-400/80 ml-1">
                                      (Peak {pt.peakAccuracy}%)
                                    </span>
                                  )}
                              </span>
                            </div>

                            {/* Practice Speed Trend */}
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-amber-300 font-sans">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                Practice Speed:
                              </span>
                              <span className="font-bold text-amber-300">
                                {pt.dailySpeed !== null ? `${pt.dailySpeed}%` : "No session"}
                                {pt.peakSpeed !== null && pt.peakSpeed !== pt.dailySpeed && (
                                  <span className="text-[10px] text-amber-400/80 ml-1">
                                    (Max {pt.peakSpeed}%)
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* Practice Duration */}
                            {pt.practiceMinutes > 0 && (
                              <div className="flex items-center justify-between gap-4 text-sky-300">
                                <span className="font-sans">Practice Time:</span>
                                <span className="font-bold">
                                  {formatHoursAndMinutes(pt.practiceMinutes)}
                                </span>
                              </div>
                            )}

                            {/* Songs Practiced */}
                            {pt.songsPracticed.length > 0 && (
                              <div className="text-[11px] font-sans text-indigo-300 pt-1 border-t border-indigo-900/60">
                                <span className="text-indigo-400">Songs: </span>
                                <span className="text-white font-medium">
                                  {pt.songsPracticed.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Goals & Milestones Met on this Date */}
                          {pt.milestones.length > 0 && (
                            <div className="pt-2 border-t border-amber-500/40 space-y-1.5">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Goals &amp; Milestones Met ({pt.milestones.length})</span>
                              </div>
                              {pt.milestones.map((m) => (
                                <div
                                  key={m.id}
                                  className="p-1.5 rounded-lg bg-amber-950/70 border border-amber-500/40 text-[11px]"
                                >
                                  <div className="font-semibold text-amber-200">{m.title}</div>
                                  <div className="text-[10px] text-amber-300/80">{m.detail}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={30}
                    wrapperStyle={{ fontSize: "12px", color: "#c7d2fe" }}
                  />

                  {/* Shaded Area + Line for Daily Accuracy Score */}
                  <Area
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="dailyAccuracy"
                    name="Daily Accuracy (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#advAccuracyFill)"
                    connectNulls
                    dot={renderAccuracyDot}
                    activeDot={{ r: 6.5, fill: "#34d399", stroke: "#ffffff", strokeWidth: 1.5 }}
                  />

                  {/* Practice Speed Trend Line */}
                  <Line
                    yAxisId="speed"
                    type="monotone"
                    dataKey="dailySpeed"
                    name="Practice Speed (%)"
                    stroke="#f59e0b"
                    strokeWidth={2.75}
                    dot={{ r: 3.5, fill: "#f59e0b", stroke: "#78350f", strokeWidth: 1 }}
                    activeDot={{ r: 6, fill: "#fbbf24", stroke: "#ffffff", strokeWidth: 1.5 }}
                    connectNulls
                  />

                  {/* Optional Peak Accuracy & Peak Speed Lines */}
                  {showPeakLines && (
                    <Line
                      yAxisId="accuracy"
                      type="monotone"
                      dataKey="peakAccuracy"
                      name="Peak Accuracy (%)"
                      stroke="#34d399"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                    />
                  )}
                  {showPeakLines && (
                    <Line
                      yAxisId="speed"
                      type="monotone"
                      dataKey="peakSpeed"
                      name="Peak Speed (%)"
                      stroke="#fde047"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Goals & Milestones Met Timeline Strip */}
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/70 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>
                    Goals &amp; Practice Milestones Met in{" "}
                    {timeframe === "weekly"
                      ? "Weekly (7-Day)"
                      : timeframe === "monthly"
                      ? "Monthly (30-Day)"
                      : "Yearly (365-Day)"}{" "}
                    View
                  </span>
                </div>
                <span className="text-[11px] text-indigo-300">
                  ★ Gold star markers on the chart indicate dates when a goal or milestone was met
                </span>
              </div>

              {milestonesInTimeframe.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1 dialog-scrollbar">
                  {milestonesInTimeframe.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 transition-colors"
                    >
                      <div className="p-1.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
                        {m.category === "goal-achieved" ? (
                          <Flag className="w-3.5 h-3.5" />
                        ) : m.category === "weekly-target" ? (
                          <Target className="w-3.5 h-3.5 text-emerald-400" />
                        ) : m.category === "speed-breakthrough" ? (
                          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-semibold text-white truncate">
                            {m.title}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-amber-300 shrink-0">
                            {format(parseISO(m.date), "MMM d")}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-300/85 truncate">{m.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-indigo-300/80 py-2">
                  No milestones recorded in this {timeframe} window yet. Log practice sessions or complete a goal to see milestone markers plotted on your chart!
                </div>
              )}
            </div>
          </>
        ) : (
          /* Secondary Mode: Weekly Practice Hours & Accuracy Chart */
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-indigo-200">
                Weekly Practice Hours &amp; Accuracy Overview
              </span>
              <div className="inline-flex items-center h-8 rounded-lg bg-indigo-950/80 p-0.5 border border-indigo-800/80 gap-0.5">
                {(
                  [
                    { id: "4w", label: "4W" },
                    { id: "8w", label: "8W" },
                    { id: "12w", label: "12W" },
                    { id: "24w", label: "24W" },
                    { id: "all", label: "All" },
                  ] as { id: WeeksRangeOption; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWeeksRange(opt.id)}
                    className={cn(
                      "h-6 px-2 text-xs font-medium rounded-md transition-colors inline-flex items-center justify-center whitespace-nowrap cursor-pointer",
                      weeksRange === opt.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-300 hover:text-white"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyData}
                  margin={{ top: 10, right: 25, bottom: 20, left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridStroke}
                    strokeOpacity={0.85}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="weekLabel"
                    stroke="#818cf8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="accuracy"
                    stroke="#10b981"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <YAxis
                    yAxisId="hours"
                    orientation="right"
                    stroke="#38bdf8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, "auto"]}
                    tickFormatter={(val) => `${val}h`}
                  />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    wrapperStyle={{ fontSize: "12px", color: "#c7d2fe" }}
                  />
                  <Line
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="accuracy"
                    name="Weekly Accuracy (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    connectNulls
                  />
                  <Line
                    yAxisId="hours"
                    type="monotone"
                    dataKey="weeklyHours"
                    name="Weekly Practice Hours (hrs)"
                    stroke="#38bdf8"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

