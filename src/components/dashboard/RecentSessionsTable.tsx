import React from "react";
import { format, parseISO } from "date-fns";
import { Printer, Plus, Edit2, Trash2, Search, X, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Practice, Song, SessionSortField, SortDirection, PrintMode } from "../../types";
import { cn } from "../../lib/utils";

interface RecentSessionsTableProps {
  practices: Practice[];
  totalCount: number;
  activeSongs: Song[];
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  sortField: SessionSortField;
  sortDirection: SortDirection;
  onSort: (field: SessionSortField) => void;
  filterName: string;
  onFilterNameChange: (val: string) => void;
  filterDate: string;
  onFilterDateChange: (val: string) => void;
  filterSpeed: string;
  onFilterSpeedChange: (val: string) => void;
  filterLevel: string;
  onFilterLevelChange: (val: string) => void;
  onClearFilters: () => void;
  onAddSession: () => void;
  onEditSession: (p: Practice) => void;
  onDeleteSession: (id: string) => void;
  onFeedbackSession?: (p: Practice) => void;
  printMode: PrintMode;
  onPrint: (mode: "recent") => void;
}

export const RecentSessionsTable: React.FC<RecentSessionsTableProps> = ({
  practices,
  totalCount,
  activeSongs,
  searchQuery,
  onSearchQueryChange,
  sortField,
  sortDirection,
  onSort,
  filterName,
  onFilterNameChange,
  filterDate,
  onFilterDateChange,
  filterSpeed,
  onFilterSpeedChange,
  filterLevel,
  onFilterLevelChange,
  onClearFilters,
  onAddSession,
  onEditSession,
  onDeleteSession,
  onFeedbackSession,
  printMode,
  onPrint,
}) => {
  const isHiddenForPrint = printMode && printMode !== "recent" && printMode !== "all";

  const hasActiveFiltersOrSort = Boolean(
    searchQuery ||
      filterName ||
      filterDate ||
      filterSpeed ||
      filterLevel ||
      sortField !== "date" ||
      sortDirection !== "desc"
  );

  const activeFilterDescriptions = [
    searchQuery ? `Search: "${searchQuery}"` : "",
    filterName,
    filterDate ? `Date: ${filterDate}` : "",
    filterSpeed ? `Speed: ${filterSpeed}%` : "",
    filterLevel ? `Level: ${filterLevel}` : "",
  ].filter(Boolean);

  return (
    <Card className={isHiddenForPrint ? "print:hidden" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <CardTitle>Recent Sessions</CardTitle>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/60 text-indigo-300 border border-indigo-700/80 shadow-sm"
            title={`${practices.length} visible session${practices.length === 1 ? "" : "s"}${
              practices.length !== totalCount ? ` of ${totalCount} total` : ""
            }`}
          >
            {practices.length}
          </span>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => onPrint("recent")}>
            <Printer className="w-4 h-4 text-indigo-400" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddSession}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
          {activeFilterDescriptions.length > 0
            ? `Active Filters: ${activeFilterDescriptions.join(", ")}`
            : "Active Filters: None"}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search songs or notes..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 pr-8 w-full bg-indigo-950/60 border-indigo-700/70 text-indigo-100 placeholder:text-indigo-400/60 focus:border-indigo-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-indigo-400 hover:text-white rounded-full transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select
            value={filterName}
            onChange={(e) => onFilterNameChange(e.target.value)}
            className="w-44"
          >
            <option value="">All Songs</option>
            {activeSongs.map((s) => (
              <option key={s.id} value={s.title}>
                {s.title}
              </option>
            ))}
          </Select>

          <Input
            type="number"
            placeholder="Speed"
            value={filterSpeed}
            onChange={(e) => onFilterSpeedChange(e.target.value)}
            className="w-20"
            min={1}
          />

          <Input
            type="number"
            placeholder="Level"
            value={filterLevel}
            onChange={(e) => onFilterLevelChange(e.target.value)}
            className="w-20"
            min={1}
          />

          <Input
            type="date"
            value={filterDate}
            onChange={(e) => onFilterDateChange(e.target.value)}
            className="w-36"
          />

          {hasActiveFiltersOrSort && (
            <Button variant="ghost" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-indigo-400 uppercase bg-indigo-900/40 border-b border-indigo-800">
              <tr>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors"
                  onClick={() => onSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors"
                  onClick={() => onSort("songTitle")}
                >
                  <div className="flex items-center gap-1">
                    Song / Difficulty {sortField === "songTitle" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-right">Notes (✓/Total)</th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-indigo-900/60 transition-colors"
                  onClick={() => onSort("accuracy")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Accuracy {sortField === "accuracy" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th className="px-4 py-3 font-medium text-right">Speed</th>
                <th className="px-4 py-3 font-medium text-left">Note</th>
                <th className="px-4 py-3 print:hidden text-right sticky right-0 z-10 bg-indigo-950/90 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {practices.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-indigo-800 last:border-0 hover:bg-indigo-900/20 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-indigo-300">
                    {format(parseISO(p.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-indigo-50 flex items-center gap-2">
                      {p.songTitle}
                      {p.isPartial && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                          Partial
                        </span>
                      )}
                      {p.isTestSession && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-900/60 text-purple-300 border border-purple-700">
                          Test
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-indigo-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Level {p.difficulty}</span>
                      {p.difficultyRating !== undefined && p.difficultyRating > 0 && (
                        <button
                          type="button"
                          onClick={() => onFeedbackSession?.(p)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium hover:bg-amber-500/20 transition-colors"
                          title={`Perceived difficulty: ${p.difficultyRating} of 5 stars (click to view/edit feedback)`}
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{p.difficultyRating}★</span>
                        </button>
                      )}
                      {p.duration !== undefined && (
                        <span className="text-emerald-300 font-mono">
                          {p.duration} min
                        </span>
                      )}
                      {p.score !== undefined && (
                        <span className="text-indigo-300 font-mono">
                          Score: {p.score.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-indigo-300">
                    {p.isTestSession && p.correctNotes === 0 ? (
                      <span className="text-indigo-400/60" title={`Total notes: ${p.totalNotes}`}>
                        {p.totalNotes > 0 ? `— / ${p.totalNotes}` : "—"}
                      </span>
                    ) : (
                      <>
                        <span className="font-medium text-indigo-50">{p.correctNotes}</span> /{" "}
                        {p.totalNotes}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.isTestSession && p.correctNotes === 0 ? (
                      <span className="text-indigo-400/50 text-xs italic">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          p.accuracy >= 90
                            ? "bg-emerald-900/40 text-emerald-300"
                            : p.accuracy >= 70
                            ? "bg-amber-900/40 text-amber-300"
                            : "bg-red-900/40 text-red-300"
                        )}
                      >
                        {p.accuracy}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-indigo-300">
                    {p.speed} <span className="text-xs">%</span>
                  </td>
                  <td className="px-4 py-3 text-left text-sm text-indigo-300">
                    <div
                      className="max-w-[120px] sm:max-w-[200px] whitespace-pre-wrap break-words"
                      title={p.note || ""}
                    >
                      {p.note || ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap print:hidden sticky right-0 z-10 bg-indigo-950/90 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.1)]">
                    <button
                      type="button"
                      onClick={() => onFeedbackSession?.(p)}
                      className="text-indigo-500 hover:text-amber-400 transition-colors mr-3"
                      title={
                        p.difficultyRating
                          ? `Feedback (${p.difficultyRating}★) - click to edit`
                          : "Rate session difficulty & notes"
                      }
                    >
                      <Star
                        className={cn(
                          "w-4 h-4 transition-colors",
                          p.difficultyRating
                            ? "fill-amber-400 text-amber-400"
                            : "hover:fill-amber-400/30"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => onEditSession(p)}
                      className="text-indigo-500 hover:text-indigo-400 transition-colors mr-3"
                      title="Edit session"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSession(p.id)}
                      className="text-indigo-500 hover:text-red-400 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {practices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-indigo-400">
                    {totalCount === 0 ? (
                      "No sessions recorded."
                    ) : searchQuery ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>
                          No sessions found matching{" "}
                          <span className="font-semibold text-indigo-200">
                            "{searchQuery}"
                          </span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSearchQueryChange("")}
                          className="border-indigo-700 text-indigo-300 hover:bg-indigo-900 mt-1"
                        >
                          Clear Search
                        </Button>
                      </div>
                    ) : (
                      "No sessions match your active filters."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
