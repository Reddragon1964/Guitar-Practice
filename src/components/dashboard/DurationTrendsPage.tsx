import React, { useState, useMemo } from "react";
import {
  Clock,
  Printer,
  ArrowLeft,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Timer,
  Edit2,
  Plus,
  Flame,
  Activity,
  Layers,
  Star,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { format, parseISO, subDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Practice, Song, PrintMode } from "../../types";
import { cn } from "../../lib/utils";
import { formatDurationColon, formatDurationLabel } from "../../utils/durationFormat";

interface DurationTrendsPageProps {
  practices: Practice[];
  activeSongs: Song[];
  usageLogs?: { date: string; minutes: number }[];
  printMode: PrintMode;
  onPrint: (mode: "durations") => void;
  onBack: () => void;
  onAddSession: () => void;
  onEditSession: (p: Practice) => void;
  onFeedbackSession?: (p: Practice) => void;
}

type TimeRangeOption = "14d" | "30d" | "90d" | "all";
type ViewModeOption = "sessions" | "daily";
type ChartTypeOption = "area" | "bar";

// Helper to estimate session duration if not explicitly logged
export function getSessionDurationMinutes(p: Practice): { minutes: number; isEstimated: boolean } {
  if (typeof p.duration === "number" && p.duration > 0) {
    const minutes = Math.max(1, Math.round(p.duration / 60));
    return { minutes, isEstimated: false };
  }
  // Fallback estimation based on note count or default 15 minutes
  if (p.totalNotes && p.totalNotes > 0) {
    const estimated = Math.max(2, Math.min(60, Math.round(p.totalNotes / 22)));
    return { minutes: estimated, isEstimated: true };
  }
  return { minutes: 5, isEstimated: true };
}

// Format minutes into human-readable duration
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export const DurationTrendsPage: React.FC<DurationTrendsPageProps> = ({
  practices,
  activeSongs,
  usageLogs = [],
  printMode,
  onPrint,
  onBack,
  onAddSession,
  onEditSession,
  onFeedbackSession,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>("30d");
  const [viewMode, setViewMode] = useState<ViewModeOption>("sessions");
  const [chartType, setChartType] = useState<ChartTypeOption>("area");
  const [songFilter, setSongFilter] = useState<string>("");
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);

  const isPrintHidden = printMode && printMode !== "durations" && printMode !== "all";

  // Filter practices based on date range and song
  const filteredPractices = useMemo(() => {
    const now = new Date();
    let cutoffDate: Date | null = null;

    if (timeRange === "14d") cutoffDate = startOfDay(subDays(now, 14));
    else if (timeRange === "30d") cutoffDate = startOfDay(subDays(now, 30));
    else if (timeRange === "90d") cutoffDate = startOfDay(subDays(now, 90));

    return practices
      .filter((p) => {
        if (songFilter && p.songTitle !== songFilter) return false;
        if (cutoffDate) {
          try {
            const pDate = parseISO(p.date);
            if (pDate < cutoffDate) return false;
          } catch {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.createdAt - b.createdAt;
      });
  }, [practices, timeRange, songFilter]);

  // Aggregate Data for the Chart
  const { chartData, averageMinutes, totalMinutes, longestSession, totalExplicitCount } = useMemo(() => {
    if (filteredPractices.length === 0) {
      return {
        chartData: [],
        averageMinutes: 0,
        totalMinutes: 0,
        longestSession: null as { minutes: number; song: string; date: string } | null,
        totalExplicitCount: 0,
      };
    }

    let sumMinutes = 0;
    let explicitCount = 0;
    let maxSession: { minutes: number; song: string; date: string } | null = null;

    if (viewMode === "sessions") {
      const data = filteredPractices.map((p, idx) => {
        const { minutes, isEstimated } = getSessionDurationMinutes(p);
        sumMinutes += minutes;
        if (!isEstimated) explicitCount++;

        if (!maxSession || minutes > maxSession.minutes) {
          maxSession = { minutes, song: p.songTitle, date: p.date };
        }

        let formattedDate = p.date;
        try {
          formattedDate = format(parseISO(p.date), "MMM d");
        } catch {
          // fallback
        }

        return {
          id: p.id,
          rawDate: p.date,
          label: `${formattedDate} (#${idx + 1})`,
          shortLabel: formattedDate,
          songTitle: p.songTitle,
          difficulty: p.difficulty,
          duration: minutes,
          exactSeconds: p.duration,
          isEstimated,
          accuracy: p.accuracy,
          speed: p.speed,
          isTestSession: p.isTestSession,
        };
      });

      const avg = data.length > 0 ? Math.round(sumMinutes / data.length) : 0;

      return {
        chartData: data,
        averageMinutes: avg,
        totalMinutes: sumMinutes,
        longestSession: maxSession,
        totalExplicitCount: explicitCount,
      };
    } else {
      // Daily aggregation view
      const dailyMap: Record<
        string,
        {
          date: string;
          duration: number;
          sessionCount: number;
          hasEstimated: boolean;
          songs: Set<string>;
        }
      > = {};

      filteredPractices.forEach((p) => {
        const { minutes, isEstimated } = getSessionDurationMinutes(p);
        sumMinutes += minutes;
        if (!isEstimated) explicitCount++;

        if (!maxSession || minutes > maxSession.minutes) {
          maxSession = { minutes, song: p.songTitle, date: p.date };
        }

        if (!dailyMap[p.date]) {
          dailyMap[p.date] = {
            date: p.date,
            duration: 0,
            sessionCount: 0,
            hasEstimated: false,
            songs: new Set(),
          };
        }

        dailyMap[p.date].duration += minutes;
        dailyMap[p.date].sessionCount += 1;
        dailyMap[p.date].songs.add(p.songTitle);
        if (isEstimated) dailyMap[p.date].hasEstimated = true;
      });

      // Factor in dailyUsage timer logs if they exceed practice session total for that day
      usageLogs.forEach((log) => {
        if (dailyMap[log.date] && log.minutes > dailyMap[log.date].duration) {
          // Optional boost to reflect total active app practice timer
          dailyMap[log.date].duration = Math.max(dailyMap[log.date].duration, log.minutes);
        }
      });

      const sortedDates = Object.keys(dailyMap).sort((a, b) => a.localeCompare(b));
      const data = sortedDates.map((d) => {
        let label = d;
        try {
          label = format(parseISO(d), "MMM d");
        } catch {
          // fallback
        }
        return {
          id: d,
          rawDate: d,
          label,
          shortLabel: label,
          duration: dailyMap[d].duration,
          sessionCount: dailyMap[d].sessionCount,
          songsSummary: Array.from(dailyMap[d].songs).join(", "),
          isEstimated: dailyMap[d].hasEstimated,
        };
      });

      const avg = data.length > 0 ? Math.round(sumMinutes / data.length) : 0;

      return {
        chartData: data,
        averageMinutes: avg,
        totalMinutes: sumMinutes,
        longestSession: maxSession,
        totalExplicitCount: explicitCount,
      };
    }
  }, [filteredPractices, viewMode, usageLogs]);

  // Calculate Duration Trend (first half vs second half)
  const staminaTrend = useMemo(() => {
    if (chartData.length < 4) return null;
    const mid = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, mid);
    const secondHalf = chartData.slice(mid);

    const avg1 = firstHalf.reduce((acc, curr) => acc + curr.duration, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((acc, curr) => acc + curr.duration, 0) / secondHalf.length;

    if (avg1 === 0) return null;
    const diffPct = Math.round(((avg2 - avg1) / avg1) * 100);
    return diffPct;
  }, [chartData]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-50">
                Session Duration Trends
              </h1>
              <p className="text-sm text-indigo-300">
                Visualize practice session lengths, endurance, and practice volume over time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => onPrint("durations")}
            className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800"
          >
            <Printer className="w-4 h-4" /> Print
          </Button>
          <Button
            onClick={onAddSession}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950"
          >
            <Plus className="w-4 h-4" /> Log Session
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-900/50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-800/60 bg-indigo-950/40 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
              <Timer className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-50 font-mono">
              {formatDuration(totalMinutes)}
            </div>
            <p className="text-xs text-indigo-300 mt-1">
              Across {filteredPractices.length} session{filteredPractices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-800/60 bg-indigo-950/40 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Duration</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {averageMinutes} <span className="text-sm font-normal text-indigo-300">min</span>
            </div>
            <p className="text-xs text-indigo-300 mt-1">
              {viewMode === "sessions" ? "Per practice session" : "Per practice day"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-800/60 bg-indigo-950/40 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Longest Session</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
              {longestSession ? `${longestSession.minutes}m` : "—"}
            </div>
            <p className="text-xs text-indigo-300 mt-1 truncate" title={longestSession?.song}>
              {longestSession ? longestSession.song : "No sessions logged"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-indigo-800/60 bg-indigo-950/40 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-indigo-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Stamina Trend</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono">
              {staminaTrend !== null ? (
                <span className={staminaTrend >= 0 ? "text-cyan-300" : "text-amber-400"}>
                  {staminaTrend > 0 ? `+${staminaTrend}%` : `${staminaTrend}%`}
                </span>
              ) : (
                <span className="text-indigo-400/60 text-lg font-sans">Baseline</span>
              )}
            </div>
            <p className="text-xs text-indigo-300 mt-1">
              {staminaTrend !== null
                ? staminaTrend >= 0
                  ? "Duration trending longer"
                  : "Shorter recent sessions"
                : "Need more sessions"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart Card */}
      <Card
        className={`border-indigo-500/30 bg-indigo-900/10 shadow-[0_0_20px_rgba(99,102,241,0.12)] ${
          isPrintHidden ? "print:hidden" : ""
        }`}
      >
        <CardHeader className="pb-4 border-b border-indigo-800/50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-indigo-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <span>
                  {viewMode === "sessions" ? "Per-Session Practice Length" : "Daily Practice Time"}
                </span>
              </CardTitle>
              <p className="text-xs text-indigo-300 mt-0.5">
                {viewMode === "sessions"
                  ? "Chronological history of individual session durations"
                  : "Total accumulated practice time for each calendar day"}
              </p>
            </div>

            {/* Filter & Display Controls */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {/* Song Filter */}
              <div className="flex items-center">
                <Select
                  value={songFilter}
                  onChange={(e) => setSongFilter(e.target.value)}
                  className="h-8 text-xs w-36 sm:w-44 bg-indigo-950/80 border-indigo-700"
                >
                  <option value="">All Songs</option>
                  {activeSongs.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Time Range Selector */}
              <div className="inline-flex rounded-md p-0.5 bg-indigo-950 border border-indigo-800">
                {(["14d", "30d", "90d", "all"] as TimeRangeOption[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                      timeRange === range
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-indigo-300 hover:text-indigo-100"
                    )}
                  >
                    {range === "14d"
                      ? "14D"
                      : range === "30d"
                      ? "30D"
                      : range === "90d"
                      ? "90D"
                      : "All"}
                  </button>
                ))}
              </div>

              {/* Granularity View Mode */}
              <div className="inline-flex rounded-md p-0.5 bg-indigo-950 border border-indigo-800">
                <button
                  onClick={() => setViewMode("sessions")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                    viewMode === "sessions"
                      ? "bg-indigo-600 text-white"
                      : "text-indigo-300 hover:text-indigo-100"
                  )}
                  title="View individual session durations"
                >
                  Sessions
                </button>
                <button
                  onClick={() => setViewMode("daily")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded transition-colors",
                    viewMode === "daily"
                      ? "bg-indigo-600 text-white"
                      : "text-indigo-300 hover:text-indigo-100"
                  )}
                  title="View total daily practice minutes"
                >
                  Daily Total
                </button>
              </div>

              {/* Chart Type (Area vs Bar) */}
              <div className="inline-flex rounded-md p-0.5 bg-indigo-950 border border-indigo-800">
                <button
                  onClick={() => setChartType("area")}
                  className={cn(
                    "p-1 rounded transition-colors",
                    chartType === "area"
                      ? "bg-indigo-600 text-white"
                      : "text-indigo-400 hover:text-indigo-200"
                  )}
                  title="Area chart"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "p-1 rounded transition-colors",
                    chartType === "bar"
                      ? "bg-indigo-600 text-white"
                      : "text-indigo-400 hover:text-indigo-200"
                  )}
                  title="Bar chart"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle Average Line */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAverageLine(!showAverageLine)}
                className={cn(
                  "h-8 text-xs border border-indigo-800 transition-colors",
                  showAverageLine
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-700/50"
                    : "text-indigo-400 hover:text-indigo-200"
                )}
              >
                Avg Line: {showAverageLine ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {chartData.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-indigo-800/80 rounded-xl bg-indigo-950/20">
              <Clock className="w-12 h-12 text-indigo-500/40 mb-3" />
              <h3 className="text-base font-medium text-indigo-200">No practice sessions found</h3>
              <p className="text-xs text-indigo-400 max-w-sm mt-1 mb-4">
                No practice sessions match the selected timeframe or song filter. Log a practice
                session with duration to start tracking!
              </p>
              <Button onClick={onAddSession} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Log Session Now
              </Button>
            </div>
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, bottom: 25, left: 10 }}
                  >
                    <defs>
                      <linearGradient id="durationAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="durationEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#312e81" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#818cf8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#3730a3" }}
                      dy={10}
                    />
                    <YAxis
                      stroke="#a5b4fc"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#3730a3" }}
                      domain={[0, (dataMax: number) => Math.max(30, Math.ceil(dataMax * 1.15))]}
                      unit="m"
                      label={{
                        value: "Duration (min)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        fill: "#a5b4fc",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ stroke: "#6366f1", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-indigo-950/95 backdrop-blur border border-indigo-700/80 p-3 rounded-lg shadow-xl text-indigo-50 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-1.5 mb-2">
                              <span className="font-semibold text-xs text-indigo-200">
                                {data.rawDate}
                              </span>
                              {data.isEstimated && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                                  Est.
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2 mb-1.5">
                              <span className="text-xl font-bold text-emerald-400 font-mono">
                                {data.exactSeconds !== undefined
                                  ? formatDurationColon(data.exactSeconds)
                                  : formatDurationColon(data.duration * 60)}
                              </span>
                              <span className="text-xs text-indigo-300">
                                ({data.exactSeconds !== undefined
                                  ? formatDurationLabel(data.exactSeconds)
                                  : formatDuration(data.duration)})
                              </span>
                            </div>

                            {viewMode === "sessions" ? (
                              <div className="space-y-1 text-xs border-t border-indigo-900/60 pt-1.5 text-indigo-300">
                                <div className="font-medium text-indigo-100 flex items-center justify-between">
                                  <span>{data.songTitle}</span>
                                  <span className="text-indigo-400">Lvl {data.difficulty}</span>
                                </div>
                                <div className="flex items-center justify-between text-indigo-300">
                                  <span>Accuracy: {data.accuracy}%</span>
                                  <span>Speed: {data.speed}%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs border-t border-indigo-900/60 pt-1.5 text-indigo-300 space-y-1">
                                <div>Sessions: {data.sessionCount}</div>
                                {data.songsSummary && (
                                  <div className="text-[11px] text-indigo-400 truncate max-w-[220px]">
                                    Songs: {data.songsSummary}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    {showAverageLine && averageMinutes > 0 && (
                      <ReferenceLine
                        y={averageMinutes}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{
                          value: `Avg: ${averageMinutes}m`,
                          position: "right",
                          fill: "#10b981",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="duration"
                      name="Duration (min)"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#durationAreaGradient)"
                      dot={{ r: 4, fill: "#818cf8", stroke: "#1e1b4b", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, bottom: 25, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#312e81" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#818cf8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#3730a3" }}
                      dy={10}
                    />
                    <YAxis
                      stroke="#a5b4fc"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#3730a3" }}
                      domain={[0, (dataMax: number) => Math.max(30, Math.ceil(dataMax * 1.15))]}
                      unit="m"
                      label={{
                        value: "Duration (min)",
                        angle: -90,
                        position: "insideLeft",
                        offset: 5,
                        fill: "#a5b4fc",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(99, 102, 241, 0.15)" }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-indigo-950/95 backdrop-blur border border-indigo-700/80 p-3 rounded-lg shadow-xl text-indigo-50 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-1.5 mb-2">
                              <span className="font-semibold text-xs text-indigo-200">
                                {data.rawDate}
                              </span>
                              {data.isEstimated && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                                  Est.
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline gap-2 mb-1.5">
                              <span className="text-xl font-bold text-emerald-400 font-mono">
                                {data.exactSeconds !== undefined
                                  ? formatDurationColon(data.exactSeconds)
                                  : formatDurationColon(data.duration * 60)}
                              </span>
                              <span className="text-xs text-indigo-300">
                                ({data.exactSeconds !== undefined
                                  ? formatDurationLabel(data.exactSeconds)
                                  : formatDuration(data.duration)})
                              </span>
                            </div>

                            {viewMode === "sessions" ? (
                              <div className="space-y-1 text-xs border-t border-indigo-900/60 pt-1.5 text-indigo-300">
                                <div className="font-medium text-indigo-100 flex items-center justify-between">
                                  <span>{data.songTitle}</span>
                                  <span className="text-indigo-400">Lvl {data.difficulty}</span>
                                </div>
                                <div className="flex items-center justify-between text-indigo-300">
                                  <span>Accuracy: {data.accuracy}%</span>
                                  <span>Speed: {data.speed}%</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs border-t border-indigo-900/60 pt-1.5 text-indigo-300 space-y-1">
                                <div>Sessions: {data.sessionCount}</div>
                                {data.songsSummary && (
                                  <div className="text-[11px] text-indigo-400 truncate max-w-[220px]">
                                    Songs: {data.songsSummary}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }}
                    />
                    {showAverageLine && averageMinutes > 0 && (
                      <ReferenceLine
                        y={averageMinutes}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{
                          value: `Avg: ${averageMinutes}m`,
                          position: "right",
                          fill: "#10b981",
                          fontSize: 11,
                        }}
                      />
                    )}
                    <Bar
                      dataKey="duration"
                      name="Duration (min)"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Helper Legend & Footnote */}
          <div className="mt-4 pt-3 border-t border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-indigo-400 gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
                <span>Session Length</span>
              </span>
              {showAverageLine && averageMinutes > 0 && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                  <span>Average ({averageMinutes}m)</span>
                </span>
              )}
            </div>

            <div className="text-indigo-400/80">
              {totalExplicitCount < filteredPractices.length && (
                <span>
                  Tip: Edit older sessions to add custom logged durations.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Duration Log Table */}
      <Card className="border-indigo-800/60 bg-indigo-950/40 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-indigo-800/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-indigo-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Practice Sessions Plotted ({filteredPractices.length})
            </CardTitle>
            <p className="text-xs text-indigo-400 mt-0.5">
              Click "Edit" on any session to update its duration.
            </p>
          </div>
          <Button size="sm" onClick={onAddSession} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Session
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-indigo-950/80 sticky top-0 z-10 border-b border-indigo-800 text-xs font-semibold uppercase text-indigo-300">
                <tr>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Song</th>
                  <th className="px-4 py-2.5 text-right">Duration</th>
                  <th className="px-4 py-2.5 text-right">Accuracy</th>
                  <th className="px-4 py-2.5 text-right">Speed</th>
                  <th className="px-4 py-2.5 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-900/40">
                {filteredPractices.map((p) => {
                  const { minutes, isEstimated } = getSessionDurationMinutes(p);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-indigo-900/20 transition-colors text-indigo-200"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs font-mono text-indigo-300">
                        {p.date}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-indigo-100 flex items-center gap-1.5">
                          <span>{p.songTitle}</span>
                          <span className="text-[10px] text-indigo-400 bg-indigo-900/40 px-1 py-0.5 rounded border border-indigo-800">
                            Lvl {p.difficulty}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-emerald-300">
                          {p.duration !== undefined
                            ? formatDurationColon(p.duration)
                            : formatDurationColon(minutes * 60)}
                        </span>
                        <span className="ml-1 text-[11px] text-indigo-400 font-mono">
                          ({p.duration !== undefined ? formatDurationLabel(p.duration) : `${minutes}m`})
                        </span>
                        {isEstimated && (
                          <span
                            className="ml-1 text-[10px] text-indigo-400 font-sans cursor-help"
                            title="Estimated based on exercise length. Click Edit to record exact duration."
                          >
                            (est)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {p.isTestSession && p.correctNotes === 0 ? "—" : `${p.accuracy}%`}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">{p.speed}%</td>
                      <td className="px-4 py-2.5 text-right print:hidden">
                        <button
                          onClick={() => onEditSession(p)}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-100 hover:underline"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
