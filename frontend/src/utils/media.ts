const API_BASE = import.meta.env.VITE_API_URL ?? 'https://rawdah-quran-hackathon-project-7.onrender.com/api'

export const resolveMediaUrl = (path?: string | null) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path

  try {
    return new URL(path, API_BASE).toString()
  } catch {
    return path
  }
}
