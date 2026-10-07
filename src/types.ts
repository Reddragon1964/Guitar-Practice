export interface Practice {
  id: string;
  userId: string;
  songTitle: string;
  difficulty: number;
  correctNotes: number;
  totalNotes: number;
  accuracy: number;
  speed: number;
  duration?: number; // duration in seconds (formatted as mm:ss / m:ss)
  isPartial?: boolean;
  isShortVersion?: boolean;
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

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "model";
  text: string;
  personaId: string;
  model: string;
  createdAt: number;
}

export interface AiAssessment {
  id: string;
  userId: string;
  analysis: string;
  date: string; // YYYY-MM-DD
  time: string; // formatted e.g. "12:24 PM"
  createdAt: number;
  sessionCount?: number;
  summary?: string;
}

export type DashboardView =
  | "dashboard"
  | "add-practice"
  | "add-goal"
  | "manage-songs"
  | "ai-analysis"
  | "chatbot"
  | "live-voice"
  | "trends"
  | "duration-trends"
  | "help";

export type SessionSortField = "date" | "duration" | "songTitle" | "difficulty" | "accuracy" | "speed";
export type SortDirection = "asc" | "desc";

export type PrintMode = "all" | "weekly" | "historical" | "recent" | "milestones" | "trends" | "durations" | null;

export interface DeleteConfirmState {
  id: string;
  type: "practice" | "goal" | "song" | "weeklyGoal" | "assessment";
  message: string;
}
