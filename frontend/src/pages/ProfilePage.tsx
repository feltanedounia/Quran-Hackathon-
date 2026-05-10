import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Flame, BookOpen, Clock, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react'
import { getMe, updateMe } from '../api/auth'
import { getGardenState } from '../api/garden'
import { getEngagement, getSessions } from '../api/reading'
import { getMilestones } from '../api/milestones'
import Navbar from '../components/ui/Navbar'
import LoadingSpinner from '../components/ui/LoadingSpinner'

function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ComponentType<{ className?: string }>
  value: string | number
  label: string
  color: string
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

function EngagementProfile({ riskScore, trend, avgVerses7d }: {
  riskScore: number; trend: string; avgVerses7d: number
}) {
  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendColor = trend === 'improving' ? 'text-garden-600' : trend === 'declining' ? 'text-red-500' : 'text-gray-400'

  const engagementPct = Math.round((1 - riskScore) * 100)
  const profileLabel =
    engagementPct >= 80 ? 'Deeply Engaged' :
    engagementPct >= 60 ? 'Consistently Active' :
    engagementPct >= 40 ? 'Moderately Engaged' :
    engagementPct >= 20 ? 'Needs Attention' : 'At Risk'

  const profileColor =
    engagementPct >= 80 ? 'text-garden-600' :
    engagementPct >= 60 ? 'text-blue-600' :
    engagementPct >= 40 ? 'text-earth-600' :
    engagementPct >= 20 ? 'text-orange-600' : 'text-red-600'

  const ringColor =
    engagementPct >= 80 ? 'stroke-garden-500' :
    engagementPct >= 60 ? 'stroke-blue-500' :
    engagementPct >= 40 ? 'stroke-earth-500' :
    engagementPct >= 20 ? 'stroke-orange-500' : 'stroke-red-500'

  const radius = 60
  const circ = 2 * Math.PI * radius
  const dashOffset = circ - (engagementPct / 100) * circ

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-gray-800 mb-5">Spiritual Engagement Profile</h3>

      <div className="flex items-center gap-8">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              strokeWidth="12"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={ringColor}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{engagementPct}%</span>
            <span className={`text-xs font-semibold ${profileColor}`}>{profileLabel}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-5 h-5 ${trendColor}`} />
            <span className="text-sm font-medium text-gray-700 capitalize">{trend} trend</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Reading consistency</span>
                <span>{engagementPct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${engagementPct}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full rounded-full ${
                    engagementPct >= 60 ? 'bg-garden-500' : engagementPct >= 40 ? 'bg-earth-500' : 'bg-red-500'
                  }`}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Avg verses / day (7d)</span>
                <span>{avgVerses7d}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((avgVerses7d / 20) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [hifd, setHifd] = useState('')

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  useEffect(() => {
    if (user) {
      setBio(user.bio || '')
      setCountry(user.country || '')
      setHifd(user.current_hifd || '')
    }
  }, [user?.id])

  const { data: garden } = useQuery({ queryKey: ['garden'], queryFn: getGardenState })
  const { data: engagement } = useQuery({ queryKey: ['engagement'], queryFn: getEngagement })
  const { data: milestones = [] } = useQuery({ queryKey: ['milestones'], queryFn: getMilestones })
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => getSessions(7) })

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => updateMe({ bio, country, current_hifd: hifd }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setEditing(false)
    },
  })

  if (userLoading) return <LoadingSpinner className="min-h-screen" size="lg" />

  const hours = Math.round((user?.total_minutes_read ?? 0) / 60 * 10) / 10

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-3xl mx-auto space-y-5">

        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-garden-400 to-garden-700 flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {user?.username?.[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">{user?.username}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-garden-100 text-garden-700 px-2 py-0.5 rounded-full font-medium capitalize">
                    {user?.gender}
                  </span>
                  {garden && (
                    <span className="text-xs bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full font-medium">
                      🌿 {garden.level_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing((e) => !e)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            >
              {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Member since */}
          <p className="text-xs text-gray-400 mt-3">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
          </p>

          {/* Edit form */}
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 pt-5 border-t border-gray-100 space-y-3"
            >
              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input resize-none h-20"
                  placeholder="Tell us about your Quran journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Country</label>
                  <input
                    className="input"
                    placeholder="e.g. Saudi Arabia"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Current Hifdh</label>
                  <input
                    className="input"
                    placeholder="e.g. Surah Al-Baqarah"
                    value={hifd}
                    onChange={(e) => setHifd(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => save()}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {/* Bio display */}
          {!editing && user?.bio && (
            <p className="text-sm text-gray-600 mt-3 italic">"{user.bio}"</p>
          )}
          {!editing && (user?.country || user?.current_hifd) && (
            <div className="flex gap-3 mt-2 text-xs text-gray-500">
              {user?.country && <span>📍 {user.country}</span>}
              {user?.current_hifd && <span>📖 Memorizing: {user.current_hifd}</span>}
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Flame} value={user?.streak_count ?? 0} label="Current streak (days)" color="bg-orange-100 text-orange-500" />
          <StatCard icon={Star} value={user?.longest_streak ?? 0} label="Longest streak (days)" color="bg-yellow-100 text-yellow-500" />
          <StatCard icon={BookOpen} value={user?.total_verses_read ?? 0} label="Total verses read" color="bg-garden-100 text-garden-600" />
          <StatCard icon={Clock} value={`${hours}h`} label="Total reading time" color="bg-blue-100 text-blue-600" />
        </div>

        {/* Engagement Profile */}
        {engagement && (
          <EngagementProfile
            riskScore={engagement.risk_score}
            trend={engagement.trend}
            avgVerses7d={engagement.avg_verses_7d}
          />
        )}

        {/* Milestones summary */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏆</span> Milestones Earned
          </h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-gray-400">No milestones yet. Start your first session!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {milestones.map((m) => (
                <span
                  key={m.id}
                  className="text-xs bg-earth-50 text-earth-700 border border-earth-200 px-3 py-1.5 rounded-full font-medium capitalize"
                >
                  {m.milestone_type.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-garden-600" /> Recent Sessions
            </h3>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="text-sm text-gray-600">
                    {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="text-garden-600 font-medium">{s.verses_read} verses</span>
                    <span>{Math.round(s.minutes_spent)} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
