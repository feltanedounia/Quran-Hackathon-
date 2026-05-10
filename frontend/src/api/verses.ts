import client from './client'
import type { DailyVerse, Interpretation } from '../types'

export const getDailyVerse = () =>
  client.get<DailyVerse>('/verses/daily').then(r => r.data)

export const submitInterpretation = (data: {
  verse_key: string; verse_text: string; user_interpretation: string
}) => client.post<Interpretation>('/verses/interpret', data).then(r => r.data)

export const getInterpretations = () =>
  client.get<Interpretation[]>('/verses/interpretations').then(r => r.data)

export const getReviewQueue = () =>
  client.get<Interpretation[]>('/verses/review-queue').then(r => r.data)
