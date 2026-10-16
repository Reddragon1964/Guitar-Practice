import React, { useMemo, useState } from "react";
import {
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Practice } from "../../types";
import { format, parseISO } from "date-fns";
import {
  computeAccuracyReportData,
  printAccuracyReportDirectly,
  downloadAccuracyReportHtml,
  downloadAccuracyReportCsv,
  AccuracyReportFilters,
} from "../../utils/printAccuracyReport";
import { getAppCurrentUrl } from "./SiteNavButton";
import { cn } from "../../lib/utils";

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
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [sandboxBlocked, setSandboxBlocked] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const reportData = useMemo(() => {
    return computeAccuracyReportData(practices, {
      ...filters,
      totalAvailableSessions: totalAvailableCount,
      filteredSessionsCount: practices.length,
    });
  }, [practices, filters, totalAvailableCount]);

  if (!isOpen) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setSandboxBlocked(false);
    setStatusMessage(null);

    const result = await printAccuracyReportDirectly(reportData);
    setIsPrinting(false);

    if (result.blockedBySandbox) {
      setSandboxBlocked(true);
      setStatusMessage("Browser preview iframe blocked direct printing. Use 'Open in New Tab' or download standalone HTML.");
    } else if (result.success) {
      setStatusMessage("Print dialog triggered! You can print or save as PDF.");
      setTimeout(() => setStatusMessage(null), 4000);
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

  const { songs, dates, dailyTotals, grandTotalSessions, grandAvgAccuracy, filters: filterSummary } = reportData;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-indigo-700/80 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top laser accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950/30 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                Songs listed on the left, daily averages across dates, and final column showing overall average of all entries.
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Sandbox Warning Banner if window.print was blocked */}
        {sandboxBlocked && (
          <div className="bg-amber-950/80 border-b border-amber-600/70 p-3 px-6 flex items-center justify-between gap-4 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Browser preview iframe blocked direct printing. Open the app in a new tab or download the standalone HTML report to print cleanly.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={getAppCurrentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium inline-flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in New Tab</span>
              </a>
              <button
                type="button"
                onClick={() => setSandboxBlocked(false)}
                className="text-amber-400 hover:text-white p-1"
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

          {/* Report Data Table */}
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
          ) : (
            <div className="border border-indigo-800/70 rounded-xl overflow-hidden shadow-xl bg-slate-950">
              <div className="overflow-x-auto max-h-[50vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/95 sticky top-0 z-20 shadow-md">
                    <tr className="border-b border-indigo-800/80">
                      {/* Left Sticky Song Column */}
                      <th className="py-3 px-4 font-bold text-white tracking-wide min-w-[180px] sticky left-0 bg-slate-900/95 z-30 border-r border-indigo-800/60">
                        Song Title
                      </th>
                      {/* Dates Across Columns */}
                      {dates.map((dateStr) => {
                        let formattedDate = dateStr;
                        let dayOfWeek = "";
                        try {
                          const parsed = parseISO(dateStr);
                          formattedDate = format(parsed, "MMM d");
                          dayOfWeek = format(parsed, "EEE");
                        } catch {
                          // raw fallback
                        }
                        return (
                          <th
                            key={dateStr}
                            className="py-2.5 px-3 font-semibold text-indigo-200 text-center min-w-[85px] border-r border-indigo-900/60"
                            title={dateStr}
                          >
                            <div className="text-xs font-bold text-white">{formattedDate}</div>
                            <div className="text-[10px] text-indigo-400 font-normal">{dayOfWeek}</div>
                          </th>
                        );
                      })}
                      {/* Final Column: Average of all entries */}
                      <th className="py-3 px-4 font-bold text-emerald-300 text-center min-w-[140px] bg-emerald-950/40 border-l border-emerald-800/50">
                        Average of All Entries
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
                            className={cn(
                              "py-3 px-4 font-semibold text-white sticky left-0 z-10 border-r border-indigo-800/60",
                              rowIdx % 2 === 0 ? "bg-slate-950" : "bg-slate-900"
                            )}
                          >
                            <div className="font-bold text-slate-100">{song.songTitle}</div>
                            <div className="text-[10px] text-indigo-400 font-mono">
                              {song.totalSessions} {song.totalSessions === 1 ? "entry" : "entries"}
                            </div>
                          </td>

                          {/* Daily Accuracy Across */}
                          {dates.map((dateStr) => {
                            const cell = song.dailyValues[dateStr];
                            if (cell && cell.avgAccuracy !== null) {
                              return (
                                <td
                                  key={dateStr}
                                  className="py-3 px-3 text-center border-r border-indigo-950/60"
                                >
                                  <span
                                    className={cn(
                                      "inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-mono font-bold border",
                                      getAccuracyColor(cell.avgAccuracy)
                                    )}
                                    title={`${song.songTitle} on ${dateStr}: ${cell.avgAccuracy}% average across ${cell.count} session${cell.count === 1 ? "" : "s"}`}
                                  >
                                    {cell.avgAccuracy}%
                                    {cell.count > 1 && (
                                      <span className="text-[9px] opacity-75 ml-1">
                                        x{cell.count}
                                      </span>
                                    )}
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td
                                key={dateStr}
                                className="py-3 px-3 text-center text-slate-600 font-mono border-r border-indigo-950/60"
                              >
                                —
                              </td>
                            );
                          })}

                          {/* Final Column: Average of all entries */}
                          <td className="py-3 px-4 text-center bg-emerald-950/20 border-l border-emerald-900/40">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border shadow-sm",
                                getAccuracyColor(song.overallAvgAccuracy)
                              )}
                              title={`Overall average accuracy for ${song.songTitle} across all ${song.totalSessions} entries`}
                            >
                              {song.overallAvgAccuracy}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Daily Averages Footer Row */}
                  <tfoot className="bg-slate-900/95 font-bold border-t-2 border-indigo-700/80 sticky bottom-0 z-20">
                    <tr>
                      <td className="py-3 px-4 text-white sticky left-0 bg-slate-900 z-30 border-r border-indigo-800/60 font-bold">
                        Daily Average
                      </td>
                      {dates.map((dateStr) => {
                        const dt = dailyTotals[dateStr];
                        if (dt && dt.avgAccuracy !== null) {
                          return (
                            <td
                              key={dateStr}
                              className="py-3 px-3 text-center border-r border-indigo-900/60"
                            >
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs",
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
                            className="py-3 px-3 text-center text-slate-600 font-mono border-r border-indigo-900/60"
                          >
                            —
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-center bg-emerald-950/40 border-l border-emerald-800/50">
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
