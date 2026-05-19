import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, Clock, TrendingUp, TrendingDown, Flame,
  Star, AlertTriangle, BarChart2, Activity
} from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import { getMetrics } from '../api/analytics'

interface Metrics {
  users: {
    total: number; dau: number; wau: number; mau: number
    stickiness_pct: number; at_risk: number; churn_rate_pct: number
    streak_7_plus: number; streak_30_plus: number
  }
  sessions: {
    total: number; avg_duration_min: number; avg_verses: number
    avg_per_user_per_week: number; total_verses: number; total_hours: number
  }
  streaks: { max: number; avg: number }
  engagement: { total_bookmarks: number; total_reflections: number; milestones: Record<string, number> }
  top_surahs: { surah: number; count: number }[]
  daily_sessions: Record<string, number>
  events: Record<string, number>
}

const SURAH_NAMES: Record<number, string> = {
  1:'Al-Fatiha',2:'Al-Baqarah',3:'Ali Imran',4:'An-Nisa',5:'Al-Maidah',
  6:'Al-Anam',7:'Al-Araf',18:'Al-Kahf',36:'Ya-Sin',55:'Ar-Rahman',
  67:'Al-Mulk',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
}

function StatCard({ icon, label, value, sub, color = 'garden', warn = false }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string
  color?: string; warn?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${warn ? 'border-orange-200' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl ${warn ? 'bg-orange-100' : `bg-${color}-100`}`}>
          <span className={warn ? 'text-orange-600' : `text-${color}-600`}>{icon}</span>
        </div>
        {warn && <AlertTriangle className="w-4 h-4 text-orange-400" />}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color = 'bg-garden-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Sparkline({ data }: { data: Record<string, number> }) {
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
  const values = days.map(d => data[d] ?? 0)
  const max = Math.max(...values, 1)

  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end" title={`${days[i]}: ${v} sessions`}>
          <div
            className="bg-garden-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
            style={{ height: `${Math.max((v / max) * 48, v > 0 ? 4 : 2)}px` }}
          />
        </div>
      ))}
    </div>
  )
}

const MILESTONE_LABELS: Record<string, string> = {
  first_session: 'First Session',
  streak_3: '3-Day Streak',
  streak_7: '7-Day Streak',
  streak_30: '30-Day Streak',
  verses_100: '100 Verses',
  verses_500: '500 Verses',
  verses_1000: '1000 Verses',
  first_buddy: 'First Buddy',
  first_interpretation: 'First Reflection',
  first_photo: 'First Photo',
}

export default function AdminPage() {
  const { data: metrics, isLoading, error } = useQuery<Metrics>({
    queryKey: ['admin-metrics'],
    queryFn: getMetrics,
    refetchInterval: 60_000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-5xl mx-auto">

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <BarChart2 className="w-6 h-6 text-garden-600" />
            <h1 className="font-display text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500">Real-time metrics from the live database · refreshes every 60s</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Activity className="w-5 h-5 animate-pulse mr-2" /> Loading metrics...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
            Could not load metrics. Make sure the backend is running.
          </div>
        )}

        {metrics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* 1. Engagement */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Engagement & Retention
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={metrics.users.total} />
                <StatCard icon={<Activity className="w-4 h-4" />} label="DAU" value={metrics.users.dau}
                  sub="Active today" />
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="WAU" value={metrics.users.wau}
                  sub="Last 7 days" />
                <StatCard icon={<Users className="w-4 h-4" />} label="MAU" value={metrics.users.mau}
                  sub="Last 30 days" />
                <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Stickiness"
                  value={`${metrics.users.stickiness_pct}%`}
                  sub="DAU/MAU · target >20%"
                  warn={metrics.users.stickiness_pct < 20} />
                <StatCard icon={<Clock className="w-4 h-4" />} label="Avg Session"
                  value={`${metrics.sessions.avg_duration_min} min`}
                  sub="Target 5–15 min" />
                <StatCard icon={<BarChart2 className="w-4 h-4" />} label="Sessions/User/Week"
                  value={metrics.sessions.avg_per_user_per_week}
                  sub="Target >3" warn={metrics.sessions.avg_per_user_per_week < 3} />
                <StatCard icon={<TrendingDown className="w-4 h-4" />} label="At-Risk Users"
                  value={metrics.users.at_risk}
                  sub={`${metrics.users.churn_rate_pct}% churn · inactive 14d+`}
                  warn={metrics.users.churn_rate_pct > 10} />
              </div>
            </section>

            {/* 2. Daily sessions sparkline */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Sessions · Last 14 Days
              </h2>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <Sparkline data={metrics.daily_sessions} />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>14 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </section>

            {/* 3. Reading behavior */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Quran Reading Behaviour
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="Total Sessions"
                  value={metrics.sessions.total.toLocaleString()} />
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="Total Verses Read"
                  value={metrics.sessions.total_verses.toLocaleString()} />
                <StatCard icon={<Clock className="w-4 h-4" />} label="Total Hours Read"
                  value={`${metrics.sessions.total_hours.toLocaleString()}h`} />
                <StatCard icon={<BookOpen className="w-4 h-4" />} label="Avg Verses/Session"
                  value={metrics.sessions.avg_verses} />
                <StatCard icon={<Star className="w-4 h-4" />} label="Bookmarks"
                  value={metrics.engagement.total_bookmarks} sub="Total saved" />
                <StatCard icon={<Star className="w-4 h-4" />} label="Reflections"
                  value={metrics.engagement.total_reflections} sub="Interpretations written" />
              </div>
            </section>

            {/* 4. Top surahs */}
            {metrics.top_surahs.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Most Read Surahs
                </h2>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  {metrics.top_surahs.map((s, i) => {
                    const maxCount = metrics.top_surahs[0]?.count ?? 1
                    return (
                      <div key={s.surah} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {SURAH_NAMES[s.surah] ?? `Surah ${s.surah}`}
                              <span className="text-xs text-gray-400 ml-1">#{s.surah}</span>
                            </span>
                            <span className="text-xs text-gray-500 font-semibold">{s.count} sessions</span>
                          </div>
                          <MiniBar value={s.count} max={maxCount} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* 5. Garden & Gamification */}
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Garden & Streaks
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Flame className="w-4 h-4" />} label="Longest Active Streak"
                  value={`${metrics.streaks.max} days`} color="orange" />
                <StatCard icon={<Flame className="w-4 h-4" />} label="Avg Streak"
                  value={`${metrics.streaks.avg} days`} color="orange" />
                <StatCard icon={<Star className="w-4 h-4" />} label="7-Day Streaks"
                  value={metrics.users.streak_7_plus} sub="Users with ≥7 day streak" />
                <StatCard icon={<Star className="w-4 h-4" />} label="30-Day Streaks"
                  value={metrics.users.streak_30_plus} sub="Users with ≥30 day streak" />
              </div>
            </section>

            {/* 6. Milestones */}
            {Object.keys(metrics.engagement.milestones).length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Milestone Completion
                </h2>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  {Object.entries(metrics.engagement.milestones)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const maxMs = Math.max(...Object.values(metrics.engagement.milestones))
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                {MILESTONE_LABELS[type] ?? type}
                              </span>
                              <span className="text-xs font-semibold text-gray-500">{count}</span>
                            </div>
                            <MiniBar value={count} max={maxMs} color="bg-earth-400" />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </section>
            )}

            {/* 7. Event log breakdown */}
            {Object.keys(metrics.events).length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tracked Events
                </h2>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(metrics.events).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="text-xs text-gray-600 font-medium">{type.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-bold text-garden-700">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          </motion.div>
        )}
      </div>
    </div>
  )
}
