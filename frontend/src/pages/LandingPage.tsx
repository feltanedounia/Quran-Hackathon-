import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Mic, Brain, TrendingUp, Star, TreePine } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Reading with Tafsir',
    desc: 'Explore authentic Islamic commentary while reading. Every verse opens a world of meaning.',
    color: 'bg-garden-50 text-garden-600',
  },
  {
    icon: Mic,
    title: 'Recitation & Khatma',
    desc: 'Track your recitation progress and complete full Khatmas with milestone celebrations.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Brain,
    title: 'Hifdh Memorization',
    desc: 'Spaced repetition keeps your memorization strong. Never forget what you\'ve learned.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: TrendingUp,
    title: 'Behavioral Intelligence',
    desc: 'ML models predict disengagement and intervene with personalized spiritual nudges.',
    color: 'bg-earth-50 text-earth-600',
  },
  {
    icon: Star,
    title: 'Reflections & AI Insights',
    desc: 'Write personal reflections on ayat. Claude AI compares your understanding with tafsir.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: TreePine,
    title: 'Living 3D Garden',
    desc: 'Your garden grows with every session. Each verse read blooms as a flower in your paradise.',
    color: 'bg-teal-50 text-teal-600',
  },
]

const levels = [
  { name: "Zari'", arabic: 'زارع', desc: 'The Sower — plant your seeds', icon: '🌱' },
  { name: 'Nabat', arabic: 'نبات', desc: 'Sprouts emerging from the soil', icon: '🌿' },
  { name: 'Warad', arabic: 'ورد', desc: 'Roses blooming in the breeze', icon: '🌹' },
  { name: 'Zahir', arabic: 'زاهر', desc: 'A blossoming, vibrant garden', icon: '🌸' },
  { name: 'Janna', arabic: 'جنة', desc: 'Your own heavenly garden', icon: '🌳' },
  { name: 'Bustaan', arabic: 'بستان', desc: 'An orchard abundant with fruit', icon: '🍊' },
  { name: 'Riyad', arabic: 'رياض', desc: 'Vast meadows of paradise', icon: '🏞️' },
  { name: "Adn", arabic: 'عدن', desc: 'The Garden of Eden itself', icon: '✨' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-garden-950 via-garden-900 to-garden-800 text-white overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-garden-400 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🌿</span>
          </div>
          <span className="font-display text-xl font-semibold text-garden-100">Rawdah</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-garden-300 hover:text-white text-sm font-medium transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="bg-garden-400 hover:bg-garden-300 text-garden-950 font-semibold px-5 py-2 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Begin Journey
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-garden-800/60 border border-garden-600/40 rounded-full px-4 py-1.5 text-garden-300 text-sm mb-8">
            <span className="w-2 h-2 bg-garden-400 rounded-full animate-pulse" />
            Grow your connection with the Quran
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Your Heavenly{' '}
            <span className="text-garden-300">Garden</span>{' '}
            Awaits
          </h1>

          <p className="text-garden-300 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
            Rawdah transforms daily Quran engagement into a living, breathing 3D garden.
            Every verse you read, every surah you recite, every page you memorize — blooms as
            a flower in your personal paradise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="bg-garden-400 hover:bg-garden-300 text-garden-950 font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-xl hover:shadow-2xl active:scale-95 inline-flex items-center gap-2"
            >
              <span>🌱</span> Plant Your First Seed
            </Link>
            <a
              href="#features"
              className="border border-garden-600 text-garden-200 hover:bg-garden-800/50 px-8 py-4 rounded-2xl text-base transition-all inline-flex items-center gap-2"
            >
              <span>✨</span> Learn More
            </a>
          </div>
        </motion.div>

        {/* Garden Preview - ASCII art style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="bg-gradient-to-b from-sky-400/20 to-garden-900/80 rounded-3xl border border-garden-700/50 p-8 backdrop-blur-sm">
            <div className="text-center text-6xl mb-4 space-x-3 animate-float">
              <span>🌳</span><span>🌸</span><span>🌿</span><span>🌹</span><span>🌳</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-garden-500/40 to-transparent mb-4" />
            <div className="text-center text-4xl space-x-4">
              <span className="animate-sway inline-block">🌱</span>
              <span className="animate-float inline-block delay-100">🌼</span>
              <span className="animate-sway inline-block delay-200">🌾</span>
              <span className="animate-float inline-block delay-300">🌺</span>
              <span className="animate-sway inline-block">🌱</span>
            </div>
            <div className="mt-4 text-garden-400 text-sm font-medium">
              Janna — Level 4 Garden · 312 verses · 14-day streak 🔥
            </div>
          </div>
        </motion.div>
      </section>

      {/* Garden Levels */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center text-white mb-3">
          8 Levels of Spiritual Growth
        </h2>
        <p className="text-garden-400 text-center mb-10">
          From a single seed to the Gardens of Eden — your garden reflects your journey.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {levels.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="bg-garden-800/40 border border-garden-700/40 rounded-2xl p-4 text-center hover:bg-garden-800/60 transition-colors"
            >
              <div className="text-3xl mb-2">{level.icon}</div>
              <div className="font-display font-semibold text-white text-sm">{level.name}</div>
              <div className="font-arabic text-garden-400 text-base mt-0.5">{level.arabic}</div>
              <div className="text-garden-500 text-xs mt-1.5 leading-relaxed">{level.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center text-white mb-3">
          Everything You Need to Grow
        </h2>
        <p className="text-garden-400 text-center mb-12">
          Built with behavioral intelligence and Islamic scholarship at its core.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-garden-800/30 border border-garden-700/30 rounded-2xl p-6 hover:bg-garden-800/50 transition-all hover:border-garden-600/50"
            >
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-garden-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="max-w-xl mx-auto bg-garden-800/40 border border-garden-600/30 rounded-3xl p-10 backdrop-blur-sm">
          <div className="text-4xl mb-4">🌿</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Begin Your Heavenly Journey
          </h2>
          <p className="text-garden-400 mb-8 leading-relaxed">
            Join thousands of believers growing their connection with the Quran, one verse at a time.
          </p>
          <Link
            to="/auth"
            className="bg-garden-400 hover:bg-garden-300 text-garden-950 font-bold px-10 py-4 rounded-2xl text-base transition-all shadow-xl hover:shadow-2xl active:scale-95 inline-block"
          >
            Plant Your Seed Today
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-garden-600 text-sm border-t border-garden-800">
        <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        <p className="mt-1">Rawdah · Built with love for the Ummah</p>
      </footer>
    </div>
  )
}
