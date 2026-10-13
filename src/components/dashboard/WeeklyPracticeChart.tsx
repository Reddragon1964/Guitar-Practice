import React, { useState, useMemo } from "react";
import {
  Printer,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Plus,
  Music,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  LabelList,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  subDays,
  subWeeks,
  parseISO,
  isSameDay,
  isToday as checkIsToday,
} from "date-fns";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Practice, PrintMode } from "../../types";
import { getSessionDurationMinutes } from "./DurationTrendsPage";

export type WeekRangeMode = "last7days" | "thisWeek" | "lastWeek";

export interface DayPracticeData {
  dateKey: string;
  dayLabel: string;
  dateSub: string;
  fullDate: string;
  totalMinutes: number;
  formattedTime: string;
  sessionCount: number;
  practices: Practice[];
  songsBreakdown: { songTitle: string; minutes: number; accuracy: number | null }[];
  isToday: boolean;
  goalMet: boolean;
}

export interface WeeklyPracticeChartProps {
  data?: { label: string; totalMinutes: number }[];
  practices?: Practice[];
  usageLogs?: { date: string; minutes: number }[];
  printMode?: PrintMode;
  onPrint?: (mode: "weekly") => void;
  onRecordSession?: () => void;
  dailyGoalMinutes?: number;
  gridStroke?: string;
}

export const WeeklyPracticeChart: React.FC<WeeklyPracticeChartProps> = ({
  data: fallbackData,
  practices = [],
  usageLogs = [],
  printMode,
  onPrint,
  onRecordSession,
  dailyGoalMinutes = 30,
  gridStroke = "#1e1b4b",
}) => {
  const [rangeMode, setRangeMode] = useState<WeekRangeMode>("last7days");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeGoalMinutes, setActiveGoalMinutes] = useState<number>(dailyGoalMinutes);
  const [showGoalLine, setShowGoalLine] = useState<boolean>(true);

  const isHiddenForPrint = printMode && printMode !== "weekly" && printMode !== "all";

  const formatMinutes = (val: number): string => {
    if (val <= 0) return "0m";
    const h = Math.floor(val / 60);
    const m = Math.round(val % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  // Compute 7 days of practice data based on range mode
  const chartDays = useMemo<DayPracticeData[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    let dates: Date[] = [];

    if (rangeMode === "last7days") {
      // 7 days ending today (today - 6 days to today)
      for (let i = 6; i >= 0; i--) {
        dates.push(subDays(today, i));
      }
    } else if (rangeMode === "thisWeek") {
      // Monday to Sunday of current week
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    } else {
      // Monday to Sunday of previous week
      const lastWeekDate = subWeeks(today, 1);
      startDate = startOfWeek(lastWeekDate, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        dates.push(d);
      }
    }

    return dates.map((d) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const dayLabel = format(d, "EEE");
      const dateSub = format(d, "MMM d");
      const fullDate = format(d, "EEEE, MMMM d, yyyy");
      const isTodayDate = checkIsToday(d);

      // Find practices matching this date
      const dayPractices = practices.filter((p) => {
        if (!p.date) return false;
        const pDateStr = p.date.split("T")[0];
        return pDateStr === dateKey;
      });

      // Calculate total practice duration in minutes
      const practiceMinutes = dayPractices.reduce((sum, p) => {
        return sum + getSessionDurationMinutes(p).minutes;
      }, 0);

      // Also check usageLogs
      const usageForDay = usageLogs
        .filter((u) => u.date === dateKey)
        .reduce((sum, u) => sum + u.minutes, 0);

      // Take the max of practice sessions or usage log
      let totalMinutes = Math.max(practiceMinutes, usageForDay);

      // If fallbackData is provided and no practices exist, check fallback
      if (totalMinutes === 0 && fallbackData && fallbackData.length > 0) {
        const fallbackMatch = fallbackData.find((f) => f.label === dayLabel);
        if (fallbackMatch) {
          totalMinutes = fallbackMatch.totalMinutes;
        }
      }

      // Group songs breakdown
      const songMap: Record<string, { minutes: number; accuracySum: number; count: number }> = {};
      dayPractices.forEach((p) => {
        const sName = p.songTitle || "Free Practice";
        const mins = getSessionDurationMinutes(p).minutes;
        if (!songMap[sName]) {
          songMap[sName] = { minutes: 0, accuracySum: 0, count: 0 };
        }
        songMap[sName].minutes += mins;
        if (typeof p.accuracy === "number") {
          songMap[sName].accuracySum += p.accuracy;
          songMap[sName].count += 1;
        }
      });

      const songsBreakdown = Object.entries(songMap).map(([title, sData]) => ({
        songTitle: title,
        minutes: sData.minutes,
        accuracy: sData.count > 0 ? Math.round(sData.accuracySum / sData.count) : null,
      }));

      return {
        dateKey,
        dayLabel,
        dateSub,
        fullDate,
        totalMinutes,
        formattedTime: formatMinutes(totalMinutes),
        sessionCount: dayPractices.length,
        practices: dayPractices,
        songsBreakdown,
        isToday: isTodayDate,
        goalMet: activeGoalMinutes > 0 ? totalMinutes >= activeGoalMinutes : false,
      };
    });
  }, [rangeMode, practices, usageLogs, fallbackData, activeGoalMinutes]);

  // Aggregate stats across the 7 days
  const stats = useMemo(() => {
    const totalMinutes = chartDays.reduce((sum, d) => sum + d.totalMinutes, 0);
    const activeDaysCount = chartDays.filter((d) => d.totalMinutes > 0).length;
    const totalSessions = chartDays.reduce((sum, d) => sum + d.sessionCount, 0);
    const averageMinutes = Math.round(totalMinutes / 7);

    // Peak day
    let peakDay = chartDays[0];
    chartDays.forEach((d) => {
      if (d.totalMinutes > (peakDay?.totalMinutes || 0)) {
        peakDay = d;
      }
    });

    const goalsMetCount = chartDays.filter((d) => d.goalMet).length;

    return {
      totalMinutes,
      formattedTotal: formatMinutes(totalMinutes),
      totalHours: (totalMinutes / 60).toFixed(1),
      activeDaysCount,
      totalSessions,
      averageMinutes,
      formattedAverage: formatMinutes(averageMinutes),
      peakDay: peakDay && peakDay.totalMinutes > 0 ? peakDay : null,
      goalsMetCount,
    };
  }, [chartDays]);

  // Selected day details (default to selected or today or peak day)
  const activeSelectedDay = useMemo(() => {
    if (selectedDateKey) {
      return chartDays.find((d) => d.dateKey === selectedDateKey) || null;
    }
    // Default to today if within range
    const todayMatch = chartDays.find((d) => d.isToday);
    if (todayMatch && todayMatch.totalMinutes > 0) return todayMatch;
    // Or peak day
    if (stats.peakDay) return stats.peakDay;
    return chartDays[chartDays.length - 1];
  }, [selectedDateKey, chartDays, stats.peakDay]);

  // Max value for Y-Axis domain scaling
  const maxMinutes = useMemo(() => {
    const highestInDays = Math.max(...chartDays.map((d) => d.totalMinutes), 0);
    const baseline = Math.max(highestInDays, activeGoalMinutes, 60);
    return Math.ceil(baseline / 30) * 30 + 15; // round up to multiple of 30 + margin
  }, [chartDays, activeGoalMinutes]);

  const rangeTitle = useMemo(() => {
    if (rangeMode === "last7days") return "Last 7 Days";
    if (rangeMode === "thisWeek") return "This Week (Mon - Sun)";
    return "Previous Week";
  }, [rangeMode]);

  return (
    <Card
      className={`border border-indigo-950/70 bg-gradient-to-b from-indigo-950/40 to-slate-950/60 shadow-xl backdrop-blur-sm ${
        isHiddenForPrint ? "print:hidden" : ""
      }`}
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top Control Bar: Range Tabs, Benchmark Toggle & Print */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-indigo-900/40">
          {/* Week Range Segmented Buttons (No static pills, clean button group) */}
          <div className="flex items-center gap-1 p-1 bg-indigo-950/80 border border-indigo-800/60 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setRangeMode("last7days");
                setSelectedDateKey(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                rangeMode === "last7days"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-300 hover:text-white hover:bg-indigo-900/60"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setRangeMode("thisWeek");
                setSelectedDateKey(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                rangeMode === "thisWeek"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-300 hover:text-white hover:bg-indigo-900/60"
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => {
                setRangeMode("lastWeek");
                setSelectedDateKey(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                rangeMode === "lastWeek"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-indigo-300 hover:text-white hover:bg-indigo-900/60"
              }`}
            >
              Last Week
            </button>
          </div>

          {/* Goal Benchmark Selector & Print Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-900/50">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target:</span>
              <button
                type="button"
                onClick={() => {
                  setShowGoalLine((prev) => !prev);
                }}
                className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
                  showGoalLine ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" : "text-indigo-400 hover:text-white"
                }`}
              >
                {showGoalLine ? `${activeGoalMinutes}m` : "Off"}
              </button>
              {showGoalLine && (
                <div className="flex items-center gap-0.5 ml-1">
                  {[20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setActiveGoalMinutes(mins)}
                      className={`px-1 text-[11px] font-mono rounded ${
                        activeGoalMinutes === mins
                          ? "bg-emerald-500 text-slate-950 font-bold"
                          : "text-indigo-300 hover:text-white"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              )}
            </div>

            {onPrint && (
              <Button
                variant="outline"
                size="sm"
                className="print:hidden h-8 px-2.5 gap-1.5 border-indigo-800/80 bg-indigo-900/40 text-indigo-200 hover:bg-indigo-800 hover:text-white"
                onClick={() => onPrint("weekly")}
                title="Print Weekly Practice Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Print</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Metrics Strip - Darker Grid Styling */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 px-3 rounded-lg bg-slate-950/90 border border-slate-900/90 shadow-inner">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Total Practice</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              {stats.formattedTotal}
            </div>
            <div className="text-[11px] text-indigo-300/80">
              {stats.totalHours} hrs · {rangeTitle}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Daily Average</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-300 mt-0.5">
              {stats.formattedAverage}
            </div>
            <div className="text-[11px] text-indigo-300/80">
              Across all 7 calendar days
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Active Days</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              {stats.activeDaysCount} <span className="text-sm font-normal text-indigo-400">/ 7</span>
            </div>
            <div className="text-[11px] text-indigo-300/80">
              {stats.totalSessions} session{stats.totalSessions === 1 ? "" : "s"} logged
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-indigo-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-300" />
              <span>Peak Day</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-indigo-200 mt-0.5 truncate">
              {stats.peakDay ? stats.peakDay.dayLabel : "—"}
            </div>
            <div className="text-[11px] text-indigo-300/80 truncate">
              {stats.peakDay ? `${stats.peakDay.formattedTime} on ${stats.peakDay.dateSub}` : "No practice yet"}
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Visualization */}
        <div className="w-full relative pt-1">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDays}
                margin={{ top: 20, right: 12, bottom: 24, left: 4 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const payload = e.activePayload[0].payload as DayPracticeData;
                    setSelectedDateKey(payload.dateKey);
                  }
                }}
              >
                <defs>
                  {/* Standard Vibrant Emerald/Indigo Bar Gradient */}
                  <linearGradient id="practiceBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.75} />
                  </linearGradient>

                  {/* Today Highlight Gradient */}
                  <linearGradient id="todayBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                  </linearGradient>

                  {/* Selected Bar Gradient */}
                  <linearGradient id="selectedBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                  </linearGradient>

                  {/* Zero practice baseline bar gradient */}
                  <linearGradient id="emptyBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#312e81" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1e1b4b" stopOpacity={0.2} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  strokeOpacity={0.85}
                  vertical={false}
                />

                <XAxis
                  dataKey="dayLabel"
                  stroke="#818cf8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: gridStroke, strokeWidth: 1 }}
                  tick={(props: any) => {
                    const { x, y, payload } = props;
                    const item = chartDays.find((d) => d.dayLabel === payload.value);
                    const isSelected = item?.dateKey === selectedDateKey;
                    const isTodayItem = item?.isToday;

                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={0}
                          y={14}
                          textAnchor="middle"
                          fill={isSelected ? "#38bdf8" : isTodayItem ? "#a5b4fc" : "#94a3b8"}
                          fontSize={12}
                          fontWeight={isSelected || isTodayItem ? 700 : 500}
                        >
                          {payload.value}
                        </text>
                        {item && (
                          <text
                            x={0}
                            y={28}
                            textAnchor="middle"
                            fill={isSelected ? "#7dd3fc" : "#64748b"}
                            fontSize={10}
                          >
                            {item.dateSub}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />

                <YAxis
                  stroke="#818cf8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, maxMinutes]}
                  tickFormatter={formatMinutes}
                  width={46}
                />

                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.12)", radius: 6 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0) {
                      const data = payload[0].payload as DayPracticeData;
                      const diffVsAvg = data.totalMinutes - stats.averageMinutes;

                      return (
                        <div className="bg-slate-900/95 border border-indigo-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md min-w-[220px] text-xs">
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-800/50">
                            <div>
                              <span className="font-semibold text-white text-sm">
                                {data.dayLabel}
                              </span>
                              <span className="text-indigo-300 ml-1.5 font-normal">
                                {data.dateSub}
                              </span>
                            </div>
                            {data.isToday && (
                              <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-700/60">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="py-2.5">
                            <div className="text-[11px] text-indigo-300 font-medium">
                              Total Practice Time
                            </div>
                            <div className="text-2xl font-black tracking-tight text-emerald-400 mt-0.5">
                              {data.formattedTime}
                              <span className="text-xs text-indigo-300 font-normal ml-1.5">
                                ({data.totalMinutes} min)
                              </span>
                            </div>
                          </div>

                          {/* Sessions & Benchmark status */}
                          <div className="space-y-1 pt-1 border-t border-indigo-900/50 text-[11px]">
                            <div className="flex items-center justify-between text-indigo-200">
                              <span>Sessions logged:</span>
                              <span className="font-semibold text-white">
                                {data.sessionCount}
                              </span>
                            </div>

                            {stats.averageMinutes > 0 && data.totalMinutes > 0 && (
                              <div className="flex items-center justify-between text-indigo-300">
                                <span>Vs daily avg:</span>
                                <span
                                  className={`font-semibold ${
                                    diffVsAvg >= 0 ? "text-emerald-400" : "text-amber-400"
                                  }`}
                                >
                                  {diffVsAvg >= 0 ? `+${diffVsAvg}m` : `${diffVsAvg}m`}
                                </span>
                              </div>
                            )}

                            {showGoalLine && activeGoalMinutes > 0 && (
                              <div className="flex items-center justify-between text-indigo-300">
                                <span>Goal ({activeGoalMinutes}m):</span>
                                <span
                                  className={`font-semibold ${
                                    data.goalMet ? "text-emerald-400" : "text-indigo-400"
                                  }`}
                                >
                                  {data.goalMet ? "Achieved ✓" : `${activeGoalMinutes - data.totalMinutes}m to go`}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Songs practiced breakdown */}
                          {data.songsBreakdown.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-indigo-900/50">
                              <div className="text-[10px] uppercase font-semibold text-indigo-400 mb-1">
                                Songs Practiced
                              </div>
                              <div className="space-y-1">
                                {data.songsBreakdown.map((s, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] text-slate-300"
                                  >
                                    <span className="truncate max-w-[130px] text-indigo-200">
                                      {s.songTitle}
                                    </span>
                                    <span className="font-medium text-emerald-300 ml-2">
                                      {formatMinutes(s.minutes)}
                                      {s.accuracy !== null && ` (${s.accuracy}%)`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2.5 pt-1.5 text-[10px] text-indigo-400/80 text-center italic">
                            Click bar to inspect day details
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Daily Average Reference Line */}
                {stats.averageMinutes > 0 && (
                  <ReferenceLine
                    y={stats.averageMinutes}
                    stroke="#818cf8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Avg: ${stats.formattedAverage}`,
                      fill: "#c7d2fe",
                      fontSize: 11,
                      position: "insideTopRight",
                    }}
                  />
                )}

                {/* Optional Daily Goal Reference Line */}
                {showGoalLine && activeGoalMinutes > 0 && (
                  <ReferenceLine
                    y={activeGoalMinutes}
                    stroke="#10b981"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                    label={{
                      value: `Goal: ${activeGoalMinutes}m`,
                      fill: "#6ee7b7",
                      fontSize: 11,
                      position: "insideTopLeft",
                    }}
                  />
                )}

                <Bar
                  dataKey="totalMinutes"
                  name="Practice Time"
                  radius={[6, 6, 0, 0]}
                  barSize={36}
                  minPointSize={4}
                  className="cursor-pointer transition-all duration-200"
                >
                  {/* Top value labels on bars with practice */}
                  <LabelList
                    dataKey="totalMinutes"
                    position="top"
                    formatter={(val: any) => (val && Number(val) > 0 ? formatMinutes(Number(val)) : "")}
                    fill="#a5b4fc"
                    fontSize={11}
                    fontWeight={600}
                    offset={6}
                  />

                  {chartDays.map((entry, index) => {
                    const isSelected = entry.dateKey === selectedDateKey;
                    let fillUrl = "url(#practiceBarGrad)";

                    if (isSelected) {
                      fillUrl = "url(#selectedBarGrad)";
                    } else if (entry.isToday) {
                      fillUrl = "url(#todayBarGrad)";
                    } else if (entry.totalMinutes === 0) {
                      fillUrl = "url(#emptyBarGrad)";
                    }

                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fillUrl}
                        stroke={isSelected ? "#7dd3fc" : entry.isToday ? "#a5b4fc" : undefined}
                        strokeWidth={isSelected ? 2 : entry.isToday ? 1 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Day Drill-down & Interactive Inspection Panel */}
        {activeSelectedDay && (
          <div className="pt-3 border-t border-indigo-900/40 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-white text-sm">
                  {activeSelectedDay.fullDate}
                </span>
                {activeSelectedDay.isToday && (
                  <span className="text-[11px] font-medium text-indigo-300">
                    · Today
                  </span>
                )}
                <span className="text-xs text-indigo-400">
                  · Total: <strong className="text-emerald-300">{activeSelectedDay.formattedTime}</strong>
                </span>
              </div>

              {onRecordSession && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRecordSession}
                  className="h-7 px-2.5 text-xs text-indigo-300 hover:text-white hover:bg-indigo-900/60 gap-1 border border-indigo-800/40"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Log Practice</span>
                </Button>
              )}
            </div>

            {/* List of sessions on this selected day */}
            {activeSelectedDay.practices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {activeSelectedDay.practices.map((practice) => {
                  const durationInfo = getSessionDurationMinutes(practice);
                  return (
                    <div
                      key={practice.id}
                      className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-900/60 text-xs flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-white truncate flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{practice.songTitle}</span>
                        </div>
                        <span className="font-semibold text-emerald-400 whitespace-nowrap">
                          {formatMinutes(durationInfo.minutes)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-indigo-300">
                        <span>Speed: {practice.speed} BPM</span>
                        <span aria-hidden="true">·</span>
                        <span>Acc: {practice.accuracy}%</span>
                        <span aria-hidden="true">·</span>
                        <span>Level {practice.difficulty}</span>
                      </div>

                      {practice.note && (
                        <p className="text-[11px] text-indigo-300/80 italic truncate border-t border-indigo-900/40 pt-1 mt-0.5">
                          "{practice.note}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-3 px-4 rounded-lg bg-indigo-950/30 border border-indigo-900/30 text-xs text-indigo-300 flex items-center justify-between">
                <span>No practice sessions were recorded for this day.</span>
                {onRecordSession && (
                  <button
                    type="button"
                    onClick={onRecordSession}
                    className="text-xs font-medium text-indigo-200 hover:text-white underline underline-offset-2 ml-2"
                  >
                    Start a practice session now →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
