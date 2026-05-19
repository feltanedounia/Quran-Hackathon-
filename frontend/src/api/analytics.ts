import apiClient from './client'

export const trackEvent = async (eventType: string, data?: Record<string, unknown>): Promise<void> => {
  try {
    await apiClient.post('/analytics/event', { event_type: eventType, event_data: data ?? null })
  } catch {
    // analytics failures must never break the app
  }
}

export const getMetrics = async () => {
  const res = await apiClient.get('/analytics/metrics')
  return res.data
}
