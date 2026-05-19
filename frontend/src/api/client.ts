import axios from 'axios'

const normalizeApiBaseUrl = (rawUrl?: string) => {
  const fallback = 'https://rawdah-quran-hackathon-project-7.onrender.com/api'
  const candidate = (rawUrl ?? fallback).trim()

  // Keep relative local dev proxies untouched (e.g. /api).
  if (candidate.startsWith('/')) return candidate

  try {
    const parsed = new URL(candidate)
    const path = parsed.pathname.replace(/\/+$/, '')
    if (!path || path === '/') {
      parsed.pathname = '/api'
    } else if (!path.endsWith('/api')) {
      parsed.pathname = `${path}/api`
    }
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    // If env value is malformed, use fallback for resilience.
    return fallback
  }
}

const client = axios.create({ baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL) })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rawdah_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rawdah_token')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default client
