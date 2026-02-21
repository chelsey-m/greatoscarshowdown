export interface Category {
  id: string;
  name: string;
  year: number;
}

export interface Nominee {
  id: string;
  category_id: string;
  name: string;
  film?: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  category_id: string;
  nominee_id: string;
  updated_at: string;
}

export interface Result {
  category_id: string;
  nominee_id: string;
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
