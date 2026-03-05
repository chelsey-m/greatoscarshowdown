export interface Category {
  id: string;
  name: string;
  year: number;
}

export interface Nominee {
  id: string;
  category_id: string;
  nominee_name: string;
  film_title?: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  category_id: string;
  nominee_id: string;
  updated_at: string;
  submitted_at?: string | null;
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

export interface Profile {
  id: string;
  display_name: string;
  created_at?: string;
  submitted_at?: string | null;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  score: number;
  rank: number;
}
