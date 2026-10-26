import React, { useMemo } from "react";
import { Printer, Calendar, Grid } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Select } from "../ui/select";
import { Song, PrintMode } from "../../types";
import { cn } from "../../lib/utils";

const COLORS = [
  "#a855f7",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

// Existing major horizontal grid lines (25% increments)
const MAJOR_TICKS = [0, 25, 50, 75, 100];
const MAJOR_TICK_SET = new Set(MAJOR_TICKS);

// 5% horizontal accuracy ticks (0%, 5%, 10%, ..., 100%)
const FIVE_PERCENT_TICKS = Array.from({ length: 21 }, (_, i) => i * 5);
const FIVE_PERCENT_SUBDIVISIONS = FIVE_PERCENT_TICKS.filter((t) => !MAJOR_TICK_SET.has(t));

// 2% horizontal accuracy subdivisions (excluding major and 5% lines)
const TWO_PERCENT_SUBDIVISIONS = Array.from({ length: 51 }, (_, i) => i * 2).filter(
  (t) => !MAJOR_TICK_SET.has(t) && t % 5 !== 0
);

type SubdivisionStep = "5%" | "2%" | "major";

interface HistoricalAccuracyChartProps {
  chartData: any[];
  songKeys: string[];
  activeSongs: Song[];
  songFilter: string;
  onSongFilterChange: (val: string) => void;
  speedFilter: string;
  onSpeedFilterChange: (val: string) => void;
  levelFilter: string;
  onLevelFilterChange: (val: string) => void;
  startDateFilter: string;
  onStartDateFilterChange: (val: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (val: string) => void;
  onClearFilters?: () => void;
  printMode: PrintMode;
  onPrint: (mode: "historical") => void;
  gridStroke?: string;
  showConnectingLines?: boolean;
  onToggleConnectingLines?: (val: boolean) => void;
}

export const HistoricalAccuracyChart: React.FC<HistoricalAccuracyChartProps> = ({
  chartData,
  songKeys,
  activeSongs,
  songFilter,
  onSongFilterChange,
  speedFilter,
  onSpeedFilterChange,
  levelFilter,
  onLevelFilterChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
  onClearFilters,
  printMode,
  onPrint,
  gridStroke = "#1e1b4b",
  showConnectingLines: showConnectingLinesProp,
  onToggleConnectingLines,
}) => {
  const [localShowLines, setLocalShowLines] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("guitar_historical_accuracy_connect_lines");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });

  const [subdivisionMode, setSubdivisionMode] = React.useState<SubdivisionStep>(() => {
    try {
      const saved = localStorage.getItem("guitar_historical_accuracy_subdivision_step_v2");
      if (saved === "5%" || saved === "2%" || saved === "major") {
        return saved;
      }
    } catch {}
    return "5%";
  });

  const handleSubdivisionChange = (mode: SubdivisionStep) => {
    setSubdivisionMode(mode);
    try {
      localStorage.setItem("guitar_historical_accuracy_subdivision_step_v2", mode);
    } catch {}
  };

  const showLines =
    showConnectingLinesProp !== undefined ? showConnectingLinesProp : localShowLines;

  const handleToggleLines = (checked: boolean) => {
    if (showConnectingLinesProp === undefined) {
      setLocalShowLines(checked);
      try {
        localStorage.setItem("guitar_historical_accuracy_connect_lines", String(checked));
      } catch {
        // ignore
      }
    }
    onToggleConnectingLines?.(checked);
  };

  const isHiddenForPrint = printMode && printMode !== "historical" && printMode !== "all";

  const hasActiveFilters = Boolean(
    songFilter || speedFilter || levelFilter || startDateFilter || endDateFilter
  );

  const activeFilterDescriptions = [
    songFilter,
    speedFilter ? `Speed ${speedFilter}%` : "",
    levelFilter ? `Level ${levelFilter}` : "",
    startDateFilter ? `From ${startDateFilter}` : "",
    endDateFilter ? `To ${endDateFilter}` : "",
  ].filter(Boolean);

  // Determine subdivision stroke color that contrasts well with the selected grid theme
  const subdivisionStrokeColor = useMemo(() => {
    if (gridStroke === "#ffffff") return "rgba(255, 255, 255, 0.45)";
    return "#4f46e5"; // crisp indigo subdivision line
  }, [gridStroke]);

  const yAxisTicks = useMemo(() => {
    if (subdivisionMode === "major") return MAJOR_TICKS;
    return FIVE_PERCENT_TICKS;
  }, [subdivisionMode]);

  // Custom Y-Axis tick renderer to differentiate major 25% lines and finer 5% horizontal subdivisions
  const renderYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const val = Number(payload.value);
    const isMajor = MAJOR_TICK_SET.has(val);

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-6}
          y={0}
          dy={3.5}
          textAnchor="end"
          fill={isMajor ? "#c7d2fe" : "#818cf8"}
          fontSize={isMajor ? 11 : 9.5}
          fontWeight={isMajor ? 700 : 500}
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        >
          {val}%
        </text>
      </g>
    );
  };

  return (
    <Card className={isHiddenForPrint ? "print:hidden" : ""}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <CardTitle>Historical Accuracy by Song</CardTitle>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
              {subdivisionMode === "5%"
                ? "5% Horizontal Grid Subdivisions"
                : subdivisionMode === "2%"
                ? "5% & 2% Fine Grid Subdivisions"
                : "25% Major Grid Lines"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            {/* Horizontal Accuracy Subdivision Grid Control */}
            <div
              className="inline-flex items-center h-8 gap-1 p-0.5 rounded-lg bg-indigo-950/70 border border-indigo-800/70 text-xs"
              title="Configure finer horizontal accuracy subdivision grid lines"
            >
              <span className="inline-flex items-center gap-1 px-2 h-6 text-[11px] text-indigo-300 font-medium whitespace-nowrap">
                <Grid className="w-3 h-3 text-indigo-400" />
                Grid:
              </span>
              {(
                [
                  { id: "5%", label: "5% Subdivisions" },
                  { id: "2%", label: "2% Fine" },
                  { id: "major", label: "25% Only" },
                ] as { id: SubdivisionStep; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSubdivisionChange(opt.id)}
                  className={cn(
                    "h-6 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center justify-center whitespace-nowrap",
                    subdivisionMode === opt.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-indigo-300 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label
              htmlFor="historical-connect-lines"
              className="inline-flex items-center h-8 gap-2 cursor-pointer select-none px-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 hover:border-indigo-700/80 hover:bg-indigo-950/80 transition-colors group"
              title="Turn off or on the lines connecting the data points"
            >
              <input
                type="checkbox"
                id="historical-connect-lines"
                className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-500"
                checked={showLines}
                onChange={(e) => handleToggleLines(e.target.checked)}
              />
              <span className="text-xs font-medium text-indigo-200 group-hover:text-indigo-100 whitespace-nowrap">
                Connect data points
              </span>
            </label>
            <Button
              variant="ghost"
              size="sm"
              className="print:hidden h-8 px-2.5"
              onClick={() => onPrint("historical")}
              title="Print Historical Accuracy Chart"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
            </Button>
          </div>
        </div>

        <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
          {hasActiveFilters
            ? `Active Filters: ${activeFilterDescriptions.join(", ")}`
            : "Active Filters: None"}
          {!showLines && " • Connecting lines: Off"}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <Select
            value={songFilter}
            onChange={(e) => onSongFilterChange(e.target.value)}
            className="h-9 text-xs py-1 w-40"
          >
            <option value="">All Songs</option>
            {activeSongs.map((s) => (
              <option key={s.id} value={s.title}>
                {s.title}
              </option>
            ))}
          </Select>

          <NumericKeypadInput
            compact
            label="Filter Speed (%)"
            placeholder="Speed"
            inputClassName="h-9 text-xs"
            containerClassName="w-24"
            value={speedFilter}
            onChange={(val) => onSpeedFilterChange(val)}
            min={1}
            max={100}
            step={5}
            quickPresets={[
              { label: "50%", value: "50" },
              { label: "75%", value: "75" },
              { label: "90%", value: "90" },
              { label: "100%", value: "100" },
            ]}
          />

          <NumericKeypadInput
            compact
            label="Filter Level"
            placeholder="Level"
            inputClassName="h-9 text-xs"
            containerClassName="w-24"
            value={levelFilter}
            onChange={(val) => onLevelFilterChange(val)}
            min={1}
            max={12}
            quickPresets={[
              { label: "1", value: "1" },
              { label: "3", value: "3" },
              { label: "5", value: "5" },
              { label: "8", value: "8" },
              { label: "10", value: "10" },
              { label: "12", value: "12" },
            ]}
          />

          <div className="inline-flex items-center h-9 gap-1.5 bg-slate-900/80 border border-slate-800 rounded-md px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-indigo-300 whitespace-nowrap">From:</span>
            <Input
              type="date"
              className="h-7 py-0 px-2 text-xs w-32"
              value={startDateFilter}
              onChange={(e) => onStartDateFilterChange(e.target.value)}
            />
          </div>

          <div className="inline-flex items-center h-9 gap-1.5 bg-slate-900/80 border border-slate-800 rounded-md px-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-medium text-indigo-300 whitespace-nowrap">To:</span>
            <Input
              type="date"
              className="h-7 py-0 px-2 text-xs w-32"
              value={endDateFilter}
              onChange={(e) => onEndDateFilterChange(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2.5 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 25 }}>
                {/* Existing primary horizontal grid lines */}
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  strokeOpacity={0.9}
                  vertical={false}
                />

                {/* Optional ultra-fine 2% horizontal accuracy subdivision lines */}
                {subdivisionMode === "2%" &&
                  TWO_PERCENT_SUBDIVISIONS.map((val) => (
                    <ReferenceLine
                      key={`sub2-${val}`}
                      y={val}
                      stroke={subdivisionStrokeColor}
                      strokeDasharray="1 4"
                      strokeOpacity={0.32}
                      strokeWidth={0.75}
                    />
                  ))}

                {/* Finer 5% horizontal accuracy subdivision grid lines */}
                {(subdivisionMode === "5%" || subdivisionMode === "2%") &&
                  FIVE_PERCENT_SUBDIVISIONS.map((val) => (
                    <ReferenceLine
                      key={`sub5-${val}`}
                      y={val}
                      stroke={subdivisionStrokeColor}
                      strokeDasharray="2 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                    />
                  ))}

                {/* Emphasize existing 25% major horizontal grid lines */}
                {MAJOR_TICKS.map((val) => (
                  <ReferenceLine
                    key={`major-${val}`}
                    y={val}
                    stroke={gridStroke === "#ffffff" ? "#ffffff" : "#6366f1"}
                    strokeDasharray="3 3"
                    strokeOpacity={0.85}
                    strokeWidth={1.35}
                  />
                ))}

                <XAxis
                  dataKey="date"
                  stroke="#818cf8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -15,
                    fill: "#a5b4fc",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  stroke="#818cf8"
                  fontSize={11}
                  tickLine={{ stroke: "#4f46e5", strokeWidth: 1 }}
                  axisLine={false}
                  domain={[0, 100]}
                  ticks={yAxisTicks}
                  interval={0}
                  tick={renderYAxisTick}
                  label={{
                    value: "Accuracy (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -14,
                    fill: "#a5b4fc",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1b4b",
                    borderRadius: "8px",
                    border: "1px solid #3730a3",
                    color: "#e0e7ff",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
                  }}
                  itemStyle={{ color: "#e0e7ff" }}
                />
                {songKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={showLines ? 3 : 0}
                    strokeOpacity={showLines ? 1 : 0}
                    connectNulls={showLines}
                    dot={{
                      r: showLines ? 4 : 5,
                      fill: COLORS[idx % COLORS.length],
                      stroke: showLines ? "none" : "#ffffff",
                      strokeWidth: showLines ? 0 : 1.5,
                    }}
                    activeDot={{
                      r: 6.5,
                      fill: COLORS[idx % COLORS.length],
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    label={{
                      position: "top",
                      fill: COLORS[idx % COLORS.length],
                      fontSize: 11,
                      fontWeight: 500,
                      formatter: (val: any) => (val ? `${val}%` : ""),
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-indigo-500 text-sm">
            No practice data yet. Add a session to see your progress!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
