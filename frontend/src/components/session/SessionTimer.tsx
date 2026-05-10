import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, CheckCircle } from 'lucide-react'

interface SessionTimerProps {
  onComplete: (minutes: number) => void
  onCancel?: () => void
}

export default function SessionTimer({ onComplete, onCancel }: SessionTimerProps) {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const radius = 88
  const circ = 2 * Math.PI * radius
  const cycleProgress = (seconds % 300) / 300
  const offset = circ - cycleProgress * circ

  const handleComplete = useCallback(() => {
    setRunning(false)
    onComplete(Math.max(seconds / 60, 0.1))
  }, [seconds, onComplete])

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Circular progress */}
      <div className="relative">
        <svg width="210" height="210" className="transform -rotate-90">
          <circle cx="105" cy="105" r={radius} fill="none" stroke="#dcfce7" strokeWidth="10" />
          <circle
            cx="105" cy="105" r={radius}
            fill="none"
            stroke="#16a34a"
            strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold font-mono text-garden-800 tracking-tight">{display}</span>
          <span className="text-sm text-gray-500 mt-1.5">
            {mins === 0 ? 'Just getting started...' : `${mins} minute${mins !== 1 ? 's' : ''}`}
          </span>
          {mins >= 5 && (
            <span className="text-xs text-earth-600 font-medium mt-1 bg-earth-50 px-2 py-0.5 rounded-full">
              🌸 Milestone approaching!
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => { setRunning(false); setSeconds(0); onCancel?.() }}
          className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"
          title="Cancel session"
        >
          <Square className="w-5 h-5" />
        </button>

        <button
          onClick={() => setRunning((r) => !r)}
          className="w-16 h-16 rounded-2xl bg-garden-600 text-white hover:bg-garden-700 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
        >
          {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>

        <button
          onClick={handleComplete}
          disabled={seconds < 30}
          className="p-3 rounded-xl bg-earth-50 text-earth-600 hover:bg-earth-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-earth-100"
          title="Complete and save"
        >
          <CheckCircle className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center max-w-xs">
        {seconds < 30
          ? 'Timer will auto-save your session. Press play to begin.'
          : 'Press ✓ when done to save your session to your garden.'}
      </p>
    </div>
  )
}
