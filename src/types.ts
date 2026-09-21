export interface Practice {
  id: string;
  userId: string;
  songTitle: string;
  difficulty: number;
  correctNotes: number;
  totalNotes: number;
  accuracy: number;
  speed: number;
  duration?: number; // duration in minutes
  isPartial?: boolean;
  isTestSession?: boolean;
  score?: number;
  date: string; // ISO String
  createdAt: number;
  note?: string;
  difficultyRating?: number; // 1-5 stars perceived difficulty
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  songTitle?: string;
  targetDate: string; // ISO String
  achieved: boolean;
  createdAt: number;
}

export interface WeeklyGoal {
  id: string;
  userId: string;
  title: string; // e.g. "Overall Practice" or specific song
  songTitle?: string;
  targetMinutes: number; // e.g. 180 for 3 hours
  createdAt: number;
}

export interface Song {
  id: string;
  userId: string;
  title: string;
  retired?: boolean;
  createdAt: number;
}

export type DashboardView = "dashboard" | "add-practice" | "add-goal" | "manage-songs" | "ai-analysis" | "trends" | "duration-trends";

export type SessionSortField = "date" | "songTitle" | "accuracy";
export type SortDirection = "asc" | "desc";

export type PrintMode = "all" | "weekly" | "historical" | "recent" | "milestones" | "trends" | "durations" | null;

export interface DeleteConfirmState {
  id: string;
  type: "practice" | "goal" | "song" | "weeklyGoal";
  message: string;
}
