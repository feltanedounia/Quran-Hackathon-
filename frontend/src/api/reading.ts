import client from './client'
import type { ReadingSession, ReadingSessionCreate, EngagementStatus, ActivityType } from '../types'

export const logSession = (data: ReadingSessionCreate) =>
  client.post<ReadingSession>('/reading/session', data).then(r => r.data)

export const getSessions = (limit = 30, activityType?: ActivityType) => {
  const params = new URLSearchParams({ limit: String(limit) })
  if (activityType) params.set('activity_type', activityType)
  return client.get<ReadingSession[]>(`/reading/sessions?${params.toString()}`).then(r => r.data)
}

export const getStreak = () =>
  client.get<{ streak_count: number; longest_streak: number; last_reading_date: string }>('/reading/streak').then(r => r.data)

export const getEngagement = () =>
  client.get<EngagementStatus>('/reading/engagement').then(r => r.data)
