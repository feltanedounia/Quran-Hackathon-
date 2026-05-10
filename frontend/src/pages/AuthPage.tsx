import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Sprout, Loader2 } from 'lucide-react'
import { login, register, getMe } from '../api/auth'
import { useAuthStore } from '../store/authStore'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const navigate = useNavigate()
  const { setToken, setUser } = useAuthStore()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [form, setForm] = useState({
    email: '', username: '', password: '', gender: 'male' as 'male' | 'female',
  })

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let tokenData
      if (tab === 'login') {
        tokenData = await login({ email: form.email, password: form.password })
      } else {
        tokenData = await register({ email: form.email, username: form.username, password: form.password, gender: form.gender })
      }
      setToken(tokenData.access_token)
      const user = await getMe()
      setUser(user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(msg || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-garden-950 via-garden-900 to-garden-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-5xl opacity-10 animate-float">🌿</div>
        <div className="absolute top-1/4 right-10 text-4xl opacity-10 animate-sway">🌸</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-10 animate-float">🌹</div>
        <div className="absolute bottom-10 right-20 text-5xl opacity-10 animate-sway">🌳</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-garden-400 rounded-2xl items-center justify-center shadow-2xl mb-4">
            <Sprout className="w-8 h-8 text-garden-950" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Rawdah</h1>
          <p className="text-garden-400 text-sm mt-1">Your Heavenly Garden</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-7">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t ? 'bg-white text-garden-800 shadow-md' : 'text-garden-300 hover:text-white'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="label text-garden-200">Username</label>
                <input
                  className="input bg-white/10 border-white/20 text-white placeholder-garden-400 focus:border-garden-300 focus:ring-garden-300/30"
                  placeholder="your_name"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="label text-garden-200">Email</label>
              <input
                type="email"
                className="input bg-white/10 border-white/20 text-white placeholder-garden-400 focus:border-garden-300 focus:ring-garden-300/30"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label text-garden-200">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input bg-white/10 border-white/20 text-white placeholder-garden-400 focus:border-garden-300 focus:ring-garden-300/30 pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-garden-400 hover:text-garden-200"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="label text-garden-200">Gender</label>
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <label
                      key={g}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                        form.gender === g
                          ? 'bg-garden-400/30 border-garden-400 text-garden-200'
                          : 'border-white/20 text-garden-400 hover:border-white/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={() => set('gender', g)}
                        className="sr-only"
                      />
                      <span>{g === 'male' ? '👨' : '👩'}</span>
                      <span className="capitalize">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-garden-400 hover:bg-garden-300 text-garden-950 font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
              ) : tab === 'login' ? (
                <><span>🌿</span> Enter Your Garden</>
              ) : (
                <><span>🌱</span> Plant Your First Seed</>
              )}
            </button>
          </form>

          <p className="text-center text-garden-500 text-xs mt-6">
            By continuing, you agree to engage with the Quran with sincerity and consistency.
          </p>
        </div>

        <p className="text-center text-garden-600 text-xs mt-4">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
      </motion.div>
    </div>
  )
}
