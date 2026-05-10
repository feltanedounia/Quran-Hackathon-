import client from './client'
import type { GardenState } from '../types'

export const getGardenState = () =>
  client.get<GardenState>('/garden/').then(r => r.data)
