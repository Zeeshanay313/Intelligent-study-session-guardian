/**
 * PresenceDetection – full feature view
 *
 * Features covered:
 *  ✅ Optional on-device webcam (camera off by default)
 *  ✅ Log percent-of-session presence, avoid remote image storage
 *  ✅ Manual check-in ("I'm Here!") for privacy-conscious users
 *  ✅ Alerts for prolonged absence (15 s no-face)
 *  ✅ Rest suggestions when fatigue detected (eye closure / yawn)
 *  ✅ Fatigue metrics: PERCLOS, blink rate, EAR, composite score
 *  ✅ Audit logs showing when camera was active and why
 */
import React, { useState, useEffect } from 'react'
import {
  Camera, CameraOff, UserCheck, UserX, AlertTriangle,
  CheckCircle, Clock, Activity, RefreshCw, Eye, EyeOff,
  Hand, Zap, Shield, Brain, Timer, ArrowRight, X,
  TrendingUp, BarChart2, Info, Coffee
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTimer } from '../../contexts/TimerContext'
import { usePresence } from '../../contexts/PresenceContext'

// ─── Circular presence indicator ──────────────────────────────────────────────
const PresenceRing = ({ percent, size = 'md' }) => {
  const r    = size === 'lg' ? 42 : 28
  const circ = 2 * Math.PI * r
  const dim  = size === 'lg' ? 100 : 70
  const color = percent >= 75 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim/2} cy={dim/2} r={r} stroke="#e5e7eb" strokeWidth="6" fill="none" className="dark:stroke-gray-700" />
        <circle cx={dim/2} cy={dim/2} r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circ} strokeDashoffset={circ - (percent / 100) * circ}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <span className={`absolute font-bold ${size === 'lg' ? 'text-xl' : 'text-sm'}`} style={{ color }}>
        {percent}%
      </span>
    </div>
  )
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
    <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
)

// ─── Progress bar ──────────────────────────────────────────────────────────────
const ScoreBar = ({ value, max = 100, label, sublabel, colorFn }) => {
  const pct   = Math.min(100, Math.round((value / max) * 100))
  const color = colorFn ? colorFn(value) : (pct < 30 ? 'bg-green-500' : pct < 60 ? 'bg-amber-500' : 'bg-red-500')
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{sublabel || `${value}`}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Camera feed + canvas overlay ─────────────────────────────────────────────
const CameraFeed = ({ videoRef, canvasRef, isPresent, isFatigued, yawnDetected, confidence, modelsLoading, cameraError }) => (
  <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black shadow-xl aspect-video">
    <video ref={videoRef} autoPlay playsInline muted
      className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full"
      style={{ transform: 'scaleX(-1)', pointerEvents: 'none' }} />

    {modelsLoading && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
        <p className="text-white text-sm font-medium">Loading AI models…</p>
      </div>
    )}
    {cameraError && (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3 p-4">
        <CameraOff className="w-10 h-10 text-red-400" />
        <p className="text-red-300 text-sm text-center">{cameraError}</p>
      </div>
    )}
    {!modelsLoading && !cameraError && (
      <>
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isPresent ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${
            isPresent ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
          }`}>{isPresent ? `Present ${confidence}%` : 'No Face'}</span>
        </div>
        {yawnDetected && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-amber-900/80 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-amber-300 text-xs font-bold">🥱 Yawn Detected</span>
          </div>
        )}
      </>
    )}
    <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple-900/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
      <Brain className="w-3 h-3 text-purple-300" />
      <span className="text-xs text-purple-300 font-medium">AI</span>
    </div>
    {isFatigued && (
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 bg-red-900/85 backdrop-blur-sm rounded-xl px-3 py-2">
        <Zap className="w-4 h-4 text-red-300 flex-shrink-0 animate-pulse" />
        <span className="text-xs text-red-200 font-medium">Fatigue detected! Eyes closing for too long.</span>
      </div>
    )}
  </div>
)

// ─── Fatigue metrics panel ─────────────────────────────────────────────────────
const FatiguePanel = ({ fatigueScore, perclos, blinkRate, earValue, isFatigued, yawnDetected }) => {
  const blinkStatus =
    blinkRate === 0   ? { label: 'Measuring…', color: 'text-gray-400' } :
    blinkRate < 5     ? { label: 'Very Low (drowsy)', color: 'text-red-500 dark:text-red-400' } :
    blinkRate < 10    ? { label: 'Low (tired)', color: 'text-amber-500 dark:text-amber-400' } :
    blinkRate <= 20   ? { label: 'Normal', color: 'text-green-600 dark:text-green-400' } :
    blinkRate <= 30   ? { label: 'Elevated', color: 'text-amber-500 dark:text-amber-400' } :
                        { label: 'High (strain)', color: 'text-red-500 dark:text-red-400' }

  const fatigueLevel =
    fatigueScore < 20 ? 'Alert'    :
    fatigueScore < 50 ? 'Mild'     :
    fatigueScore < 75 ? 'Moderate' : 'High'
  const fatigueLevelColor =
    fatigueScore < 20 ? 'text-green-600 dark:text-green-400' :
    fatigueScore < 50 ? 'text-amber-500 dark:text-amber-400' :
                        'text-red-500 dark:text-red-400'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" /> Fatigue Monitor
        </h3>
        <span className={`text-sm font-bold ${fatigueLevelColor}`}>{fatigueLevel}</span>
      </div>

      <ScoreBar
        value={fatigueScore}
        label="Fatigue Score"
        sublabel={`${fatigueScore}/100`}
        colorFn={v => v < 30 ? 'bg-green-500' : v < 60 ? 'bg-amber-500' : 'bg-red-500'}
      />

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">PERCLOS</p>
          <p className={`text-sm font-bold ${perclos > 15 ? 'text-red-500' : perclos > 8 ? 'text-amber-500' : 'text-green-600'}`}>{perclos}%</p>
          <p className="text-xs text-gray-400">eye-close %</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Blink Rate</p>
          <p className={`text-sm font-bold ${blinkStatus.color}`}>{blinkRate} BPM</p>
          <p className="text-xs text-gray-400">{blinkStatus.label}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">EAR</p>
          <p className={`text-sm font-bold ${earValue > 0 && earValue < 0.25 ? 'text-red-500' : earValue >= 0.25 ? 'text-green-600' : 'text-gray-400'}`}>
            {earValue > 0 ? earValue : '—'}
          </p>
          <p className="text-xs text-gray-400">eye open ratio</p>
        </div>
      </div>

      <div className="flex gap-2 text-xs flex-wrap">
        <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
          isFatigued ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        }`}>
          <EyeOff className="w-3 h-3" /> {isFatigued ? 'Eyes Closing' : 'Eyes Open'}
        </span>
        {yawnDetected && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1">
            🥱 Yawn
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" /> EAR &lt; 0.25 = eyes closing
        </span>
      </div>
    </div>
  )
}

// ─── Rest suggestion card ──────────────────────────────────────────────────────
const RestSuggestionCard = ({ suggestion, onDismiss }) => (
  <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4 animate-fade-in">
    <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Rest Suggestion</p>
      <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">{suggestion.text}</p>
      <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
        {suggestion.type === 'eye_closure' ? '😴 Fatigue: eye closure detected' :
         suggestion.type === 'yawn'        ? '🥱 Fatigue: yawn detected' :
                                             '⚠ General fatigue signal'}
      </p>
    </div>
    <button onClick={onDismiss} className="flex-shrink-0 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
      <X className="w-4 h-4 text-blue-500" />
    </button>
  </div>
)

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PresenceDetection() {
  const { isRunning, sessionType, goalMeta } = useTimer()
  const {
    cameraEnabled, setCameraEnabled,
    videoRef, canvasRef,
    modelsLoading, isPresent, faceCount, isFatigued, confidence,
    cameraError,
    fatigueScore, blinkRate, perclos, yawnDetected, earValue,
    presenceSession, livePercent, absenceWarning, checkinMsg,
    restSuggestion, dismissRestSuggestion,
    history, histLoading, cameraAudit,
    handleManualCheckin, loadCameraAudit,
  } = usePresence()

  const [view, setView] = useState('session')

  useEffect(() => { if (view === 'audit') loadCameraAudit() }, [view, loadCameraAudit])

  const timerActive = isRunning && sessionType === 'focus'

  const formatDuration = secs => {
    if (!secs) return '0m'
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presence Detection</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            On-device AI webcam monitoring — no images stored or transmitted
          </p>
        </div>
      </div>

      {/* Timer status banner */}
      <div className={`flex items-start gap-3 rounded-xl p-4 border ${
        timerActive
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      }`}>
        <Timer className={`w-5 h-5 flex-shrink-0 mt-0.5 ${timerActive ? 'text-green-600' : 'text-blue-600 dark:text-blue-400'}`} />
        {timerActive ? (
          <p className="text-sm text-green-800 dark:text-green-300">
            <strong>Focus session active.</strong> Presence tracking is running automatically.
            {goalMeta?.title && <span className="ml-1">Goal: <em>{goalMeta.title}</em></span>}
          </p>
        ) : (
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>No active focus session.</strong> Presence detection starts automatically when you start the Focus Timer.
            </p>
            <Link to="/focus" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline">
              Go to Focus Timer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-purple-800 dark:text-purple-300">
          <strong>Privacy-First AI:</strong> Face detection runs entirely in your browser using TinyFaceDetector.
          Only metadata is recorded (present/absent, confidence, EAR, blink rate) — <strong>no images are ever stored or transmitted</strong>.
          Camera access can be revoked any time via your browser settings.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['session', 'Live Monitor'], ['history', 'History'], ['audit', 'Camera Audit']].map(([val, label]) => (
          <button key={val} onClick={() => setView(val)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === val
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── LIVE MONITOR ── */}
      {view === 'session' && (
        <div className="space-y-4">

          {/* Rest suggestion (fatigue response) */}
          {restSuggestion && (
            <RestSuggestionCard suggestion={restSuggestion} onDismiss={dismissRestSuggestion} />
          )}

          {/* Absence warning — fires after 15 s of no face */}
          {absenceWarning && presenceSession && (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Are you still there?</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  No face detected for 15 seconds. Click "I'm Here!" to confirm your presence.
                </p>
              </div>
              <button onClick={handleManualCheckin}
                className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors">
                I'm Here!
              </button>
            </div>
          )}

          {/* Check-in success */}
          {checkinMsg && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> {checkinMsg}
            </div>
          )}

          {/* Main card */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            {!presenceSession ? (
              /* No active session */
              <div className="text-center space-y-5 py-4">
                <div className="flex justify-center">
                  <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <Timer className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Waiting for Focus Session</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Start the Focus Timer to begin automatic presence tracking
                  </p>
                </div>
                <Link to="/focus"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  <Timer className="w-4 h-4" /> Open Focus Timer
                </Link>

                {/* Camera preview */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI Camera Preview</span>
                    <button onClick={() => setCameraEnabled(v => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cameraEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${cameraEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    {cameraEnabled ? <Camera className="w-4 h-4 text-purple-500" /> : <CameraOff className="w-4 h-4 text-gray-400" />}
                  </div>
                  {cameraEnabled && (
                    <>
                      <CameraFeed videoRef={videoRef} canvasRef={canvasRef} isPresent={isPresent}
                        isFatigued={isFatigued} yawnDetected={yawnDetected}
                        confidence={confidence} modelsLoading={modelsLoading} cameraError={cameraError} />
                      <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                        <Brain className="w-3.5 h-3.5" /> Preview only — detection records when a Focus session starts
                      </p>
                      {isPresent && (
                        <FatiguePanel fatigueScore={fatigueScore} perclos={perclos}
                          blinkRate={blinkRate} earValue={earValue}
                          isFatigued={isFatigued} yawnDetected={yawnDetected} />
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* Active presence session */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">Presence Active</span>
                    {cameraEnabled && (
                      <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
                        <Brain className="w-3 h-3" /> AI On
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Since {new Date(presenceSession.startedAt || presenceSession.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {cameraEnabled && (
                  <CameraFeed videoRef={videoRef} canvasRef={canvasRef} isPresent={isPresent}
                    isFatigued={isFatigued} yawnDetected={yawnDetected}
                    confidence={confidence} modelsLoading={modelsLoading} cameraError={cameraError} />
                )}

                {/* Real-time face/yawn status strip */}
                {cameraEnabled && !cameraError && !modelsLoading && (
                  <div className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border ${
                    isPresent
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  }`}>
                    {isPresent
                      ? <><UserCheck className="w-4 h-4" /> {faceCount} face{faceCount !== 1 ? 's' : ''} detected · {confidence}% conf</>
                      : <><UserX className="w-4 h-4" /> No face detected — move into camera view</>
                    }
                  </div>
                )}

                {/* Fatigue panel — shown when camera is on and face is visible */}
                {cameraEnabled && isPresent && (
                  <FatiguePanel fatigueScore={fatigueScore} perclos={perclos}
                    blinkRate={blinkRate} earValue={earValue}
                    isFatigued={isFatigued} yawnDetected={yawnDetected} />
                )}

                {/* Presence score ring */}
                <div className="flex flex-col items-center gap-1">
                  <PresenceRing percent={livePercent} size="lg" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Presence Score</p>
                </div>

                {/* Session stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    ['Check-ins', presenceSession.manualCheckIns || 0],
                    ['Warnings',  presenceSession.absenceWarnings || 0],
                    ['Checks',    presenceSession.totalChecks || 0],
                    ['Fatigue',   presenceSession.fatigueAlerts || 0],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{val}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={handleManualCheckin}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
                    <Hand className="w-5 h-5" /> I'm Here!
                  </button>
                  <button onClick={() => setCameraEnabled(v => !v)}
                    title={cameraEnabled ? 'Disable AI camera' : 'Enable AI camera'}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors ${
                      cameraEnabled
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                    {cameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600">
                  Presence session ends automatically when the Focus Timer stops
                </p>
              </div>
            )}
          </div>

          {/* History summary stats */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={Activity}      label="Sessions Tracked" value={history.length}                                                                                                    color="bg-purple-500" />
              <StatCard icon={UserCheck}     label="Avg Presence"     value={`${Math.round(history.reduce((s, h) => s + (h.presencePercent || 0), 0) / history.length)}%`}                    color="bg-green-500" />
              <StatCard icon={Clock}         label="Total Time"       value={formatDuration(history.reduce((s, h) => s + (h.durationSeconds || 0), 0))}                                       color="bg-blue-500" />
              <StatCard icon={AlertTriangle} label="Total Warnings"   value={history.reduce((s, h) => s + (h.absenceWarnings || 0), 0)}                                                       color="bg-amber-500" />
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY ── */}
      {view === 'history' && (
        <div className="space-y-3">
          {histLoading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-gray-400 dark:text-gray-600">
              No sessions yet. Start the Focus Timer to begin tracking.
            </div>
          ) : (
            history.map(s => (
              <div key={s._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <PresenceRing percent={Math.round(s.presencePercent || 0)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(s.startedAt || s.createdAt).toLocaleDateString()} ·{' '}
                      {new Date(s.startedAt || s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {s.cameraEnabled && (
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                    {(s.fatigueAlerts || 0) > 0 && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        ⚠ {s.fatigueAlerts} fatigue alert{s.fatigueAlerts !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Duration: {formatDuration(s.durationSeconds)} · Checks: {s.totalChecks} · Warnings: {s.absenceWarnings} · Manual: {s.manualCheckIns}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CAMERA AUDIT ── */}
      {view === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800 dark:text-green-300">
              <strong>Audit Guarantee:</strong> All face detection is on-device.
              The log below confirms <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded">imageDataStored</code> is always <strong>false</strong>.
              Events are logged with timestamps, action type, and reason — never with image data.
            </div>
          </div>

          {/* Audit log legend */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Logged Event Types</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { icon: '🟢', label: 'presence_detected', desc: 'Face visible in frame' },
                { icon: '🔴', label: 'absence_detected', desc: 'No face in frame' },
                { icon: '⚠️', label: 'fatigue_alert', desc: 'Eye closure / yawn' },
                { icon: '✋', label: 'manual_checkin', desc: 'User pressed "I\'m Here"' },
                { icon: '📷', label: 'camera_enabled', desc: 'Camera turned on' },
                { icon: '🚫', label: 'camera_disabled', desc: 'Camera turned off' },
              ].map(e => (
                <div key={e.label} className="flex items-start gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span>{e.icon}</span>
                  <div>
                    <p className="font-mono font-medium text-gray-800 dark:text-gray-200 text-xs">{e.label}</p>
                    <p className="text-gray-400 dark:text-gray-500">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Camera Event Log</h3>
              <span className="text-xs text-gray-400">{cameraAudit.length} event{cameraAudit.length !== 1 ? 's' : ''}</span>
            </div>
            {cameraAudit.length === 0 ? (
              <p className="p-6 text-center text-gray-400 dark:text-gray-600 text-sm">No camera events recorded.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
                {cameraAudit.map(a => (
                  <div key={a._id} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{a.action.replace(/_/g, ' ')}</span>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{new Date(a.createdAt).toLocaleString()}</span>
                      {a.reason && <p className="text-xs text-gray-400 mt-0.5">Reason: {a.reason}</p>}
                    </div>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      No image stored
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
