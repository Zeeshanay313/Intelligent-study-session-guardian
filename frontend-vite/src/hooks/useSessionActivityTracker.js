import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'

const DEFAULT_IDLE_THRESHOLD_SECONDS = 15
const DEFAULT_NUDGE_THRESHOLD_SECONDS = 15
const FLUSH_INTERVAL_MS = 10000
const MOUSE_THROTTLE_MS = 200
const DEBUG = import.meta.env.VITE_DEBUG === 'true'

const clampScore = (value) => Math.max(0, Math.min(100, Math.round(value)))

const calculateEngagementScore = (counts, activeSeconds) => {
  if (activeSeconds <= 0) return 0
  const interactions = (counts.mouseMoves || 0)
    + (counts.keyStrokes || 0)
    + (counts.clicks || 0)
    + (counts.scrolls || 0)
  const minutes = Math.max(1, activeSeconds / 60)
  const ratePerMinute = interactions / minutes
  return clampScore(ratePerMinute * 2)
}

const calculateProductivityScore = (activeSeconds, idleSeconds) => {
  const total = activeSeconds + idleSeconds
  if (total <= 0) return 0
  return clampScore((activeSeconds / total) * 100)
}

const useSessionActivityTracker = ({
  sessionId,
  goalId = null,
  sessionSource = 'timer',
  sessionType = null,
  sessionSubject = null,
  enabled = false,
  isRunning = false,
  idleThresholdSeconds = DEFAULT_IDLE_THRESHOLD_SECONDS,
  nudgeThresholdSeconds = DEFAULT_NUDGE_THRESHOLD_SECONDS,
  onNudge
}) => {
  const [summary, setSummary] = useState({
    activeSeconds: 0,
    idleSeconds: 0,
    focusPercent: 0,
    engagementScore: 0,
    productivityScore: 0
  })
  const [timeline, setTimeline] = useState([])
  const [isIdle, setIsIdle] = useState(false)

  const activeSecondsRef = useRef(0)
  const idleSecondsRef = useRef(0)
  const countsRef = useRef({ mouseMoves: 0, keyStrokes: 0, clicks: 0, scrolls: 0 })
  const lastActivityRef = useRef(Date.now())
  const lastTickRef = useRef(Date.now())
  const lastMouseMoveRef = useRef(0)
  const currentSegmentRef = useRef(null)
  const timelineRef = useRef([])
  const flushTimerRef = useRef(null)
  const runningRef = useRef(false)
  const startedRef = useRef(false)
  const endedRef = useRef(false)
  const nudgedRef = useRef(false)
  const isIdleRef = useRef(false)
  const onNudgeRef = useRef(onNudge)
  const lastDebugRef = useRef(0)

  useEffect(() => {
    onNudgeRef.current = onNudge
  }, [onNudge])

  const buildSummary = useCallback(() => {
    const activeSeconds = activeSecondsRef.current
    const idleSeconds = idleSecondsRef.current
    const focusPercent = activeSeconds + idleSeconds > 0
      ? Math.round((activeSeconds / (activeSeconds + idleSeconds)) * 100)
      : 0

    return {
      activeSeconds,
      idleSeconds,
      focusPercent,
      engagementScore: calculateEngagementScore(countsRef.current, activeSeconds),
      productivityScore: calculateProductivityScore(activeSeconds, idleSeconds)
    }
  }, [])

  const logDebug = useCallback((message, data = null) => {
    if (!DEBUG) return
    const now = Date.now()
    if (now - lastDebugRef.current < 800 && message === 'activity_event') return
    lastDebugRef.current = now
    if (data) {
      console.log(`[ActivityTracker] ${message}`, data)
    } else {
      console.log(`[ActivityTracker] ${message}`)
    }
  }, [])

  const confirmActive = useCallback(() => {
    if (!enabled || !sessionId) return
    const now = Date.now()
    lastActivityRef.current = now
    lastTickRef.current = now
    if (isIdleRef.current) {
      closeSegment(now)
      startSegment('active', now)
      isIdleRef.current = false
      setIsIdle(false)
    }
    nudgedRef.current = false
    logDebug('manual_confirm_active')
  }, [enabled, sessionId, logDebug])

  const closeSegment = (timestamp) => {
    if (!currentSegmentRef.current) return
    timelineRef.current = [
      ...timelineRef.current,
      {
        ...currentSegmentRef.current,
        endTime: new Date(timestamp).toISOString()
      }
    ]
    currentSegmentRef.current = null
    setTimeline(timelineRef.current)
  }

  const startSegment = (status, timestamp) => {
    currentSegmentRef.current = {
      startTime: new Date(timestamp).toISOString(),
      endTime: null,
      status
    }
  }

  const flushActivity = useCallback(async (eventType, options = {}) => {
    if (!enabled || !sessionId) return null

    const payloadSummary = buildSummary()
    const payload = {
      sessionId,
      goalId,
      sessionSource,
      eventType,
      timestamp: new Date().toISOString(),
      status: isIdleRef.current ? 'idle' : 'active',
      activeSeconds: payloadSummary.activeSeconds,
      idleSeconds: payloadSummary.idleSeconds,
      focusPercent: payloadSummary.focusPercent,
      engagementScore: payloadSummary.engagementScore,
      productivityScore: payloadSummary.productivityScore,
      mouseMoves: countsRef.current.mouseMoves,
      keyStrokes: countsRef.current.keyStrokes,
      clicks: countsRef.current.clicks,
      scrolls: countsRef.current.scrolls,
      details: {
        idleThresholdSeconds,
        nudgeThresholdSeconds,
        sessionType: sessionType || null,
        sessionSubject: sessionSubject || null
      }
    }

    if (options.timeline) {
      payload.timeline = options.timeline
    }

    try {
      logDebug('api_flush', { eventType, status: payload.status, activeSeconds: payload.activeSeconds, idleSeconds: payload.idleSeconds })
      if (eventType === 'session_end') {
        return await api.activity.endSession(payload)
      }
      return await api.activity.updateSession(payload)
    } catch (error) {
      console.error('Failed to flush activity:', error)
      return null
    }
  }, [enabled, sessionId, goalId, sessionSource, sessionType, sessionSubject, idleThresholdSeconds, nudgeThresholdSeconds, buildSummary, logDebug])

  const endTracking = useCallback(async () => {
    if (endedRef.current || !sessionId) return buildSummary()
    endedRef.current = true

    closeSegment(Date.now())
    const finalTimeline = timelineRef.current

    const response = await flushActivity('session_end', { timeline: finalTimeline })
    const nextSummary = response?.data?.summary || buildSummary()
    setSummary(nextSummary)
    return nextSummary
  }, [buildSummary, flushActivity, sessionId])

  useEffect(() => {
    if (!enabled || !sessionId) {
      return undefined
    }

    activeSecondsRef.current = 0
    idleSecondsRef.current = 0
    countsRef.current = { mouseMoves: 0, keyStrokes: 0, clicks: 0, scrolls: 0 }
    lastActivityRef.current = Date.now()
    lastTickRef.current = Date.now()
    lastMouseMoveRef.current = 0
    timelineRef.current = []
    currentSegmentRef.current = null
    runningRef.current = isRunning
    startedRef.current = false
    endedRef.current = false
    nudgedRef.current = false
    isIdleRef.current = false
    setTimeline([])
    setSummary({
      activeSeconds: 0,
      idleSeconds: 0,
      focusPercent: 0,
      engagementScore: 0,
      productivityScore: 0
    })

    if (runningRef.current) {
      startSegment('active', Date.now())
    }

    const setIdleState = (idle, timestamp, reason) => {
      if (idle === isIdleRef.current) return
      closeSegment(timestamp)
      startSegment(idle ? 'idle' : 'active', timestamp)
      isIdleRef.current = idle
      setIsIdle(idle)
      logDebug('status_change', { status: idle ? 'idle' : 'active', reason })
    }

    const markActivity = (type) => {
      if (!runningRef.current) return
      const now = Date.now()
      lastActivityRef.current = now
      if (type === 'mousemove') {
        if (now - lastMouseMoveRef.current >= MOUSE_THROTTLE_MS) {
          countsRef.current.mouseMoves += 1
          lastMouseMoveRef.current = now
        }
      }
      if (type === 'keydown') countsRef.current.keyStrokes += 1
      if (type === 'click') countsRef.current.clicks += 1
      if (type === 'scroll') countsRef.current.scrolls += 1
      if (isIdleRef.current) {
        setIdleState(false, now, type)
      }
      logDebug('activity_event', { type })
    }

    const handleMouseMove = () => markActivity('mousemove')
    const handleKeyDown = () => markActivity('keydown')
    const handleClick = () => markActivity('click')
    const handleScroll = () => markActivity('scroll')

    const handleVisibilityChange = () => {
      if (!runningRef.current) return
      const now = Date.now()
      if (document.visibilityState === 'hidden') {
        lastActivityRef.current = now - idleThresholdSeconds * 1000
        setIdleState(true, now, 'visibility_hidden')
      } else {
        markActivity('visibility')
      }
    }

    const handleWindowBlur = () => {
      if (!runningRef.current) return
      const now = Date.now()
      lastActivityRef.current = now - idleThresholdSeconds * 1000
      setIdleState(true, now, 'window_blur')
    }

    const handleWindowFocus = () => {
      if (!runningRef.current) return
      markActivity('window_focus')
    }

    const startSession = async () => {
      if (startedRef.current) return
      startedRef.current = true
      try {
        logDebug('api_start', { sessionId, goalId, sessionSource })
        await api.activity.startSession({ sessionId, goalId, sessionSource })
      } catch (error) {
        console.error('Failed to start activity session:', error)
      }
    }

    startSession()

    const tickTimer = setInterval(() => {
      if (!runningRef.current) {
        lastTickRef.current = Date.now()
        return
      }

      const now = Date.now()
      const deltaSeconds = Math.floor((now - lastTickRef.current) / 1000)
      if (deltaSeconds <= 0) return

      lastTickRef.current = now
      const idleForSeconds = Math.floor((now - lastActivityRef.current) / 1000)
      const idleNow = idleForSeconds >= idleThresholdSeconds

      if (idleNow) {
        if (!isIdleRef.current) {
          // Just crossed the threshold — retroactively credit the full detection window as idle
          const retroactive = idleThresholdSeconds
          idleSecondsRef.current += retroactive
          activeSecondsRef.current = Math.max(0, activeSecondsRef.current - retroactive)
        }
        idleSecondsRef.current += deltaSeconds
      } else {
        activeSecondsRef.current += deltaSeconds
      }

      if (idleNow !== isIdleRef.current) {
        setIdleState(idleNow, now, 'timer')
      }

      const nextSummary = buildSummary()
      setSummary(nextSummary)

      if (idleNow && !nudgedRef.current && idleForSeconds >= nudgeThresholdSeconds) {
        nudgedRef.current = true
        if (onNudgeRef.current) {
          onNudgeRef.current({ idleSeconds: idleForSeconds, summary: nextSummary })
        }
      }

      if (!idleNow) {
        nudgedRef.current = false
      }
    }, 1000)

    flushTimerRef.current = setInterval(() => {
      if (runningRef.current) {
        flushActivity('session_update')
      }
    }, FLUSH_INTERVAL_MS)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(tickTimer)
      clearInterval(flushTimerRef.current)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      endTracking()
    }
  }, [enabled, sessionId, goalId, sessionSource, idleThresholdSeconds, nudgeThresholdSeconds, flushActivity, buildSummary, endTracking, logDebug])

  useEffect(() => {
    if (!enabled || !sessionId) return

    if (isRunning) {
      runningRef.current = true
      lastActivityRef.current = Date.now()
      lastTickRef.current = Date.now()
      if (!currentSegmentRef.current) {
        startSegment('active', Date.now())
      }
    } else {
      runningRef.current = false
      closeSegment(Date.now())
      isIdleRef.current = false
      setIsIdle(false)
      nudgedRef.current = false
    }
  }, [enabled, sessionId, isRunning])

  return {
    summary,
    timeline,
    isIdle,
    confirmActive,
    endTracking
  }
}

export default useSessionActivityTracker