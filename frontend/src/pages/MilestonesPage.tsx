import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Share2, Lock } from 'lucide-react'
import { getMilestones, shareMilestone } from '../api/milestones'
import Navbar from '../components/ui/Navbar'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const allMilestones = [
  { type: 'first_session', emoji: '🌱', title: 'First Step', desc: 'Complete your very first reading session', color: 'garden' },
  { type: 'first_interpretation', emoji: '💭', title: 'Deep Thinker', desc: 'Write your first verse reflection', color: 'purple' },
  { type: 'first_photo', emoji: '📸', title: 'Accountable', desc: 'Upload your first accountability photo', color: 'blue' },
  { type: 'first_buddy', emoji: '🤝', title: 'Connected', desc: 'Get matched with a reading buddy', color: 'pink' },
  { type: 'streak_3', emoji: '🔥', title: '3-Day Streak', desc: 'Read consistently for 3 days in a row', color: 'orange' },
  { type: 'streak_7', emoji: '⚡', title: 'Week Warrior', desc: 'Maintain a 7-day reading streak', color: 'yellow' },
  { type: 'streak_30', emoji: '🌟', title: 'Month Master', desc: 'An incredible 30-day reading streak', color: 'gold' },
  { type: 'verses_100', emoji: '📖', title: 'Century', desc: 'Read 100 verses total', color: 'garden' },
  { type: 'verses_500', emoji: '🌺', title: 'Garden Bloomer', desc: 'Read 500 verses — your garden flourishes', color: 'rose' },
  { type: 'verses_1000', emoji: '✨', title: 'Thousand Verses', desc: 'A thousand verses deep in the Quran', color: 'earth' },
]

const colorMap: Record<string, { card: string; badge: string; icon: string }> = {
  garden: { card: 'bg-garden-50 border-garden-200', badge: 'bg-garden-100 text-garden-700', icon: 'text-garden-600' },
  purple: { card: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-600' },
  blue: { card: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-600' },
  pink: { card: 'bg-pink-50 border-pink-200', badge: 'bg-pink-100 text-pink-700', icon: 'text-pink-600' },
  orange: { card: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-600' },
  yellow: { card: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', icon: 'text-yellow-600' },
  gold: { card: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600' },
  rose: { card: 'bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: 'text-rose-600' },
  earth: { card: 'bg-earth-50 border-earth-200', badge: 'bg-earth-100 text-earth-700', icon: 'text-earth-600' },
}

export default function MilestonesPage() {
  const { data: earned = [], isLoading } = useQuery({
    queryKey: ['milestones'],
    queryFn: getMilestones,
  })

  const { mutate: share } = useMutation({ mutationFn: shareMilestone })

  const earnedTypes = new Set(earned.map((m) => m.milestone_type))
  const earnedCount = earnedTypes.size

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Your Milestones
          </h1>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Every achievement is a petal in your heavenly garden. Keep going — paradise is earned through consistency.
          </p>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{earnedCount} earned</span>
              <span>{allMilestones.length} total</span>
            </div>
            <div className="h-3 bg-garden-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(earnedCount / allMilestones.length) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-garden-400 to-garden-600 rounded-full"
              />
            </div>
            <p className="text-xs text-garden-600 font-medium mt-2">
              {Math.round((earnedCount / allMilestones.length) * 100)}% complete
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner className="py-20" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMilestones.map((milestone, i) => {
              const isEarned = earnedTypes.has(milestone.type)
              const earnedData = earned.find((e) => e.milestone_type === milestone.type)
              const colors = colorMap[milestone.color] ?? colorMap.garden

              return (
                <motion.div
                  key={milestone.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative rounded-2xl border-2 p-5 transition-all ${
                    isEarned
                      ? `${colors.card} shadow-md`
                      : 'bg-white border-gray-100 opacity-60 grayscale'
                  }`}
                >
                  {/* Lock indicator */}
                  {!isEarned && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-gray-300" />
                    </div>
                  )}

                  {/* Share button */}
                  {isEarned && earnedData && !earnedData.shared_with_buddy && (
                    <button
                      onClick={() => share(earnedData.id)}
                      className="absolute top-3 right-3 p-1.5 hover:bg-white/80 rounded-lg transition-colors"
                      title="Share with buddy"
                    >
                      <Share2 className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  )}

                  <div className={`text-4xl mb-3 ${!isEarned ? 'filter grayscale' : 'animate-bloom'}`}>
                    {milestone.emoji}
                  </div>

                  <h3 className={`font-semibold text-sm mb-1 ${isEarned ? 'text-gray-800' : 'text-gray-400'}`}>
                    {milestone.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isEarned ? 'text-gray-600' : 'text-gray-300'}`}>
                    {milestone.desc}
                  </p>

                  {isEarned && earnedData && (
                    <div className={`mt-3 text-xs font-medium px-2.5 py-1 rounded-full inline-block ${colors.badge}`}>
                      Earned {new Date(earnedData.achieved_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      })}
                    </div>
                  )}

                  {!isEarned && (
                    <div className="mt-3 text-xs text-gray-300">Not yet earned</div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {earnedCount === 0 && !isLoading && (
          <div className="text-center py-8 mt-4">
            <p className="text-gray-500 text-sm">
              Start your first session to earn your first milestone! 🌱
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
