import React from "react";
import { format, parseISO } from "date-fns";
import { Printer, CheckCircle2, Circle, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Goal, Song, PrintMode } from "../../types";
import { cn } from "../../lib/utils";

interface MilestonesCardProps {
  goals: Goal[];
  activeSongs: Song[];
  songFilter: string;
  onSongFilterChange: (val: string) => void;
  startDateFilter: string;
  onStartDateFilterChange: (val: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (val: string) => void;
  onClearFilters: () => void;
  onToggleGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  printMode: PrintMode;
  onPrint: (mode: "milestones") => void;
}

export const MilestonesCard: React.FC<MilestonesCardProps> = ({
  goals,
  activeSongs,
  songFilter,
  onSongFilterChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
  onClearFilters,
  onToggleGoal,
  onDeleteGoal,
  printMode,
  onPrint,
}) => {
  const isPrintHiddenContainer = printMode && printMode !== "milestones" && printMode !== "all";

  const hasActiveFilters = Boolean(songFilter || startDateFilter || endDateFilter);

  const activeFilterDescriptions = [
    songFilter,
    startDateFilter ? `From ${startDateFilter}` : "",
    endDateFilter ? `To ${endDateFilter}` : "",
  ].filter(Boolean);

  const filteredGoals = goals.filter((g) => {
    const matchSong = songFilter ? g.songTitle === songFilter : true;
    const matchStart = startDateFilter ? g.targetDate >= startDateFilter : true;
    const matchEnd = endDateFilter ? g.targetDate <= endDateFilter : true;
    return matchSong && matchStart && matchEnd;
  });

  const groupedGoals = filteredGoals.reduce((acc, g) => {
    const key = g.songTitle || "General Milestones";
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {} as Record<string, Goal[]>);

  return (
    <div className={`space-y-8 ${isPrintHiddenContainer ? "print:hidden" : ""}`}>
      <Card
        className={`h-full border-indigo-800 bg-purple-900/20 ${
          isPrintHiddenContainer ? "print:hidden" : ""
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="print:hidden h-8 hover:bg-purple-800/50"
            onClick={() => onPrint("milestones")}
          >
            <Printer className="w-4 h-4 text-purple-300" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="hidden print:block text-sm text-purple-300 italic mb-4">
            {hasActiveFilters
              ? `Active Filters: ${activeFilterDescriptions.join(", ")}`
              : "Active Filters: None"}
          </div>

          <div className="mb-6 flex flex-col gap-3 bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/50 print:hidden">
            <div className="space-y-1">
              <div className="h-5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 flex items-center gap-1">
                  Song Filter
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-[10px] font-semibold text-rose-300 hover:text-rose-200 underline cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              <Select
                value={songFilter}
                onChange={(e) => onSongFilterChange(e.target.value)}
                className="h-9 text-xs w-full"
              >
                <option value="">All Songs</option>
                {activeSongs.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
              <div className="space-y-1">
                <div className="h-5 flex items-center">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                    From Date
                  </span>
                </div>
                <Input
                  type="date"
                  className="h-9 text-xs font-mono w-full"
                  value={startDateFilter}
                  onChange={(e) => onStartDateFilterChange(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <div className="h-5 flex items-center">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                    To Date
                  </span>
                </div>
                <Input
                  type="date"
                  className="h-9 text-xs font-mono w-full"
                  value={endDateFilter}
                  onChange={(e) => onEndDateFilterChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(Object.entries(groupedGoals) as [string, Goal[]][]).map(([groupName, groupList]) => (
              <div key={groupName} className="space-y-3">
                <h4 className="text-sm font-semibold text-purple-200 border-b border-indigo-800/50 pb-1">
                  {groupName}
                </h4>
                <div className="space-y-3">
                  {groupList.map((g) => (
                    <div
                      key={g.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        g.achieved
                          ? "bg-indigo-900/40 border-indigo-800 opacity-60"
                          : "bg-indigo-950/60 backdrop-blur-md border-indigo-800 shadow-sm"
                      )}
                    >
                      <button
                        onClick={() => onToggleGoal(g)}
                        className="mt-0.5 shrink-0 transition-colors"
                        title={g.achieved ? "Mark as incomplete" : "Mark as completed"}
                      >
                        {g.achieved ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-indigo-600 hover:text-indigo-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium break-words",
                            g.achieved ? "line-through text-indigo-400" : "text-indigo-50"
                          )}
                        >
                          {g.title}
                        </p>
                        <p className="text-xs text-indigo-400 mt-1">
                          Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteGoal(g.id)}
                        className="shrink-0 text-indigo-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredGoals.length === 0 && (
              <div className="text-center text-sm text-indigo-400 py-6">
                {goals.length === 0
                  ? "No active goals. Set a milestone to keep yourself motivated!"
                  : "No goals match your filters."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
