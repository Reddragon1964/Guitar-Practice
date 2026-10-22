import React, { useMemo, useState } from "react";
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Sliders,
} from "lucide-react";
import { Button } from "../ui/button";
import { Practice } from "../../types";
import { format, parseISO } from "date-fns";
import {
  computeAccuracyReportData,
  printAccuracyReportDirectly,
  downloadAccuracyReportHtml,
  downloadAccuracyReportCsv,
  copyAccuracyReportToClipboard,
} from "../../utils/printAccuracyReport";
import { cn } from "../../lib/utils";
import {
  useResizableColumns,
  AdjustableTableToolbar,
  ColumnResizeHandle,
} from "../ui/AdjustableTable";

interface DailyAccuracyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  practices: Practice[]; // Filtered practices from the log
  totalAvailableCount: number; // Total practices before filtering
  filters: {
    searchQuery?: string;
    filterName?: string;
    filterDate?: string;
    filterStartDate?: string;
    filterEndDate?: string;
    filterSpeed?: string;
    filterLevel?: string;
  };
  onClearFilters?: () => void;
}

export const DailyAccuracyReportModal: React.FC<DailyAccuracyReportModalProps> = ({
  isOpen,
  onClose,
  practices,
  totalAvailableCount,
  filters,
  onClearFilters,
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "sheet">("interactive");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [sandboxBlocked, setSandboxBlocked] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const reportData = useMemo(() => {
    return computeAccuracyReportData(practices, {
      ...filters,
      totalAvailableSessions: totalAvailableCount,
      filteredSessionsCount: practices.length,
    });
  }, [practices, filters, totalAvailableCount]);

  const defaultColWidths = useMemo(() => {
    const map: Record<string, number> = {
      songTitle: 220,
      average: 150,
    };
    reportData.dates.forEach((d) => {
      map[`date_${d}`] = 95;
    });
    return map;
  }, [reportData.dates]);

  const {
    widths,
    density,
    densityStyle,
    activeResizingColumn,
    setDensity,
    resetWidths,
    resetColumn,
    resetAll,
    startResize,
  } = useResizableColumns({
    tableId: "daily_accuracy_report",
    defaultWidths: defaultColWidths,
    minWidth: 70,
    maxWidth: 500,
    defaultDensity: "default",
  });

  const [isExpandedHeight, setIsExpandedHeight] = useState<boolean>(false);

  if (!isOpen) return null;

  const { songs, dates, dailyTotals, grandTotalSessions, grandAvgAccuracy, filters: filterSummary } = reportData;

  const handlePrint = async () => {
    setIsPrinting(true);
    setSandboxBlocked(false);
    setStatusMessage(null);

    const result = await printAccuracyReportDirectly(reportData);
    setIsPrinting(false);

    if (result.blockedBySandbox) {
      setSandboxBlocked(true);
      setViewMode("sheet");
      setStatusMessage("Browser preview restricted direct window.print(). Showing on-screen Printable Sheet Preview! You can also download standalone HTML or copy to clipboard.");
    } else if (result.success) {
      setStatusMessage("Print dialog triggered! You can print or save as PDF.");
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCopyTable = async () => {
    const ok = await copyAccuracyReportToClipboard(reportData);
    if (ok) {
      setCopySuccess(true);
      setStatusMessage("Copied formatted table to clipboard! Ready to paste into Excel or Sheets.");
      setTimeout(() => setCopySuccess(false), 3000);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage("Could not copy table to clipboard in this browser.");
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleDownloadHtml = () => {
    downloadAccuracyReportHtml(reportData);
    setStatusMessage("Downloaded standalone printable HTML report!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDownloadCsv = () => {
    downloadAccuracyReportCsv(reportData);
    setStatusMessage("Exported daily accuracy matrix CSV!");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const getAccuracyColor = (acc: number | null) => {
    if (acc === null) return "text-slate-500";
    if (acc >= 90) return "text-emerald-400 bg-emerald-950/40 border-emerald-800/40";
    if (acc >= 80) return "text-cyan-400 bg-cyan-950/40 border-cyan-800/40";
    if (acc >= 70) return "text-amber-400 bg-amber-950/40 border-amber-800/40";
    return "text-rose-400 bg-rose-950/40 border-rose-800/40";
  };

  const getPrintSheetAccuracyColor = (acc: number | null) => {
    if (acc === null) return "text-slate-400";
    if (acc >= 90) return "text-emerald-700 font-bold";
    if (acc >= 80) return "text-sky-700 font-semibold";
    if (acc >= 70) return "text-amber-700 font-semibold";
    return "text-rose-700 font-bold";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-indigo-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top laser accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3.5 border-b border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0 mt-0.5">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Daily Accuracy by Song Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 font-mono">
                  Printable Report
                </span>
                {filterSummary.hasActiveFilters && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filtered
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300/80 mt-1">
                Song list on left, chronological daily averages across dates, and final column showing overall average of all entries.
              </p>
            </div>
          </div>

          {/* Controls & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-indigo-800/80">
              <button
                type="button"
                onClick={() => setViewMode("interactive")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                  viewMode === "interactive"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-indigo-300 hover:text-white"
                )}
              >
                Interactive
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sheet")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1",
                  viewMode === "sheet"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-indigo-300 hover:text-white"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Print Preview</span>
              </button>
            </div>

            {/* Print Button */}
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting || songs.length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 shadow-md shadow-emerald-950/60"
              title="Print document or save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Printing..." : "Print Report"}</span>
            </Button>

            {/* Copy Table to Clipboard */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTable}
              disabled={songs.length === 0}
              className="border-indigo-700/80 text-indigo-200 hover:bg-indigo-900/60 gap-1.5"
              title="Copy formatted table to clipboard for pasting into Excel, Sheets, or Word"
            >
              {copySuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-indigo-300" />
                  <span className="hidden sm:inline">Copy Table</span>
                </>
              )}
            </Button>

            {/* Download Standalone HTML */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadHtml}
              disabled={songs.length === 0}
              className="border-indigo-700/80 text-indigo-200 hover:bg-indigo-900/60 gap-1.5"
              title="Download standalone HTML report that can be opened and printed anywhere"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">HTML</span>
            </Button>

            {/* Download CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              disabled={songs.length === 0}
              className="border-indigo-700/80 text-indigo-200 hover:bg-indigo-900/60 gap-1.5"
              title="Download accuracy matrix as CSV for spreadsheets"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-indigo-400 hover:text-white hover:bg-indigo-900/60 rounded-lg transition-colors border border-transparent hover:border-indigo-700/50"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sandbox Notification Banner (No external dead links) */}
        {sandboxBlocked && (
          <div className="bg-amber-950/90 border-b border-amber-600/70 p-3 px-6 flex items-center justify-between gap-4 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Browser preview restricted direct window printing. Switched to <strong>Print Preview Sheet</strong> below! You can also download the standalone HTML report to open & print from your desktop browser.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleDownloadHtml}
                className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Download HTML File
              </Button>
              <button
                type="button"
                onClick={() => setSandboxBlocked(false)}
                className="text-amber-400 hover:text-white p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Status Notification Message */}
        {statusMessage && !sandboxBlocked && (
          <div className="bg-indigo-950/80 border-b border-indigo-700/60 px-6 py-2 flex items-center justify-between text-xs text-indigo-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-indigo-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Active Filter Info Banner */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-indigo-900/70 text-xs flex-wrap">
            <div className="flex items-center gap-2 text-indigo-200 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-semibold text-white">Log Filter Query:</span>
              {filterSummary.hasActiveFilters ? (
                <>
                  <span>
                    Evaluating <strong>{filterSummary.filteredSessionsCount}</strong> of <strong>{filterSummary.totalAvailableSessions}</strong> practice sessions
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap ml-1">
                    {filterSummary.filterName && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        Song: {filterSummary.filterName}
                      </span>
                    )}
                    {((filterSummary.filterStartDate || filterSummary.filterDate) && filterSummary.filterEndDate) ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        Date Range: {filterSummary.filterStartDate || filterSummary.filterDate} to {filterSummary.filterEndDate}
                      </span>
                    ) : (filterSummary.filterStartDate || filterSummary.filterDate) ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        From: {filterSummary.filterStartDate || filterSummary.filterDate}
                      </span>
                    ) : filterSummary.filterEndDate ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        To: {filterSummary.filterEndDate}
                      </span>
                    ) : null}
                    {filterSummary.filterSpeed && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        Speed: {filterSummary.filterSpeed}%
                      </span>
                    )}
                    {filterSummary.filterLevel && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        Level: {filterSummary.filterLevel}
                      </span>
                    )}
                    {filterSummary.searchQuery && (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-200">
                        Search: "{filterSummary.searchQuery}"
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <span className="text-indigo-300/80">
                  Showing all {filterSummary.filteredSessionsCount} practice sessions (no active filters applied).
                </span>
              )}
            </div>

            {filterSummary.hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 text-xs text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-900/60">
              <div className="text-[11px] font-semibold text-indigo-300/80 uppercase tracking-wider">
                Songs Plotted
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {songs.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-900/60">
              <div className="text-[11px] font-semibold text-indigo-300/80 uppercase tracking-wider">
                Practice Days
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {dates.length}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-900/60">
              <div className="text-[11px] font-semibold text-indigo-300/80 uppercase tracking-wider">
                Total Sessions
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {grandTotalSessions}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-900/60">
              <div className="text-[11px] font-semibold text-indigo-300/80 uppercase tracking-wider">
                Average of All Entries
              </div>
              <div className={cn("text-xl sm:text-2xl font-bold mt-1 font-mono", getAccuracyColor(grandAvgAccuracy).split(" ")[0])}>
                {grandAvgAccuracy}%
              </div>
            </div>
          </div>

          {/* Empty State */}
          {songs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-indigo-800/60 rounded-xl bg-slate-900/40 space-y-3">
              <FileSpreadsheet className="w-12 h-12 text-indigo-400/50 mx-auto" />
              <h3 className="text-base font-semibold text-indigo-200">
                No Practice Sessions Found
              </h3>
              <p className="text-xs text-indigo-300/70 max-w-md mx-auto">
                No practice sessions match the current filter query in the Practice Sessions Log. Adjust or clear your filters to generate the report.
              </p>
              {onClearFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="border-indigo-700 text-indigo-200 hover:bg-indigo-900/60"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : viewMode === "sheet" ? (
            /* PRINT PREVIEW SHEET: Clean, Crisp White Paper Layout with High Contrast */
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/70 text-xs">
                <span className="text-indigo-200 flex items-center gap-1.5 font-medium">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Print Preview Mode: Exact 1:1 paper rendering with landscape matrix & totals
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewMode("interactive")}
                    className="h-7 text-xs border-indigo-700 text-indigo-200 hover:bg-indigo-900/60"
                  >
                    Return to Interactive
                  </Button>
                </div>
              </div>

              {/* White Paper Sheet */}
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 overflow-x-auto font-sans">
                {/* Sheet Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-slate-900 text-white mb-1.5">
                      Practice Log Report
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                      Daily Practice Accuracy by Song
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Guitar Practice Tracker &bull; Comprehensive daily accuracy breakdown and overall entry averages
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-600 space-y-0.5 shrink-0">
                    <div>Generated: <strong className="text-slate-900">{reportData.generatedAt}</strong></div>
                    <div>Sessions Evaluated: <strong className="text-slate-900">{grandTotalSessions}</strong></div>
                  </div>
                </div>

                {/* Filter info summary box on paper */}
                <div className="bg-slate-100 border border-slate-300 rounded p-2.5 mb-4 text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Query Scope: </span>
                  {filterSummary.hasActiveFilters ? (
                    <span>
                      Filtered ({filterSummary.filteredSessionsCount} of {filterSummary.totalAvailableSessions} sessions) &bull;{" "}
                      {[
                        filterSummary.filterName ? `Song: "${filterSummary.filterName}"` : null,
                        filterSummary.filterStartDate || filterSummary.filterDate ? `From: ${filterSummary.filterStartDate || filterSummary.filterDate}` : null,
                        filterSummary.filterEndDate ? `To: ${filterSummary.filterEndDate}` : null,
                        filterSummary.filterSpeed ? `Speed: ${filterSummary.filterSpeed}%` : null,
                        filterSummary.filterLevel ? `Level: ${filterSummary.filterLevel}` : null,
                        filterSummary.searchQuery ? `Search: "${filterSummary.searchQuery}"` : null,
                      ].filter(Boolean).join(" • ")}
                    </span>
                  ) : (
                    <span>All logged practice sessions (no active filters applied)</span>
                  )}
                </div>

                {/* Summary stat tiles on paper */}
                <div className="grid grid-cols-4 gap-3 mb-5 text-center">
                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Songs</div>
                    <div className="text-lg font-bold text-slate-900">{songs.length}</div>
                  </div>
                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Practice Days</div>
                    <div className="text-lg font-bold text-slate-900">{dates.length}</div>
                  </div>
                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Sessions</div>
                    <div className="text-lg font-bold text-slate-900">{grandTotalSessions}</div>
                  </div>
                  <div className="border-2 border-emerald-600 rounded p-2.5 bg-emerald-50">
                    <div className="text-[10px] font-extrabold text-emerald-800 uppercase">Average of All Entries</div>
                    <div className="text-lg font-black text-emerald-800">{grandAvgAccuracy}%</div>
                  </div>
                </div>

                {/* Print Sheet Table */}
                <table className="w-full text-left border-collapse border border-slate-400 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-400">
                      <th className="p-2.5 font-bold text-slate-900 border-r border-slate-300 min-w-[180px]">
                        Song Title
                      </th>
                      {dates.map((dateStr) => {
                        let formattedDate = dateStr;
                        let dayOfWeek = "";
                        try {
                          const parsed = parseISO(dateStr);
                          formattedDate = format(parsed, "MMM d");
                          dayOfWeek = format(parsed, "EEE");
                        } catch {}
                        return (
                          <th key={dateStr} className="p-2 text-center border-r border-slate-300 min-w-[70px]">
                            <div className="font-bold text-slate-900">{formattedDate}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{dayOfWeek}</div>
                          </th>
                        );
                      })}
                      <th className="p-2.5 text-center font-extrabold text-slate-950 bg-slate-200 border-l border-slate-400 min-w-[110px]">
                        Average of All Entries
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {songs.map((song, rowIdx) => (
                      <tr
                        key={song.songTitle}
                        className={rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                      >
                        <td className="p-2.5 border-t border-r border-slate-300">
                          <div className="font-bold text-slate-900">{song.songTitle}</div>
                          <div className="text-[10px] text-slate-500">
                            {song.totalSessions} {song.totalSessions === 1 ? "session" : "sessions"}
                          </div>
                        </td>
                        {dates.map((dateStr) => {
                          const cell = song.dailyValues[dateStr];
                          if (cell && cell.avgAccuracy !== null) {
                            return (
                              <td
                                key={dateStr}
                                className={cn(
                                  "p-2 text-center font-mono border-t border-r border-slate-300",
                                  getPrintSheetAccuracyColor(cell.avgAccuracy)
                                )}
                              >
                                {cell.avgAccuracy}%
                                {cell.count > 1 && (
                                  <span className="text-[9px] text-slate-500 font-sans ml-0.5">
                                    ({cell.count})
                                  </span>
                                )}
                              </td>
                            );
                          }
                          return (
                            <td key={dateStr} className="p-2 text-center text-slate-300 border-t border-r border-slate-300">
                              —
                            </td>
                          );
                        })}
                        <td
                          className={cn(
                            "p-2.5 text-center font-mono font-bold text-sm bg-slate-100/60 border-t border-l border-slate-400",
                            getPrintSheetAccuracyColor(song.overallAvgAccuracy)
                          )}
                        >
                          {song.overallAvgAccuracy}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                      <td className="p-2.5 border-r border-slate-300 text-slate-900 font-extrabold">
                        Daily Average
                      </td>
                      {dates.map((dateStr) => {
                        const dt = dailyTotals[dateStr];
                        if (dt && dt.avgAccuracy !== null) {
                          return (
                            <td
                              key={dateStr}
                              className={cn(
                                "p-2 text-center font-mono border-r border-slate-300",
                                getPrintSheetAccuracyColor(dt.avgAccuracy)
                              )}
                            >
                              {dt.avgAccuracy}%
                            </td>
                          );
                        }
                        return (
                          <td key={dateStr} className="p-2 text-center text-slate-400 border-r border-slate-300">
                            —
                          </td>
                        );
                      })}
                      <td
                        className={cn(
                          "p-2.5 text-center font-mono font-extrabold text-base bg-slate-300 border-l border-slate-400",
                          getPrintSheetAccuracyColor(grandAvgAccuracy)
                        )}
                      >
                        {grandAvgAccuracy}%
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Print Sheet Footer */}
                <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Guitar Practice Tracker &bull; Accurate Practice Log Metric Matrix</span>
                  <span>Page 1 of 1 &bull; Printed {reportData.generatedAt}</span>
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE ADJUSTABLE TABLE VIEW */
            <div className="border border-indigo-800/70 rounded-xl overflow-hidden shadow-xl bg-slate-950">
              {/* Adjustable Rows and Columns Toolbar */}
              <AdjustableTableToolbar
                density={density}
                onDensityChange={setDensity}
                onResetColumns={resetWidths}
                onResetAll={resetAll}
                rowCount={songs.length}
                columnCount={dates.length + 2}
                isMaximizedHeight={isExpandedHeight}
                onToggleMaximizeHeight={() => setIsExpandedHeight((prev) => !prev)}
              />

              <div
                className={cn(
                  "overflow-x-auto transition-all duration-300",
                  isExpandedHeight ? "max-h-[75vh]" : "max-h-[50vh]"
                )}
              >
                <table className={cn("w-full text-left border-collapse", densityStyle.fontSize)}>
                  <thead className="bg-slate-900/95 sticky top-0 z-20 shadow-md">
                    <tr className="border-b border-indigo-800/80">
                      {/* Left Sticky Song Column */}
                      <th
                        style={{
                          width: widths.songTitle || defaultColWidths.songTitle,
                          minWidth: widths.songTitle || defaultColWidths.songTitle,
                        }}
                        className={cn(
                          "relative group/resize font-bold text-white tracking-wide sticky left-0 bg-slate-900/95 z-30 border-r border-indigo-800/60 select-none",
                          densityStyle.headerPaddingY,
                          densityStyle.paddingX
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 pr-2">
                          <span className="truncate">Song Title</span>
                        </div>
                        <ColumnResizeHandle
                          onResizeStart={(e) =>
                            startResize(
                              "songTitle",
                              "touches" in e ? e.touches[0].clientX : e.clientX
                            )
                          }
                          onDoubleClick={() => resetColumn("songTitle")}
                          isResizing={activeResizingColumn === "songTitle"}
                        />
                      </th>

                      {/* Dates Across Columns */}
                      {dates.map((dateStr) => {
                        const colKey = `date_${dateStr}`;
                        const colWidth = widths[colKey] || defaultColWidths[colKey] || 95;
                        let formattedDate = dateStr;
                        let dayOfWeek = "";
                        try {
                          const parsed = parseISO(dateStr);
                          formattedDate = format(parsed, "MMM d");
                          dayOfWeek = format(parsed, "EEE");
                        } catch {}
                        return (
                          <th
                            key={dateStr}
                            style={{ width: colWidth, minWidth: colWidth }}
                            className={cn(
                              "relative group/resize font-semibold text-indigo-200 text-center border-r border-indigo-900/60 select-none",
                              densityStyle.headerPaddingY,
                              densityStyle.paddingX
                            )}
                            title={dateStr}
                          >
                            <div className="text-xs font-bold text-white truncate">{formattedDate}</div>
                            <div className="text-[10px] text-indigo-400 font-normal">{dayOfWeek}</div>
                            <ColumnResizeHandle
                              onResizeStart={(e) =>
                                startResize(
                                  colKey,
                                  "touches" in e ? e.touches[0].clientX : e.clientX
                                )
                              }
                              onDoubleClick={() => resetColumn(colKey)}
                              isResizing={activeResizingColumn === colKey}
                            />
                          </th>
                        );
                      })}

                      {/* Final Column: Average of all entries */}
                      <th
                        style={{
                          width: widths.average || defaultColWidths.average,
                          minWidth: widths.average || defaultColWidths.average,
                        }}
                        className={cn(
                          "relative group/resize font-bold text-emerald-300 text-center bg-emerald-950/40 border-l border-emerald-800/50 select-none",
                          densityStyle.headerPaddingY,
                          densityStyle.paddingX
                        )}
                      >
                        <span className="truncate">Average</span>
                        <ColumnResizeHandle
                          onResizeStart={(e) =>
                            startResize(
                              "average",
                              "touches" in e ? e.touches[0].clientX : e.clientX
                            )
                          }
                          onDoubleClick={() => resetColumn("average")}
                          isResizing={activeResizingColumn === "average"}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-950/60">
                    {songs.map((song, rowIdx) => {
                      return (
                        <tr
                          key={song.songTitle}
                          className={cn(
                            "transition-colors hover:bg-indigo-950/30",
                            rowIdx % 2 === 0 ? "bg-slate-950" : "bg-slate-900/40"
                          )}
                        >
                          {/* Song Title (Sticky Left) */}
                          <td
                            style={{
                              width: widths.songTitle || defaultColWidths.songTitle,
                              minWidth: widths.songTitle || defaultColWidths.songTitle,
                            }}
                            className={cn(
                              "font-semibold text-white sticky left-0 z-10 border-r border-indigo-800/60",
                              rowIdx % 2 === 0 ? "bg-slate-950" : "bg-slate-900",
                              densityStyle.paddingY,
                              densityStyle.paddingX
                            )}
                          >
                            <div className="font-bold text-slate-100 truncate">{song.songTitle}</div>
                            <div className="text-[10px] text-indigo-400 font-mono">
                              {song.totalSessions} {song.totalSessions === 1 ? "entry" : "entries"}
                            </div>
                          </td>

                          {/* Daily Accuracy Across */}
                          {dates.map((dateStr) => {
                            const colKey = `date_${dateStr}`;
                            const colWidth = widths[colKey] || defaultColWidths[colKey] || 95;
                            const cell = song.dailyValues[dateStr];
                            if (cell && cell.avgAccuracy !== null) {
                              return (
                                <td
                                  key={dateStr}
                                  style={{ width: colWidth, minWidth: colWidth }}
                                  className={cn(
                                    "text-center border-r border-indigo-950/60",
                                    densityStyle.paddingY,
                                    densityStyle.paddingX
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "inline-flex items-center justify-center rounded-md font-mono font-bold border",
                                      densityStyle.badgeSize,
                                      getAccuracyColor(cell.avgAccuracy)
                                    )}
                                  >
                                    {cell.avgAccuracy}%
                                    {cell.count > 1 && (
                                      <span className="text-[9px] text-slate-400 font-sans ml-1">
                                        ({cell.count})
                                      </span>
                                    )}
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td
                                key={dateStr}
                                style={{ width: colWidth, minWidth: colWidth }}
                                className={cn(
                                  "text-center text-slate-600 font-mono border-r border-indigo-950/60",
                                  densityStyle.paddingY,
                                  densityStyle.paddingX
                                )}
                              >
                                —
                              </td>
                            );
                          })}

                          {/* Final Column: Overall Average for Song */}
                          <td
                            style={{
                              width: widths.average || defaultColWidths.average,
                              minWidth: widths.average || defaultColWidths.average,
                            }}
                            className={cn(
                              "text-center bg-indigo-950/30 border-l border-indigo-800/60",
                              densityStyle.paddingY,
                              densityStyle.paddingX
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex items-center justify-center rounded-md font-mono font-extrabold border shadow-sm",
                                densityStyle.badgeSize,
                                getAccuracyColor(song.overallAvgAccuracy)
                              )}
                            >
                              {song.overallAvgAccuracy}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900/95 sticky bottom-0 z-20 shadow-inner border-t-2 border-indigo-700">
                    <tr>
                      <td
                        style={{
                          width: widths.songTitle || defaultColWidths.songTitle,
                          minWidth: widths.songTitle || defaultColWidths.songTitle,
                        }}
                        className={cn(
                          "font-bold text-white sticky left-0 bg-slate-900/95 z-30 border-r border-indigo-800/60 uppercase tracking-wider text-xs",
                          densityStyle.paddingY,
                          densityStyle.paddingX
                        )}
                      >
                        Daily Average
                      </td>
                      {dates.map((dateStr) => {
                        const colKey = `date_${dateStr}`;
                        const colWidth = widths[colKey] || defaultColWidths[colKey] || 95;
                        const dt = dailyTotals[dateStr];
                        if (dt && dt.avgAccuracy !== null) {
                          return (
                            <td
                              key={dateStr}
                              style={{ width: colWidth, minWidth: colWidth }}
                              className={cn(
                                "text-center font-mono font-bold border-r border-indigo-900/60",
                                densityStyle.paddingY,
                                densityStyle.paddingX
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center rounded font-mono font-bold",
                                  densityStyle.badgeSize,
                                  getAccuracyColor(dt.avgAccuracy).split(" ")[0]
                                )}
                              >
                                {dt.avgAccuracy}%
                              </span>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={dateStr}
                            style={{ width: colWidth, minWidth: colWidth }}
                            className={cn(
                              "text-center text-slate-600 font-mono border-r border-indigo-900/60",
                              densityStyle.paddingY,
                              densityStyle.paddingX
                            )}
                          >
                            —
                          </td>
                        );
                      })}
                      <td
                        style={{
                          width: widths.average || defaultColWidths.average,
                          minWidth: widths.average || defaultColWidths.average,
                        }}
                        className={cn(
                          "text-center bg-emerald-950/40 border-l border-emerald-800/50",
                          densityStyle.paddingY,
                          densityStyle.paddingX
                        )}
                      >
                        <span className="font-mono font-extrabold text-sm text-emerald-300">
                          {grandAvgAccuracy}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Report Footer Information */}
          <div className="flex items-center justify-between text-[11px] text-indigo-400/80 pt-2 border-t border-indigo-900/40 flex-wrap gap-2">
            <span>
              Generated: {reportData.generatedAt} &bull; Practice Sessions Log Accuracy Report
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> &ge;90%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> 80-89%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 70-79%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> &lt;70%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
