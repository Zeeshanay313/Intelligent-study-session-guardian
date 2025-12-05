/**
 * Focus Component - Pomodoro Timer with Presets
 * 
 * Features:
 * - Countdown timer with start/pause/stop controls
 * - Session type selection (Focus/Short Break/Long Break)
 * - Preset timer configurations
 * - Session end modal with suggestions
 * - Keyboard shortcuts (Space: start/pause, Esc: stop)
 * - Session settings panel
 * - Progress tracking
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  Settings,
  Coffee,
  Brain,
  Clock,
  Layers
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import PresetManager from '../../components/Timer/PresetManager'
import SessionEndModal from '../../components/Timer/SessionEndModal'
import { useNotification } from '../../contexts/NotificationContext'

const Focus = () => {
  const { success, info } = useNotification()
  
  // Session types with default durations
  const sessionTypes = {
    focus: { name: 'Focus Session', duration: 25 * 60, icon: Brain, color: 'primary' },
    'short-break': { name: 'Short Break', duration: 5 * 60, icon: Coffee, color: 'green' },
    'long-break': { name: 'Long Break', duration: 15 * 60, icon: Coffee, color: 'blue' },
  }

  // Timer state
  const [sessionType, setSessionType] = useState('focus')
  const [duration, setDuration] = useState(sessionTypes.focus.duration)
  const [timeLeft, setTimeLeft] = useState(sessionTypes.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [showSessionEnd, setShowSessionEnd] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [presets, setPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  
  // Settings state
  const [customDurations, setCustomDurations] = useState({
    focus: 25,
    'short-break': 5,
    'long-break': 15,
  })

  // Load presets
  useEffect(() => {
    loadPresets()
  }, [])

  const loadPresets = async () => {
    try {
      const response = await api.presets.list()
      if (response.success) {
        setPresets(response.data)
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  // Timer countdown logic
  useEffect(() => {
    let interval = null
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleSessionComplete()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !showSettings) {
        e.preventDefault()
        handlePlayPause()
      }
      if (e.code === 'Escape' && isRunning) {
        e.preventDefault()
        handleStop()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning, showSettings])

  const handlePlayPause = async () => {
    if (!isRunning) {
      // Start session
      if (!sessionId) {
        try {
          const response = await api.sessions.start({
            type: sessionType,
            duration: duration,
          })
          if (response.success) {
            setSessionId(response.data.id)
          }
        } catch (error) {
          console.error('Failed to start session:', error)
        }
      }
      setIsRunning(true)
    } else {
      // Pause session
      setIsRunning(false)
    }
  }

  const handleStop = async () => {
    if (sessionId) {
      try {
        await api.sessions.end(sessionId, {
          actualDuration: duration - timeLeft,
          completed: false,
        })
        info('Session stopped')
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }
    
    setIsRunning(false)
    setTimeLeft(duration)
    setSessionId(null)
  }

  const handleSessionComplete = async () => {
    let completedSessionData = {
      durationSeconds: duration,
      presetName: selectedPreset?.name || sessionTypes[sessionType].name,
      todayCount: 1,
      streak: 0,
    }

    if (sessionId) {
      try {
        const response = await api.sessions.end(sessionId, {
          actualDuration: duration,
          completed: true,
        })
        if (response.success && response.data) {
          completedSessionData = { ...completedSessionData, ...response.data }
        }
      } catch (error) {
        console.error('Failed to complete session:', error)
      }
    }
    
    setIsRunning(false)
    setSessionId(null)
    setSessionData(completedSessionData)
    setShowSessionEnd(true)
    success('Session completed! 🎉')
    
    // Play notification sound (if browser supports it)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete!', {
        body: `Your ${sessionTypes[sessionType].name} is complete.`,
        icon: '/vite.svg',
      })
    }
  }

  const handleAcceptBreakSuggestion = (breakMinutes) => {
    setSessionType('short-break')
    const newDuration = breakMinutes * 60
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setShowSessionEnd(false)
    info(`Starting ${breakMinutes}-minute break`)
  }

  const handleApplyPreset = (preset) => {
    if (isRunning) {
      if (!confirm('This will end your current session. Continue?')) {
        return
      }
      handleStop()
    }

    setSelectedPreset(preset)
    setSessionType('focus')
    const newDuration = preset.workDuration
    setDuration(newDuration)
    setTimeLeft(newDuration)
    setShowPresets(false)
    success(`Applied preset: ${preset.name}`)
  }

  const handleSessionTypeChange = (type) => {
    if (isRunning) {
      if (!confirm('This will end your current session. Continue?')) {
        return
      }
      handleStop()
    }
    
    setSessionType(type)
    const newDuration = customDurations[type] * 60
    setDuration(newDuration)
    setTimeLeft(newDuration)
  }

  const handleSkip = () => {
    handleStop()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    return ((duration - timeLeft) / duration) * 100
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const currentSession = sessionTypes[sessionType]
  const Icon = currentSession.icon

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Focus Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay focused and productive with Pomodoro technique
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPresets(true)}
            className="p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
            aria-label="Timer Presets"
            title="Manage Presets"
          >
            <Layers className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Timer Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={customDurations.focus}
                onChange={(e) => setCustomDurations({ ...customDurations, focus: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={customDurations['short-break']}
                onChange={(e) => setCustomDurations({ ...customDurations, 'short-break': parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={customDurations['long-break']}
                onChange={(e) => setCustomDurations({ ...customDurations, 'long-break': parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const newDuration = customDurations[sessionType] * 60
              setDuration(newDuration)
              if (!isRunning) {
                setTimeLeft(newDuration)
              }
              setShowSettings(false)
            }}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Apply Settings
          </button>
        </div>
      )}

      {/* Session Type Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {Object.entries(sessionTypes).map(([key, type]) => {
          const TypeIcon = type.icon
          return (
            <button
              key={key}
              onClick={() => handleSessionTypeChange(key)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
                ${sessionType === key
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }
              `}
            >
              <TypeIcon className="w-5 h-5" />
              <span>{type.name}</span>
            </button>
          )
        })}
      </div>

      {/* Main Timer Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-700">
        {/* Session Icon and Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
            <Icon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {currentSession.name}
          </h2>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`
            text-8xl font-bold tabular-nums
            ${isRunning ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}
            transition-colors duration-300
          `}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="px-8"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start
              </>
            )}
          </Button>

          {(isRunning || timeLeft !== duration) && (
            <Button
              onClick={handleStop}
              variant="danger"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> to start/pause, <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> to stop</p>
        </div>
      </div>

      {/* Preset Selector */}
      {presets.length > 0 && !showPresets && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Presets
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.slice(0, 6).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                disabled={isRunning}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPreset?.id === preset.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-2xl">{preset.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {preset.name}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(preset.workDuration / 60)}m work
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="mt-8 text-center">
        <p className="text-lg italic text-gray-600 dark:text-gray-400">
          "Focus is the gateway to thinking, feeling, and learning."
        </p>
      </div>

      {/* Preset Manager Modal */}
      <PresetManager
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        onPresetsChange={loadPresets}
      />

      {/* Session End Modal */}
      <SessionEndModal
        isOpen={showSessionEnd}
        onClose={() => setShowSessionEnd(false)}
        sessionData={sessionData}
        onAcceptSuggestion={handleAcceptBreakSuggestion}
      />
    </div>
  )
}

export default Focus
