/**
 * PresenceContext – global face-detection & presence-session manager
 *
 * Lives ABOVE the router so it persists across page navigation.
 * The PresenceDetection page is a pure view that reads from this context.
 *
 * Absence warning rules:
 *   - Countdown starts the instant a no-face frame is received
 *   - Face re-detected before 15 s → countdown cancelled, warning cleared immediately
 *   - 15 s elapse with no face → absenceWarning = true
 *
 * API throttle is separate from warning logic so clearing the warning
 * is never blocked by the grace period.
 */
import React, {
  createContext, useCallback, useContext,
  useEffect, useMemo, useRef, useState,
} from 'react'
import { useTimer } from './TimerContext'
import { presenceApi } from '../services/newModulesApi'
import { useFaceDetection } from '../hooks/useFaceDetection'

const PresenceContext = createContext(null)

// ── Rest suggestion copy per fatigue type ─────────────────────────────────────
const REST_SUGGESTIONS = {
  eye_closure: [
    '👁️ 20-20-20 Rule: Look at something 20 feet away for 20 seconds',
    '😌 Close your eyes and rest them gently for 60 seconds',
    '💧 Blink deliberately 10 times, then drink some water',
  ],
  yawn: [
    '🚶 Stand up and walk around for 2 minutes',
    '🌬️ Take 5 deep breaths — inhale 4 s, exhale 6 s',
    '💧 Drink some water and do a quick neck stretch',
  ],
  general: [
    '⏸️ Take a 5-minute break from the screen',
    '🧘 Stretch your neck and shoulders',
    '🚰 Get up, drink water, and rest your eyes',
  ],
}

export const PresenceProvider = ({ children }) => {
  const { sessionId, isRunning, sessionType, goalMeta, notifyFacePresence } = useTimer()

  // ── State ─────────────────────────────────────────────────────────────────
  const [presenceSession, setPresenceSession] = useState(null)
  const [history, setHistory]               = useState([])
  const [cameraEnabled, setCameraEnabled]   = useState(false)
  const [livePercent, setLivePercent]       = useState(0)
  const [absenceWarning, setAbsenceWarning] = useState(false)
  const [checkinMsg, setCheckinMsg]         = useState('')
  const [histLoading, setHistLoading]       = useState(true)
  const [cameraAudit, setCameraAudit]       = useState([])
  const [restSuggestion, setRestSuggestion] = useState(null) // { text, type, detectedAt }

  // ── Refs ──────────────────────────────────────────────────────────────────
  const presenceRef    = useRef(null)   // always-current session (avoids stale closures)
  const prevRunning    = useRef(false)  // track timer transitions
  const absenceTimer   = useRef(null)   // 15-second countdown to show warning
  const apiThrottle    = useRef(null)   // throttle recordEvent API calls
  const restDismissRef = useRef(false)  // debounce: don't spam suggestions

  // Keep presenceRef in sync with state
  useEffect(() => { presenceRef.current = presenceSession }, [presenceSession])

  // ── Detection callbacks ───────────────────────────────────────────────────
  const handlePresenceChange = useCallback(async (detected, conf) => {
    // Tell TimerContext about face state so it can override idle detection
    notifyFacePresence(detected)

    // ── ABSENCE WARNING (unthrottled) ─────────────────────────────────────
    if (detected) {
      if (absenceTimer.current) {
        clearTimeout(absenceTimer.current)
        absenceTimer.current = null
      }
      setAbsenceWarning(false)
    } else {
      if (!absenceTimer.current) {
        absenceTimer.current = setTimeout(() => {
          absenceTimer.current = null
          setAbsenceWarning(true)
        }, 15_000)
      }
    }

    // ── API RECORDING (throttled to 1 call per 4 s) ───────────────────────
    if (apiThrottle.current) return
    apiThrottle.current = setTimeout(() => { apiThrottle.current = null }, 4000)

    const ps = presenceRef.current
    if (!ps) return

    try {
      await presenceApi.recordEvent({
        presenceSessionId: ps._id,
        eventType: detected ? 'presence_detected' : 'absence_detected',
        detectionMethod: 'camera_ai',
        confidenceScore: conf,
      })
    } catch (_) { /* non-critical */ }

    setPresenceSession(prev => {
      if (!prev) return prev
      const t = (prev.totalChecks || 0) + 1
      const p = (prev.presentCount || 0) + (detected ? 1 : 0)
      setLivePercent(Math.round((p / t) * 100))
      return { ...prev, totalChecks: t, presentCount: p }
    })
  }, [notifyFacePresence])

  const handleFatigue = useCallback(async (data = {}) => {
    // Show rest suggestion (debounced: once per 2 min max)
    if (!restDismissRef.current) {
      const type = data.type || 'general'
      const pool = REST_SUGGESTIONS[type] || REST_SUGGESTIONS.general
      const text = pool[Math.floor(Math.random() * pool.length)]
      setRestSuggestion({ text, type, detectedAt: Date.now() })
      restDismissRef.current = true
      setTimeout(() => { restDismissRef.current = false }, 120_000)
    }

    const ps = presenceRef.current
    if (!ps) return
    try {
      await presenceApi.recordEvent({
        presenceSessionId: ps._id,
        eventType: 'fatigue_alert',
        detectionMethod: 'camera_ai',
        confidenceScore: 100,
      })
      setPresenceSession(prev => prev
        ? { ...prev, fatigueAlerts: (prev.fatigueAlerts || 0) + 1 }
        : prev)
    } catch (_) {}
  }, [])

  // ── Face detection hook (persists across navigation) ──────────────────────
  const {
    videoRef, canvasRef,
    modelsLoaded, modelsLoading,
    isPresent, faceCount, isFatigued, confidence,
    cameraActive, cameraError,
    fatigueScore, blinkRate, perclos, yawnDetected, earValue,
  } = useFaceDetection({
    enabled: cameraEnabled,
    intervalMs: 800,
    onPresenceChange: handlePresenceChange,
    onFatigue: handleFatigue,
  })

  // ── React to Focus Timer transitions ──────────────────────────────────────
  useEffect(() => {
    const wasRunning = prevRunning.current
    const nowRunning = isRunning && sessionType === 'focus'
    prevRunning.current = nowRunning

    // Timer just STARTED (focus session)
    if (!wasRunning && nowRunning && sessionId) {
      setLivePercent(0)
      setAbsenceWarning(false)
      clearTimeout(absenceTimer.current)
      absenceTimer.current = null

      presenceApi.start({
        cameraEnabled,
        timerSessionId: sessionId,
        goalId: goalMeta?.id || null,
      })
        .then(res => setPresenceSession(res.data.session))
        .catch(console.error)
    }

    // Timer STOPPED / paused / switched to break
    if (wasRunning && !nowRunning) {
      clearTimeout(absenceTimer.current)
      absenceTimer.current = null
      const ps = presenceRef.current
      if (ps && ps.status === 'active') {
        presenceApi.end(ps._id)
          .then(res => {
            setPresenceSession(null)
            setHistory(prev => [res.data.session, ...prev.slice(0, 9)])
            setAbsenceWarning(false)
          })
          .catch(console.error)
      }
    }
  }, [isRunning, sessionType, sessionId])

  // ── Load history on mount ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    setHistLoading(true)
    Promise.all([
      presenceApi.getActive(),
      presenceApi.getHistory({ limit: 10 }),
    ])
      .then(([activeRes, histRes]) => {
        if (!mounted) return
        if (activeRes.data?.session) {
          const s = activeRes.data.session
          setPresenceSession(s)
          setLivePercent(
            s.totalChecks > 0 ? Math.round((s.presentCount / s.totalChecks) * 100) : 0
          )
        }
        setHistory(histRes.data?.sessions || [])
      })
      .catch(console.error)
      .finally(() => { if (mounted) setHistLoading(false) })
    return () => { mounted = false }
  }, [])

  // ── Manual check-in ───────────────────────────────────────────────────────
  const handleManualCheckin = useCallback(async () => {
    const ps = presenceRef.current
    if (!ps) return
    try {
      await presenceApi.recordEvent({
        presenceSessionId: ps._id,
        eventType: 'manual_checkin',
        detectionMethod: 'manual',
        confidenceScore: 100,
      })
      setAbsenceWarning(false)
      clearTimeout(absenceTimer.current)
      absenceTimer.current = null
      setPresenceSession(prev => prev
        ? { ...prev, manualCheckIns: (prev.manualCheckIns || 0) + 1 }
        : prev)
      setCheckinMsg('✅ Check-in recorded!')
      setTimeout(() => setCheckinMsg(''), 3000)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // ── Dismiss rest suggestion ───────────────────────────────────────────────
  const dismissRestSuggestion = useCallback(() => {
    setRestSuggestion(null)
    restDismissRef.current = true
    setTimeout(() => { restDismissRef.current = false }, 120_000)
  }, [])

  // ── Load camera audit on demand ───────────────────────────────────────────
  const loadCameraAudit = useCallback(async () => {
    try { setCameraAudit((await presenceApi.getCameraAudit()).data.audits || []) }
    catch (e) { console.error(e) }
  }, [])

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // camera
    cameraEnabled, setCameraEnabled,
    videoRef, canvasRef,
    modelsLoaded, modelsLoading,
    isPresent, faceCount, isFatigued, confidence,
    cameraActive, cameraError,
    // fatigue metrics
    fatigueScore, blinkRate, perclos, yawnDetected, earValue,
    // session
    presenceSession,
    livePercent,
    absenceWarning,
    checkinMsg,
    history,
    histLoading,
    cameraAudit,
    restSuggestion,
    // actions
    handleManualCheckin,
    loadCameraAudit,
    dismissRestSuggestion,
    setHistory,
  }), [
    cameraEnabled, videoRef, canvasRef,
    modelsLoaded, modelsLoading,
    isPresent, faceCount, isFatigued, confidence,
    cameraActive, cameraError,
    fatigueScore, blinkRate, perclos, yawnDetected, earValue,
    presenceSession, livePercent, absenceWarning, checkinMsg,
    history, histLoading, cameraAudit, restSuggestion,
    handleManualCheckin, loadCameraAudit, dismissRestSuggestion,
  ])

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  )
}

export const usePresence = () => {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresence must be used inside PresenceProvider')
  return ctx
}

export default PresenceContext
