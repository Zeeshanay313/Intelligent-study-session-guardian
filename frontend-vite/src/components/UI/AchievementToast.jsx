/**
 * Achievement Toast Notification Component
 * Displays celebratory notifications for achievements, badges, and personal records
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Trophy, Star, Flame, Award, X, Sparkles, Medal, Zap } from 'lucide-react'

// Create context for toast notifications
const ToastContext = createContext(null)

// Toast types with their styling
const toastTypes = {
  achievement: {
    bg: 'from-yellow-400 to-orange-500',
    icon: Trophy,
    title: 'Achievement Unlocked!'
  },
  badge: {
    bg: 'from-purple-500 to-pink-500',
    icon: Award,
    title: 'New Badge Earned!'
  },
  streak: {
    bg: 'from-orange-500 to-red-500',
    icon: Flame,
    title: 'Streak Milestone!'
  },
  personal_record: {
    bg: 'from-blue-500 to-indigo-600',
    icon: Star,
    title: 'New Personal Record!'
  },
  level_up: {
    bg: 'from-green-400 to-emerald-600',
    icon: Zap,
    title: 'Level Up!'
  },
  points: {
    bg: 'from-indigo-500 to-purple-600',
    icon: Sparkles,
    title: 'Points Earned!'
  }
}

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false)
  const config = toastTypes[toast.type] || toastTypes.achievement
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-2xl transform transition-all duration-300
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      {/* Background gradient */}
      <div className={`bg-gradient-to-r ${config.bg} p-4`}>
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1 right-8 w-2 h-2 bg-white/40 rounded-full animate-ping" />
          <div className="absolute top-3 right-16 w-1.5 h-1.5 bg-white/30 rounded-full animate-ping delay-100" />
          <div className="absolute bottom-2 right-12 w-1 h-1 bg-white/50 rounded-full animate-ping delay-200" />
        </div>

        <div className="flex items-start space-x-4 relative z-10">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/90 uppercase tracking-wide">
              {config.title}
            </p>
            <p className="text-lg font-bold text-white mt-0.5">
              {toast.title}
            </p>
            {toast.message && (
              <p className="text-sm text-white/80 mt-1">
                {toast.message}
              </p>
            )}
            {toast.points && (
              <p className="text-sm font-semibold text-white mt-2 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                +{toast.points} points
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}

// Toast Provider Component
export const AchievementToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showAchievement = useCallback((title, message, points) => {
    return addToast({ type: 'achievement', title, message, points, duration: 6000 })
  }, [addToast])

  const showBadge = useCallback((title, message, points) => {
    return addToast({ type: 'badge', title, message, points, duration: 6000 })
  }, [addToast])

  const showStreak = useCallback((days, message) => {
    return addToast({ type: 'streak', title: `${days}-Day Streak!`, message, duration: 5000 })
  }, [addToast])

  const showPersonalRecord = useCallback((title, message) => {
    return addToast({ type: 'personal_record', title, message, duration: 5000 })
  }, [addToast])

  const showLevelUp = useCallback((level) => {
    return addToast({ type: 'level_up', title: `Level ${level}`, message: 'Congratulations on leveling up!', duration: 6000 })
  }, [addToast])

  const showPoints = useCallback((points, reason) => {
    return addToast({ type: 'points', title: `+${points} Points`, message: reason, points: null, duration: 4000 })
  }, [addToast])

  const value = {
    addToast,
    removeToast,
    showAchievement,
    showBadge,
    showStreak,
    showPersonalRecord,
    showLevelUp,
    showPoints
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Hook to use toast notifications
export const useAchievementToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAchievementToast must be used within an AchievementToastProvider')
  }
  return context
}

export default AchievementToastProvider
