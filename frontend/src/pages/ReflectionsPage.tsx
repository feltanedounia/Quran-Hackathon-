import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, BookOpen, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { getInterpretations, submitInterpretation, getDailyVerse } from '../api/verses'
import Navbar from '../components/ui/Navbar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import type { Interpretation } from '../types'

function ReflectionCard({ r, index }: { r: Interpretation; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="card p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-garden-600 bg-garden-50 px-2 py-0.5 rounded-full border border-garden-100">
              {r.verse_key}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {r.review_count > 0 && (
              <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                reviewed {r.review_count}×
              </span>
            )}
          </div>

          {/* Arabic verse text */}
          <p className="arabic text-base text-gray-800 mb-2 leading-loose">{r.verse_text}</p>

          {/* User reflection */}
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{r.user_interpretation}</p>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
              {/* Full reflection */}
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5">Your Reflection</div>
                <p className="text-sm text-gray-700 leading-relaxed">{r.user_interpretation}</p>
              </div>

              {/* AI Feedback */}
              {r.ai_response && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-600">AI Tafsir Comparison</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.ai_response}</p>
                </div>
              )}

              {/* Next review */}
              {r.next_review_at && (
                <p className="text-xs text-gray-400">
                  Next spaced review: {new Date(r.next_review_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ReflectionsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ verse_key: '', verse_text: '', user_interpretation: '' })
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [result, setResult] = useState<Interpretation | null>(null)

  const { data: reflections = [], isLoading } = useQuery({
    queryKey: ['interpretations'],
    queryFn: getInterpretations,
  })

  const { data: dailyVerse } = useQuery({
    queryKey: ['daily-verse'],
    queryFn: getDailyVerse,
    staleTime: 24 * 60 * 60_000,
  })

  const { mutate: submit, isPending } = useMutation({
    mutationFn: submitInterpretation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interpretations'] })
      setResult(data)
      setStep('result')
    },
  })

  const handleUseDailyVerse = () => {
    if (dailyVerse) {
      setForm({
        verse_key: dailyVerse.verse_key,
        verse_text: dailyVerse.text_arabic,
        user_interpretation: '',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.verse_key || !form.verse_text || !form.user_interpretation) return
    submit(form)
  }

  const handleClose = () => {
    setShowForm(false)
    setStep('form')
    setForm({ verse_key: '', verse_text: '', user_interpretation: '' })
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-24 px-4 max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900">Reflections</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Write your thoughts on verses. Claude AI compares with authentic tafsir.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> New Reflection
          </button>
        </div>

        {/* New Reflection Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && handleClose()}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="font-display text-xl font-bold text-gray-900">
                        {step === 'form' ? 'New Reflection' : 'AI Tafsir Feedback'}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {step === 'form' ? 'Share your understanding of a verse' : 'Compare your reflection with scholarly tafsir'}
                      </p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {step === 'form' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {dailyVerse && (
                        <button
                          type="button"
                          onClick={handleUseDailyVerse}
                          className="w-full text-left p-3 bg-garden-50 border border-garden-200 rounded-xl hover:bg-garden-100 transition-colors"
                        >
                          <div className="text-xs font-semibold text-garden-600 mb-1">Use Today's Verse</div>
                          <p className="text-xs text-gray-500 truncate">{dailyVerse.surah_name} · {dailyVerse.verse_key}</p>
                        </button>
                      )}

                      <div>
                        <label className="label">Verse Key <span className="text-red-400">*</span></label>
                        <input
                          className="input"
                          placeholder="e.g. 2:255 (Surah:Ayah)"
                          value={form.verse_key}
                          onChange={(e) => setForm((f) => ({ ...f, verse_key: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Arabic Verse Text <span className="text-red-400">*</span></label>
                        <textarea
                          className="input resize-none h-20 arabic text-base"
                          placeholder="أَعُوذُ بِاللَّهِ..."
                          value={form.verse_text}
                          onChange={(e) => setForm((f) => ({ ...f, verse_text: e.target.value }))}
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Your Reflection <span className="text-red-400">*</span></label>
                        <textarea
                          className="input resize-none h-32"
                          placeholder="What does this verse mean to you? What do you understand from it? How does it apply to your life?"
                          value={form.user_interpretation}
                          onChange={(e) => setForm((f) => ({ ...f, user_interpretation: e.target.value }))}
                          required
                          minLength={20}
                        />
                        <p className="text-xs text-gray-400 mt-1">{form.user_interpretation.length} characters</p>
                      </div>

                      <button
                        type="submit"
                        disabled={isPending || form.user_interpretation.length < 20}
                        className="btn-primary w-full py-3"
                      >
                        {isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Getting AI feedback...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> Submit & Get Tafsir Insight</>
                        )}
                      </button>
                    </form>
                  ) : (
                    result && (
                      <div className="space-y-4">
                        <div className="p-4 bg-garden-50 rounded-2xl border border-garden-100">
                          <div className="text-xs font-semibold text-garden-600 mb-1.5">Your Reflection</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{result.user_interpretation}</p>
                        </div>

                        {result.ai_response && (
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <span className="text-xs font-semibold text-purple-600">Claude's Tafsir Comparison</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{result.ai_response}</p>
                          </div>
                        )}

                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-xs text-blue-600 font-medium">
                            📚 This reflection has been saved. Spaced repetition will remind you to review it on{' '}
                            {result.next_review_at
                              ? new Date(result.next_review_at).toLocaleDateString()
                              : 'future dates'}.
                          </p>
                        </div>

                        <button onClick={handleClose} className="btn-primary w-full">
                          <BookOpen className="w-4 h-4" /> View All Reflections
                        </button>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reflections list */}
        {isLoading ? (
          <LoadingSpinner className="py-20" />
        ) : reflections.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No reflections yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Start reflecting on verses that move you. AI will help you deepen your understanding through tafsir.
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Write First Reflection
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{reflections.length} reflection{reflections.length !== 1 ? 's' : ''}</p>
            {reflections.map((r, i) => (
              <ReflectionCard key={r.id} r={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
