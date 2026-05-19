import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Flame, BookOpen, Clock, Star, Camera, TrendingUp } from 'lucide-react'
import { getMe, updateMe, uploadPhoto } from '../api/auth'
import { getGardenState } from '../api/garden'
import { getSessions } from '../api/reading'
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

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [country, setCountry] = useState('')
  const [hifd, setHifd] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)

  const { mutate: changePhoto, isPending: uploadingPhoto } = useMutation({
    mutationFn: (file: File) => uploadPhoto(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  })

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (user) {
      setBio(user.bio || '')
      setCountry(user.country || '')
      setHifd(user.current_hifd || '')
    }
  }, [user?.id])

  const { data: garden } = useQuery({
    queryKey: ['garden'],
    queryFn: getGardenState,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones'],
    queryFn: getMilestones,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(5),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })

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
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg group focus:outline-none"
                title="Change profile picture"
              >
                {user?.profile_photo_path ? (
                  <img src={user.profile_photo_path} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-garden-400 to-garden-700 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{user?.username?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) changePhoto(file)
                  e.target.value = ''
                }}
              />
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

          <p className="text-xs text-gray-400 mt-3">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
          </p>

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
