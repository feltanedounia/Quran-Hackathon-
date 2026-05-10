import { Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Flame, BookOpen, Clock, TrendingUp, TrendingDown, Minus, ChevronRight, Volume2 } from 'lucide-react'
import { getGardenState } from '../api/garden'
import { getMe } from '../api/auth'
import { getDailyVerse } from '../api/verses'
import { getEngagement } from '../api/reading'
import GardenScene from '../components/garden/GardenScene'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Navbar from '../components/ui/Navbar'

function EngagementBadge({ level, score }: { level: string; score: number }) {
  const config = {
    low: { color: 'bg-garden-100 text-garden-700 border-garden-200', label: 'Engaged', icon: '✨' },
    medium: { color: 'bg-earth-100 text-earth-700 border-earth-200', label: 'Consistent', icon: '💪' },
    high: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Needs attention', icon: '🤲' },
  }[level as 'low' | 'medium' | 'high'] ?? { color: 'bg-gray-100 text-gray-700 border-gray-200', label: level, icon: '📊' }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${config.color}`}>
      {config.icon} {config.label}
    </span>
  )
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-garden-600" />
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-gray-400" />
}

function GardenLevelBar({ level, levelName }: { level: number; levelName: string }) {
  const max = 7
  const pct = (level / max) * 100
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span className="font-medium text-garden-700">{levelName}</span>
        <span>Level {level} / {max}</span>
      </div>
      <div className="h-2 bg-garden-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-full bg-gradient-to-r from-garden-400 to-garden-600 rounded-full"
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: garden, isLoading: gardenLoading } = useQuery({
    queryKey: ['garden'],
    queryFn: getGardenState,
  })
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 60_000 })
  const { data: verse } = useQuery({ queryKey: ['daily-verse'], queryFn: getDailyVerse, staleTime: 24 * 60 * 60_000 })
  const { data: engagement } = useQuery({ queryKey: ['engagement'], queryFn: getEngagement })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-[60px] md:pb-0 pb-20">
        <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)]">

          {/* 3D Garden — takes up most space */}
          <div className="relative flex-1 lg:w-2/3 h-[55vh] lg:h-full bg-sky-100">
            <Suspense fallback={<LoadingSpinner className="h-full" size="lg" />}>
              {gardenLoading ? (
                <LoadingSpinner className="h-full" size="lg" />
              ) : (
                <GardenScene gardenState={garden} />
              )}
            </Suspense>

            {/* Garden overlay - top left */}
            {garden && (
              <div className="absolute top-4 left-4">
                <div className="glass rounded-2xl px-4 py-3 shadow-lg">
                  <div className="text-xs text-gray-500 mb-1">Your Garden</div>
                  <GardenLevelBar level={garden.level} levelName={garden.level_name} />
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>🌸 {garden.flowers} flowers</span>
                    <span>🌳 {garden.branches} trees</span>
                    {garden.streak_flowers > 0 && <span>⭐ {garden.streak_flowers} golden</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Begin Journey button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <Link
                to="/journey"
                className="bg-garden-600 hover:bg-garden-700 text-white font-semibold px-8 py-3.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-2 text-sm"
              >
                <span>🌿</span> Begin Today's Journey
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="lg:w-[360px] w-full bg-white lg:overflow-y-auto border-l border-gray-100 p-5 space-y-4">

            {/* User greeting */}
            {user && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-gray-800">
                    As-salamu alaykum, {user.username} 🌙
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {user.last_reading_date
                      ? `Last session: ${new Date(user.last_reading_date).toLocaleDateString()}`
                      : 'No sessions yet — start today!'}
                  </p>
                </div>
                {engagement && (
                  <EngagementBadge level={engagement.risk_level} score={engagement.risk_score} />
                )}
              </div>
            )}

            {/* Stats grid */}
            {user && (
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Flame className="w-4 h-4 text-earth-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">{user.streak_count}</div>
                  <div className="text-xs text-gray-500">Day streak</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="w-4 h-4 text-garden-600" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">{user.total_verses_read}</div>
                  <div className="text-xs text-gray-500">Verses</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold text-gray-800">
                    {Math.round(user.total_minutes_read)}
                  </div>
                  <div className="text-xs text-gray-500">Minutes</div>
                </div>
              </div>
            )}

            {/* Engagement nudge */}
            {engagement && engagement.risk_level !== 'low' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-4 border ${
                  engagement.risk_level === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-earth-50 border-earth-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{engagement.risk_level === 'high' ? '🤲' : '💚'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">A gentle reminder</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{engagement.nudge_message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trend */}
            {engagement && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendIcon trend={engagement.trend} />
                  <span className="text-sm font-medium text-gray-700 capitalize">{engagement.trend} trend</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Avg this week: <strong className="text-gray-700">{engagement.avg_verses_7d} verses/day</strong></span>
                  <span>{engagement.days_since_last_read}d since last</span>
                </div>
              </div>
            )}

            {/* Daily Verse */}
            {verse && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-garden-600 uppercase tracking-wide">Today's Verse</span>
                  <span className="text-xs text-gray-400 bg-garden-50 px-2 py-0.5 rounded-full">
                    {verse.surah_name} {verse.verse_key}
                  </span>
                </div>
                <p className="arabic text-lg text-gray-800 leading-loose mb-3">{verse.text_arabic}</p>
                <p className="text-xs text-gray-600 leading-relaxed italic">"{verse.text_translation}"</p>
                {verse.audio_url && (
                  <a
                    href={verse.audio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1.5 text-xs text-garden-600 hover:text-garden-700 font-medium"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen to recitation
                  </a>
                )}
                <Link
                  to="/reflections"
                  className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Write a reflection
                </Link>
              </div>
            )}

            {/* Quick nav */}
            <div className="grid grid-cols-2 gap-2">
              <Link to="/milestones" className="card p-3 flex items-center gap-2 hover:bg-garden-50 transition-colors">
                <span className="text-xl">🏆</span>
                <div>
                  <div className="text-xs font-medium text-gray-700">Milestones</div>
                  <div className="text-xs text-gray-400">View badges</div>
                </div>
              </Link>
              <Link to="/reflections" className="card p-3 flex items-center gap-2 hover:bg-garden-50 transition-colors">
                <span className="text-xl">📖</span>
                <div>
                  <div className="text-xs font-medium text-gray-700">Reflections</div>
                  <div className="text-xs text-gray-400">My journal</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
