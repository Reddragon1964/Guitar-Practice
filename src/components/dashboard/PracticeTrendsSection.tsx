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
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Practice, Song, PrintMode } from "../../types";
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

interface PracticeTrendsSectionProps {
  practices: Practice[];
  activeSongs: Song[];
  usageLogs?: { date: string; minutes: number }[];
  printMode: PrintMode;
  onPrint: (mode: "trends") => void;
  onOpenFullTrends?: () => void;
}

type WeeksRangeOption = "4w" | "8w" | "12w" | "24w" | "all";
type HoursDisplayMode = "weekly" | "cumulative";

function formatHoursAndMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
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
        const diffMs = currentWeekStart.getTime() - startOfWeek(earliestDate, { weekStartsOn: 1 }).getTime();
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

    // Calculate accuracy average for the week
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

    // Calculate total practice minutes/hours for the week
    let weeklyMinutes = 0;
    if (songFilter) {
      weeklyMinutes = weekPractices.reduce((sum, p) => {
        if (typeof p.duration === "number" && p.duration > 0) {
          return sum + p.duration / 60;
        }
        return sum + getSessionDurationMinutes(p).minutes;
      }, 0);
    } else {
      // Combine session durations and usage logs per day of the week
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

export const PracticeTrendsSection: React.FC<PracticeTrendsSectionProps> = ({
  practices,
  activeSongs,
  usageLogs = [],
  printMode,
  onPrint,
  onOpenFullTrends,
}) => {
  const [weeksRange, setWeeksRange] = useState<WeeksRangeOption>("8w");
  const [songFilter, setSongFilter] = useState<string>("");
  const [hoursMode, setHoursMode] = useState<HoursDisplayMode>("weekly");

  const isHiddenForPrint = printMode && printMode !== "trends" && printMode !== "all";

  const weeklyData = useMemo(() => {
    return buildWeeklyTrendsData(practices, usageLogs, weeksRange, songFilter);
  }, [practices, usageLogs, weeksRange, songFilter]);

  // Summary metrics across the selected weeks
  const summary = useMemo(() => {
    const weeksWithAccuracy = weeklyData.filter((w) => w.accuracy !== null);
    const firstAcc =
      weeksWithAccuracy.length > 0 ? (weeksWithAccuracy[0].accuracy as number) : null;
    const latestAcc =
      weeksWithAccuracy.length > 0
        ? (weeksWithAccuracy[weeksWithAccuracy.length - 1].accuracy as number)
        : null;
    const prevWeekAcc =
      weeksWithAccuracy.length >= 2
        ? (weeksWithAccuracy[weeksWithAccuracy.length - 2].accuracy as number)
        : null;

    const overallImprovement =
      firstAcc !== null && latestAcc !== null && weeksWithAccuracy.length >= 2
        ? latestAcc - firstAcc
        : null;

    const wowImprovement =
      prevWeekAcc !== null && latestAcc !== null ? latestAcc - prevWeekAcc : null;

    const avgAccuracy =
      weeksWithAccuracy.length > 0
        ? Math.round(
            weeksWithAccuracy.reduce((sum, w) => sum + (w.accuracy || 0), 0) /
              weeksWithAccuracy.length
          )
        : 0;

    const totalMinutes = weeklyData.reduce((sum, w) => sum + w.weeklyMinutes, 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));
    const avgWeeklyMinutes =
      weeklyData.length > 0 ? Math.round(totalMinutes / weeklyData.length) : 0;

    return {
      latestAcc,
      overallImprovement,
      wowImprovement,
      avgAccuracy,
      totalHours,
      totalMinutes,
      avgWeeklyMinutes,
      hasAccuracyData: weeksWithAccuracy.length > 0,
    };
  }, [weeklyData]);

  const hoursDataKey = hoursMode === "weekly" ? "weeklyHours" : "cumulativeHours";
  const hoursSeriesLabel =
    hoursMode === "weekly" ? "Weekly Practice Hours" : "Total Cumulative Hours";

  return (
    <Card
      className={cn(
        "border-indigo-700/70 bg-slate-950/60 shadow-lg shadow-indigo-950/40",
        isHiddenForPrint ? "print:hidden" : ""
      )}
    >
      <CardHeader className="flex flex-col gap-4 pb-3 border-b border-indigo-900/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
                Practice Trends
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-900/70 text-indigo-300 border border-indigo-700/70">
                  Weekly Accuracy & Hours
                </span>
              </CardTitle>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Track weekly accuracy improvements (%) alongside total practice hours over time
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Select
              value={songFilter}
              onChange={(e) => setSongFilter(e.target.value)}
              className="h-8 text-xs w-36 bg-indigo-950/80 border-indigo-700/80"
            >
              <option value="">All Songs</option>
              {activeSongs.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </Select>

            <div className="inline-flex rounded-lg bg-indigo-950/80 p-0.5 border border-indigo-800/80">
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
                    "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                    weeksRange === opt.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-indigo-300 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-lg bg-indigo-950/80 p-0.5 border border-indigo-800/80">
              <button
                type="button"
                onClick={() => setHoursMode("weekly")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                  hoursMode === "weekly"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-indigo-300 hover:text-white"
                )}
                title="Show hours practiced each week"
              >
                Weekly Hrs
              </button>
              <button
                type="button"
                onClick={() => setHoursMode("cumulative")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-md transition-colors",
                  hoursMode === "cumulative"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-indigo-300 hover:text-white"
                )}
                title="Show cumulative total hours over time"
              >
                Total Hrs
              </button>
            </div>

            {onOpenFullTrends && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-indigo-300 hover:text-white"
                onClick={onOpenFullTrends}
                title="Open full Trends view"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onPrint("trends")}
              title="Print Practice Trends"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </Button>
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Latest Weekly Accuracy */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">Latest Weekly Accuracy</div>
              <div className="text-lg font-bold font-mono text-emerald-300">
                {summary.latestAcc !== null ? `${summary.latestAcc}%` : "—"}
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/80 shrink-0" />
          </div>

          {/* 2. Accuracy Improvement */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">Accuracy Gain</div>
              <div className="flex items-center gap-1.5">
                {summary.overallImprovement !== null ? (
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      summary.overallImprovement > 0
                        ? "text-emerald-300"
                        : summary.overallImprovement < 0
                        ? "text-rose-300"
                        : "text-indigo-200"
                    )}
                  >
                    {summary.overallImprovement > 0
                      ? `+${summary.overallImprovement}%`
                      : `${summary.overallImprovement}%`}
                  </span>
                ) : (
                  <span className="text-lg font-bold font-mono text-indigo-300">
                    {summary.avgAccuracy > 0 ? `${summary.avgAccuracy}% avg` : "—"}
                  </span>
                )}
                {summary.wowImprovement !== null && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/70 text-indigo-300">
                    {summary.wowImprovement >= 0
                      ? `+${summary.wowImprovement}% WoW`
                      : `${summary.wowImprovement}% WoW`}
                  </span>
                )}
              </div>
            </div>
            {summary.overallImprovement !== null && summary.overallImprovement < 0 ? (
              <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
          </div>

          {/* 3. Total Practice Hours */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">Total Practice Hours</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-sky-300">
                  {summary.totalHours} hrs
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  ({formatHoursAndMinutes(summary.totalMinutes)})
                </span>
              </div>
            </div>
            <Clock className="w-4 h-4 text-sky-400/80 shrink-0" />
          </div>

          {/* 4. Weekly Average Time */}
          <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-indigo-400 font-medium">Avg Weekly Time</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-indigo-100">
                  {(summary.avgWeeklyMinutes / 60).toFixed(1)} hrs
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  / week
                </span>
              </div>
            </div>
            <Calendar className="w-4 h-4 text-indigo-400/80 shrink-0" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyData}
              margin={{ top: 10, right: 25, bottom: 20, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#312e81" vertical={false} />
              <XAxis
                dataKey="weekLabel"
                stroke="#818cf8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Week Starting",
                  position: "insideBottom",
                  offset: -12,
                  fill: "#a5b4fc",
                  fontSize: 11,
                }}
              />
              <YAxis
                yAxisId="accuracy"
                stroke="#10b981"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                label={{
                  value: "Weekly Accuracy (%)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 0,
                  fill: "#10b981",
                  fontSize: 11,
                }}
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
                label={{
                  value: hoursMode === "weekly" ? "Weekly Hours (h)" : "Cumulative Hours (h)",
                  angle: 90,
                  position: "insideRight",
                  offset: -5,
                  fill: "#38bdf8",
                  fontSize: 11,
                }}
              />
              <Tooltip
                cursor={{ stroke: "#4f46e5", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const point = payload[0].payload as WeeklyTrendPoint;
                  return (
                    <div className="rounded-xl border border-indigo-700 bg-slate-950/95 p-3 shadow-xl text-xs text-indigo-100 space-y-2 min-w-[210px]">
                      <div className="font-semibold text-indigo-200 border-b border-indigo-800/80 pb-1.5 flex items-center justify-between gap-3">
                        <span>Week of {point.weekRange}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/70 text-indigo-300">
                          {point.sessionCount} {point.sessionCount === 1 ? "session" : "sessions"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Weekly Accuracy:
                          </span>
                          <span className="font-mono font-bold text-emerald-300">
                            {point.accuracy !== null ? `${point.accuracy}%` : "No sessions"}
                            {point.accuracyDelta !== null && (
                              <span
                                className={cn(
                                  "ml-1.5 text-[10px] px-1 py-0.2 rounded",
                                  point.accuracyDelta > 0
                                    ? "bg-emerald-950 text-emerald-300"
                                    : point.accuracyDelta < 0
                                    ? "bg-rose-950 text-rose-300"
                                    : "bg-indigo-950 text-indigo-300"
                                )}
                              >
                                {point.accuracyDelta > 0
                                  ? `+${point.accuracyDelta}%`
                                  : `${point.accuracyDelta}%`}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-sky-300">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            Weekly Practice:
                          </span>
                          <span className="font-mono font-bold text-sky-300">
                            {point.weeklyHours} hrs ({formatHoursAndMinutes(point.weeklyMinutes)})
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4 text-indigo-300/90 pt-0.5 border-t border-indigo-900/60">
                          <span>Cumulative Total:</span>
                          <span className="font-mono font-semibold text-indigo-200">
                            {point.cumulativeHours} hrs ({formatHoursAndMinutes(point.cumulativeMinutes)})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                wrapperStyle={{ fontSize: "12px", color: "#c7d2fe" }}
              />
              {summary.avgAccuracy > 0 && (
                <ReferenceLine
                  yAxisId="accuracy"
                  y={summary.avgAccuracy}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.35}
                />
              )}
              <Line
                yAxisId="accuracy"
                type="monotone"
                dataKey="accuracy"
                name="Weekly Accuracy (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 1.5, stroke: "#064e3b" }}
                activeDot={{ r: 6, fill: "#34d399" }}
                connectNulls
              />
              <Line
                yAxisId="hours"
                type="monotone"
                dataKey={hoursDataKey}
                name={`${hoursSeriesLabel} (hrs)`}
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: "#38bdf8", strokeWidth: 1.5, stroke: "#0c4a6e" }}
                activeDot={{ r: 6, fill: "#7dd3fc" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
