/**
 * Utility functions for formatting and parsing practice session durations.
 * Supports standard "1:01" (minutes:seconds) format.
 *
 * Examples:
 * - 61 seconds -> "1:01" (1 minute, 1 second)
 * - 45 seconds -> "0:45" (45 seconds)
 * - 90 seconds -> "1:30" (1 minute, 30 seconds)
 * - 180 seconds -> "3:00" (3 minutes)
 */

/**
 * Formats a duration in seconds into "m:ss" (e.g. 61 -> "1:01", 45 -> "0:45", 90 -> "1:30", 180 -> "3:00")
 * For durations of 1 hour or more (>= 3600 seconds), formats as "h:mm:ss".
 */
export function formatDurationColon(totalSeconds?: number | null): string {
  if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds <= 0) {
    return "";
  }
  const s = Math.round(totalSeconds);
  if (s >= 3600) {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours}:${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Parses user input in either "m:ss" (e.g. "1:01"), "h:mm:ss", or raw numeric seconds into integer seconds.
 */
export function parseDurationInputToSeconds(val: string): number | undefined {
  if (!val || typeof val !== "string") return undefined;
  const str = val.trim();
  if (str === "") return undefined;

  // Check for colon format "M:SS" or "H:MM:SS"
  if (str.includes(":")) {
    const parts = str.split(":");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const s = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(s)) {
        const total = Math.max(0, m) * 60 + Math.max(0, s);
        return total > 0 ? total : undefined;
      }
    } else if (parts.length >= 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        const total = Math.max(0, h) * 3600 + Math.max(0, m) * 60 + Math.max(0, s);
        return total > 0 ? total : undefined;
      }
    }
  }

  // Check for decimal minutes e.g. "1.5" => 90 seconds
  if (str.includes(".")) {
    const decimal = parseFloat(str);
    if (!isNaN(decimal) && decimal > 0) {
      return Math.round(decimal * 60);
    }
  }

  // Check for plain number (seconds, e.g. "61" => 61 seconds)
  const num = Number(str);
  if (!isNaN(num) && num > 0) {
    return Math.round(num);
  }

  return undefined;
}

// Backwards-compatibility aliases
export const parseDurationInputToMinutes = parseDurationInputToSeconds;
export const parseDurationInput = parseDurationInputToSeconds;

/**
 * Returns human-readable description for duration in minutes and seconds (e.g. "1 min 1 sec", "45 sec", "2 min")
 */
export function formatDurationLabel(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) return "";
  const s = Math.round(totalSeconds);

  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const remS = s % 60;
    const parts: string[] = [`${h} hr`];
    if (m > 0) parts.push(`${m} min`);
    if (remS > 0) parts.push(`${remS} sec`);
    return parts.join(" ");
  }

  const m = Math.floor(s / 60);
  const remS = s % 60;

  if (m > 0 && remS > 0) {
    return `${m} min ${remS} sec`;
  }
  if (m > 0) {
    return `${m} min`;
  }
  return `${remS} sec`;
}
