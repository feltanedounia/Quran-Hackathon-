import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Search, ChevronRight, Bookmark, Volume2, ChevronLeft, Loader2 } from 'lucide-react'
import Navbar from '../components/ui/Navbar'
import { addBookmark, listBookmarks } from '../api/bookmarks'

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

export default function QuranPage() {
  const queryClient = useQueryClient()
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const readerRef = useRef<HTMLDivElement>(null)

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

  const { mutate: bookmark } = useMutation({
    mutationFn: (ayah: Ayah) =>
      addBookmark({
        verse_key: `${selectedSurah!.number}:${ayah.numberInSurah}`,
        surah_number: selectedSurah!.number,
        ayah_number: ayah.numberInSurah,
        surah_name: selectedSurah!.englishName,
        verse_text: `${ayah.text} — ${ayah.translation}`,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  })

  const filteredSurahs = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
  )

  const isBookmarked = (ayah: Ayah) =>
    bookmarks.some((b) => b.verse_key === `${selectedSurah?.number}:${ayah.numberInSurah}`)

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurah(surah)
    setSidebarOpen(false)
    readerRef.current?.scrollTo(0, 0)
    setPlayingAyah(null)
    audioRef.current?.pause()
  }

  const playAudio = (ayah: Ayah) => {
    if (playingAyah === ayah.numberInSurah) {
      audioRef.current?.pause()
      setPlayingAyah(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(ayah.audio)
    audioRef.current = audio
    audio.play()
    setPlayingAyah(ayah.numberInSurah)
    audio.onended = () => setPlayingAyah(null)
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-[60px] h-screen flex flex-col">
        <div className="flex flex-1 overflow-hidden">

          {/* Surah Sidebar */}
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
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-garden-600" />
                      Surahs
                    </h2>
                    {selectedSurah && (
                      <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                </div>

                <div className="flex-1 overflow-y-auto">
                  {surahsLoading ? (
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
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Reader Area */}
          <div ref={readerRef} className="flex-1 overflow-y-auto">
            {!selectedSurah ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-6xl mb-4">📖</div>
                <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
                  Select a Surah to Begin
                </h2>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Choose any of the 114 surahs from the list to start reading with Arabic text and English translation.
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-8 pb-24">

                {/* Surah Header */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
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
                      <div className="text-right">
                        <div className="font-arabic text-3xl text-white/90">{selectedSurah.name}</div>
                      </div>
                    </div>
                  </div>

                  {/* Prev/Next Surah */}
                  <div className="hidden md:flex flex-col gap-1">
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

                {/* Bismillah (skip for Al-Fatiha and At-Tawbah) */}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className="group rounded-2xl p-5 hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-garden-100"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          {/* Ayah number badge */}
                          <div className="w-8 h-8 rounded-full bg-garden-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-xs font-bold text-garden-700">{ayah.numberInSurah}</span>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => playAudio(ayah)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                playingAyah === ayah.numberInSurah
                                  ? 'text-garden-600 bg-garden-100'
                                  : 'text-gray-400 hover:text-garden-600 hover:bg-garden-50'
                              }`}
                              title="Listen"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => !isBookmarked(ayah) && bookmark(ayah)}
                              disabled={isBookmarked(ayah)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBookmarked(ayah)
                                  ? 'text-garden-600 bg-garden-100'
                                  : 'text-gray-400 hover:text-garden-600 hover:bg-garden-50'
                              }`}
                              title={isBookmarked(ayah) ? 'Bookmarked' : 'Bookmark'}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked(ayah) ? 'fill-garden-600' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Arabic text */}
                        <p className="font-arabic text-2xl text-gray-900 leading-loose text-right mb-4 px-2">
                          {ayah.text}
                        </p>

                        {/* Translation */}
                        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                          {ayah.translation}
                        </p>
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
        </div>
      </div>
    </div>
  )
}
