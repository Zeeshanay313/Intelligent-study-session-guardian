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

import React, { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Square,
  Settings,
  Coffee,
  Brain,
  Layers,
  Plus,
  Target,
  BookOpen,
  Activity
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import PresetManager from '../../components/Timer/PresetManager'
import SessionEndModal from '../../components/Timer/SessionEndModal'
import GoalSelectionModal from '../../components/Timer/GoalSelectionModal'
import ResourceSelectionModal from '../../components/Timer/ResourceSelectionModal'
import SessionResourcesPanel from '../../components/Timer/SessionResourcesPanel'
import ActivityTimeline from '../../components/Activity/ActivityTimeline'
import { useNotification } from '../../contexts/NotificationContext'
import { useTimer } from '../../contexts/TimerContext'

const Focus = () => {
  const { success, info } = useNotification()
  const {
    sessionType,
    duration,
    timeLeft,
    isRunning,
    sessionId,
    goalMeta,
    activitySummary,
    activityTimeline,
    isIdle,
    activityNotice,
    autoPaused,
    sessionData,
    showSessionEnd,
    setSessionType,
    setDuration,
    setTimeLeft,
    setGoalMeta,
    setPresetName,
    setSessionSubject,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    closeSessionEnd,
    applyBreakSuggestion,
    confirmStillActive
  } = useTimer()
  
  // Session types with default durations
  const sessionTypes = {
    focus: { name: 'Focus Session', duration: 25 * 60, icon: Brain, color: 'primary' },
    'short-break': { name: 'Short Break', duration: 5 * 60, icon: Coffee, color: 'green' },
    'long-break': { name: 'Long Break', duration: 15 * 60, icon: Coffee, color: 'blue' },
  }

  const [showSettings, setShowSettings] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [presets, setPresets] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  
  // Goal tracking state
  const [showGoalSelection, setShowGoalSelection] = useState(false)
  
  // Resource selection state
  const [showResourceSelection, setShowResourceSelection] = useState(false)
  const [selectedResources, setSelectedResources] = useState([])
  const [showResourcesPanel, setShowResourcesPanel] = useState(false)
  
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

  // Also reload when showPresets changes (modal closes)
  useEffect(() => {
    if (!showPresets) {
      // Modal just closed, reload presets
      console.log('Modal closed, reloading presets...')
      loadPresets()
    }
  }, [showPresets])

  const loadPresets = async () => {
    try {
      const response = await api.presets.list()
      console.log('API preset response:', response)
      if (response.success && response.data) {
        console.log('Loaded presets from API:', response.data.length)
        setPresets(response.data)
      } else {
        // Fallback to localStorage
        const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
        console.log('Loaded presets from localStorage (API returned no data):', localPresets.length)
        setPresets(localPresets)
      }
    } catch (error) {
      console.error('Failed to load presets from API:', error)
      // Fallback to localStorage
      try {
        const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
        console.log('Loaded presets from localStorage (API failed):', localPresets.length)
        setPresets(localPresets)
        if (localPresets.length > 0) {
          console.log('Loaded preset details:', localPresets)
        }
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError)
      }
    }
  }

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

  useEffect(() => {
    if (showSessionEnd) {
      setSelectedResources([])
      setShowResourcesPanel(false)
    }
  }, [showSessionEnd])

  const handlePlayPause = async () => {
    if (!isRunning) {
      if (autoPaused) {
        confirmStillActive()
        return
      }
      // If starting fresh (no session), show goal selection
      if (!sessionId && sessionType === 'focus') {
        setShowGoalSelection(true)
        return
      }
      // Resume or start without goal
      if (sessionId) {
        resumeSession()
      } else {
        await startSession({
          sessionType,
          duration,
          goalId: goalMeta?.id || null,
          goalTitle: goalMeta?.title || null,
          presetName: selectedPreset?.name || null
        })
      }
    } else {
      // Pause session
      pauseSession()
    }
  }

  // Handle goal selection from modal
  const handleGoalSelected = (goal) => {
    const goalId = goal?._id || goal?.id || null
    setGoalMeta({ id: goalId, title: goal?.title || null })
    setShowGoalSelection(false)
    // Show resource selection next
    setShowResourceSelection(true)
  }

  // Handle skipping goal selection
  const handleSkipGoalSelection = () => {
    setGoalMeta({ id: null, title: null })
    setShowGoalSelection(false)
    // Show resource selection next
    setShowResourceSelection(true)
  }

  // Handle resource selection from modal
  const handleResourcesSelected = (resources) => {
    setSelectedResources(resources)
    setShowResourceSelection(false)
    if (resources.length > 0) {
      setShowResourcesPanel(true)
    }
    // Auto-start after selection
    setTimeout(() => {
      startSession({
        sessionType,
        duration,
        goalId: goalMeta?.id || null,
        goalTitle: goalMeta?.title || null,
        presetName: selectedPreset?.name || null
      })
    }, 100)
  }

  // Handle skipping resource selection
  const handleSkipResourceSelection = () => {
    setSelectedResources([])
    setShowResourceSelection(false)
    // Auto-start after skip
    setTimeout(() => {
      startSession({
        sessionType,
        duration,
        goalId: goalMeta?.id || null,
        goalTitle: goalMeta?.title || null,
        presetName: selectedPreset?.name || null
      })
    }, 100)
  }

  // Remove a resource from the session
  const handleRemoveResource = (resourceId) => {
    setSelectedResources(prev => prev.filter(r => (r._id || r.id) !== resourceId))
  }

  // Close resources panel
  const handleCloseResourcesPanel = () => {
    setShowResourcesPanel(false)
  }

  const handleStop = async () => {
    await stopSession()
    setSelectedResources([])
    setShowResourcesPanel(false)
  }

  const handleAcceptBreakSuggestion = (breakMinutes) => {
    applyBreakSuggestion(breakMinutes)
    info(`Starting ${breakMinutes}-minute break`)
  }

  const handleApplyPreset = async (preset) => {
    if (isRunning) {
      if (!confirm('This will end your current session. Continue?')) {
        return
      }
      await handleStop()
    }

    setSelectedPreset(preset)
    setPresetName(preset?.name || null)
    setSessionSubject(preset?.subject || null)
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
    
    setSelectedPreset(null)
    setPresetName(null)
    setSessionSubject(null)
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
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Focus Timer
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-0.5">
            Stay focused with the Pomodoro technique
          </p>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowPresets(true)}
            className="relative p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
            aria-label="Timer Presets"
            title={`Manage Presets (${presets.length})`}
          >
            <Layers className="w-5 h-5" />
            {presets.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {presets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card mb-5 animate-slide-down">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">
            Timer Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'focus', label: 'Focus Duration', max: 60, suffix: 'min' },
              { key: 'short-break', label: 'Short Break', max: 30, suffix: 'min' },
              { key: 'long-break', label: 'Long Break', max: 60, suffix: 'min' },
            ].map(({ key, label, max }) => (
              <div key={key}>
                <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  {label}
                </label>
                <input
                  type="number"
                  min="1"
                  max={max}
                  value={customDurations[key]}
                  onChange={(e) => setCustomDurations({ ...customDurations, [key]: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            ))}
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
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            Apply Settings
          </button>
        </div>
      )}

      {/* Session Type Selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(sessionTypes).map(([key, type]) => {
          const TypeIcon = type.icon
          return (
            <button
              key={key}
              onClick={() => handleSessionTypeChange(key)}
              className={`
                flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${sessionType === key
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-white dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700/40 hover:border-primary-300 dark:hover:border-primary-700'
                }
              `}
            >
              <TypeIcon className="w-4 h-4" />
              <span>{type.name}</span>
            </button>
          )
        })}
      </div>

      {/* Custom Presets Selector */}
      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/30 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Presets {presets.length > 0 && `(${presets.length})`}
          </h3>
          <button
            onClick={() => setShowPresets(true)}
            className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
          >
            Manage
          </button>
        </div>
        
        {presets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {presets.map((preset) => {
              const presetId = preset._id || preset.id;
              const isSelected = (selectedPreset?._id || selectedPreset?.id) === presetId;
              return (
                <button
                  key={presetId}
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isRunning}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md ring-1 ring-primary-500/20'
                      : 'border-gray-200 dark:border-gray-700/40 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800/60'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-[13px] font-semibold text-gray-900 dark:text-white truncate flex-1">
                      {preset.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                    {Math.round(preset.workDuration / 60)}m work &middot; {Math.round(preset.breakDuration / 60)}m break
                  </div>
                  {isSelected && (
                    <div className="mt-1 text-[11px] text-primary-600 dark:text-primary-400 font-semibold">
                      &#10003; Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No custom presets yet
            </p>
            <button
              onClick={() => setShowPresets(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Preset
            </button>
          </div>
        )}
      </div>

      {/* Main Timer Card */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/40 p-8 sm:p-12">
        {activityNotice && (
          <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
            {activityNotice}
          </div>
        )}
        {/* Selected Goal Display */}
        {goalMeta?.title && (
          <div className="mb-6 p-3.5 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                <span className="text-sm font-semibold text-accent-800 dark:text-accent-200">
                  {goalMeta.title}
                </span>
              </div>
              {!isRunning && (
                <button
                  onClick={() => setGoalMeta({ id: null, title: null })}
                  className="text-xs font-medium text-accent-600 dark:text-accent-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-accent-600 dark:text-accent-400 mt-1">
              Session time will be tracked toward this goal
            </p>
          </div>
        )}

        {/* Selected Resources Display */}
        {selectedResources.length > 0 && (
          <div className="mb-6 p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  {selectedResources.length} Resource{selectedResources.length !== 1 ? 's' : ''} Ready
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {!showResourcesPanel && (
                  <button
                    onClick={() => setShowResourcesPanel(true)}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Show
                  </button>
                )}
                {!isRunning && (
                  <button
                    onClick={() => {
                      setSelectedResources([])
                      setShowResourcesPanel(false)
                    }}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Session Icon and Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl mb-3">
            <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-\[17px\] font-semibold text-gray-900 dark:text-white">
            {currentSession.name}
          </h2>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className={`
            text-7xl sm:text-8xl font-extrabold tabular-nums tracking-tight
            ${isRunning ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}
            transition-colors duration-300
          `}>
            {formatTime(timeLeft)}
          </div>
        </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/30 p-5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">Activity</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isRunning
                    ? (isIdle ? 'Idle detected' : 'Tracking live')
                    : (autoPaused ? 'Paused on idle' : (sessionId ? 'Paused' : 'Waiting'))}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[
                { label: 'Active', value: formatTime(activitySummary.activeSeconds || 0) },
                { label: 'Idle', value: formatTime(activitySummary.idleSeconds || 0) },
                { label: 'Score', value: `${Math.round(activitySummary.productivityScore || 0)}%` },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">{stat.label}</div>
                  <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{stat.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <ActivityTimeline timeline={activityTimeline} />
            </div>
          </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-3">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="px-8 rounded-xl shadow-lg shadow-primary-500/20"
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
              className="rounded-xl"
            >
              <Square className="w-5 h-5 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-6 text-center text-[13px] text-gray-400 dark:text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[11px] font-mono">Space</kbd>
          {' '}start/pause &nbsp;&middot;&nbsp;{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[11px] font-mono">Esc</kbd>
          {' '}stop
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="mt-6 text-center">
        <p className="text-[15px] italic text-gray-400 dark:text-gray-500">
          "Focus is the gateway to thinking, feeling, and learning."
        </p>
      </div>

      {/* Preset Manager Modal */}
      <PresetManager
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        onPresetsChange={loadPresets}
      />

      {/* Goal Selection Modal */}
      <GoalSelectionModal
        isOpen={showGoalSelection}
        onClose={() => {
          setShowGoalSelection(false)
        }}
        onSelectGoal={handleGoalSelected}
        onSkip={handleSkipGoalSelection}
      />

      {/* Resource Selection Modal */}
      <ResourceSelectionModal
        isOpen={showResourceSelection}
        onClose={() => {
          setShowResourceSelection(false)
        }}
        onSelectResources={handleResourcesSelected}
        onSkip={handleSkipResourceSelection}
        selectedResources={selectedResources}
      />

      {/* Session Resources Panel - shown during active session */}
      {showResourcesPanel && selectedResources.length > 0 && (
        <SessionResourcesPanel
          resources={selectedResources}
          onRemoveResource={handleRemoveResource}
          onClose={handleCloseResourcesPanel}
        />
      )}

      {/* Session End Modal */}
      <SessionEndModal
        isOpen={showSessionEnd}
        onClose={closeSessionEnd}
        sessionData={sessionData}
        onAcceptSuggestion={handleAcceptBreakSuggestion}
      />
    </div>
  )
}

export default Focus
