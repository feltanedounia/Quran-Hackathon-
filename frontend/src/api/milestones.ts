import client from './client'
import type { Milestone } from '../types'

export const getMilestones = () =>
  client.get<Milestone[]>('/milestones/').then(r => r.data)

export const shareMilestone = (id: number) =>
  client.post(`/milestones/${id}/share`).then(r => r.data)
