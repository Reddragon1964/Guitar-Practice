import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { Practice, WeeklyGoal } from "../types";
import { getSessionDurationMinutes } from "../components/dashboard/DurationTrendsPage";

export interface GoalProgress {
  goalId: string;
  title: string;
  songTitle?: string;
  targetMinutes: number;
  loggedMinutes: number;
  remainingMinutes: number;
  percentage: number;
  isAchieved: boolean;
  extraMinutes: number;
  paceNeededMinutes: number;
  daysRemainingInWeek: number;
  weekStartFormatted: string;
  weekEndFormatted: string;
}

export function formatTimeMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Calculates current calendar week practice time against weekly goals
 */
export function calculateWeeklyGoalProgress(
  goals: WeeklyGoal[],
  practices: Practice[],
  usageLogs: { date: string; minutes: number }[] = []
): {
  overallProgress?: GoalProgress;
  songProgresses: GoalProgress[];
  weekRangeLabel: string;
  daysRemainingInWeek: number;
} {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

  // Days remaining in week including today
  // getDay(): 0 is Sunday, 1 is Monday, ... 6 is Saturday
  const currentDayOfWeek = now.getDay();
  // If today is Sunday (0), remaining is 1 day. If Monday (1), remaining is 7 days.
  const daysRemainingInWeek = currentDayOfWeek === 0 ? 1 : 8 - currentDayOfWeek;

  // Filter practices that occurred in the current week
  const weekPractices = practices.filter((p) => {
    try {
      const pDate = parseISO(p.date);
      return isWithinInterval(pDate, { start: weekStart, end: weekEnd });
    } catch {
      return false;
    }
  });

  // Calculate overall practice minutes for the week:
  // For each calendar day in the week, take max of usageLogs minutes and practices duration
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split("T")[0]);
  }

  let overallLoggedMinutes = 0;
  weekDates.forEach((dateStr) => {
    const usageForDay = usageLogs.find((u) => u.date === dateStr)?.minutes || 0;
    const practicesForDay = weekPractices.filter((p) => p.date === dateStr);
    const practicesMinutes = practicesForDay.reduce((sum, p) => {
      return sum + getSessionDurationMinutes(p).minutes;
    }, 0);

    overallLoggedMinutes += Math.max(usageForDay, practicesMinutes);
  });

  // Calculate progress for each goal
  const songProgresses: GoalProgress[] = [];
  let overallProgress: GoalProgress | undefined = undefined;

  goals.forEach((goal) => {
    let loggedMinutes = 0;

    if (goal.songTitle) {
      // Song specific practice
      const songPractices = weekPractices.filter((p) => p.songTitle === goal.songTitle);
      loggedMinutes = songPractices.reduce((sum, p) => {
        return sum + getSessionDurationMinutes(p).minutes;
      }, 0);
    } else {
      // Overall practice
      loggedMinutes = overallLoggedMinutes;
    }

    const targetMinutes = Math.max(1, goal.targetMinutes);
    const remainingMinutes = Math.max(0, targetMinutes - loggedMinutes);
    const extraMinutes = Math.max(0, loggedMinutes - targetMinutes);
    const percentage = Math.round((loggedMinutes / targetMinutes) * 100);
    const isAchieved = loggedMinutes >= targetMinutes;
    const paceNeededMinutes =
      daysRemainingInWeek > 0 && remainingMinutes > 0
        ? Math.ceil(remainingMinutes / daysRemainingInWeek)
        : 0;

    const progressObj: GoalProgress = {
      goalId: goal.id,
      title: goal.title,
      songTitle: goal.songTitle,
      targetMinutes,
      loggedMinutes,
      remainingMinutes,
      percentage,
      isAchieved,
      extraMinutes,
      paceNeededMinutes,
      daysRemainingInWeek,
      weekStartFormatted: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      weekEndFormatted: weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };

    if (goal.songTitle) {
      songProgresses.push(progressObj);
    } else {
      overallProgress = progressObj;
    }
  });

  const weekRangeLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return {
    overallProgress,
    songProgresses,
    weekRangeLabel,
    daysRemainingInWeek,
  };
}
