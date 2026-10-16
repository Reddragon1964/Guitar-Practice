import { Practice } from "../types";
import { format, parseISO } from "date-fns";

export interface AccuracyReportCell {
  date: string;
  count: number;
  avgAccuracy: number | null; // null if no practice entries on this day
  hasTestOnly?: boolean;
}

export interface AccuracyReportSongRow {
  songTitle: string;
  totalSessions: number;
  overallAvgAccuracy: number;
  dailyValues: Record<string, AccuracyReportCell>; // date -> cell
}

export interface AccuracyReportFilters {
  searchQuery?: string;
  filterName?: string;
  filterDate?: string;
  filterStartDate?: string;
  filterEndDate?: string;
  filterSpeed?: string;
  filterLevel?: string;
  totalAvailableSessions: number;
  filteredSessionsCount: number;
  hasActiveFilters: boolean;
}

export interface DailyAccuracyReportData {
  songs: AccuracyReportSongRow[];
  dates: string[]; // sorted chronologically "YYYY-MM-DD"
  dailyTotals: Record<string, { count: number; avgAccuracy: number | null }>;
  grandTotalSessions: number;
  grandAvgAccuracy: number;
  filters: AccuracyReportFilters;
  generatedAt: string;
}

/**
 * Computes the daily accuracy matrix and overall averages for songs based on filtered practices.
 */
export function computeAccuracyReportData(
  practices: Practice[],
  filters: Partial<AccuracyReportFilters> = {}
): DailyAccuracyReportData {
  const generatedAt = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const totalAvailable = filters.totalAvailableSessions ?? practices.length;
  const filteredCount = practices.length;
  const effectiveStart = filters.filterStartDate || filters.filterDate;
  const effectiveEnd = filters.filterEndDate;
  const hasActiveFilters = Boolean(
    (filters.searchQuery && filters.searchQuery.trim().length > 0) ||
      filters.filterName ||
      effectiveStart ||
      effectiveEnd ||
      filters.filterSpeed ||
      filters.filterLevel ||
      filteredCount !== totalAvailable
  );

  const filterSummary: AccuracyReportFilters = {
    searchQuery: filters.searchQuery,
    filterName: filters.filterName,
    filterDate: effectiveStart,
    filterStartDate: effectiveStart,
    filterEndDate: effectiveEnd,
    filterSpeed: filters.filterSpeed,
    filterLevel: filters.filterLevel,
    totalAvailableSessions: totalAvailable,
    filteredSessionsCount: filteredCount,
    hasActiveFilters,
  };

  // 1. Collect and sort unique dates (YYYY-MM-DD)
  const dateSet = new Set<string>();
  practices.forEach((p) => {
    if (p.date) {
      const d = p.date.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        dateSet.add(d);
      }
    }
  });
  const dates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

  // 2. Collect and sort unique song titles
  const songSet = new Set<string>();
  practices.forEach((p) => {
    if (p.songTitle && p.songTitle.trim()) {
      songSet.add(p.songTitle.trim());
    }
  });
  const songTitles = Array.from(songSet).sort((a, b) => a.localeCompare(b));

  // Helper to extract valid accuracy value from practice session
  const isValidAcc = (p: Practice) => !p.isTestSession || p.correctNotes > 0;

  // 3. Compute row for each song
  const songs: AccuracyReportSongRow[] = songTitles.map((songTitle) => {
    const songPractices = practices.filter((p) => p.songTitle.trim() === songTitle);
    const validAccPractices = songPractices.filter(isValidAcc);

    // Overall average for all entries of this song
    let overallAvgAccuracy = 0;
    if (validAccPractices.length > 0) {
      const sum = validAccPractices.reduce((acc, curr) => acc + curr.accuracy, 0);
      overallAvgAccuracy = Math.round((sum / validAccPractices.length) * 10) / 10;
    } else if (songPractices.length > 0) {
      const sum = songPractices.reduce((acc, curr) => acc + curr.accuracy, 0);
      overallAvgAccuracy = Math.round((sum / songPractices.length) * 10) / 10;
    }

    // Daily values for each date
    const dailyValues: Record<string, AccuracyReportCell> = {};
    dates.forEach((dateStr) => {
      const dayPractices = songPractices.filter(
        (p) => p.date && p.date.split("T")[0] === dateStr
      );
      if (dayPractices.length === 0) {
        dailyValues[dateStr] = {
          date: dateStr,
          count: 0,
          avgAccuracy: null,
        };
      } else {
        const dayValid = dayPractices.filter(isValidAcc);
        if (dayValid.length > 0) {
          const sum = dayValid.reduce((acc, curr) => acc + curr.accuracy, 0);
          dailyValues[dateStr] = {
            date: dateStr,
            count: dayPractices.length,
            avgAccuracy: Math.round((sum / dayValid.length) * 10) / 10,
          };
        } else {
          // Fallback if test session with accuracy
          const sum = dayPractices.reduce((acc, curr) => acc + curr.accuracy, 0);
          dailyValues[dateStr] = {
            date: dateStr,
            count: dayPractices.length,
            avgAccuracy: Math.round((sum / dayPractices.length) * 10) / 10,
            hasTestOnly: true,
          };
        }
      }
    });

    return {
      songTitle,
      totalSessions: songPractices.length,
      overallAvgAccuracy,
      dailyValues,
    };
  });

  // 4. Daily totals across all songs for each date
  const dailyTotals: Record<string, { count: number; avgAccuracy: number | null }> = {};
  dates.forEach((dateStr) => {
    const dayPractices = practices.filter(
      (p) => p.date && p.date.split("T")[0] === dateStr
    );
    if (dayPractices.length === 0) {
      dailyTotals[dateStr] = { count: 0, avgAccuracy: null };
    } else {
      const dayValid = dayPractices.filter(isValidAcc);
      if (dayValid.length > 0) {
        const sum = dayValid.reduce((acc, curr) => acc + curr.accuracy, 0);
        dailyTotals[dateStr] = {
          count: dayPractices.length,
          avgAccuracy: Math.round((sum / dayValid.length) * 10) / 10,
        };
      } else {
        const sum = dayPractices.reduce((acc, curr) => acc + curr.accuracy, 0);
        dailyTotals[dateStr] = {
          count: dayPractices.length,
          avgAccuracy: Math.round((sum / dayPractices.length) * 10) / 10,
        };
      }
    }
  });

  // 5. Grand average accuracy across all entries in the filtered report
  const allValidPractices = practices.filter(isValidAcc);
  let grandAvgAccuracy = 0;
  if (allValidPractices.length > 0) {
    const sum = allValidPractices.reduce((acc, curr) => acc + curr.accuracy, 0);
    grandAvgAccuracy = Math.round((sum / allValidPractices.length) * 10) / 10;
  } else if (practices.length > 0) {
    const sum = practices.reduce((acc, curr) => acc + curr.accuracy, 0);
    grandAvgAccuracy = Math.round((sum / practices.length) * 10) / 10;
  }

  return {
    songs,
    dates,
    dailyTotals,
    grandTotalSessions: practices.length,
    grandAvgAccuracy,
    filters: filterSummary,
    generatedAt,
  };
}

/**
 * Generates an isolated, beautiful HTML document string for printing or standalone download.
 */
export function generateAccuracyReportHtml(
  report: DailyAccuracyReportData,
  autoPrintOnLoad = false
): string {
  const { songs, dates, dailyTotals, grandTotalSessions, grandAvgAccuracy, filters, generatedAt } = report;

  // Build active filters text
  const filterParts: string[] = [];
  if (filters.filterName) filterParts.push(`Song: <strong>${escapeHtml(filters.filterName)}</strong>`);
  
  const effectiveStart = filters.filterStartDate || filters.filterDate;
  if (effectiveStart && filters.filterEndDate) {
    filterParts.push(`Date Range: <strong>${escapeHtml(effectiveStart)} to ${escapeHtml(filters.filterEndDate)}</strong>`);
  } else if (effectiveStart) {
    filterParts.push(`From Date: <strong>${escapeHtml(effectiveStart)}</strong>`);
  } else if (filters.filterEndDate) {
    filterParts.push(`To Date: <strong>${escapeHtml(filters.filterEndDate)}</strong>`);
  }

  if (filters.filterSpeed) filterParts.push(`Speed: <strong>${escapeHtml(filters.filterSpeed)}%</strong>`);
  if (filters.filterLevel) filterParts.push(`Level: <strong>${escapeHtml(filters.filterLevel)}</strong>`);
  if (filters.searchQuery && filters.searchQuery.trim()) {
    filterParts.push(`Search: <em>"${escapeHtml(filters.searchQuery.trim())}"</em>`);
  }

  const filterSummaryHtml = filterParts.length > 0
    ? `Active Filters (${filters.filteredSessionsCount} of ${filters.totalAvailableSessions} sessions): ${filterParts.join(" &bull; ")}`
    : `All Practice Sessions (${filters.filteredSessionsCount} total sessions evaluated, no active filters)`;

  const tableHeaderDates = dates.map((d) => {
    let formattedDate = d;
    let dayOfWeek = "";
    try {
      const parsed = parseISO(d);
      formattedDate = format(parsed, "MMM d");
      dayOfWeek = format(parsed, "EEE");
    } catch {
      // keep raw date
    }
    return `
      <th class="col-date" title="${d}">
        <div class="th-date-main">${formattedDate}</div>
        <div class="th-date-sub">${dayOfWeek}</div>
      </th>
    `;
  }).join("");

  const songRowsHtml = songs.map((s, idx) => {
    const isEven = idx % 2 === 0;
    const dateCells = dates.map((d) => {
      const cell = s.dailyValues[d];
      if (cell && cell.avgAccuracy !== null) {
        const acc = cell.avgAccuracy;
        const colorClass = acc >= 90 ? "acc-high" : acc >= 80 ? "acc-good" : acc >= 70 ? "acc-fair" : "acc-low";
        const countLabel = cell.count > 1 ? `<span class="cell-count">(${cell.count})</span>` : "";
        return `<td class="cell-acc ${colorClass}">${acc}% ${countLabel}</td>`;
      }
      return `<td class="cell-empty">&mdash;</td>`;
    }).join("");

    const overallColor = s.overallAvgAccuracy >= 90 ? "acc-high" : s.overallAvgAccuracy >= 80 ? "acc-good" : s.overallAvgAccuracy >= 70 ? "acc-fair" : "acc-low";

    return `
      <tr class="${isEven ? 'row-even' : 'row-odd'}">
        <td class="col-song">
          <div class="song-title-text">${escapeHtml(s.songTitle)}</div>
          <div class="song-sub">${s.totalSessions} ${s.totalSessions === 1 ? 'session' : 'sessions'}</div>
        </td>
        ${dateCells}
        <td class="col-avg ${overallColor}">
          <span class="badge-avg">${s.overallAvgAccuracy}%</span>
        </td>
      </tr>
    `;
  }).join("");

  // Daily totals footer row
  const footerDailyCells = dates.map((d) => {
    const dt = dailyTotals[d];
    if (dt && dt.avgAccuracy !== null) {
      const acc = dt.avgAccuracy;
      const colorClass = acc >= 90 ? "acc-high" : acc >= 80 ? "acc-good" : acc >= 70 ? "acc-fair" : "acc-low";
      return `<td class="cell-acc font-bold ${colorClass}">${acc}%</td>`;
    }
    return `<td class="cell-empty">&mdash;</td>`;
  }).join("");

  const grandColor = grandAvgAccuracy >= 90 ? "acc-high" : grandAvgAccuracy >= 80 ? "acc-good" : grandAvgAccuracy >= 70 ? "acc-fair" : "acc-low";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Guitar Practice Tracker - Daily Accuracy by Song Report</title>
  <style>
    @page {
      size: landscape;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 16px 20px;
      line-height: 1.4;
      font-size: 12px;
    }
    .report-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #4338ca;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-pill {
      background: #4338ca;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .report-title-main {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .filter-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 11px;
      color: #334155;
      margin-bottom: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    .stat-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .stat-val.highlight {
      color: #047857;
    }
    .table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      padding: 8px 10px;
      border-bottom: 2px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
    }
    th:last-child {
      border-right: none;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    td:last-child {
      border-right: none;
    }
    .col-song {
      width: 200px;
      min-width: 160px;
      font-weight: 600;
      color: #0f172a;
    }
    .song-title-text {
      font-size: 12px;
      font-weight: 700;
    }
    .song-sub {
      font-size: 9.5px;
      color: #64748b;
      font-weight: normal;
    }
    .col-date {
      text-align: center;
      min-width: 68px;
    }
    .th-date-main {
      font-size: 11px;
      font-weight: 700;
    }
    .th-date-sub {
      font-size: 9.5px;
      color: #64748b;
      font-weight: normal;
    }
    .col-avg {
      text-align: center;
      min-width: 110px;
      background: #f8fafc;
      font-weight: 700;
    }
    .cell-acc {
      text-align: center;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
    }
    .cell-empty {
      text-align: center;
      color: #94a3b8;
    }
    .cell-count {
      font-size: 9px;
      color: #64748b;
      margin-left: 2px;
    }
    .acc-high {
      color: #047857;
      font-weight: 700;
    }
    .acc-good {
      color: #0369a1;
      font-weight: 600;
    }
    .acc-fair {
      color: #b45309;
      font-weight: 600;
    }
    .acc-low {
      color: #be123c;
      font-weight: 600;
    }
    .badge-avg {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
    }
    .row-even {
      background: #ffffff;
    }
    .row-odd {
      background: #fcfdfe;
    }
    .row-footer {
      background: #f1f5f9;
      font-weight: 700;
      border-top: 2px solid #cbd5e1;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .table-wrapper {
        border: 1px solid #94a3b8;
      }
    }
  </style>
  ${autoPrintOnLoad ? "<script>window.onload = function() { setTimeout(function() { window.print(); }, 200); };</script>" : ""}
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="header-top">
        <div class="brand-title">
          <span class="brand-pill">Report</span>
          <span>Guitar Practice Tracker</span>
        </div>
        <div class="report-meta">
          <div>Generated: <strong>${generatedAt}</strong></div>
          <div>Report Type: Daily Accuracy by Song</div>
        </div>
      </div>
      <div class="report-title-main">
        Daily Practice Accuracy by Song
      </div>
    </div>

    <div class="filter-banner">
      ${filterSummaryHtml}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Songs Plotted</div>
        <div class="stat-val">${songs.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Practice Days</div>
        <div class="stat-val">${dates.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Sessions</div>
        <div class="stat-val">${grandTotalSessions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Average of All Entries</div>
        <div class="stat-val highlight ${grandColor}">${grandAvgAccuracy}%</div>
      </div>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="col-song">Song Title</th>
            ${tableHeaderDates}
            <th class="col-avg">Average of All Entries</th>
          </tr>
        </thead>
        <tbody>
          ${songRowsHtml}
        </tbody>
        <tfoot>
          <tr class="row-footer">
            <td class="col-song font-bold">Daily Average</td>
            ${footerDailyCells}
            <td class="col-avg ${grandColor}">
              <span class="badge-avg font-bold">${grandAvgAccuracy}%</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="footer">
      <span>Guitar Practice Tracker &bull; Practice Sessions Log Daily Accuracy Report</span>
      <span>Printed ${generatedAt}</span>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Generates CSV string for the Daily Accuracy matrix
 */
export function generateAccuracyReportCsv(report: DailyAccuracyReportData): string {
  const { songs, dates, dailyTotals, grandTotalSessions, grandAvgAccuracy } = report;

  const headers = [
    "Song Title",
    ...dates.map((d) => {
      try {
        return format(parseISO(d), "yyyy-MM-dd");
      } catch {
        return d;
      }
    }),
    "Average of All Entries (%)",
    "Total Sessions",
  ];

  const rows = songs.map((s) => {
    const dateValues = dates.map((d) => {
      const cell = s.dailyValues[d];
      return cell && cell.avgAccuracy !== null ? `${cell.avgAccuracy}%` : "";
    });
    return [
      s.songTitle,
      ...dateValues,
      `${s.overallAvgAccuracy}%`,
      s.totalSessions,
    ];
  });

  // Footer summary row
  const footerRow = [
    "Daily Average (All Songs)",
    ...dates.map((d) => {
      const dt = dailyTotals[d];
      return dt && dt.avgAccuracy !== null ? `${dt.avgAccuracy}%` : "";
    }),
    `${grandAvgAccuracy}%`,
    grandTotalSessions,
  ];

  return [headers, ...rows, footerRow]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}

/**
 * Directly prints the accuracy report using DOM portal injection and @media print styling.
 */
export async function printAccuracyReportDirectly(
  report: DailyAccuracyReportData
): Promise<{ success: boolean; blockedBySandbox?: boolean }> {
  return new Promise((resolve) => {
    try {
      // Clean up any stale portal
      const existing = document.getElementById("print-accuracy-report-portal");
      if (existing) {
        existing.remove();
      }

      const portal = document.createElement("div");
      portal.id = "print-accuracy-report-portal";
      portal.innerHTML = generateAccuracyReportHtml(report, false);

      document.body.appendChild(portal);
      document.body.classList.add("printing-accuracy-report");

      const cleanup = () => {
        document.body.classList.remove("printing-accuracy-report");
        if (portal.parentElement) {
          portal.parentElement.removeChild(portal);
        }
        window.removeEventListener("afterprint", cleanup);
      };

      window.addEventListener("afterprint", cleanup);

      // Trigger print
      setTimeout(() => {
        try {
          window.print();
          resolve({ success: true });
        } catch (printErr: any) {
          console.warn("Direct window.print() failed (likely sandboxed iframe):", printErr);
          cleanup();
          resolve({ success: false, blockedBySandbox: true });
        }
      }, 80);

      // Failsafe cleanup
      setTimeout(cleanup, 4000);
    } catch (err) {
      console.error("Accuracy report print setup error:", err);
      document.body.classList.remove("printing-accuracy-report");
      resolve({ success: false, blockedBySandbox: false });
    }
  });
}

/**
 * Downloads standalone HTML file for opening & printing
 */
export function downloadAccuracyReportHtml(report: DailyAccuracyReportData): void {
  const htmlContent = generateAccuracyReportHtml(report, true);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `guitar-accuracy-report-${dateStr}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads CSV of the matrix report
 */
export function downloadAccuracyReportCsv(report: DailyAccuracyReportData): void {
  const csvContent = generateAccuracyReportCsv(report);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `guitar-accuracy-report-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
