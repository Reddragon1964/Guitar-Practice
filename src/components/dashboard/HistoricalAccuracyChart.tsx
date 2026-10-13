import React from "react";
import { Printer } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Select } from "../ui/select";
import { Song, PrintMode } from "../../types";

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

  const showLines = showConnectingLinesProp !== undefined ? showConnectingLinesProp : localShowLines;

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

  return (
    <Card className={isHiddenForPrint ? "print:hidden" : ""}>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between space-y-0 gap-3 flex-wrap">
          <CardTitle>Historical Accuracy by Song</CardTitle>
          <div className="flex items-center gap-3 print:hidden">
            <label
              htmlFor="historical-connect-lines"
              className="flex items-center gap-2 cursor-pointer select-none px-2.5 py-1 rounded-md bg-indigo-950/60 border border-indigo-800/60 hover:border-indigo-700/80 hover:bg-indigo-950/80 transition-colors group"
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
              className="print:hidden h-8"
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

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Select
            value={songFilter}
            onChange={(e) => onSongFilterChange(e.target.value)}
            className="h-8 text-xs py-1 w-36"
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
            inputClassName="h-8 text-xs"
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
            inputClassName="h-8 text-xs"
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

          <div className="flex items-center gap-1">
            <span className="text-xs text-indigo-300">From</span>
            <Input
              type="date"
              className="h-8 text-xs"
              value={startDateFilter}
              onChange={(e) => onStartDateFilterChange(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-indigo-300">To</span>
            <Input
              type="date"
              className="h-8 text-xs"
              value={endDateFilter}
              onChange={(e) => onEndDateFilterChange(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} strokeOpacity={0.85} vertical={false} />
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
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  domain={[0, 100]}
                  label={{
                    value: "Accuracy (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
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
