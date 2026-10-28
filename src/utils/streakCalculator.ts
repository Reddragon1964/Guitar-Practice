import { format, parseISO, subDays, differenceInCalendarDays } from "date-fns";
import { Practice } from "../types";

export interface StreakDay {
  date: string;
  dayLabel: string;
  fullDateLabel: string;
  isToday: boolean;
  practiced: boolean;
  sessionCount: number;
  bestAccuracy: number | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalPracticeDays: number;
  totalSessionsLogged: number;
  todaySessionCount: number;
  hasPracticedToday: boolean;
  hasPracticedYesterday: boolean;
  lastPracticeDate: string | null;
  nextMilestoneDays: number;
  milestoneProgressPct: number;
  recentDays: StreakDay[];
}

const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365];

function normalizeDateString(rawDate?: string | null): string | null {
  if (!rawDate || typeof rawDate !== "string") return null;
  const trimmed = rawDate.trim();
  const datePart = trimmed.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }
  try {
    const parsed = parseISO(trimmed);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd");
    }
  } catch {
    // ignore invalid date
  }
  return null;
}

/**
 * Calculates consecutive daily practice streaks from guitar practice sessions retrieved from Firestore.
 * A day counts toward the streak when the user has logged at least one guitar practice session on that date.
 */
export function calculateStreak(
  practices: Practice[],
  _usageLogs: { date: string; minutes: number }[] = []
): StreakInfo {
  const practiceDates = new Set<string>();
  const sessionsPerDate = new Map<string, number>();
  const bestAccPerDate = new Map<string, number>();

  let validSessionsCount = 0;

  // Aggregate dates and counts strictly from logged guitar practice sessions in Firestore
  practices.forEach((p) => {
    const normalizedDate = normalizeDateString(p.date);
    if (normalizedDate) {
      validSessionsCount += 1;
      practiceDates.add(normalizedDate);
      sessionsPerDate.set(normalizedDate, (sessionsPerDate.get(normalizedDate) || 0) + 1);
      if (typeof p.accuracy === "number" && (!p.isTestSession || p.correctNotes > 0)) {
        const prevBest = bestAccPerDate.get(normalizedDate);
        if (prevBest === undefined || p.accuracy > prevBest) {
          bestAccPerDate.set(normalizedDate, p.accuracy);
        }
      }
    }
  });

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

  const hasPracticedToday = practiceDates.has(todayStr);
  const hasPracticedYesterday = practiceDates.has(yesterdayStr);
  const todaySessionCount = sessionsPerDate.get(todayStr) || 0;

  // Calculate current consecutive day streak
  let currentStreak = 0;
  if (hasPracticedToday) {
    currentStreak = 1;
    let checkDay = 1;
    while (true) {
      const prevDateStr = format(subDays(now, checkDay), "yyyy-MM-dd");
      if (practiceDates.has(prevDateStr)) {
        currentStreak++;
        checkDay++;
      } else {
        break;
      }
    }
  } else if (hasPracticedYesterday) {
    // Yesterday had a logged session, so the streak is active pending today's session
    currentStreak = 1;
    let checkDay = 2;
    while (true) {
      const prevDateStr = format(subDays(now, checkDay), "yyyy-MM-dd");
      if (practiceDates.has(prevDateStr)) {
        currentStreak++;
        checkDay++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // Calculate longest historical consecutive day streak
  const sortedDates = Array.from(practiceDates).sort((a, b) => a.localeCompare(b));
  let longestStreak = currentStreak;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    try {
      const d = parseISO(dateStr);
      if (!prevDate) {
        runningStreak = 1;
      } else {
        const diff = differenceInCalendarDays(d, prevDate);
        if (diff === 1) {
          runningStreak++;
        } else if (diff > 1) {
          runningStreak = 1;
        }
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
      prevDate = d;
    } catch {
      // skip invalid date string
    }
  }

  const lastPracticeDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  // Determine next streak milestone target
  const nextMilestoneDays =
    STREAK_MILESTONES.find((m) => m > currentStreak) ||
    Math.ceil((currentStreak + 1) / 30) * 30;
  const milestoneProgressPct = Math.min(
    100,
    Math.round((currentStreak / Math.max(1, nextMilestoneDays)) * 100)
  );

  // Build 7-day activity timeline (6 days ago through today)
  const recentDays: StreakDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const isToday = i === 0;
    const count = sessionsPerDate.get(dateStr) || 0;
    recentDays.push({
      date: dateStr,
      dayLabel: format(d, "EEE"),
      fullDateLabel: format(d, "MMM d"),
      isToday,
      practiced: count > 0,
      sessionCount: count,
      bestAccuracy: bestAccPerDate.get(dateStr) ?? null,
    });
  }

  return {
    currentStreak,
    longestStreak,
    totalPracticeDays: practiceDates.size,
    totalSessionsLogged: validSessionsCount,
    todaySessionCount,
    hasPracticedToday,
    hasPracticedYesterday,
    lastPracticeDate,
    nextMilestoneDays,
    milestoneProgressPct,
    recentDays,
  };
}

