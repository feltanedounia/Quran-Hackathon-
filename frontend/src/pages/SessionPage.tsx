import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Bookmark, ChevronLeft, Sparkles, Volume2, RefreshCw } from 'lucide-react'
import { logSession } from '../api/reading'
import { getDailyVerse } from '../api/verses'
import { addBookmark, listBookmarks } from '../api/bookmarks'
import SessionTimer from '../components/session/SessionTimer'
import Navbar from '../components/ui/Navbar'
import type { ActivityType } from '../types'

const activityConfig = {
  reading: {
    emoji: '📖',
    title: 'Reading Session',
    subtitle: 'Read with understanding and reflection',
    color: 'garden',
    gradient: 'from-garden-600 to-garden-800',
    tip: 'Focus on meaning, not just recitation. Let each verse settle in your heart.',
  },
  recitation: {
    emoji: '🎙️',
    title: 'Recitation Session',
    subtitle: 'Follow along and strengthen your khatma progress',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-800',
    tip: 'Listen carefully. The beauty of tajweed brings the Quran to life.',
  },
  memorization: {
    emoji: '🧠',
    title: 'Memorization Session',
    subtitle: 'Commit the words of Allah to your heart',
    color: 'purple',
    gradient: 'from-purple-600 to-purple-800',
    tip: 'Repeat each ayah until it flows naturally. Your garden will never forget.',
  },
}

type Step = 'session' | 'log' | 'done'

export default function SessionPage() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const activityType = (type as ActivityType) || 'reading'
  const config = activityConfig[activityType] ?? activityConfig.reading

  const [step, setStep] = useState<Step>('session')
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const [versesRead, setVersesRead] = useState(0)
  const [notes, setNotes] = useState('')
  const [surahNum, setSurahNum] = useState('')
  const [ayahStart, setAyahStart] = useState('')
  const [ayahEnd, setAyahEnd] = useState('')
  const [milestone, setMilestone] = useState<string | null>(null)

  const { data: verse, refetch: refetchVerse } = useQuery({
    queryKey: ['daily-verse'],
    queryFn: getDailyVerse,
    staleTime: 24 * 60 * 60_000,
  })

  const { data: bookmarks } = useQuery({ queryKey: ['bookmarks'], queryFn: listBookmarks })
  const isBookmarked = verse ? bookmarks?.some(b => b.verse_key === verse.verse_key) : false

  const { mutate: bookmarkVerse, isPending: bookmarking } = useMutation({
    mutationFn: () => addBookmark({
      verse_key: verse!.verse_key,
      surah_number: verse!.surah_number,
      ayah_number: verse!.ayah_number,
      surah_name: verse!.surah_name,
      verse_text: `${verse!.text_arabic} — ${verse!.text_translation}`,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })

  const { mutate: saveSession, isPending: saving } = useMutation({
    mutationFn: logSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['garden'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['engagement'] })

      // Check for milestones (example based on verses)
      if (data.verses_read >= 100) setMilestone('100 verses reached! 🌸')
      setStep('done')
    },
  })

  const handleTimerComplete = (minutes: number) => {
    setSessionMinutes(Math.round(minutes * 10) / 10)
    setStep('log')
  }

  const handleSave = () => {
    saveSession({
      verses_read: versesRead || 1,
      minutes_spent: sessionMinutes,
      surah_number: surahNum ? parseInt(surahNum) : undefined,
      ayah_start: ayahStart ? parseInt(ayahStart) : undefined,
      ayah_end: ayahEnd ? parseInt(ayahEnd) : undefined,
      notes: notes || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-2xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate('/journey')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Journey
        </button>

        {/* Header */}
        <div className={`bg-gradient-to-r ${config.gradient} rounded-3xl p-6 mb-6 text-white shadow-xl`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl mb-2">{config.emoji}</div>
              <h1 className="font-display text-2xl font-bold mb-1">{config.title}</h1>
              <p className="text-white/70 text-sm">{config.subtitle}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 mb-1">Tip</div>
              <p className="text-xs text-white/80 max-w-[160px] leading-relaxed italic">{config.tip}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* Step 1: Timer */}
          {step === 'session' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-8"
            >
              <h2 className="font-display text-xl font-semibold text-gray-800 text-center mb-2">
                Your Session Timer
              </h2>
              <p className="text-gray-500 text-sm text-center mb-8">
                Press play to begin. Your garden grows with every minute.
              </p>
              <SessionTimer
                onComplete={handleTimerComplete}
                onCancel={() => navigate('/journey')}
              />

              {/* Quran verse for context */}
              {verse && (
                <div className="mt-8 p-4 bg-garden-50 rounded-2xl border border-garden-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-garden-600">Today's Verse</span>
                    <div className="flex gap-2 items-center">
                      {verse.audio_url && (
                        <a href={verse.audio_url} target="_blank" rel="noopener noreferrer"
                          className="text-garden-500 hover:text-garden-700">
                          <Volume2 className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => !isBookmarked && bookmarkVerse()}
                        disabled={bookmarking || isBookmarked}
                        title={isBookmarked ? 'Bookmarked' : 'Bookmark this verse'}
                        className={`transition-colors ${isBookmarked ? 'text-garden-600' : 'text-garden-400 hover:text-garden-600'}`}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-garden-600' : ''}`} />
                      </button>
                      <button onClick={() => refetchVerse()} className="text-garden-500 hover:text-garden-700">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="arabic text-base text-gray-800 mb-2">{verse.text_arabic}</p>
                  <p className="text-xs text-gray-500 italic leading-relaxed">"{verse.text_translation}"</p>
                  <span className="text-xs text-garden-500 mt-1.5 block font-medium">
                    {verse.surah_name} · {verse.verse_key}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Log details */}
          {step === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-garden-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-garden-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Log Your Session</h2>
                  <p className="text-xs text-gray-500">Session time: <strong>{sessionMinutes} minutes</strong></p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Verses Read *</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    placeholder="How many verses did you read?"
                    value={versesRead || ''}
                    onChange={(e) => setVersesRead(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Surah #</label>
                    <input
                      type="number"
                      min="1" max="114"
                      className="input"
                      placeholder="e.g. 2"
                      value={surahNum}
                      onChange={(e) => setSurahNum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Ayah from</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      placeholder="Start"
                      value={ayahStart}
                      onChange={(e) => setAyahStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Ayah to</label>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      placeholder="End"
                      value={ayahEnd}
                      onChange={(e) => setAyahEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    className="input resize-none h-24"
                    placeholder="Any reflections, feelings, or things you want to remember..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={versesRead < 1 || saving}
                  className="btn-primary w-full py-3.5 text-base font-bold disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving to your garden...
                    </span>
                  ) : (
                    <span>🌸 Save Session & Grow Garden</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="text-7xl mb-6"
              >
                🌸
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
                MashaAllah!
              </h2>
              <p className="text-gray-600 mb-2">
                Your garden has grown. <strong>{versesRead} verses</strong> in{' '}
                <strong>{sessionMinutes} minutes</strong> — every second counts.
              </p>

              {milestone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-earth-50 border border-earth-200 rounded-2xl p-4 mb-4 flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5 text-earth-600" />
                  <span className="text-earth-700 font-medium text-sm">{milestone}</span>
                </motion.div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-primary"
                >
                  🌿 View My Garden
                </button>
                <button
                  onClick={() => { setStep('session'); setVersesRead(0); setNotes(''); setSurahNum(''); setAyahStart(''); setAyahEnd('') }}
                  className="btn-outline"
                >
                  Another Session
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
