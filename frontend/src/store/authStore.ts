import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (u: User | null) => void
  setToken: (t: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) localStorage.setItem('rawdah_token', token)
        else localStorage.removeItem('rawdah_token')
        set({ token })
      },
      logout: () => {
        localStorage.removeItem('rawdah_token')
        set({ user: null, token: null })
      },
    }),
    { name: 'rawdah-auth', partialize: (s) => ({ token: s.token }) }
  )
)
