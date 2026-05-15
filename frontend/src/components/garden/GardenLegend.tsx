import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Info } from 'lucide-react'
import type { GardenState } from '../../types'

// ─── PLANT DATA ───────────────────────────────────────────────────────────────
const PLANTS = [
  {
    id: 'tulip',
    emoji: '🌷',
    name: 'Pink Tulip',
    arabic: 'جلنار',
    romanization: 'Julnār',
    mode: 'Reading',
    modeEmoji: '📖',
    modeColor: 'bg-garden-100 text-garden-700',
    description:
      'Delicate pink tulips that bloom with each verse you read. Their cup-shaped petals fill with light as your understanding deepens.',
    quranRef: null,
    howToEarn: 'Earned from your reading sessions. Each tulip represents a portion of your daily reading progress (verses % 10).',
    getCount: (g: GardenState) => Math.min(g.petals, 9),
  },
  {
    id: 'rose',
    emoji: '🌹',
    name: 'Red Rose',
    arabic: 'وَرْدَة',
    romanization: 'Warda',
    mode: 'Recitation',
    modeEmoji: '🎙️',
    modeColor: 'bg-red-100 text-red-700',
    description:
      'Fragrant red roses that grow from the beauty of your recitation. Each rose is a testament to your voice joining the chorus of those who recite the Quran.',
    quranRef: {
      arabic: 'فَكَانَتْ وَرْدَةً كَالدِّهَانِ',
      translation: '"And the sky will become like molten rose..."',
      ref: 'Ar-Rahman 55:37',
    },
    howToEarn: 'Grows with every 20 verses read. The more you engage with the Quran, the more roses bloom (flowers ÷ 2, max 15).',
    getCount: (g: GardenState) => Math.min(Math.floor(g.flowers / 2), 15),
  },
  {
    id: 'lavender',
    emoji: '💜',
    name: 'Lavender',
    arabic: 'خُزَامَى',
    romanization: 'Khuzāmā',
    mode: 'Memorization',
    modeEmoji: '🧠',
    modeColor: 'bg-purple-100 text-purple-700',
    description:
      'Purple lavender spikes that represent the depth of hifdh. Their calming fragrance symbolizes the tranquility of having Allah\'s words in your heart.',
    quranRef: null,
    howToEarn: 'Earned through consistent long-term engagement. Lavender clusters appear every 100 verses read (branches × 2, max 8).',
    getCount: (g: GardenState) => Math.min(g.branches * 2, 8),
  },
  {
    id: 'narcissus',
    emoji: '🌼',
    name: 'Narcissus',
    arabic: 'نَرْجِس',
    romanization: 'Narjis',
    mode: 'Daily Streak',
    modeEmoji: '🔥',
    modeColor: 'bg-yellow-100 text-yellow-700',
    description:
      'Golden narcissus that shimmer with streak bonuses. They float gently above the ground when your streak is strong, glowing with warm golden light.',
    quranRef: null,
    howToEarn: 'Awarded for maintaining reading streaks. Each streak milestone (every 7 consecutive days) adds a golden narcissus.',
    getCount: (g: GardenState) => Math.min(g.streak_flowers, 6),
  },
  {
    id: 'pomegranate',
    emoji: '🌳',
    name: 'Pomegranate Tree',
    arabic: 'رُمَّان',
    romanization: 'Rummān',
    mode: 'Level 3+',
    modeEmoji: '⭐',
    modeColor: 'bg-red-100 text-red-700',
    description:
      'The noble pomegranate tree, explicitly mentioned in the Quran among the fruits of Paradise. Its round crimson fruits hang heavy with countless seeds — a symbol of abundance and barakah.',
    quranRef: {
      arabic: 'وَالنَّخْلَ وَالزَّرْعَ وَالزَّيْتُونَ وَالرُّمَّانَ',
      translation: '"...date palms, crops, olive trees and pomegranates..."',
      ref: 'Al-An\'am 6:141 · Ar-Rahman 55:68',
    },
    howToEarn: 'Unlocks when you reach Level 3 (300+ total verses). It appears in the corner of your garden as a permanent gift.',
    getCount: (g: GardenState) => g.level >= 3 ? 1 : 0,
  },
  {
    id: 'date_palm',
    emoji: '🌴',
    name: 'Date Palm',
    arabic: 'نَخْلَة',
    romanization: 'Nakhla',
    mode: 'Level 4+',
    modeEmoji: '⭐⭐',
    modeColor: 'bg-orange-100 text-orange-700',
    description:
      'The majestic date palm — the most mentioned tree in the Quran. Maryam (alayhassalam) was guided to its trunk during her blessed trial. Its golden dates hang in generous clusters.',
    quranRef: {
      arabic: 'وَهُزِّي إِلَيْكِ بِجِذْعِ النَّخْلَةِ تُسَاقِطْ عَلَيْكِ رُطَبًا جَنِيًّا',
      translation: '"Shake the trunk of the palm tree towards you — it will drop fresh ripe dates upon you."',
      ref: 'Maryam 19:25',
    },
    howToEarn: 'Unlocks at Level 4 (500+ total verses). Stands tall in your garden as a sign of perseverance.',
    getCount: (g: GardenState) => g.level >= 4 ? 1 : 0,
  },
  {
    id: 'fig',
    emoji: '🍃',
    name: 'Fig Tree',
    arabic: 'تِين',
    romanization: 'Tīn',
    mode: 'Level 5+',
    modeEmoji: '⭐⭐⭐',
    modeColor: 'bg-purple-100 text-purple-700',
    description:
      'The sacred fig tree, honoured by Allah who swore by it in the opening of Surah At-Tin. Its wide, spreading canopy provides generous shade and its purple figs are filled with sweetness.',
    quranRef: {
      arabic: 'وَالتِّينِ وَالزَّيْتُونِ',
      translation: '"By the fig and the olive..."',
      ref: 'At-Tin 95:1',
    },
    howToEarn: 'Unlocks at Level 5 (700+ total verses). A blessed tree that marks your garden reaching lush maturity.',
    getCount: (g: GardenState) => g.level >= 5 ? 1 : 0,
  },
  {
    id: 'olive',
    emoji: '🫒',
    name: 'Olive Tree',
    arabic: 'زَيْتُون',
    romanization: 'Zaytūn',
    mode: 'Level 6+',
    modeEmoji: '⭐⭐⭐⭐',
    modeColor: 'bg-teal-100 text-teal-700',
    description:
      'The blessed olive tree — whose oil illuminates the famous Light Verse (Ayat an-Nur). Its silver-green foliage catches the light and its dark olives represent the wisdom accumulated through deep Quranic study.',
    quranRef: {
      arabic: 'شَجَرَةٍ مُّبَارَكَةٍ زَيْتُونَةٍ لَّا شَرْقِيَّةٍ وَلَا غَرْبِيَّةٍ',
      translation: '"...a blessed olive tree — neither of the east nor the west..."',
      ref: 'An-Nur 24:35',
    },
    howToEarn: 'Unlocks at Level 6 (900+ total verses). The crowning blessed tree of a mature Quran garden.',
    getCount: (g: GardenState) => g.level >= 6 ? 1 : 0,
  },
]

const LEVEL_NAMES = [
  { level: 0, name: "Zari'", arabic: 'زارع', desc: 'The Sower — seeds in the earth', emoji: '🌱' },
  { level: 1, name: 'Nabat', arabic: 'نبات', desc: 'First sprouts emerging', emoji: '🌿' },
  { level: 2, name: 'Warad', arabic: 'ورد', desc: 'Roses have bloomed', emoji: '🌹' },
  { level: 3, name: 'Zahir', arabic: 'زاهر', desc: 'Blossoming garden', emoji: '🌸' },
  { level: 4, name: 'Janna', arabic: 'جنة', desc: 'A heavenly garden', emoji: '🌳' },
  { level: 5, name: 'Bustaan', arabic: 'بستان', desc: 'An abundant orchard', emoji: '🍊' },
  { level: 6, name: 'Riyad', arabic: 'رياض', desc: 'Vast meadows of paradise', emoji: '🏞️' },
  { level: 7, name: "Adn", arabic: 'عدن', desc: 'The Garden of Eden', emoji: '✨' },
]

// ─── COMPONENT ────────────────────────────────────────────────────────────────
interface GardenLegendProps {
  gardenState?: GardenState | null
}

type LegendTab = 'summary' | 'guide'

export default function GardenLegend({ gardenState }: GardenLegendProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<LegendTab>('summary')
  const [expandedPlant, setExpandedPlant] = useState<string | null>(null)

  const garden = gardenState ?? {
    total_verses: 0, petals: 0, flowers: 0, branches: 0,
    streak_flowers: 0, level: 0, level_name: "Zari'",
  }

  const currentLevel = LEVEL_NAMES.find((l) => l.level === garden.level) ?? LEVEL_NAMES[0]
  const nextLevel = LEVEL_NAMES.find((l) => l.level === garden.level + 1)

  const versesToNext = garden.level < 7
    ? [0, 100, 200, 300, 500, 700, 900, 1000][garden.level + 1] - garden.total_verses
    : 0

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-20 right-4 z-20 w-11 h-11 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60 flex items-center justify-center hover:bg-white hover:scale-110 transition-all"
        title="Garden Guide & Summary"
      >
        <Info className="w-5 h-5 text-garden-600" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 bottom-0 z-40 w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-garden-700 to-garden-900 px-5 py-4 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg font-bold text-white">Garden Guide</h2>
                    <p className="text-garden-300 text-xs mt-0.5">Your heavenly botanical journey</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 text-garden-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tab switcher */}
                <div className="flex mt-3 bg-white/10 rounded-xl p-0.5 gap-1">
                  {([['summary', 'My Garden'], ['guide', 'Plant Guide']] as [LegendTab, string][]).map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        tab === t ? 'bg-white text-garden-800' : 'text-garden-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">

                {/* ── MY GARDEN TAB ── */}
                {tab === 'summary' && (
                  <div className="p-4 space-y-4">

                    {/* Current level card */}
                    <div className="bg-gradient-to-br from-garden-50 to-garden-100 rounded-2xl p-4 border border-garden-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl">{currentLevel.emoji}</span>
                        <div>
                          <div className="font-display text-xl font-bold text-garden-800">
                            {currentLevel.name}
                          </div>
                          <div className="font-arabic text-lg text-garden-600">{currentLevel.arabic}</div>
                          <div className="text-xs text-garden-600 italic">{currentLevel.desc}</div>
                        </div>
                      </div>

                      {/* Progress to next level */}
                      {nextLevel && (
                        <div>
                          <div className="flex justify-between text-xs text-garden-600 mb-1.5">
                            <span>Progress to {nextLevel.name}</span>
                            <span>{Math.max(0, versesToNext)} verses away</span>
                          </div>
                          <div className="h-2 bg-garden-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(100, (garden.total_verses / ([100,200,300,500,700,900,1000,1000][garden.level] || 1)) * 100)}%`
                              }}
                              transition={{ duration: 1 }}
                              className="h-full bg-gradient-to-r from-garden-400 to-garden-600 rounded-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs text-garden-500 mt-1">
                            <span>{garden.total_verses} verses total</span>
                            <span>→ {nextLevel.emoji} {nextLevel.name}</span>
                          </div>
                        </div>
                      )}
                      {!nextLevel && (
                        <div className="text-xs text-garden-600 font-medium text-center">
                          ✨ You have reached the highest level — Jannatu ʿAdn!
                        </div>
                      )}
                    </div>

                    {/* Plant inventory */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Plants in Your Garden
                      </h3>
                      <div className="space-y-2">
                        {PLANTS.map((plant) => {
                          const count = plant.getCount(garden)
                          const isUnlocked = count > 0
                          return (
                            <div
                              key={plant.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                isUnlocked
                                  ? 'bg-white border-gray-100 shadow-sm'
                                  : 'bg-gray-50 border-gray-100 opacity-50'
                              }`}
                            >
                              <span className={`text-2xl ${!isUnlocked ? 'grayscale' : ''}`}>
                                {plant.emoji}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-gray-800">{plant.name}</span>
                                  <span className="font-arabic text-xs text-gray-500">{plant.arabic}</span>
                                </div>
                                <div className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${plant.modeColor}`}>
                                  {plant.modeEmoji} {plant.mode}
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {isUnlocked ? (
                                  <span className="text-sm font-bold text-garden-700">
                                    {typeof count === 'number' && count > 1 ? `×${count}` : '✓'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">🔒</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Level progression */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        All Garden Levels
                      </h3>
                      <div className="space-y-1.5">
                        {LEVEL_NAMES.map((lvl) => (
                          <div
                            key={lvl.level}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                              lvl.level === garden.level
                                ? 'bg-garden-100 border border-garden-300'
                                : lvl.level < garden.level
                                ? 'bg-garden-50 text-gray-500'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            <span className="text-xl">{lvl.emoji}</span>
                            <div className="flex-1">
                              <span className="font-medium">{lvl.name}</span>
                              <span className="font-arabic text-xs ml-2 opacity-70">{lvl.arabic}</span>
                            </div>
                            {lvl.level === garden.level && (
                              <span className="text-xs text-garden-600 font-bold">← You</span>
                            )}
                            {lvl.level < garden.level && (
                              <span className="text-xs text-garden-500">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PLANT GUIDE TAB ── */}
                {tab === 'guide' && (
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Each plant in your garden carries meaning — rooted in Islamic tradition and the words of the Quran.
                      Tap any plant to learn its story and how to grow it.
                    </p>

                    {PLANTS.map((plant) => {
                      const isExpanded = expandedPlant === plant.id
                      const count = plant.getCount(garden)
                      const isUnlocked = count > 0

                      return (
                        <div key={plant.id} className={`rounded-2xl border overflow-hidden transition-all ${
                          isUnlocked ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-70'
                        }`}>
                          <button
                            onClick={() => setExpandedPlant(isExpanded ? null : plant.id)}
                            className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <span className={`text-2xl ${!isUnlocked ? 'grayscale' : ''}`}>{plant.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-sm text-gray-800">{plant.name}</span>
                                <span className="font-arabic text-sm text-gray-500">{plant.arabic}</span>
                                <span className="text-xs text-gray-400 italic">({plant.romanization})</span>
                              </div>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${plant.modeColor} mt-0.5 inline-block`}>
                                {plant.modeEmoji} {plant.mode}
                              </span>
                            </div>
                            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 bg-gray-50 space-y-3">
                                  {/* Description */}
                                  <p className="text-xs text-gray-600 leading-relaxed pt-2">{plant.description}</p>

                                  {/* Quran reference */}
                                  {plant.quranRef && (
                                    <div className="bg-gradient-to-r from-garden-50 to-teal-50 border border-garden-200 rounded-xl p-3">
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <BookOpen className="w-3.5 h-3.5 text-garden-600" />
                                        <span className="text-xs font-semibold text-garden-700">Quranic Reference</span>
                                      </div>
                                      <p className="font-arabic text-base text-gray-800 mb-1.5 leading-loose">
                                        {plant.quranRef.arabic}
                                      </p>
                                      <p className="text-xs text-gray-600 italic mb-1">{plant.quranRef.translation}</p>
                                      <p className="text-xs font-semibold text-garden-600">{plant.quranRef.ref}</p>
                                    </div>
                                  )}

                                  {/* How to earn */}
                                  <div className="bg-earth-50 border border-earth-200 rounded-xl p-3">
                                    <div className="text-xs font-semibold text-earth-700 mb-1">How to grow it</div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{plant.howToEarn}</p>
                                  </div>

                                  {/* Current count */}
                                  {isUnlocked ? (
                                    <div className="text-xs text-garden-600 font-medium">
                                      ✓ You have {count === 1 ? 'this' : `${count} of these`} in your garden!
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-400">🔒 Not yet in your garden</div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
