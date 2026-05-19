import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, ChevronRight, Bookmark, Volume2, ChevronLeft,
  Loader2, ListOrdered, Hash, Menu, Play, Pause, X, Clock, CheckCircle2,
  Trash2,
} from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import { addBookmark, listBookmarks, deleteBookmark } from '../api/bookmarks'
import type { Bookmark as BookmarkType } from '../api/bookmarks'
import { getSessions, logSession } from '../api/reading'
import { trackEvent } from '../api/analytics'
import type { ActivityType } from '../types'

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: 'Meccan' | 'Medinan'
}

interface Ayah {
  number: number
  numberInSurah: number
  text: string
  translation: string
  audio?: string
}

interface JuzzInfo { number: number; arabicName: string; startSurah: number; startAyah: number }
interface HizbInfo { number: number; juzz: number; startSurah: number; startAyah: number }

const JUZZ: JuzzInfo[] = [
  { number: 1,  arabicName: 'الم',              startSurah: 1,  startAyah: 1 },
  { number: 2,  arabicName: 'سيقول',            startSurah: 2,  startAyah: 142 },
  { number: 3,  arabicName: 'تلك الرسل',        startSurah: 2,  startAyah: 253 },
  { number: 4,  arabicName: 'كُلُّ الطَّعَامِ',   startSurah: 3,  startAyah: 93 },
  { number: 5,  arabicName: 'والمحصنات',        startSurah: 4,  startAyah: 24 },
  { number: 6,  arabicName: 'لا يحب الله',      startSurah: 4,  startAyah: 148 },
  { number: 7,  arabicName: 'وإذا سمعوا',       startSurah: 5,  startAyah: 82 },
  { number: 8,  arabicName: 'ولو أننا',         startSurah: 6,  startAyah: 111 },
  { number: 9,  arabicName: 'قال الملأ',        startSurah: 7,  startAyah: 88 },
  { number: 10, arabicName: 'واعلموا',          startSurah: 8,  startAyah: 41 },
  { number: 11, arabicName: 'يعتذرون',          startSurah: 9,  startAyah: 93 },
  { number: 12, arabicName: 'وما من دابة',      startSurah: 11, startAyah: 6 },
  { number: 13, arabicName: 'وما أبرئ',         startSurah: 12, startAyah: 53 },
  { number: 14, arabicName: 'ربما',             startSurah: 15, startAyah: 1 },
  { number: 15, arabicName: 'سبحان الذي',       startSurah: 17, startAyah: 1 },
  { number: 16, arabicName: 'قال ألم',          startSurah: 18, startAyah: 75 },
  { number: 17, arabicName: 'اقترب',            startSurah: 21, startAyah: 1 },
  { number: 18, arabicName: 'قد أفلح',          startSurah: 23, startAyah: 1 },
  { number: 19, arabicName: 'وقال الذين',       startSurah: 25, startAyah: 21 },
  { number: 20, arabicName: 'أمن خلق',          startSurah: 27, startAyah: 56 },
  { number: 21, arabicName: 'اتل ما أوحي',      startSurah: 29, startAyah: 46 },
  { number: 22, arabicName: 'ومن يقنط',         startSurah: 33, startAyah: 31 },
  { number: 23, arabicName: 'وما لي',           startSurah: 36, startAyah: 28 },
  { number: 24, arabicName: 'فمن أظلم',         startSurah: 39, startAyah: 32 },
  { number: 25, arabicName: 'إليه يرد',         startSurah: 41, startAyah: 47 },
  { number: 26, arabicName: 'حم',               startSurah: 46, startAyah: 1 },
  { number: 27, arabicName: 'قال فما خطبكم',    startSurah: 51, startAyah: 31 },
  { number: 28, arabicName: 'قد سمع الله',      startSurah: 58, startAyah: 1 },
  { number: 29, arabicName: 'تبارك الذي',       startSurah: 67, startAyah: 1 },
  { number: 30, arabicName: 'عم',               startSurah: 78, startAyah: 1 },
]

const HIZB: HizbInfo[] = [
  { number: 1,  juzz: 1,  startSurah: 1,  startAyah: 1 },
  { number: 2,  juzz: 1,  startSurah: 2,  startAyah: 75 },
  { number: 3,  juzz: 2,  startSurah: 2,  startAyah: 142 },
  { number: 4,  juzz: 2,  startSurah: 2,  startAyah: 203 },
  { number: 5,  juzz: 3,  startSurah: 2,  startAyah: 253 },
  { number: 6,  juzz: 3,  startSurah: 3,  startAyah: 15 },
  { number: 7,  juzz: 4,  startSurah: 3,  startAyah: 93 },
  { number: 8,  juzz: 4,  startSurah: 3,  startAyah: 171 },
  { number: 9,  juzz: 5,  startSurah: 4,  startAyah: 24 },
  { number: 10, juzz: 5,  startSurah: 4,  startAyah: 88 },
  { number: 11, juzz: 6,  startSurah: 4,  startAyah: 148 },
  { number: 12, juzz: 6,  startSurah: 5,  startAyah: 27 },
  { number: 13, juzz: 7,  startSurah: 5,  startAyah: 82 },
  { number: 14, juzz: 7,  startSurah: 6,  startAyah: 36 },
  { number: 15, juzz: 8,  startSurah: 6,  startAyah: 111 },
  { number: 16, juzz: 8,  startSurah: 7,  startAyah: 1 },
  { number: 17, juzz: 9,  startSurah: 7,  startAyah: 88 },
  { number: 18, juzz: 9,  startSurah: 7,  startAyah: 171 },
  { number: 19, juzz: 10, startSurah: 8,  startAyah: 41 },
  { number: 20, juzz: 10, startSurah: 9,  startAyah: 34 },
  { number: 21, juzz: 11, startSurah: 9,  startAyah: 93 },
  { number: 22, juzz: 11, startSurah: 10, startAyah: 26 },
  { number: 23, juzz: 12, startSurah: 11, startAyah: 6 },
  { number: 24, juzz: 12, startSurah: 11, startAyah: 84 },
  { number: 25, juzz: 13, startSurah: 12, startAyah: 53 },
  { number: 26, juzz: 13, startSurah: 13, startAyah: 19 },
  { number: 27, juzz: 14, startSurah: 15, startAyah: 1 },
  { number: 28, juzz: 14, startSurah: 16, startAyah: 51 },
  { number: 29, juzz: 15, startSurah: 17, startAyah: 1 },
  { number: 30, juzz: 15, startSurah: 17, startAyah: 99 },
  { number: 31, juzz: 16, startSurah: 18, startAyah: 75 },
  { number: 32, juzz: 16, startSurah: 20, startAyah: 1 },
  { number: 33, juzz: 17, startSurah: 21, startAyah: 1 },
  { number: 34, juzz: 17, startSurah: 22, startAyah: 1 },
  { number: 35, juzz: 18, startSurah: 23, startAyah: 1 },
  { number: 36, juzz: 18, startSurah: 24, startAyah: 21 },
  { number: 37, juzz: 19, startSurah: 25, startAyah: 21 },
  { number: 38, juzz: 19, startSurah: 26, startAyah: 111 },
  { number: 39, juzz: 20, startSurah: 27, startAyah: 56 },
  { number: 40, juzz: 20, startSurah: 28, startAyah: 51 },
  { number: 41, juzz: 21, startSurah: 29, startAyah: 46 },
  { number: 42, juzz: 21, startSurah: 31, startAyah: 22 },
  { number: 43, juzz: 22, startSurah: 33, startAyah: 31 },
  { number: 44, juzz: 22, startSurah: 34, startAyah: 24 },
  { number: 45, juzz: 23, startSurah: 36, startAyah: 28 },
  { number: 46, juzz: 23, startSurah: 37, startAyah: 145 },
  { number: 47, juzz: 24, startSurah: 39, startAyah: 32 },
  { number: 48, juzz: 24, startSurah: 40, startAyah: 41 },
  { number: 49, juzz: 25, startSurah: 41, startAyah: 47 },
  { number: 50, juzz: 25, startSurah: 43, startAyah: 24 },
  { number: 51, juzz: 26, startSurah: 46, startAyah: 1 },
  { number: 52, juzz: 26, startSurah: 48, startAyah: 18 },
  { number: 53, juzz: 27, startSurah: 51, startAyah: 31 },
  { number: 54, juzz: 27, startSurah: 55, startAyah: 1 },
  { number: 55, juzz: 28, startSurah: 58, startAyah: 1 },
  { number: 56, juzz: 28, startSurah: 62, startAyah: 1 },
  { number: 57, juzz: 29, startSurah: 67, startAyah: 1 },
  { number: 58, juzz: 29, startSurah: 72, startAyah: 1 },
  { number: 59, juzz: 30, startSurah: 78, startAyah: 1 },
  { number: 60, juzz: 30, startSurah: 87, startAyah: 1 },
]

const fetchSurahs = async (): Promise<Surah[]> => {
  const res = await fetch('https://api.alquran.cloud/v1/surah')
  const data = await res.json()
  return data.data
}

const fetchSurah = async (number: number): Promise<Ayah[]> => {
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

type NavMode = 'surah' | 'juzz' | 'hizb' | 'bookmarks'

const isActivityType = (value: string | null): value is ActivityType => (
  value === 'reading' || value === 'recitation' || value === 'memorization'
)

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function QuranPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showTranslation, setShowTranslation] = useState(true)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [navMode, setNavMode] = useState<NavMode>('surah')
  const [scrollToAyah, setScrollToAyah] = useState<number | null>(null)
  const [bookmarkError, setBookmarkError] = useState<string | null>(null)

  // Go-to-ayah input
  const [gotoValue, setGotoValue] = useState('')

  // Auto-scroll
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(2) // px per tick
  const autoScrollRef = useRef<number | null>(null)

  // Session timer (from ?session= param)
  const sessionTypeParam = searchParams.get('session')
  const sessionType: ActivityType | null = isActivityType(sessionTypeParam) ? sessionTypeParam : null
  const sessionStart = searchParams.get('start')
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerCollapsed, setTimerCollapsed] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)
  const [versesRead, setVersesRead] = useState('')
  const [sessionSaved, setSessionSaved] = useState(false)
  const timerIntervalRef = useRef<number | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const readerRef = useRef<HTMLDivElement>(null)
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const { data: surahs = [], isLoading: surahsLoading } = useQuery({
    queryKey: ['quran-surahs'],
    queryFn: fetchSurahs,
    staleTime: Infinity,
  })

  const { data: ayahs = [], isLoading: ayahsLoading } = useQuery({
    queryKey: ['quran-surah', selectedSurah?.number],
    queryFn: () => fetchSurah(selectedSurah!.number),
    enabled: !!selectedSurah,
    staleTime: Infinity,
  })

  const { data: bookmarks = [] } = useQuery({ queryKey: ['bookmarks'], queryFn: listBookmarks })

  const { data: sessions = [] } = useQuery({
    queryKey: ['reading-sessions', sessionType ?? 'all'],
    queryFn: () => getSessions(5, sessionType ?? undefined),
    staleTime: 60_000,
  })

  const lastSession = sessions.find(s => s.surah_number)

  const { mutate: bookmark } = useMutation({
    mutationFn: (ayah: Ayah) =>
      addBookmark({
        verse_key: `${selectedSurah!.number}:${ayah.numberInSurah}`,
        surah_number: selectedSurah!.number,
        ayah_number: ayah.numberInSurah,
        surah_name: selectedSurah!.englishName,
        verse_text: `${ayah.text} — ${ayah.translation}`,
      }),
    onSuccess: () => {
      setBookmarkError(null)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
    onError: (error) => {
      setBookmarkError('Failed to save bookmark. Please try again.')
      console.error('Bookmark error:', error)
    },
  })

  const { mutate: removeBookmark } = useMutation({
    mutationFn: (id: number) => deleteBookmark(id),
    onSuccess: () => {
      setBookmarkError(null)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
    onError: (error) => {
      setBookmarkError('Failed to remove bookmark. Please try again.')
      console.error('Remove bookmark error:', error)
    },
  })

  const { mutate: saveSession, isPending: savingSession } = useMutation({
    mutationFn: logSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garden'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setSessionSaved(true)
      // Clear session params from URL
      setSearchParams({})
    },
  })

  // Timer: start/resume from ?start= param
  useEffect(() => {
    if (!sessionType || !sessionStart) return
    const elapsed = Math.floor((Date.now() - Number(sessionStart)) / 1000)
    setTimerSeconds(elapsed > 0 ? elapsed : 0)

    timerIntervalRef.current = window.setInterval(() => {
      setTimerSeconds(s => s + 1)
    }, 1000)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [sessionType, sessionStart])

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && readerRef.current) {
      autoScrollRef.current = window.setInterval(() => {
        readerRef.current?.scrollBy({ top: scrollSpeed, behavior: 'auto' })
      }, 50)
    } else {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [autoScroll, scrollSpeed])

  // Scroll to target ayah after ayahs load
  useEffect(() => {
    if (!ayahsLoading && scrollToAyah !== null && ayahs.length > 0) {
      setTimeout(() => {
        const el = ayahRefs.current[scrollToAyah]
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setScrollToAyah(null)
      }, 100)
    }
  }, [ayahsLoading, scrollToAyah, ayahs])

  const filteredSurahs = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
  )

  const isBookmarked = (ayah: Ayah) =>
    bookmarks.some((b) => b.verse_key === `${selectedSurah?.number}:${ayah.numberInSurah}`)

  const getBookmarkForAyah = (ayah: Ayah): BookmarkType | undefined =>
    bookmarks.find((b) => b.verse_key === `${selectedSurah?.number}:${ayah.numberInSurah}`)

  const handleSelectSurah = useCallback((surah: Surah, targetAyah?: number) => {
    setSelectedSurah(surah)
    setSidebarOpen(false)
    readerRef.current?.scrollTo(0, 0)
    setPlayingAyah(null)
    audioRef.current?.pause()
    ayahRefs.current = {}
    setGotoValue('')
    setAutoScroll(false)
    if (targetAyah && targetAyah > 1) {
      setScrollToAyah(targetAyah)
    } else {
      setScrollToAyah(null)
    }
    trackEvent('surah_view', { surah_number: surah.number, surah_name: surah.englishName })
  }, [])

  const handleSelectJuzz = (juzz: JuzzInfo) => {
    const surah = surahs.find(s => s.number === juzz.startSurah)
    if (surah) {
      handleSelectSurah(surah, juzz.startAyah)
      trackEvent('juzz_navigate', { juzz_number: juzz.number, startSurah: juzz.startSurah })
    }
  }

  const handleSelectHizb = (hizb: HizbInfo) => {
    const surah = surahs.find(s => s.number === hizb.startSurah)
    if (surah) {
      handleSelectSurah(surah, hizb.startAyah)
      trackEvent('hizb_navigate', { hizb_number: hizb.number, startSurah: hizb.startSurah })
    }
  }

  const handleContinueKhatma = () => {
    if (!lastSession) return
    const surah = surahs.find(s => s.number === lastSession.surah_number)
    if (surah) handleSelectSurah(surah, lastSession.ayah_end ?? lastSession.ayah_start ?? 1)
  }

  const handleGotoAyah = () => {
    const num = parseInt(gotoValue)
    if (!selectedSurah || isNaN(num) || num < 1 || num > selectedSurah.numberOfAyahs) return
    const el = ayahRefs.current[num]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setGotoValue('')
  }

  const handleBookmarkFromList = (b: BookmarkType) => {
    const surah = surahs.find(s => s.number === b.surah_number)
    if (surah) handleSelectSurah(surah, b.ayah_number)
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
    trackEvent('audio_play', { surah: selectedSurah?.number, ayah: ayah.numberInSurah })
  }

  const handleEndSession = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setSessionDone(true)
  }

  const handleSaveSession = () => {
    saveSession({
      activity_type: sessionType ?? 'reading',
      verses_read: parseInt(versesRead) || 1,
      minutes_spent: Math.round(timerSeconds / 60 * 10) / 10,
      surah_number: selectedSurah?.number,
      notes: undefined,
    })
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (autoScrollRef.current) clearInterval(autoScrollRef.current)
    }
  }, [])

  const navTabs: { id: NavMode; label: string; icon: React.ReactNode }[] = [
    { id: 'surah',     label: 'Surah',     icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'juzz',      label: 'Juzz',      icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'hizb',      label: 'Hizb',      icon: <Hash className="w-3.5 h-3.5" /> },
    { id: 'bookmarks', label: 'Saved',     icon: <Bookmark className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-[60px] h-screen flex flex-col">
        <div className="flex flex-1 overflow-hidden relative">

          {/* Sidebar */}
          <AnimatePresence initial={false}>
            {(sidebarOpen || !selectedSurah) && (
              <motion.aside
                key="sidebar"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="w-72 bg-white border-r border-gray-100 flex flex-col z-10 absolute md:relative h-full shadow-xl md:shadow-none"
              >
                {/* Sidebar header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-garden-600" />
                      Quran
                    </h2>
                    {selectedSurah && (
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Nav mode tabs */}
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
                    {navTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setNavMode(tab.id); setSearch('') }}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          navMode === tab.id
                            ? 'bg-white text-garden-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.icon}
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search — only for surah mode */}
                  {navMode === 'surah' && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search surah..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-garden-300 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Continue khatma banner */}
                {lastSession && navMode === 'surah' && !search && (
                  <button
                    onClick={handleContinueKhatma}
                    className="mx-3 mt-3 px-3 py-2.5 bg-garden-50 border border-garden-200 rounded-xl text-left hover:bg-garden-100 transition-colors flex-shrink-0"
                  >
                    <div className="text-xs font-semibold text-garden-700 mb-0.5">Continue Khatma</div>
                    <div className="text-xs text-garden-600">
                      Surah {lastSession.surah_number}
                      {lastSession.ayah_end ? ` · Ayah ${lastSession.ayah_end}` : ''}
                    </div>
                  </button>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto mt-1">

                  {navMode === 'surah' && (
                    surahsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="w-5 h-5 text-garden-500 animate-spin" />
                      </div>
                    ) : (
                      filteredSurahs.map((surah) => (
                        <button
                          key={surah.number}
                          onClick={() => handleSelectSurah(surah)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-garden-50 transition-colors text-left border-b border-gray-50 ${
                            selectedSurah?.number === surah.number ? 'bg-garden-50 border-l-2 border-l-garden-500' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-garden-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-garden-700">{surah.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800 truncate">{surah.englishName}</span>
                              <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{surah.numberOfAyahs}v</span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs text-gray-400 truncate">{surah.englishNameTranslation}</span>
                              <span className="font-arabic text-sm text-garden-700 flex-shrink-0 ml-1">{surah.name}</span>
                            </div>
                          </div>
                        </button>
                      ))
                    )
                  )}

                  {navMode === 'juzz' && (
                    <div>
                      <p className="px-4 py-2 text-xs text-gray-400">Select a Juzz to jump to its start</p>
                      {JUZZ.map((juzz) => (
                        <button
                          key={juzz.number}
                          onClick={() => handleSelectJuzz(juzz)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-garden-50 transition-colors text-left border-b border-gray-50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-garden-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-garden-700">{juzz.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Juzz {juzz.number}</span>
                              <span className="font-arabic text-sm text-garden-700">{juzz.arabicName}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              Surah {juzz.startSurah}{juzz.startAyah > 1 ? ` · Ayah ${juzz.startAyah}` : ''}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {navMode === 'hizb' && (
                    <div>
                      <p className="px-4 py-2 text-xs text-gray-400">60 Hizb · 2 per Juzz · tap to navigate</p>
                      {HIZB.map((hizb) => (
                        <button
                          key={hizb.number}
                          onClick={() => handleSelectHizb(hizb)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-garden-50 transition-colors text-left border-b border-gray-50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-garden-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-garden-700">{hizb.number}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-800">Hizb {hizb.number}</span>
                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Juzz {hizb.juzz}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              Surah {hizb.startSurah} · Ayah {hizb.startAyah}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {navMode === 'bookmarks' && (
                    <div>
                      <p className="px-4 py-2 text-xs text-gray-400">
                        {bookmarks.length} saved · tap to jump
                      </p>
                      {bookmarks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <Bookmark className="w-8 h-8 text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No bookmarks yet</p>
                          <p className="text-xs text-gray-300 mt-1">Tap the bookmark icon on any ayah</p>
                        </div>
                      ) : (
                        bookmarks.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-start gap-2 px-4 py-3 border-b border-gray-50 hover:bg-garden-50 transition-colors"
                          >
                            <button
                              onClick={() => handleBookmarkFromList(b)}
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-semibold text-garden-700">
                                  {b.surah_name ?? `Surah ${b.surah_number}`} · {b.ayah_number}
                                </span>
                              </div>
                              {b.verse_text && (
                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{b.verse_text}</p>
                              )}
                              <p className="text-xs text-gray-300 mt-1">
                                {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </button>
                            <button
                              onClick={() => removeBookmark(b.id)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                              title="Remove bookmark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Reader Area */}
          <div ref={readerRef} className="flex-1 overflow-y-auto relative">

            {/* Persistent sidebar toggle button */}
            {selectedSurah && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-gray-200 border-l-0 rounded-r-xl p-2 shadow-md text-gray-500 hover:text-garden-600 hover:bg-garden-50 transition-colors"
                title="Open surah panel"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            {!selectedSurah ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
                  Select a Surah to Begin
                </h2>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Choose any of the 114 surahs, or navigate by Juzz (1–30) or Hizb (1–60) for easy khatma tracking.
                </p>
                <div className="flex gap-3 mt-6 text-sm text-gray-400">
                  <span className="bg-garden-50 text-garden-700 px-3 py-1 rounded-full font-medium">📚 Surah</span>
                  <span className="bg-garden-50 text-garden-700 px-3 py-1 rounded-full font-medium">📑 Juzz</span>
                  <span className="bg-garden-50 text-garden-700 px-3 py-1 rounded-full font-medium"># Hizb</span>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

                {/* Surah Header */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Change surah"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className="flex-1 bg-gradient-to-r from-garden-600 to-garden-800 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-white/60 mb-1">Surah {selectedSurah.number}</div>
                        <h1 className="font-display text-xl font-bold mb-0.5">{selectedSurah.englishName}</h1>
                        <p className="text-white/70 text-sm">{selectedSurah.englishNameTranslation}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                          <span>{selectedSurah.numberOfAyahs} verses</span>
                          <span>·</span>
                          <span>{selectedSurah.revelationType}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-arabic text-3xl text-white/90">{selectedSurah.name}</div>
                        <button
                          onClick={() => {
                            setShowTranslation(t => !t)
                            trackEvent('translation_toggle', { surah: selectedSurah.number })
                          }}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                            showTranslation
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {showTranslation ? 'Hide translation' : 'Show translation'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prev/Next Surah */}
                  <div className="flex flex-col gap-1">
                    {selectedSurah.number > 1 && (
                      <button
                        onClick={() => handleSelectSurah(surahs[selectedSurah.number - 2])}
                        className="p-2 text-gray-400 hover:text-garden-600 hover:bg-garden-50 rounded-lg transition-colors"
                        title="Previous Surah"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                    {selectedSurah.number < 114 && (
                      <button
                        onClick={() => handleSelectSurah(surahs[selectedSurah.number])}
                        className="p-2 text-gray-400 hover:text-garden-600 hover:bg-garden-50 rounded-lg transition-colors"
                        title="Next Surah"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Toolbar: go-to-ayah + auto-scroll */}
                {!ayahsLoading && ayahs.length > 0 && (
                  <div className="flex items-center gap-2 mb-5 flex-wrap">
                    {/* Go to ayah */}
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleGotoAyah() }}
                      className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm"
                    >
                      <Hash className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="number"
                        min={1}
                        max={selectedSurah.numberOfAyahs}
                        placeholder={`Ayah 1–${selectedSurah.numberOfAyahs}`}
                        value={gotoValue}
                        onChange={(e) => setGotoValue(e.target.value)}
                        className="w-28 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-300"
                      />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-garden-600 hover:text-garden-800 px-1"
                      >
                        Go
                      </button>
                    </form>

                    {/* Auto-scroll toggle */}
                    <button
                      onClick={() => setAutoScroll(a => !a)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        autoScroll
                          ? 'bg-garden-600 text-white border-garden-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-garden-300'
                      }`}
                    >
                      {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      Auto-scroll
                    </button>

                    {/* Speed slider — only when auto-scroll is on */}
                    {autoScroll && (
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className="text-xs text-gray-400">Speed</span>
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={scrollSpeed}
                          onChange={(e) => setScrollSpeed(Number(e.target.value))}
                          className="w-20 accent-garden-600"
                        />
                        <span className="text-xs font-semibold text-garden-700">{scrollSpeed}x</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error notification */}
                {bookmarkError && (
                  <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start justify-between">
                    <span>{bookmarkError}</span>
                    <button
                      onClick={() => setBookmarkError(null)}
                      className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Bismillah */}
                {selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
                  <div className="text-center mb-8">
                    <p className="font-arabic text-2xl text-garden-800 leading-loose">
                      بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                    </p>
                    <p className="text-xs text-gray-400 mt-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
                  </div>
                )}

                {/* Ayahs */}
                {ayahsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-garden-500 animate-spin" />
                    <span className="ml-2 text-gray-500 text-sm">Loading surah...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {ayahs.map((ayah, i) => (
                      <motion.div
                        key={ayah.numberInSurah}
                        ref={(el) => { ayahRefs.current[ayah.numberInSurah] = el }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="group rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-garden-100"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="w-8 h-8 rounded-full bg-garden-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-xs font-bold text-garden-700">{ayah.numberInSurah}</span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => playAudio(ayah)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                playingAyah === ayah.numberInSurah
                                  ? 'text-garden-600 bg-garden-100'
                                  : 'text-gray-300 hover:text-garden-600 hover:bg-garden-50'
                              }`}
                              title="Listen"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const existing = getBookmarkForAyah(ayah)
                                if (existing) removeBookmark(existing.id)
                                else bookmark(ayah)
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBookmarked(ayah)
                                  ? 'text-garden-600 bg-garden-100'
                                  : 'text-gray-300 hover:text-garden-600 hover:bg-garden-50'
                              }`}
                              title={isBookmarked(ayah) ? 'Remove bookmark' : 'Bookmark'}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked(ayah) ? 'fill-garden-600' : ''}`} />
                            </button>
                          </div>
                        </div>

                        <p className="font-arabic text-2xl text-gray-900 leading-loose text-right mb-4 px-2">
                          {ayah.text}
                        </p>

                        {showTranslation && (
                          <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                            {ayah.translation}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Next Surah Footer */}
                {!ayahsLoading && selectedSurah.number < 114 && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => handleSelectSurah(surahs[selectedSurah.number])}
                      className="inline-flex items-center gap-2 bg-garden-600 hover:bg-garden-700 text-white font-semibold px-6 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all"
                    >
                      Next: {surahs[selectedSurah.number]?.englishName}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Session timer panel (only when ?session= is in URL) */}
          {sessionType && !sessionSaved && (
            <AnimatePresence>
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="w-64 bg-white border-l border-gray-100 flex flex-col z-10 h-full shadow-xl flex-shrink-0"
              >
                {/* Timer header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-garden-600" />
                    <span className="capitalize">{sessionType} session</span>
                  </div>
                  <button
                    onClick={() => setTimerCollapsed(c => !c)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={timerCollapsed ? 'Expand' : 'Collapse'}
                  >
                    {timerCollapsed ? <ChevronLeft className="w-4 h-4 rotate-180" /> : <X className="w-4 h-4" />}
                  </button>
                </div>

                {!timerCollapsed && (
                  <div className="flex-1 p-4 flex flex-col gap-4">
                    {/* Timer display */}
                    <div className="text-center py-6">
                      <div className="text-4xl font-mono font-bold text-garden-700 tabular-nums">
                        {formatTime(timerSeconds)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {sessionDone ? 'Session ended' : 'Session running'}
                      </p>
                    </div>

                    {!sessionDone ? (
                      <button
                        onClick={handleEndSession}
                        className="w-full py-2.5 bg-garden-600 hover:bg-garden-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        End Session
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 block mb-1">Verses read</label>
                          <input
                            type="number"
                            min={1}
                            value={versesRead}
                            onChange={(e) => setVersesRead(e.target.value)}
                            placeholder="e.g. 20"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-garden-300"
                          />
                        </div>
                        <button
                          onClick={handleSaveSession}
                          disabled={savingSession}
                          className="w-full py-2.5 bg-garden-600 hover:bg-garden-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {savingSession ? 'Saving...' : 'Save Session'}
                        </button>
                      </div>
                    )}

                    {/* Current surah info */}
                    {selectedSurah && (
                      <div className="mt-auto bg-garden-50 rounded-xl p-3">
                        <p className="text-xs text-garden-600 font-semibold">Reading</p>
                        <p className="text-sm font-medium text-garden-800">{selectedSurah.englishName}</p>
                        <p className="text-xs text-garden-600">{selectedSurah.numberOfAyahs} verses</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsed state: just show time */}
                {timerCollapsed && (
                  <button
                    onClick={() => setTimerCollapsed(false)}
                    className="flex-1 flex flex-col items-center justify-center gap-1 text-garden-700 hover:bg-garden-50 transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-mono font-bold text-lg tabular-nums">{formatTime(timerSeconds)}</span>
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  )
}
