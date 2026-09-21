import { format, parseISO, subDays, differenceInCalendarDays } from "date-fns";
import { Practice } from "../types";

export interface StreakDay {
  date: string;
  dayLabel: string;
  fullDateLabel: string;
  isToday: boolean;
  practiced: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalPracticeDays: number;
  hasPracticedToday: boolean;
  hasPracticedYesterday: boolean;
  lastPracticeDate: string | null;
  recentDays: StreakDay[];
}

/**
 * Calculates consecutive daily practice streaks from practice sessions and usage logs.
 */
export function calculateStreak(
  practices: Practice[],
  usageLogs: { date: string; minutes: number }[] = []
): StreakInfo {
  const practiceDates = new Set<string>();

  // Add dates from practice sessions
  practices.forEach((p) => {
    if (p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date)) {
      practiceDates.add(p.date);
    }
  });

  // Add dates from usage logs if minutes > 0
  usageLogs.forEach((u) => {
    if (u.date && u.minutes > 0 && /^\d{4}-\d{2}-\d{2}$/.test(u.date)) {
      practiceDates.add(u.date);
    }
  });

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");

  const hasPracticedToday = practiceDates.has(todayStr);
  const hasPracticedYesterday = practiceDates.has(yesterdayStr);

  // Calculate current streak
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
    // Yesterday was practiced, so streak is active pending today's session
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

  // Calculate longest historical streak
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

  // Build 7-day activity timeline (6 days ago through today)
  const recentDays: StreakDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const isToday = i === 0;
    recentDays.push({
      date: dateStr,
      dayLabel: format(d, "EEE"),
      fullDateLabel: format(d, "MMM d"),
      isToday,
      practiced: practiceDates.has(dateStr),
    });
  }

  return {
    currentStreak,
    longestStreak,
    totalPracticeDays: practiceDates.size,
    hasPracticedToday,
    hasPracticedYesterday,
    lastPracticeDate,
    recentDays,
  };
}
