import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import useSessionActivityTracker from '../hooks/useSessionActivityTracker'
import { useNotification } from './NotificationContext'
import { useAchievementToast } from '../components/UI/AchievementToast'
import { useDistraction } from './DistractionContext'

const TimerContext = createContext(null)

const defaultDurations = {
  focus: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60
}

const defaultLabels = {
  focus: 'Focus Session',
  'short-break': 'Short Break',
  'long-break': 'Long Break'
}

export const TimerProvider = ({ children }) => {
  const { success, info } = useNotification()
  const achievementToast = useAchievementToast()
  const { setTimerContext } = useDistraction()

  const [sessionType, setSessionType] = useState('focus')
  const [duration, setDuration] = useState(defaultDurations.focus)
  const [timeLeft, setTimeLeft] = useState(defaultDurations.focus)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [goalMeta, setGoalMeta] = useState({ id: null, title: null })
  const [presetName, setPresetName] = useState(null)
  const [sessionSubject, setSessionSubject] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [showSessionEnd, setShowSessionEnd] = useState(false)
  const [autoPaused, setAutoPaused] = useState(false)
  const [idlePrompt, setIdlePrompt] = useState({ show: false, idleSeconds: 0 })
  const [activityNotice, setActivityNotice] = useState(null)

  const endAtRef = useRef(null)
  const idleTimeoutRef = useRef(null)
  const completingRef = useRef(false)

  const {
    summary: activitySummary,
    timeline: activityTimeline,
    isIdle,
    confirmActive,
    endTracking
  } = useSessionActivityTracker({
    sessionId,
    goalId: goalMeta.id,
    sessionSource: 'timer',
    sessionType,
    sessionSubject,
    enabled: Boolean(sessionId),
    isRunning: isRunning || autoPaused,
    idleThresholdSeconds: 30,
    nudgeThresholdSeconds: 30,
    onNudge: ({ idleSeconds }) => {
      if (autoPaused || !isRunning) return
      const message = 'No activity detected for 30 seconds. Are you still active?'
      pauseSession()
      setActivityNotice(message)
      setIdlePrompt({ show: true, idleSeconds })
      setAutoPaused(true)
      info(message)
    }
  })

  useEffect(() => {
    setTimerContext({
      sessionId,
      goalId: goalMeta.id,
      isRunning: isRunning || autoPaused
    })
  }, [sessionId, goalMeta.id, isRunning, autoPaused, setTimerContext])


  useEffect(() => {
    if (!idlePrompt.show) {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
      return
    }

    idleTimeoutRef.current = setTimeout(() => {
      setIdlePrompt({ show: false, idleSeconds: 0 })
      setActivityNotice('Marked idle due to no response.')
    }, 60000)

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current)
        idleTimeoutRef.current = null
      }
    }
  }, [idlePrompt.show])

  useEffect(() => {
    if (!isIdle && !autoPaused) {
      setActivityNotice(null)
      setIdlePrompt({ show: false, idleSeconds: 0 })
    }
  }, [isIdle, autoPaused])

  const startNewSession = async ({
    nextSessionType,
    nextDuration,
    goalId,
    goalTitle,
    nextPresetName,
    nextSessionSubject
  }) => {
    const response = await api.sessions.start({
      type: nextSessionType,
      duration: nextDuration,
      goalId: goalId || null,
      subject: nextSessionSubject || ''
    })

    if (response.success) {
      const nextSessionId = response.data?.sessionId || response.data?.id || response.data?._id
      if (nextSessionId) {
        setSessionId(nextSessionId)
      }
    }

    setSessionType(nextSessionType)
    setDuration(nextDuration)
    setTimeLeft(nextDuration)
    setGoalMeta({ id: goalId || null, title: goalTitle || null })
    setPresetName(nextPresetName || null)
    setSessionSubject(nextSessionSubject || null)
  }

  const startSession = async ({
    sessionType: nextSessionType = sessionType,
    duration: nextDuration = duration,
    goalId = goalMeta.id,
    goalTitle = goalMeta.title,
    presetName: nextPresetName = presetName,
    sessionSubject: nextSessionSubject = sessionSubject
  } = {}) => {
    setShowSessionEnd(false)
    setSessionData(null)
    if (!sessionId) {
      await startNewSession({
        nextSessionType,
        nextDuration,
        goalId,
        goalTitle,
        nextPresetName,
        nextSessionSubject
      })
      endAtRef.current = Date.now() + (nextDuration * 1000)
    } else {
      endAtRef.current = Date.now() + (timeLeft * 1000)
    }
    setAutoPaused(false)
    setIsRunning(true)
  }

  const pauseSession = () => {
    if (!isRunning) return
    if (endAtRef.current) {
      const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
      setTimeLeft(remaining)
    }
    endAtRef.current = null
    setIsRunning(false)
  }

  const resumeSession = () => {
    if (isRunning) return
    endAtRef.current = Date.now() + (timeLeft * 1000)
    setAutoPaused(false)
    setIsRunning(true)
  }

  const resetTimerState = () => {
    endAtRef.current = null
    setIsRunning(false)
    setAutoPaused(false)
    setSessionId(null)
    setGoalMeta({ id: null, title: null })
    setPresetName(null)
    setSessionSubject(null)
    setActivityNotice(null)
    setIdlePrompt({ show: false, idleSeconds: 0 })
  }

  const stopSession = async () => {
    if (!sessionId) {
      resetTimerState()
      setTimeLeft(duration)
      return
    }

    try {
      const finalSummary = await endTracking()
      const productiveSeconds = finalSummary?.activeSeconds
      const actualDuration = productiveSeconds && productiveSeconds > 0
        ? productiveSeconds
        : (duration - timeLeft)

      await api.sessions.end(sessionId, {
        actualDuration,
        completed: false,
        goalId: goalMeta.id || null,
        subject: sessionSubject || ''
      })

      info('Session stopped')
    } catch (error) {
      console.error('Failed to end session:', error)
    }

    resetTimerState()
    setTimeLeft(duration)
  }

  const completeSession = useCallback(async () => {
    if (completingRef.current) return
    completingRef.current = true

    let completedSessionData = {
      durationSeconds: duration,
      presetName: presetName || defaultLabels[sessionType] || 'Session',
      todayCount: 1,
      streak: 0,
      goalUpdated: false,
      goalTitle: goalMeta.title || null
    }

    try {
      const finalSummary = await endTracking()
      completedSessionData.activitySummary = finalSummary

      if (sessionId) {
        const distractionResponse = await api.distraction.getSession(sessionId)
        if (distractionResponse?.success) {
          completedSessionData.distractionSummary = distractionResponse.data?.summary || null
        }
      }

      const productiveSeconds = finalSummary?.activeSeconds
      const actualDuration = productiveSeconds && productiveSeconds > 0
        ? productiveSeconds
        : duration

      const sessionResponse = sessionId ? await api.sessions.end(sessionId, {
        actualDuration,
        completed: true,
        goalId: goalMeta.id || null,
        subject: sessionSubject || ''
      }) : null

      if (sessionResponse?.success && sessionResponse.data) {
        completedSessionData = { ...completedSessionData, ...sessionResponse.data }
      }

      if (goalMeta.id) {
        try {
          const hoursCompleted = duration / 3600
          const progressResponse = await api.goals.addProgress(goalMeta.id, hoursCompleted)
          completedSessionData.goalUpdated = true
          completedSessionData.hoursAdded = hoursCompleted
          success(`Added ${hoursCompleted.toFixed(2)} hours to "${goalMeta.title || 'goal'}"!`)

          if (progressResponse.goal?.status === 'completed' && progressResponse.rewardResult) {
            setTimeout(() => {
              achievementToast.showPoints(
                progressResponse.rewardResult.pointsAwarded,
                `Goal Complete: ${goalMeta.title || 'Goal'}`
              )
            }, 2000)

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

      const sessionMinutes = Math.round(duration / 60)
      const pointsEarned = sessionResponse?.rewards?.pointsAwarded || sessionMinutes * 2
      achievementToast.showPoints(pointsEarned, `${sessionMinutes}-minute study session completed!`)

      if (sessionResponse?.rewards?.levelUp?.leveledUp) {
        setTimeout(() => {
          achievementToast.showLevelUp(sessionResponse.rewards.levelUp.newLevel || sessionResponse.rewards.currentLevel)
        }, 1500)
      }

      if (completedSessionData.streak && completedSessionData.streak >= 7) {
        setTimeout(() => {
          achievementToast.showStreak(completedSessionData.streak, 'Keep your streak going!')
        }, sessionResponse?.rewards?.levelUp?.leveledUp ? 3000 : 1500)
      }

      if (sessionResponse?.challenges && sessionResponse.challenges.length > 0) {
        const completedChallenges = sessionResponse.challenges.filter(c => c.completed)
        completedChallenges.forEach((challenge, index) => {
          setTimeout(() => {
            achievementToast.showAchievement('🏆', 'Challenge Complete!', challenge.title)
            if (challenge.rewardResult?.pointsAwarded) {
              setTimeout(() => {
                achievementToast.showPoints(challenge.rewardResult.pointsAwarded, `Bonus for ${challenge.title}`)
              }, 1000)
            }
          }, 2000 + (index * 2500))
        })
      }

      success('Session completed! 🎉')

      setSessionData(completedSessionData)
      setShowSessionEnd(true)
    } catch (error) {
      console.error('Failed to complete session:', error)
    }

    resetTimerState()
    completingRef.current = false
  }, [duration, presetName, goalMeta, sessionId, endTracking, achievementToast, success])

  useEffect(() => {
    if (completingRef.current) return undefined
    if (!isRunning) return undefined

    if (!endAtRef.current) {
      endAtRef.current = Date.now() + (timeLeft * 1000)
    }

    const interval = setInterval(() => {
      if (!endAtRef.current) return
      const remaining = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        endAtRef.current = null
        clearInterval(interval)
        completeSession()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, completeSession, timeLeft])

  const confirmIdle = () => {
    setIdlePrompt({ show: false, idleSeconds: 0 })
  }

  const confirmStillActive = () => {
    confirmActive()
    resumeSession()
    setIdlePrompt({ show: false, idleSeconds: 0 })
    setActivityNotice(null)
  }

  const closeSessionEnd = () => {
    setShowSessionEnd(false)
  }

  const applyBreakSuggestion = (breakMinutes) => {
    const nextDuration = breakMinutes * 60
    setSessionType('short-break')
    setDuration(nextDuration)
    setTimeLeft(nextDuration)
    setShowSessionEnd(false)
  }

  const value = useMemo(() => ({
    sessionType,
    duration,
    timeLeft,
    isRunning,
    sessionId,
    goalMeta,
    presetName,
    sessionSubject,
    activitySummary,
    activityTimeline,
    isIdle,
    activityNotice,
    autoPaused,
    idlePrompt,
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
    confirmIdle,
    confirmStillActive,
    closeSessionEnd,
    applyBreakSuggestion
  }), [
    sessionType,
    duration,
    timeLeft,
    isRunning,
    sessionId,
    goalMeta,
    presetName,
    sessionSubject,
    activitySummary,
    activityTimeline,
    isIdle,
    activityNotice,
    autoPaused,
    idlePrompt,
    sessionData,
    showSessionEnd,
    startSession,
    pauseSession,
    resumeSession,
    stopSession
  ])

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider')
  }
  return context
}

export default TimerContext
