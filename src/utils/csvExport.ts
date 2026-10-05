import { Practice } from "../types";
import { formatDurationColon } from "./durationFormat";

/**
 * Escapes a single CSV cell value according to RFC 4180.
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a CSV string from a list of Practice sessions.
 */
export function generatePracticesCsv(practices: Practice[]): string {
  const headers = [
    "Date",
    "Duration (m:ss)",
    "Duration (Seconds)",
    "Song Title",
    "Difficulty Level",
    "Correct Notes",
    "Total Notes",
    "Accuracy (%)",
    "Practice Speed (%)",
    "Session Type",
    "Test Score",
    "Difficulty Rating (1-5)",
    "Notes",
  ];

  const rows = practices.map((p) => {
    const durationFormatted =
      typeof p.duration === "number" && p.duration > 0 ? formatDurationColon(p.duration) : "";
    const durationSeconds =
      typeof p.duration === "number" && p.duration > 0 ? p.duration : "";

    const sessionTypes: string[] = [];
    if (p.isTestSession) sessionTypes.push("Test");
    if (p.isPartial) sessionTypes.push("Partial");
    const sessionTypeLabel = sessionTypes.length > 0 ? sessionTypes.join(" / ") : "Standard";

    return [
      p.date,
      durationFormatted,
      durationSeconds,
      p.songTitle,
      p.difficulty,
      p.isTestSession && p.correctNotes === 0 ? "" : p.correctNotes,
      p.totalNotes,
      p.isTestSession && p.correctNotes === 0 ? "" : p.accuracy,
      p.speed,
      sessionTypeLabel,
      p.score !== undefined ? p.score : "",
      p.difficultyRating !== undefined ? p.difficultyRating : "",
      p.note || "",
    ].map(escapeCsvCell);
  });

  const csvLines = [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.join(","))];
  // Prepend UTF-8 BOM so spreadsheet software opens it cleanly
  return "\uFEFF" + csvLines.join("\r\n");
}

/**
 * Triggers a browser download of the given Practice sessions as a CSV file.
 */
export function downloadPracticesCsv(practices: Practice[], filenamePrefix = "guitar-practice-sessions"): void {
  const csvContent = generatePracticesCsv(practices);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const todayStr = new Date().toISOString().split("T")[0];
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filenamePrefix}-${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
