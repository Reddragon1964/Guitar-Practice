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
  date: string; // ISO String
  createdAt: number;
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

export interface Song {
  id: string;
  userId: string;
  title: string;
  retired?: boolean;
  createdAt: number;
}
