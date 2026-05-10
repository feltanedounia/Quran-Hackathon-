import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mic, Brain, ChevronRight, Clock, Flower, Star } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import type { ActivityType } from '../types'

const activities = [
  {
    type: 'reading' as ActivityType,
    icon: BookOpen,
    emoji: '📖',
    title: 'Reading',
    arabicTitle: 'قراءة',
    subtitle: 'Read with Translation & Tafsir',
    desc: 'Explore the Quran with authenticated translations and Ibn Kathir tafsir. Deepen your understanding verse by verse.',
    color: 'from-garden-500 to-garden-700',
    bg: 'bg-garden-50',
    border: 'border-garden-200',
    ring: 'ring-garden-400',
    textColor: 'text-garden-700',
    milestones: [
      { icon: Clock, label: 'Bonus every 5 minutes of reading' },
      { icon: Flower, label: 'Flower for every 10 verses' },
      { icon: Star, label: 'Streak bonus for consecutive days' },
    ],
    tip: 'Reading with tafsir deepens comprehension and spiritual connection.',
  },
  {
    type: 'recitation' as ActivityType,
    icon: Mic,
    emoji: '🎙️',
    title: 'Recitation',
    arabicTitle: 'تلاوة',
    subtitle: 'Track Khatma Progress',
    desc: 'Follow along with audio recitation, track your khatma progress, and earn page milestones with each surah completed.',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'ring-blue-400',
    textColor: 'text-blue-700',
    milestones: [
      { icon: BookOpen, label: 'Bonus every 2 pages of recitation' },
      { icon: Star, label: 'Special badge for completed Surahs' },
      { icon: Flower, label: 'Golden flower for full Khatma' },
    ],
    tip: 'Regular recitation purifies the heart and enriches your relationship with the Quran.',
  },
  {
    type: 'memorization' as ActivityType,
    icon: Brain,
    emoji: '🧠',
    title: 'Memorization',
    arabicTitle: 'حفظ',
    subtitle: 'Hifdh with Spaced Repetition',
    desc: 'Long-term hifdh tracking with spaced repetition reviews. Never forget what you\'ve memorized — your garden never fades.',
    color: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    ring: 'ring-purple-400',
    textColor: 'text-purple-700',
    milestones: [
      { icon: Brain, label: 'Bonus for every memorized page' },
      { icon: Star, label: 'Milestone for each memorized Juz' },
      { icon: Flower, label: 'Eternal flower for mastered Surahs' },
    ],
    tip: 'Hifdh is a lifelong treasure. Consistency beats intensity every time.',
  },
]

export default function JourneyPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ActivityType | null>(null)

  const handleStart = () => {
    if (selected) navigate(`/session/${selected}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-50 to-white">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-garden-100 text-garden-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-garden-500 rounded-full animate-pulse" />
            Begin Your Heavenly Journey
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What will you tend to today?
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
            Choose an activity to begin your session. Your garden grows differently with each type of engagement.
            Every minute of sincere effort is recorded in your heavenly garden.
          </p>
        </motion.div>

        {/* Activity cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {activities.map((activity, i) => {
            const isSelected = selected === activity.type
            return (
              <motion.div
                key={activity.type}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelected(activity.type)}
                className={`relative cursor-pointer rounded-3xl border-2 p-6 transition-all duration-200 ${
                  isSelected
                    ? `${activity.border} ${activity.bg} ring-2 ${activity.ring} shadow-lg scale-[1.02]`
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-garden-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activity.color} flex items-center justify-center shadow-lg mb-4`}>
                  <span className="text-2xl">{activity.emoji}</span>
                </div>

                {/* Title */}
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="font-display text-xl font-bold text-gray-900">{activity.title}</h3>
                  <span className={`font-arabic text-base ${activity.textColor}`}>{activity.arabicTitle}</span>
                </div>
                <p className={`text-xs font-medium ${activity.textColor} mb-3`}>{activity.subtitle}</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{activity.desc}</p>

                {/* Milestones */}
                <div className="space-y-2">
                  {activity.milestones.map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                      <m.icon className={`w-3.5 h-3.5 ${activity.textColor}`} />
                      {m.label}
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div className={`mt-4 p-3 rounded-xl ${activity.bg} border ${activity.border}`}>
                  <p className={`text-xs ${activity.textColor} italic leading-relaxed`}>
                    💡 {activity.tip}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selected ? 1 : 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={handleStart}
            disabled={!selected}
            className="btn-primary px-10 py-4 text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selected
              ? `Start ${activities.find(a => a.type === selected)?.title} Session`
              : 'Select an Activity'}
            {selected && <ChevronRight className="w-5 h-5" />}
          </button>
        </motion.div>

        {selected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-400 mt-3"
          >
            Your session timer will start automatically. You can pause and resume at any time.
          </motion.p>
        )}
      </div>
    </div>
  )
}
