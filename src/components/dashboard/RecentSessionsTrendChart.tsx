import React, { useMemo, useState } from "react";
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
  TrendingUp,
  Clock,
  Target,
  Gauge,
  Music,
  Info,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { Practice, Song } from "../../types";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { cn } from "../../lib/utils";
import { formatDurationColon } from "../../utils/durationFormat";
import { getSessionDurationMinutes } from "./DurationTrendsPage";

interface RecentSessionsTrendChartProps {
  practices: Practice[];
  activeSongs?: Song[];
  gridStroke?: string;
  onRecordSession?: () => void;
}

export const RecentSessionsTrendChart: React.FC<RecentSessionsTrendChartProps> = ({
  practices = [],
  activeSongs = [],
  gridStroke = "#1e1b4b",
  onRecordSession,
}) => {
  const [selectedSong, setSelectedSong] = useState<string>("all");
  const [curveType, setCurveType] = useState<"monotone" | "linear">("monotone");

  React.useEffect(() => {
    if (
      selectedSong !== "all" &&
      !activeSongs.some((s) => s.title.trim().toLowerCase() === selectedSong.trim().toLowerCase())
    ) {
      setSelectedSong("all");
    }
  }, [activeSongs, selectedSong]);

  // Filter and chronologically sort the last 7 sessions
  const chartData = useMemo(() => {
    if (!practices || practices.length === 0) return [];

    // Filter by song if selected
    const filtered =
      selectedSong === "all"
        ? practices
        : practices.filter(
            (p) =>
              p.songTitle &&
              p.songTitle.trim().toLowerCase() === selectedSong.trim().toLowerCase()
          );

    if (filtered.length === 0) return [];

    // Sort chronologically ascending (oldest to newest)
    const sorted = [...filtered].sort((a, b) => {
      const dateCmp = (a.date || "").localeCompare(b.date || "");
      if (dateCmp !== 0) return dateCmp;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

    // Take the last 7 sessions
    const last7 = sorted.slice(-7);

    return last7.map((p, index) => {
      const durationInfo = getSessionDurationMinutes(p);
      let dateFormatted = p.date || "";
      let fullDate = p.date || "";
      try {
        const d = p.date ? parseISO(p.date) : new Date(p.createdAt || Date.now());
        if (isValid(d)) {
          dateFormatted = format(d, "MMM d");
          fullDate = format(d, "EEE, MMM d, yyyy");
        }
      } catch {}

      const durationSec = typeof p.duration === "number" ? p.duration : durationInfo.minutes * 60;
      const colonTime = formatDurationColon(durationSec);

      return {
        id: p.id,
        sessionNumber: index + 1,
        label: `#${index + 1} (${dateFormatted})`,
        shortLabel: `#${index + 1}`,
        date: dateFormatted,
        fullDate,
        songTitle: p.songTitle || "Untitled Session",
        durationMinutes: durationInfo.minutes,
        durationFormatted: colonTime,
        isEstimatedDuration: durationInfo.isEstimated,
        accuracy: typeof p.accuracy === "number" ? Math.min(100, Math.max(0, Math.round(p.accuracy))) : 0,
        speed: p.speed || 100,
        difficulty: p.difficulty || 1,
        correctNotes: p.correctNotes || 0,
        totalNotes: p.totalNotes || 0,
        isTestSession: Boolean(p.isTestSession),
      };
    });
  }, [practices, selectedSong]);

  // Aggregate statistics for the last 7 sessions
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgAccuracy: 0,
        avgDurationMinutes: 0,
        totalDurationMinutes: 0,
        accuracyTrend: 0,
        durationTrend: 0,
        highestAccuracy: 0,
        sessionCount: 0,
      };
    }

    const sessionCount = chartData.length;
    const totalAcc = chartData.reduce((acc, curr) => acc + curr.accuracy, 0);
    const totalDur = chartData.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const avgAccuracy = Math.round(totalAcc / sessionCount);
    const avgDurationMinutes = Math.round(totalDur / sessionCount);
    const highestAccuracy = Math.max(...chartData.map((d) => d.accuracy));

    // Trend comparing first to last session in the 7-session window
    const firstSession = chartData[0];
    const lastSession = chartData[chartData.length - 1];
    const accuracyTrend = lastSession.accuracy - firstSession.accuracy;
    const durationTrend = lastSession.durationMinutes - firstSession.durationMinutes;

    return {
      avgAccuracy,
      avgDurationMinutes,
      totalDurationMinutes: totalDur,
      accuracyTrend,
      durationTrend,
      highestAccuracy,
      sessionCount,
    };
  }, [chartData]);

  // Custom Dark Mode Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs space-y-2 min-w-[210px] z-50">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span>Session {data.shortLabel}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{data.fullDate}</span>
        </div>

        <div className="text-indigo-200 font-semibold truncate flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{data.songTitle}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Accuracy Row */}
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 space-y-0.5">
            <span className="text-[10px] text-indigo-300 font-medium flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-400" /> Accuracy
            </span>
            <div className="text-sm font-bold text-indigo-200 font-mono">
              {data.accuracy}%
            </div>
            <div className="text-[10px] text-indigo-400/80">
              {data.correctNotes}/{data.totalNotes} notes
            </div>
          </div>

          {/* Duration Row */}
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 space-y-0.5">
            <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" /> Duration
            </span>
            <div className="text-sm font-bold text-emerald-200 font-mono">
              {data.durationFormatted}
            </div>
            <div className="text-[10px] text-emerald-400/80">
              {data.durationMinutes} min{data.isEstimatedDuration ? " (est)" : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Speed: <strong className="text-slate-200 font-mono">{data.speed}%</strong></span>
          <span>Difficulty: <strong className="text-slate-200 font-mono">{data.difficulty}/12</strong></span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-5 space-y-4">
      {/* Header Stat Overview Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Last 7 Sessions Progression
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-700/50 normal-case">
                  {chartData.length} of {Math.min(7, practices.length)} recorded
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tracking session duration (mins) & note accuracy (%) trend lines
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeSongs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Song:</span>
              <Select
                value={selectedSong}
                onChange={(e) => setSelectedSong(e.target.value)}
                className="h-8 text-xs bg-slate-950 border-slate-700 text-slate-200 rounded-lg py-1 px-2.5 focus:border-indigo-400"
              >
                <option value="all">All Songs ({practices.length} sessions)</option>
                {activeSongs.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="inline-flex items-center h-8 border border-slate-800 rounded-lg p-0.5 bg-slate-950 text-xs gap-0.5">
            <button
              type="button"
              onClick={() => setCurveType("monotone")}
              className={cn(
                "h-6 px-2.5 rounded-md transition-colors cursor-pointer text-[11px] font-medium inline-flex items-center justify-center whitespace-nowrap",
                curveType === "monotone"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
              title="Smooth curved trend lines"
            >
              Smooth
            </button>
            <button
              type="button"
              onClick={() => setCurveType("linear")}
              className={cn(
                "h-6 px-2.5 rounded-md transition-colors cursor-pointer text-[11px] font-medium inline-flex items-center justify-center whitespace-nowrap",
                curveType === "linear"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
              title="Straight point-to-point lines"
            >
              Linear
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Pill Badges */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Average Accuracy */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-medium text-indigo-300 uppercase tracking-wider block">
                Avg Accuracy
              </span>
              <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                {stats.avgAccuracy}%
                {stats.accuracyTrend > 0 ? (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3 h-3" />+{stats.accuracyTrend}%
                  </span>
                ) : stats.accuracyTrend < 0 ? (
                  <span className="text-[10px] font-semibold text-rose-400 flex items-center">
                    <ArrowDownRight className="w-3 h-3" />
                    {stats.accuracyTrend}%
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Minus className="w-3 h-3" /> 0%
                  </span>
                )}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Average Duration */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider block">
                Avg Duration
              </span>
              <div className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                {stats.avgDurationMinutes}m
                {stats.durationTrend > 0 ? (
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3 h-3" />+{stats.durationTrend}m
                  </span>
                ) : stats.durationTrend < 0 ? (
                  <span className="text-[10px] font-semibold text-amber-400 flex items-center">
                    <ArrowDownRight className="w-3 h-3" />
                    {stats.durationTrend}m
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Minus className="w-3 h-3" /> 0m
                  </span>
                )}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Peak Accuracy in Window */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Peak Accuracy
              </span>
              <div className="text-base font-bold text-emerald-300 font-mono">
                {stats.highestAccuracy}%
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Total Window Time */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
                Total Window Time
              </span>
              <div className="text-base font-bold text-white font-mono">
                {stats.totalDurationMinutes} mins
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas or Empty State */}
      {chartData.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/50 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No Practice Sessions Recorded Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {selectedSong !== "all"
                ? `No sessions recorded for "${selectedSong}". Switch to "All Songs" or record a session.`
                : "Record your practice sessions to automatically visualize duration and note accuracy trend lines over the last 7 sessions."}
            </p>
          </div>
          {onRecordSession && (
            <Button
              size="sm"
              onClick={onRecordSession}
              className="mt-2 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Session</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Main Recharts Line Chart */}
          <div className="w-full h-72 sm:h-80 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 18, left: -10, bottom: 5 }}
              >
                <CartesianGrid
                  stroke={gridStroke}
                  strokeDasharray="3 3"
                  strokeOpacity={0.6}
                  vertical={true}
                  horizontal={true}
                />

                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickLine={{ stroke: "#334155" }}
                />

                {/* Left Y-Axis: Practice Duration in minutes */}
                <YAxis
                  yAxisId="duration"
                  orientation="left"
                  stroke="#10b981"
                  unit="m"
                  tick={{ fill: "#34d399", fontSize: 11 }}
                  tickLine={{ stroke: "#065f46" }}
                  domain={[0, (dataMax: number) => Math.max(15, Math.ceil(dataMax * 1.2))]}
                />

                {/* Right Y-Axis: Accuracy in percentage */}
                <YAxis
                  yAxisId="accuracy"
                  orientation="right"
                  stroke="#818cf8"
                  unit="%"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 90, 100]}
                  tick={{ fill: "#a5b4fc", fontSize: 11 }}
                  tickLine={{ stroke: "#312e81" }}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* 90% Target Accuracy benchmark reference line */}
                <ReferenceLine
                  yAxisId="accuracy"
                  y={90}
                  stroke="#818cf8"
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  label={{
                    value: "90% Goal",
                    fill: "#818cf8",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />

                {/* Line 1: Practice Duration */}
                <Line
                  yAxisId="duration"
                  type={curveType}
                  dataKey="durationMinutes"
                  name="Practice Duration (min)"
                  stroke="#10b981"
                  strokeWidth={2.75}
                  dot={{
                    r: 4.5,
                    fill: "#10b981",
                    stroke: "#022c22",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#34d399",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    className: "drop-shadow-[0_0_8px_rgba(16,185,129,0.9)]",
                  }}
                  animationDuration={1000}
                />

                {/* Line 2: Accuracy Percentage */}
                <Line
                  yAxisId="accuracy"
                  type={curveType}
                  dataKey="accuracy"
                  name="Accuracy (%)"
                  stroke="#6366f1"
                  strokeWidth={2.75}
                  dot={{
                    r: 4.5,
                    fill: "#6366f1",
                    stroke: "#1e1b4b",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#818cf8",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    className: "drop-shadow-[0_0_8px_rgba(99,102,241,0.9)]",
                  }}
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend & Chart Footnote */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/80">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-emerald-300">
                <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block shadow-[0_0_6px_#10b981]" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>Practice Duration (Minutes, Left Axis)</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-indigo-300">
                <span className="w-3 h-1 bg-indigo-400 rounded-full inline-block shadow-[0_0_6px_#6366f1]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                <span>Accuracy (% Score, Right Axis)</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>Hover over any data point to inspect song, notes, and session details.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
