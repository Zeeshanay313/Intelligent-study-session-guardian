/**
 * AppLoadingScreen
 *
 * Branded full-page loading screen shown while the app initialises.
 * Displays all 12 modules with an animated check-in sequence.
 */
import React, { useState, useEffect } from 'react'
import {
  Lock,
  User,
  Clock,
  Activity,
  EyeOff,
  Camera,
  Target,
  Star,
  Folder,
  BarChart3,
  Shield,
  LineChart,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

const MODULES = [
  { id: 1,  label: 'Authentication',      icon: Lock,     delay: 0   },
  { id: 2,  label: 'User Profile',         icon: User,     delay: 200 },
  { id: 3,  label: 'Focus Timer',          icon: Clock,    delay: 400 },
  { id: 4,  label: 'Activity Logger',      icon: Activity, delay: 600 },
  { id: 5,  label: 'Distraction Blocker',  icon: EyeOff,   delay: 700 },
  { id: 6,  label: 'Presence Detection',   icon: Camera,   delay: 800 },
  { id: 7,  label: 'Goal Tracker',         icon: Target,   delay: 900 },
  { id: 8,  label: 'Motivation & Rewards', icon: Star,     delay: 1000 },
  { id: 9,  label: 'Resource Hub',         icon: Folder,   delay: 1100 },
  { id: 10, label: 'Session Reports',      icon: BarChart3,delay: 1200 },
  { id: 11, label: 'Data Security',        icon: Shield,   delay: 1300 },
  { id: 12, label: 'Insights Dashboard',   icon: LineChart, delay: 1400 },
]

const AppLoadingScreen = () => {
  const [checked, setChecked] = useState(new Set())

  useEffect(() => {
    const timers = MODULES.map(({ id, delay }) =>
      setTimeout(() => setChecked(prev => new Set([...prev, id])), delay + 100)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const done = checked.size
  const pct = Math.round((done / MODULES.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-accent-700 p-6">
      {/* Glow blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Study Guardian</h1>
          <p className="text-primary-200 text-sm mt-1">Intelligent Focus System</p>
        </div>

        {/* Module checklist */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {MODULES.map(({ id, label, icon: Icon }) => {
            const isDone = checked.has(id)
            return (
              <div
                key={id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                  isDone
                    ? 'bg-white/10 text-white'
                    : 'bg-white/4 text-white/40'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <Icon className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="text-xs font-medium truncate">{label}</span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-primary-200">
            <span>{done === MODULES.length ? 'Ready!' : `Initialising modules…`}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-accent-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {done < MODULES.length && (
          <div className="flex justify-center mt-6">
            <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

export default AppLoadingScreen
