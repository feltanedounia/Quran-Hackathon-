export interface User {
  id: number
  email: string
  username: string
  gender: 'male' | 'female'
  profile_photo_path?: string
  bio?: string
  country?: string
  current_hifd?: string
  streak_count: number
  longest_streak: number
  total_verses_read: number
  total_minutes_read: number
  last_reading_date?: string
  created_at: string
}

export interface GardenState {
  total_verses: number
  petals: number
  flowers: number
  branches: number
  streak_flowers: number
  level: number
  level_name: string
}

export interface EngagementStatus {
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  days_since_last_read: number
  avg_verses_7d: number
  trend: 'improving' | 'stable' | 'declining'
  nudge_message: string
}

export interface ReadingSessionCreate {
  activity_type?: ActivityType
  verses_read: number
  minutes_spent: number
  surah_number?: number
  ayah_start?: number
  ayah_end?: number
  notes?: string
}

export interface ReadingSession {
  id: number
  date: string
  activity_type: ActivityType
  verses_read: number
  minutes_spent: number
  surah_number?: number
  ayah_start?: number
  ayah_end?: number
  notes?: string
  photo_path?: string
  created_at: string
}

export interface DailyVerse {
  verse_key: string
  surah_number: number
  ayah_number: number
  surah_name: string
  text_arabic: string
  text_translation: string
  audio_url?: string
}

export interface Interpretation {
  id: number
  verse_key: string
  verse_text: string
  user_interpretation: string
  ai_response?: string
  tafsir_text?: string
  review_count: number
  last_reviewed_at?: string
  next_review_at?: string
  created_at: string
}

export interface Milestone {
  id: number
  milestone_type: string
  achieved_at: string
  shared_with_buddy: boolean
}

export type ActivityType = 'reading' | 'recitation' | 'memorization'
