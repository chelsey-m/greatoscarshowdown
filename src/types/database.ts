export interface Category {
  id: string;
  name: string;
  year: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  category_id: string;
  predicted_winner: string;
  updated_at: string;
}

export interface Result {
  category_id: string;
  actual_winner: string;
}

export interface AppSettings {
  id: string;
  lock_time: string;
  submissions_locked: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  score: number;
  rank: number;
}
