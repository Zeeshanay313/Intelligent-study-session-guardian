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
  Layers,
  Plus,
  Target,
  BookOpen
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import PresetManager from '../../components/Timer/PresetManager'
import SessionEndModal from '../../components/Timer/SessionEndModal'
import GoalSelectionModal from '../../components/Timer/GoalSelectionModal'
import ResourceSelectionModal from '../../components/Timer/ResourceSelectionModal'
import SessionResourcesPanel from '../../components/Timer/SessionResourcesPanel'
import { useNotification } from '../../contexts/NotificationContext'
import { useAchievementToast } from '../../components/UI/AchievementToast'

const Focus = () => {
  const { success, info } = useNotification()
  const achievementToast = useAchievementToast()
  
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
  
  // Goal tracking state
  const [showGoalSelection, setShowGoalSelection] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [pendingStart, setPendingStart] = useState(false)
  
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
      // If starting fresh (no session), show goal selection
      if (!sessionId && sessionType === 'focus') {
        setShowGoalSelection(true)
        setPendingStart(true)
        return
      }
      // Resume or start without goal
      await startSession()
    } else {
      // Pause session
      setIsRunning(false)
    }
  }

  // Actually start the timer session
  const startSession = async () => {
    if (!sessionId) {
      try {
        const response = await api.sessions.start({
          type: sessionType,
          duration: duration,
          goalId: selectedGoal?._id || selectedGoal?.id || null,
        })
        if (response.success) {
          setSessionId(response.data.id)
        }
      } catch (error) {
        console.error('Failed to start session:', error)
      }
    }
    setIsRunning(true)
    setPendingStart(false)
  }

  // Handle goal selection from modal
  const handleGoalSelected = (goal) => {
    setSelectedGoal(goal)
    setShowGoalSelection(false)
    // Show resource selection next
    setShowResourceSelection(true)
  }

  // Handle skipping goal selection
  const handleSkipGoalSelection = () => {
    setSelectedGoal(null)
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
    setTimeout(() => startSession(), 100)
  }

  // Handle skipping resource selection
  const handleSkipResourceSelection = () => {
    setSelectedResources([])
    setShowResourceSelection(false)
    // Auto-start after skip
    setTimeout(() => startSession(), 100)
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
    if (sessionId) {
      try {
        const actualDuration = duration - timeLeft
        await api.sessions.end(sessionId, {
          actualDuration: actualDuration,
          completed: false,
          goalId: selectedGoal?._id || selectedGoal?.id || null,
        })
        info('Session stopped')
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }
    
    setIsRunning(false)
    setTimeLeft(duration)
    setSessionId(null)
    setSelectedGoal(null)
    setSelectedResources([])
    setShowResourcesPanel(false)
  }

  const handleSessionComplete = async () => {
    let completedSessionData = {
      durationSeconds: duration,
      presetName: selectedPreset?.name || sessionTypes[sessionType].name,
      todayCount: 1,
      streak: 0,
      goalUpdated: false,
      goalTitle: selectedGoal?.title || null,
    }

    let sessionResponse = null
    if (sessionId) {
      try {
        sessionResponse = await api.sessions.end(sessionId, {
          actualDuration: duration,
          completed: true,
          goalId: selectedGoal?._id || selectedGoal?.id || null,
        })
        if (sessionResponse.success && sessionResponse.data) {
          completedSessionData = { ...completedSessionData, ...sessionResponse.data }
        }
      } catch (error) {
        console.error('Failed to complete session:', error)
      }
    }
    
    // Update goal progress if a goal was selected
    if (selectedGoal) {
      try {
        const hoursCompleted = duration / 3600 // Convert seconds to hours
        const progressResponse = await api.goals.addProgress(selectedGoal._id || selectedGoal.id, hoursCompleted)
        completedSessionData.goalUpdated = true
        completedSessionData.hoursAdded = hoursCompleted
        success(`Added ${hoursCompleted.toFixed(2)} hours to "${selectedGoal.title}"!`)
        
        // Check if goal was completed and celebrate
        if (progressResponse.goal?.status === 'completed' && progressResponse.rewardResult) {
          setTimeout(() => {
            achievementToast.showPoints(
              progressResponse.rewardResult.pointsAwarded, 
              `Goal Complete: ${selectedGoal.title}`
            )
          }, 2000)
          
          // Show level up if applicable
          if (progressResponse.rewardResult.levelUp?.didLevelUp) {
            setTimeout(() => {
              achievementToast.showLevelUp(progressResponse.rewardResult.levelUp.newLevel)
            }, 3500)
          }
        }
      } catch (error) {
        console.error('Failed to update goal progress:', error)
      }
    }
    
    setIsRunning(false)
    setSessionId(null)
    setSessionData(completedSessionData)
    setShowSessionEnd(true)
    
    // Show achievement toast for session completion with actual points from server
    const sessionMinutes = Math.round(duration / 60)
    const pointsEarned = sessionResponse?.rewards?.pointsAwarded || sessionMinutes * 2
    achievementToast.showPoints(pointsEarned, `${sessionMinutes}-minute study session completed!`)
    
    // Check for level up from session
    if (sessionResponse?.rewards?.levelUp?.leveledUp) {
      setTimeout(() => {
        achievementToast.showLevelUp(sessionResponse.rewards.levelUp.newLevel || sessionResponse.rewards.currentLevel)
      }, 1500)
    }
    
    // Check for streak milestone celebration
    if (completedSessionData.streak && completedSessionData.streak >= 7) {
      setTimeout(() => {
        achievementToast.showStreak(completedSessionData.streak, 'Keep your streak going!')
      }, sessionResponse?.rewards?.levelUp?.leveledUp ? 3000 : 1500)
    }
    
    // Show challenge completion celebrations
    if (sessionResponse?.challenges && sessionResponse.challenges.length > 0) {
      const completedChallenges = sessionResponse.challenges.filter(c => c.completed)
      completedChallenges.forEach((challenge, index) => {
        setTimeout(() => {
          achievementToast.showAchievement(
            '🏆',
            `Challenge Complete!`,
            challenge.title,
          )
          if (challenge.rewardResult?.pointsAwarded) {
            setTimeout(() => {
              achievementToast.showPoints(challenge.rewardResult.pointsAwarded, `Bonus for ${challenge.title}`)
            }, 1000)
          }
        }, 2000 + (index * 2500))
      })
    }
    
    success('Session completed! 🎉')
    
    // Clear selected goal and resources after session
    setSelectedGoal(null)
    setSelectedResources([])
    setShowResourcesPanel(false)
    
    // Play notification sound (if browser supports it)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Session Complete!', {
        body: `Your ${sessionTypes[sessionType].name} is complete.${completedSessionData.goalUpdated ? ` Progress added to "${completedSessionData.goalTitle}".` : ''}`,
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
            className="relative p-3 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 dark:text-primary-400 transition-colors"
            aria-label="Timer Presets"
            title={`Manage Presets (${presets.length})`}
          >
            <Layers className="w-6 h-6" />
            {presets.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {presets.length}
              </span>
            )}
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
      <div className="flex flex-wrap gap-3 mb-6">
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

      {/* Custom Presets Selector */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Presets {presets.length > 0 && `(${presets.length})`}
          </h3>
          <button
            onClick={() => setShowPresets(true)}
            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
          >
            Manage Presets
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
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-800'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      {preset.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {Math.round(preset.workDuration / 60)}m work · {Math.round(preset.breakDuration / 60)}m break
                  </div>
                  {isSelected && (
                    <div className="mt-1 text-xs text-primary-600 dark:text-primary-400 font-medium">
                      ✓ Active
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              No custom presets yet. Create one to get started!
            </p>
            <button
              onClick={() => setShowPresets(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Preset
            </button>
          </div>
        )}
      </div>

      {/* Main Timer Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 border border-gray-200 dark:border-gray-700">
        {/* Selected Goal Display */}
        {selectedGoal && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Tracking: {selectedGoal.title}
                </span>
              </div>
              {!isRunning && (
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="text-xs text-green-600 dark:text-green-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Session time will be added to this goal's progress
            </p>
          </div>
        )}

        {/* Selected Resources Display */}
        {selectedResources.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedResources.length} Resource{selectedResources.length !== 1 ? 's' : ''} Ready
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {!showResourcesPanel && (
                  <button
                    onClick={() => setShowResourcesPanel(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Show Panel
                  </button>
                )}
                {!isRunning && (
                  <button
                    onClick={() => {
                      setSelectedResources([])
                      setShowResourcesPanel(false)
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Access your study materials from the floating panel
            </p>
          </div>
        )}

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

      {/* Goal Selection Modal */}
      <GoalSelectionModal
        isOpen={showGoalSelection}
        onClose={() => {
          setShowGoalSelection(false)
          setPendingStart(false)
        }}
        onSelectGoal={handleGoalSelected}
        onSkip={handleSkipGoalSelection}
      />

      {/* Resource Selection Modal */}
      <ResourceSelectionModal
        isOpen={showResourceSelection}
        onClose={() => {
          setShowResourceSelection(false)
          setPendingStart(false)
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
        onClose={() => setShowSessionEnd(false)}
        sessionData={sessionData}
        onAcceptSuggestion={handleAcceptBreakSuggestion}
      />
    </div>
  )
}

export default Focus
