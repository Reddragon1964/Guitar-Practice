import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Star,
  Clock,
  CheckCircle2,
  Gauge,
  Music,
  ChevronDown,
  ChevronUp,
  Download,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Select } from "../ui/select";
import { Practice, Song, SessionSortField, SortDirection, PrintMode } from "../../types";
import { cn } from "../../lib/utils";
import {
  formatDurationColon,
  formatDurationLabel,
  parseDurationInputToSeconds,
} from "../../utils/durationFormat";
import { downloadPracticesCsv } from "../../utils/csvExport";

export interface QuickRecordPayload {
  date: string;
  durationSeconds?: number;
  songTitle: string;
  difficulty: number;
  correctNotes: number;
  totalNotes: number;
  accuracy: number;
  speed: number;
  note?: string;
}

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
  onQuickRecordSession?: (payload: QuickRecordPayload) => Promise<void> | void;
  onEditSession: (p: Practice) => void;
  onDeleteSession: (id: string) => void;
  onFeedbackSession?: (p: Practice) => void;
  printMode: PrintMode;
  onPrint: (mode: "recent") => void;
  isHighlighted?: boolean;
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
  onQuickRecordSession,
  onEditSession,
  onDeleteSession,
  onFeedbackSession,
  printMode,
  onPrint,
  isHighlighted = false,
}) => {
  const isHiddenForPrint = printMode && printMode !== "recent" && printMode !== "all";

  // Quick inline record form state
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quickDuration, setQuickDuration] = useState("3:00");
  const [quickSongTitle, setQuickSongTitle] = useState("");
  const [quickCustomSong, setQuickCustomSong] = useState(activeSongs.length === 0);
  const [quickDifficulty, setQuickDifficulty] = useState<number>(3);
  const [quickCorrectNotes, setQuickCorrectNotes] = useState("95");
  const [quickTotalNotes, setQuickTotalNotes] = useState("100");
  const [quickSpeed, setQuickSpeed] = useState("100");
  const [quickNote, setQuickNote] = useState("");
  const [isSavingQuick, setIsSavingQuick] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  const handleDownloadCsv = () => {
    if (practices.length === 0) return;
    downloadPracticesCsv(practices);
    setCsvExported(true);
    setTimeout(() => {
      setCsvExported(false);
    }, 2000);
  };

  const quickAccuracy = useMemo(() => {
    const c = parseInt(quickCorrectNotes, 10);
    const t = parseInt(quickTotalNotes, 10);
    if (!isNaN(c) && !isNaN(t) && t > 0) {
      return Math.min(100, Math.max(0, Math.round((c / t) * 100)));
    }
    return 0;
  }, [quickCorrectNotes, quickTotalNotes]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onQuickRecordSession) return;
    const trimmedSong = quickSongTitle.trim();
    const c = parseInt(quickCorrectNotes, 10);
    const t = parseInt(quickTotalNotes, 10);
    const spd = parseInt(quickSpeed, 10);
    if (!trimmedSong || isNaN(c) || isNaN(t) || t <= 0 || isNaN(spd)) return;

    setIsSavingQuick(true);
    try {
      const durationSeconds = parseDurationInputToSeconds(quickDuration);
      await onQuickRecordSession({
        date: quickDate,
        durationSeconds,
        songTitle: trimmedSong,
        difficulty: Math.min(12, Math.max(1, quickDifficulty || 1)),
        correctNotes: Math.max(0, c),
        totalNotes: Math.max(1, t),
        accuracy: Math.min(100, Math.max(0, Math.round((c / t) * 100))),
        speed: Math.max(0, spd),
        note: quickNote.trim() || undefined,
      });
      setQuickNote("");
      setShowQuickForm(false);
    } finally {
      setIsSavingQuick(false);
    }
  };

  // Summary metrics for visible rows
  const summaryStats = useMemo(() => {
    if (practices.length === 0) {
      return { totalSeconds: 0, avgAccuracy: 0, avgSpeed: 0 };
    }
    let totalSeconds = 0;
    let accSum = 0;
    let accCount = 0;
    let speedSum = 0;

    practices.forEach((p) => {
      if (typeof p.duration === "number" && p.duration > 0) {
        totalSeconds += p.duration;
      }
      if (!p.isTestSession || p.correctNotes > 0) {
        accSum += p.accuracy;
        accCount += 1;
      }
      speedSum += p.speed;
    });

    return {
      totalSeconds,
      avgAccuracy: accCount > 0 ? Math.round(accSum / accCount) : 0,
      avgSpeed: Math.round(speedSum / practices.length),
    };
  }, [practices]);

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
    <Card
      id="practice-sessions-log"
      tabIndex={-1}
      className={cn(
        "scroll-mt-24 outline-none transition-all duration-700 relative",
        isHiddenForPrint && "print:hidden",
        isHighlighted &&
          "ring-4 ring-indigo-400 ring-offset-4 ring-offset-slate-950 shadow-[0_0_35px_rgba(99,102,241,0.45)] border-indigo-400"
      )}
    >
      <div id="practice-sessions-log-top" className="absolute -top-6 left-0 w-1 h-1 pointer-events-none" />
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <CardTitle>Practice Sessions Log</CardTitle>
          {isHighlighted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/60 animate-pulse">
              Focused
            </span>
          )}
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-900/60 text-indigo-300 border border-indigo-700/80 shadow-sm"
            title={`${practices.length} visible session${practices.length === 1 ? "" : "s"}${
              practices.length !== totalCount ? ` of ${totalCount} total` : ""
            }`}
          >
            {practices.length} {practices.length === 1 ? "Session" : "Sessions"}
          </span>
          {practices.length > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-indigo-300/90 ml-1">
              {summaryStats.totalSeconds > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-700/40 text-emerald-300 font-mono">
                  <Clock className="w-3 h-3" />
                  {formatDurationColon(summaryStats.totalSeconds)} total
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Avg {summaryStats.avgAccuracy}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 font-mono">
                <Gauge className="w-3 h-3 text-purple-400" />
                Avg {summaryStats.avgSpeed}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <Button
            variant="outline"
            size="sm"
            disabled={practices.length === 0}
            onClick={handleDownloadCsv}
            className={cn(
              "gap-1.5 border-indigo-700 text-indigo-200 hover:bg-indigo-900/70 transition-colors",
              csvExported && "border-emerald-500/70 bg-emerald-950/50 text-emerald-300"
            )}
            title={
              practices.length === 0
                ? "No sessions to export"
                : `Export ${practices.length} practice session${practices.length === 1 ? "" : "s"} to CSV`
            }
          >
            {csvExported ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> CSV Downloaded
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-indigo-400" /> Download CSV
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onPrint("recent")} title="Print table">
            <Printer className="w-4 h-4 text-indigo-400" />
          </Button>
          {onQuickRecordSession && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickForm((prev) => !prev)}
              className="border-indigo-700 text-indigo-200 hover:bg-indigo-900/70 gap-1"
            >
              {showQuickForm ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Hide Quick Entry
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Quick Entry
                </>
              )}
            </Button>
          )}
          <Button
            id="start-next-practice-session-btn"
            size="sm"
            onClick={onAddSession}
            className={cn(
              "gap-1 font-semibold transition-all duration-300",
              isHighlighted
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/90 ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
            title="Start your next guitar practice session"
          >
            <Plus className="w-4 h-4" /> Record Session
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Optional Inline Quick Record Session Form */}
        {showQuickForm && onQuickRecordSession && (
          <form
            onSubmit={handleQuickSubmit}
            className="mb-5 p-4 rounded-xl bg-indigo-950/70 border border-indigo-700/80 space-y-3 print:hidden animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                  Quick Record Guitar Practice Session
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-300 font-semibold">
                Accuracy Score: {quickCorrectNotes || 0} / {quickTotalNotes || 0} ({quickAccuracy}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">Date</label>
                <Input
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">
                  Duration (m:ss)
                </label>
                <NumericKeypadInput
                  compact
                  allowColon
                  label="Duration (m:ss)"
                  value={quickDuration}
                  onChange={setQuickDuration}
                  placeholder="3:00"
                  inputClassName="h-9 text-xs font-mono text-center"
                  quickPresets={[
                    { label: "1:00", value: "1:00" },
                    { label: "2:00", value: "2:00" },
                    { label: "3:00", value: "3:00" },
                    { label: "5:00", value: "5:00" },
                  ]}
                />
              </div>

              {/* Song Title */}
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-indigo-300">Song Title</label>
                  {activeSongs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCustomSong((prev) => !prev);
                        setQuickSongTitle("");
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-200 underline"
                    >
                      {quickCustomSong ? "Select existing" : "+ New song"}
                    </button>
                  )}
                </div>
                {!quickCustomSong && activeSongs.length > 0 ? (
                  <Select
                    required
                    value={quickSongTitle}
                    onChange={(e) => setQuickSongTitle(e.target.value)}
                    className="h-9 text-xs"
                  >
                    <option value="" disabled>
                      Select song...
                    </option>
                    {activeSongs.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type="text"
                    required
                    maxLength={200}
                    placeholder="Enter song title..."
                    value={quickSongTitle}
                    onChange={(e) => setQuickSongTitle(e.target.value)}
                    className="h-9 text-xs"
                  />
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">
                  Difficulty (1-12)
                </label>
                <NumericKeypadInput
                  compact
                  label="Difficulty"
                  min={1}
                  max={12}
                  value={quickDifficulty}
                  onChange={(val) =>
                    setQuickDifficulty(
                      val === "" ? 1 : Math.min(12, Math.max(1, parseInt(val, 10) || 1))
                    )
                  }
                  inputClassName="h-9 text-xs font-mono text-center"
                  quickPresets={[
                    { label: "1", value: "1" },
                    { label: "3", value: "3" },
                    { label: "5", value: "5" },
                    { label: "8", value: "8" },
                    { label: "10", value: "10" },
                  ]}
                />
              </div>

              {/* Speed */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">
                  Speed (%)
                </label>
                <NumericKeypadInput
                  compact
                  label="Speed (%)"
                  min={1}
                  max={200}
                  step={5}
                  value={quickSpeed}
                  onChange={setQuickSpeed}
                  inputClassName="h-9 text-xs font-mono text-center"
                  quickPresets={[
                    { label: "75%", value: "75" },
                    { label: "90%", value: "90" },
                    { label: "100%", value: "100" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-1">
              {/* Correct Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">
                  Correct Notes
                </label>
                <NumericKeypadInput
                  compact
                  label="Correct Notes"
                  min={0}
                  value={quickCorrectNotes}
                  onChange={setQuickCorrectNotes}
                  inputClassName="h-9 text-xs font-mono text-center"
                />
              </div>

              {/* Total Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-indigo-300 block">
                  Total Notes
                </label>
                <NumericKeypadInput
                  compact
                  label="Total Notes"
                  min={1}
                  step={10}
                  value={quickTotalNotes}
                  onChange={setQuickTotalNotes}
                  inputClassName="h-9 text-xs font-mono text-center"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingQuick || !quickSongTitle.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {isSavingQuick ? "Saving..." : "Save Session"}
                </Button>
              </div>
            </div>
          </form>
        )}

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
              id="practice-sessions-search"
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

          <NumericKeypadInput
            compact
            label="Filter Speed (%)"
            placeholder="Speed"
            value={filterSpeed}
            onChange={(val) => onFilterSpeedChange(val)}
            containerClassName="w-24"
            min={1}
            max={200}
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
            value={filterLevel}
            onChange={(val) => onFilterLevelChange(val)}
            containerClassName="w-24"
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
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                  onClick={() => onSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                  onClick={() => onSort("duration")}
                >
                  <div className="flex items-center gap-1">
                    Duration {sortField === "duration" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors"
                  onClick={() => onSort("songTitle")}
                >
                  <div className="flex items-center gap-1">
                    Song Title {sortField === "songTitle" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium cursor-pointer hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                  onClick={() => onSort("difficulty")}
                >
                  <div className="flex items-center gap-1">
                    Difficulty {sortField === "difficulty" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                  onClick={() => onSort("accuracy")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Accuracy (Correct / Total){" "}
                    {sortField === "accuracy" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
                <th
                  className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                  onClick={() => onSort("speed")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Speed {sortField === "speed" && (sortDirection === "asc" ? "↑" : "↓")}
                  </div>
                </th>
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
                  {/* 1. Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-indigo-200 font-medium">
                    {format(parseISO(p.date), "MMM d, yyyy")}
                  </td>

                  {/* 2. Duration */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.duration !== undefined && p.duration > 0 ? (
                      <div className="flex flex-col">
                        <span
                          className="text-emerald-300 font-mono font-semibold"
                          title={`${formatDurationLabel(p.duration)} (${formatDurationColon(p.duration)} min:sec)`}
                        >
                          {formatDurationColon(p.duration)}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-mono">
                          {formatDurationLabel(p.duration)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-indigo-500 font-mono text-xs">—</span>
                    )}
                  </td>

                  {/* 3. Song Title */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-indigo-50 flex items-center gap-2 flex-wrap">
                      <span>{p.songTitle}</span>
                      {p.isPartial && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                          Partial
                        </span>
                      )}
                      {p.isShortVersion && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-teal-900/60 text-teal-300 border border-teal-700">
                          Short
                        </span>
                      )}
                      {p.isTestSession && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-purple-900/60 text-purple-300 border border-purple-700">
                          Test
                        </span>
                      )}
                    </div>
                    {p.score !== undefined && (
                      <div className="text-xs text-indigo-300 font-mono mt-0.5">
                        Test Score: {p.score.toLocaleString()}
                      </div>
                    )}
                  </td>

                  {/* 4. Difficulty Level */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-900/60 text-indigo-200 border border-indigo-700/70 font-mono">
                        Level {p.difficulty}
                      </span>
                      {p.difficultyRating !== undefined && p.difficultyRating > 0 && (
                        <button
                          type="button"
                          onClick={() => onFeedbackSession?.(p)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-medium hover:bg-amber-500/20 transition-colors"
                          title={`Perceived difficulty: ${p.difficultyRating} of 5 stars (click to view/edit feedback)`}
                        >
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{p.difficultyRating}</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* 5. Accuracy Score (Correct / Total Notes) */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {p.isTestSession && p.correctNotes === 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-indigo-400/60 text-xs font-mono">
                          {p.totalNotes > 0 ? `— / ${p.totalNotes}` : "Test Only"}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-end gap-2">
                        <span className="text-xs tabular-nums font-mono text-indigo-300">
                          <strong className="text-indigo-50">{p.correctNotes}</strong> /{" "}
                          {p.totalNotes}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono min-w-[46px] justify-center",
                            p.accuracy >= 90
                              ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
                              : p.accuracy >= 70
                              ? "bg-amber-900/40 text-amber-300 border border-amber-700/50"
                              : "bg-red-900/40 text-red-300 border border-red-700/50"
                          )}
                        >
                          {p.accuracy}%
                        </span>
                      </div>
                    )}
                  </td>

                  {/* 6. Practice Speed */}
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap font-mono text-indigo-200">
                    {p.speed}
                    <span className="text-xs text-indigo-400 ml-0.5">%</span>
                  </td>

                  {/* 7. Note */}
                  <td className="px-4 py-3 text-left text-sm text-indigo-300">
                    <div
                      className="max-w-[120px] sm:max-w-[200px] whitespace-pre-wrap break-words"
                      title={p.note || ""}
                    >
                      {p.note || <span className="text-indigo-600 text-xs">—</span>}
                    </div>
                  </td>

                  {/* 8. Actions */}
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
                  <td colSpan={8} className="px-4 py-8 text-center text-indigo-400">
                    {totalCount === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>No guitar practice sessions recorded yet.</p>
                        <Button size="sm" onClick={onAddSession} className="mt-1 gap-1">
                          <Plus className="w-4 h-4" /> Record Your First Session
                        </Button>
                      </div>
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
