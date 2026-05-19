import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Bookmark, ChevronLeft, Sparkles, Volume2, RefreshCw, WifiOff, ChevronRight, Loader2 } from 'lucide-react'
import { logSession } from '../api/reading'
import { getDailyVerse } from '../api/verses'
import { addBookmark, listBookmarks } from '../api/bookmarks'
import { trackEvent } from '../api/analytics'
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

interface Surah { number: number; name: string; englishName: string; numberOfAyahs: number }
interface Ayah { number: number; numberInSurah: number; text: string; translation: string; audio: string }

const fetchSurahs = async (): Promise<Surah[]> => {
  const res = await fetch('https://api.alquran.cloud/v1/surah')
  const data = await res.json()
  return data.data
}

const fetchSurahAyahs = async (number: number): Promise<Ayah[]> => {
  const [arabicRes, translationRes] = await Promise.all([
    fetch(`https://api.alquran.cloud/v1/surah/${number}/quran-uthmani`),
    fetch(`https://api.alquran.cloud/v1/surah/${number}/en.sahih`),
  ])
  const [arabic, translation] = await Promise.all([arabicRes.json(), translationRes.json()])
  return arabic.data.ayahs.map((ayah: { number: number; numberInSurah: number; text: string }, i: number) => ({
    number: ayah.number,
    numberInSurah: ayah.numberInSurah,
    text: ayah.text,
    translation: translation.data.ayahs[i]?.text ?? '',
    audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
  }))
}

type Step = 'session' | 'log' | 'done'
type ReadMode = 'inapp' | 'offline'

export default function SessionPage() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const activityType = (type as ActivityType) || 'reading'
  const config = activityConfig[activityType] ?? activityConfig.reading

  const [step, setStep] = useState<Step>('session')
  const [readMode, setReadMode] = useState<ReadMode>('inapp')
  const [showTranslation, setShowTranslation] = useState(true)
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const [versesRead, setVersesRead] = useState(0)
  const [notes, setNotes] = useState('')
  const [surahNum, setSurahNum] = useState('')
  const [ayahStart, setAyahStart] = useState('')
  const [ayahEnd, setAyahEnd] = useState('')
  const [milestone, setMilestone] = useState<string | null>(null)

  // Inline Quran reader state
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { data: verse, refetch: refetchVerse } = useQuery({
    queryKey: ['daily-verse'],
    queryFn: getDailyVerse,
    staleTime: 24 * 60 * 60_000,
  })

  const { data: bookmarks } = useQuery({ queryKey: ['bookmarks'], queryFn: listBookmarks })
  const isBookmarked = verse ? bookmarks?.some(b => b.verse_key === verse.verse_key) : false

  const { data: surahs = [], isLoading: surahsLoading } = useQuery({
    queryKey: ['quran-surahs'],
    queryFn: fetchSurahs,
    staleTime: Infinity,
    enabled: readMode === 'inapp',
  })

  const { data: ayahs = [], isLoading: ayahsLoading } = useQuery({
    queryKey: ['quran-surah', selectedSurah?.number],
    queryFn: () => fetchSurahAyahs(selectedSurah!.number),
    enabled: !!selectedSurah && readMode === 'inapp',
    staleTime: Infinity,
  })

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

  const { mutate: bookmarkAyah } = useMutation({
    mutationFn: (ayah: Ayah) => addBookmark({
      verse_key: `${selectedSurah!.number}:${ayah.numberInSurah}`,
      surah_number: selectedSurah!.number,
      ayah_number: ayah.numberInSurah,
      surah_name: selectedSurah!.englishName,
      verse_text: ayah.text,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })

  const { mutate: saveSession, isPending: saving } = useMutation({
    mutationFn: logSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['garden'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['engagement'] })
      queryClient.invalidateQueries({ queryKey: ['milestones'] })

      if (data.verses_read >= 100) setMilestone('100 verses reached! 🌸')
      setStep('done')
    },
  })

  // Auto-fill surah number from in-app reader when surah is selected
  useEffect(() => {
    if (selectedSurah) setSurahNum(String(selectedSurah.number))
  }, [selectedSurah])

  const handleTimerComplete = (minutes: number) => {
    const rounded = Math.round(minutes * 10) / 10
    setSessionMinutes(rounded)
    setStep('log')
    trackEvent('session_end', { activity: activityType, minutes: rounded })
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

  const playAudio = (ayah: Ayah) => {
    if (playingAyah === ayah.numberInSurah) {
      audioRef.current?.pause()
      setPlayingAyah(null)
      return
    }
    audioRef.current?.pause()
    const audio = new Audio(ayah.audio)
    audioRef.current = audio
    audio.play()
    setPlayingAyah(ayah.numberInSurah)
    audio.onended = () => setPlayingAyah(null)
  }

  const isAyahBookmarked = (ayah: Ayah) =>
    bookmarks?.some(b => b.verse_key === `${selectedSurah?.number}:${ayah.numberInSurah}`) ?? false

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
            >
              {/* Mode toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => navigate(`/quran?session=${activityType}&start=${Date.now()}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all bg-white text-gray-500 border-gray-200 hover:border-garden-300 hover:bg-garden-50"
                >
                  <BookOpen className="w-4 h-4" />
                  Read in-app
                </button>
                <button
                  onClick={() => setReadMode('offline')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    readMode === 'offline'
                      ? 'bg-garden-600 text-white border-garden-600 shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-garden-300'
                  }`}
                >
                  <WifiOff className="w-4 h-4" />
                  Timer only
                </button>
              </div>

              {/* Timer card */}
              <div className="card p-8 mb-4">
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

                {/* Daily verse — only in offline mode */}
                {readMode === 'offline' && verse && (
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
              </div>

              {/* Inline Quran reader — only in inapp mode */}
              {readMode === 'inapp' && (
                <div className="card overflow-hidden">
                  {/* Translation toggle */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-garden-600" />
                      {selectedSurah ? selectedSurah.englishName : 'Select a Surah'}
                    </span>
                    <button
                      onClick={() => setShowTranslation(t => !t)}
                      className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                        showTranslation
                          ? 'bg-garden-100 text-garden-700 border-garden-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}
                    >
                      {showTranslation ? 'Translation on' : 'Translation off'}
                    </button>
                  </div>

                  {!selectedSurah ? (
                    /* Surah list */
                    <div className="max-h-80 overflow-y-auto">
                      {surahsLoading ? (
                        <div className="flex items-center justify-center h-24">
                          <Loader2 className="w-5 h-5 text-garden-500 animate-spin" />
                        </div>
                      ) : surahs.map(surah => (
                        <button
                          key={surah.number}
                          onClick={() => setSelectedSurah(surah)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-garden-50 transition-colors text-left border-b border-gray-50"
                        >
                          <div className="w-7 h-7 rounded-lg bg-garden-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-garden-700">{surah.number}</span>
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-800">{surah.englishName}</span>
                          <span className="font-arabic text-base text-garden-700 mr-1">{surah.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Ayah reader */
                    <div className="max-h-[480px] overflow-y-auto">
                      <button
                        onClick={() => { setSelectedSurah(null); audioRef.current?.pause(); setPlayingAyah(null) }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-5 py-2.5 border-b border-gray-100 w-full"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> All Surahs
                      </button>

                      {ayahsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-5 h-5 text-garden-500 animate-spin" />
                        </div>
                      ) : ayahs.map(ayah => (
                        <div
                          key={ayah.numberInSurah}
                          className="group px-5 py-4 hover:bg-garden-50 transition-colors border-b border-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-6 h-6 rounded-full bg-garden-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-garden-700">{ayah.numberInSurah}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => playAudio(ayah)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  playingAyah === ayah.numberInSurah
                                    ? 'text-garden-600 bg-garden-100'
                                    : 'text-gray-400 hover:text-garden-600 hover:bg-garden-50'
                                }`}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => !isAyahBookmarked(ayah) && bookmarkAyah(ayah)}
                                disabled={isAyahBookmarked(ayah)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isAyahBookmarked(ayah)
                                    ? 'text-garden-600 bg-garden-100'
                                    : 'text-gray-400 hover:text-garden-600 hover:bg-garden-50'
                                }`}
                              >
                                <Bookmark className={`w-3.5 h-3.5 ${isAyahBookmarked(ayah) ? 'fill-garden-600' : ''}`} />
                              </button>
                            </div>
                          </div>
                          <p className="font-arabic text-xl text-gray-900 leading-loose text-right mb-2">
                            {ayah.text}
                          </p>
                          {showTranslation && (
                            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                              {ayah.translation}
                            </p>
                          )}
                        </div>
                      ))}

                      {/* Next surah button */}
                      {!ayahsLoading && selectedSurah.number < 114 && (
                        <button
                          onClick={() => {
                            setSelectedSurah(surahs[selectedSurah.number])
                            audioRef.current?.pause()
                            setPlayingAyah(null)
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-medium text-garden-600 hover:bg-garden-50 transition-colors"
                        >
                          Next: {surahs[selectedSurah.number]?.englishName}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
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
