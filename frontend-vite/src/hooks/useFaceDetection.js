/**
 * useFaceDetection – Real AI face detection using face-api.js
 *
 * Fatigue signals detected:
 *   1. Sustained eye closure  ≥ 1.5 s   (EAR < 0.25)
 *   2. Yawn                              (MAR > 0.50)
 *   3. Low blink rate         < 5 BPM   (prolonged staring → eye strain)
 *   4. PERCLOS                > 15 %    (% of time eyes closed in last 2 min)
 *
 * Privacy: only numeric metadata produced — no images ever stored or sent.
 */
import { useRef, useState, useEffect, useCallback } from 'react'
import * as faceapi from 'face-api.js'

// ── Detection thresholds ───────────────────────────────────────────────────────
const EAR_CLOSED_THRESHOLD = 0.25    // eye aspect ratio below this = eyes closing/closed
const FATIGUE_CLOSE_MS     = 1500    // sustain closure this long → fatigue event fires
const MAR_YAWN_THRESHOLD   = 0.50    // mouth aspect ratio above this = yawn
const PERCLOS_WINDOW_MS    = 120_000 // rolling 2-min window for PERCLOS calculation
const BLINK_WINDOW_MS      = 60_000  // rolling 1-min window for blink rate
const MODELS_PATH          = '/models'

// ── Math helpers ───────────────────────────────────────────────────────────────
function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/** Eye Aspect Ratio – 6-point eye landmark array */
function calcEAR(eye) {
  const v1 = dist(eye[1], eye[5])
  const v2 = dist(eye[2], eye[4])
  const h  = dist(eye[0], eye[3])
  return h > 0 ? (v1 + v2) / (2 * h) : 0.30
}

/**
 * Mouth Aspect Ratio – face-api getMouth() returns 20 points (indices 48-67)
 *   index 0  = point 48 (left outer corner)
 *   index 6  = point 54 (right outer corner)
 *   index 14 = point 62 (inner top lip)
 *   index 18 = point 66 (inner bottom lip)
 */
function calcMAR(mouth) {
  if (!mouth || mouth.length < 20) return 0
  const vertical   = dist(mouth[14], mouth[18])
  const horizontal = dist(mouth[0],  mouth[6])
  return horizontal > 0 ? vertical / horizontal : 0
}

// ── Draw rounded rect (fallback if roundRect not available) ───────────────────
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useFaceDetection({
  enabled     = false,
  intervalMs  = 800,       // faster than before for reliable eye-close detection
  onPresenceChange,        // (isPresent: bool, confidence: number) => void
  onFatigue,               // ({ type, ear?, mar?, perclos, blinkRate }) => void
}) {
  // ── Persistent refs (callback refs survive navigation remounts) ────────────
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef  = useRef(null)

  // Callback refs: re-attach stream + restart detection when elements remount
  const videoCallbackRef = useCallback((node) => {
    videoRef.current = node
    if (node && streamRef.current) {
      node.srcObject = streamRef.current
      node.play().catch(() => {})
    }
  }, [])

  const canvasCallbackRef = useCallback((node) => {
    canvasRef.current = node
    if (node && streamRef.current) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(runDetectionRef.current, intervalMsRef.current)
    }
  }, [])

  const runDetectionRef = useRef(null)
  const intervalMsRef   = useRef(intervalMs)

  // ── Fatigue tracking refs ──────────────────────────────────────────────────
  const eyeClosedStartRef  = useRef(null)    // timestamp when eyes first closed this bout
  const eyeWasClosedRef    = useRef(false)   // previous-frame eye state (blink detection)
  const blinkTimestampsRef = useRef([])      // timestamps of completed blinks
  const perclosFramesRef   = useRef([])      // { ts: ms, closed: bool }
  const isFatiguedRef      = useRef(false)   // prevents duplicate onFatigue calls
  const yawnActiveRef      = useRef(false)   // current yawn active
  const yawnClearRef       = useRef(null)    // timeout to auto-clear yawn state
  const startTimeRef       = useRef(null)    // when camera started (for elapsed time)

  // ── State ──────────────────────────────────────────────────────────────────
  const [modelsLoaded,  setModelsLoaded]  = useState(false)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [isPresent,     setIsPresent]     = useState(false)
  const [faceCount,     setFaceCount]     = useState(0)
  const [isFatigued,    setIsFatigued]    = useState(false)
  const [confidence,    setConfidence]    = useState(0)
  const [cameraError,   setCameraError]   = useState(null)
  const [cameraActive,  setCameraActive]  = useState(false)
  // Fatigue metrics
  const [fatigueScore,  setFatigueScore]  = useState(0)    // 0–100 composite
  const [blinkRate,     setBlinkRate]     = useState(0)    // blinks per minute
  const [perclos,       setPerclos]       = useState(0)    // % of time eyes closed
  const [yawnDetected,  setYawnDetected]  = useState(false)
  const [earValue,      setEarValue]      = useState(0)    // current EAR reading

  // ── Load models once ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      setModelsLoading(true)
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_PATH),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_PATH),
        ])
        if (!cancelled) setModelsLoaded(true)
      } catch (e) {
        console.error('[FaceDetection] Model load failed:', e)
        if (!cancelled) setCameraError('Failed to load AI models — check /public/models/')
      } finally {
        if (!cancelled) setModelsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current   = stream
      startTimeRef.current = Date.now()
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => videoRef.current.play().catch(() => {})
      }
      setCameraActive(true)
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' :
        err.name === 'NotFoundError'   ? 'No camera found on this device.' :
        'Could not start camera: ' + err.message
      setCameraError(msg)
      setCameraActive(false)
    }
  }, [])

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (timerRef.current)   { clearInterval(timerRef.current);  timerRef.current  = null }
    if (yawnClearRef.current){ clearTimeout(yawnClearRef.current); yawnClearRef.current = null }
    if (streamRef.current)  { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (videoRef.current)   { videoRef.current.srcObject = null }
    if (canvasRef.current)  {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
    // Reset state
    setCameraActive(false); setIsPresent(false); setFaceCount(0)
    setIsFatigued(false);   setConfidence(0);    setFatigueScore(0)
    setBlinkRate(0);        setPerclos(0);       setYawnDetected(false); setEarValue(0)
    // Reset refs
    eyeClosedStartRef.current  = null;  eyeWasClosedRef.current   = false
    blinkTimestampsRef.current = [];    perclosFramesRef.current   = []
    isFatiguedRef.current      = false; yawnActiveRef.current      = false
    startTimeRef.current       = null
  }, [])

  useEffect(() => { intervalMsRef.current = intervalMs }, [intervalMs])

  // ── Detection loop ─────────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || video.readyState < 2 || !canvas) return

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 }))
        .withFaceLandmarks(true)

      const now     = Date.now()
      const count   = detections.length
      const present = count > 0
      const conf    = present ? Math.round(detections[0].detection.score * 100) : 0

      setFaceCount(count)
      setIsPresent(present)
      setConfidence(conf)
      onPresenceChange?.(present, conf)

      // ── Per-face fatigue analysis ────────────────────────────────────────
      let activeEyesClosed = false
      let activeYawn       = false
      let currentScore     = 0

      if (present) {
        const lm       = detections[0].landmarks
        const leftEye  = lm.getLeftEye()
        const rightEye = lm.getRightEye()
        const ear      = (calcEAR(leftEye) + calcEAR(rightEye)) / 2
        const earRound = +ear.toFixed(3)
        setEarValue(earRound)

        const eyesClosed = ear < EAR_CLOSED_THRESHOLD
        activeEyesClosed  = eyesClosed

        // ── Blink detection (closed → open transition = 1 blink) ──────────
        if (!eyesClosed && eyeWasClosedRef.current) {
          blinkTimestampsRef.current.push(now)
        }
        eyeWasClosedRef.current = eyesClosed

        blinkTimestampsRef.current = blinkTimestampsRef.current.filter(t => now - t < BLINK_WINDOW_MS)
        const elapsedMs  = startTimeRef.current ? Math.min(now - startTimeRef.current, BLINK_WINDOW_MS) : BLINK_WINDOW_MS
        const elapsedMin = Math.max(elapsedMs / 60_000, 0.05)
        const bpm        = Math.round(blinkTimestampsRef.current.length / elapsedMin)
        setBlinkRate(bpm)

        // ── PERCLOS (rolling 2-min window) ─────────────────────────────────
        perclosFramesRef.current.push({ ts: now, closed: eyesClosed })
        perclosFramesRef.current = perclosFramesRef.current.filter(f => now - f.ts < PERCLOS_WINDOW_MS)
        const closedCount  = perclosFramesRef.current.filter(f => f.closed).length
        const perclosValue = Math.round((closedCount / perclosFramesRef.current.length) * 100)
        setPerclos(perclosValue)

        // ── Sustained eye closure → fatigue event ─────────────────────────
        if (eyesClosed) {
          if (!eyeClosedStartRef.current) {
            eyeClosedStartRef.current = now
          } else if (now - eyeClosedStartRef.current >= FATIGUE_CLOSE_MS) {
            setIsFatigued(true)
            if (!isFatiguedRef.current) {
              isFatiguedRef.current = true
              onFatigue?.({ type: 'eye_closure', ear: earRound, perclos: perclosValue, blinkRate: bpm })
            }
          }
        } else {
          eyeClosedStartRef.current = null
          if (isFatiguedRef.current) {
            isFatiguedRef.current = false
            setIsFatigued(false)
          }
        }

        // ── Yawn detection via mouth aspect ratio ─────────────────────────
        try {
          const mouth = lm.getMouth()
          if (mouth && mouth.length >= 20) {
            const mar = calcMAR(mouth)
            activeYawn = mar > MAR_YAWN_THRESHOLD
            if (activeYawn) {
              if (!yawnActiveRef.current) {
                yawnActiveRef.current = true
                setYawnDetected(true)
                onFatigue?.({ type: 'yawn', mar: +mar.toFixed(3), perclos: perclosValue, blinkRate: bpm })
              }
              if (yawnClearRef.current) clearTimeout(yawnClearRef.current)
              yawnClearRef.current = setTimeout(() => {
                yawnActiveRef.current = false
                setYawnDetected(false)
              }, 3000)
            }
          }
        } catch (_) {}

        // ── Composite fatigue score (0–100) ───────────────────────────────
        currentScore = Math.min(100, Math.round(
          perclosValue * 1.5 +                         // PERCLOS drives most of the score
          (bpm < 5 && elapsedMin > 1 ? 25 : 0) +     // very low blink rate = drowsy stare
          (bpm > 30 ? 10 : 0) +                        // very high blink rate = eye strain
          (isFatiguedRef.current ? 30 : 0) +           // active sustained closure
          (yawnActiveRef.current ? 20 : 0)             // yawn
        ))
        setFatigueScore(currentScore)

      } else {
        // Face absent — reset eye tracking, keep PERCLOS history
        eyeClosedStartRef.current = null
        eyeWasClosedRef.current   = false
        if (isFatiguedRef.current) { isFatiguedRef.current = false; setIsFatigued(false) }
        setEarValue(0)
        // Add "not closed" frame for PERCLOS continuity
        perclosFramesRef.current.push({ ts: now, closed: false })
        perclosFramesRef.current = perclosFramesRef.current.filter(f => now - f.ts < PERCLOS_WINDOW_MS)
      }

      // ── Canvas drawing ───────────────────────────────────────────────────
      const displaySize = { width: video.videoWidth, height: video.videoHeight }
      faceapi.matchDimensions(canvas, displaySize)
      const resized = faceapi.resizeResults(detections, displaySize)

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Box colour reflects fatigue level
      const boxColor =
        activeEyesClosed || activeYawn  ? '#ef4444'  // red   = active fatigue
        : currentScore > 60             ? '#f97316'  // orange = high fatigue
        : currentScore > 30             ? '#f59e0b'  // amber = moderate
        : conf > 80                     ? '#22c55e'  // green = alert + confident
        :                                 '#6366f1'  // purple = detected

      resized.forEach(det => {
        const box   = det.detection.box
        const score = det.detection.score

        // Glow + bounding box
        ctx.save()
        ctx.strokeStyle = boxColor
        ctx.lineWidth   = 2.5
        ctx.shadowColor = boxColor
        ctx.shadowBlur  = 10
        ctx.strokeRect(box.x, box.y, box.width, box.height)
        ctx.restore()

        // Score badge
        ctx.fillStyle   = boxColor
        ctx.globalAlpha = 0.85
        ctx.fillRect(box.x, box.y - 22, 100, 22)
        ctx.globalAlpha = 1
        ctx.fillStyle   = '#fff'
        ctx.font        = 'bold 12px system-ui'
        ctx.fillText(`Face ${Math.round(score * 100)}%`, box.x + 6, box.y - 6)

        // Landmark dots
        if (det.landmarks) {
          ctx.fillStyle = boxColor
          det.landmarks.positions.forEach(pt => {
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI); ctx.fill()
          })
        }
      })

      // No-face dashed outline
      if (!present) {
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([8, 6])
        const pw = canvas.width * 0.3, ph = canvas.height * 0.5
        const px = (canvas.width - pw) / 2, py = (canvas.height - ph) / 2
        ctx.strokeRect(px, py, pw, ph)
        ctx.setLineDash([])
        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'
        ctx.fillText('No face detected', canvas.width / 2, py - 8)
        ctx.textAlign = 'left'
      }

      // Fatigue badge overlay
      if (present && (activeEyesClosed || activeYawn || currentScore > 50)) {
        const label  = activeEyesClosed ? '😴 Eyes Closing'
                      : activeYawn      ? '🥱 Yawn Detected'
                      :                   '⚠ Fatigue'
        const bw = 155, bh = 26
        const bx = canvas.width  - bw - 8
        const by = canvas.height - bh - 8
        ctx.fillStyle = 'rgba(239,68,68,0.88)'
        drawRoundedRect(ctx, bx, by, bw, bh, 5)
        ctx.fill()
        ctx.fillStyle  = '#fff'; ctx.font = 'bold 12px system-ui'
        ctx.textAlign  = 'center'
        ctx.fillText(label, bx + bw / 2, by + 17)
        ctx.textAlign  = 'left'
      }

    } catch (_) {
      // Silently swallow per-frame errors (tab hidden, video not ready, etc.)
    }
  }, [onPresenceChange, onFatigue])

  // Keep runDetectionRef current
  useEffect(() => { runDetectionRef.current = runDetection }, [runDetection])

  // ── Activate / deactivate ──────────────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded) return
    if (enabled) {
      const t = setTimeout(() => {
        startCamera().then(() => {
          setTimeout(() => {
            timerRef.current = setInterval(runDetection, intervalMs)
          }, 800)
        })
      }, 50)
      return () => { clearTimeout(t); stopCamera() }
    } else {
      stopCamera()
    }
  }, [enabled, modelsLoaded])

  // Re-create interval when intervalMs changes while active
  useEffect(() => {
    if (!enabled || !cameraActive) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(runDetection, intervalMs)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [intervalMs, runDetection, cameraActive, enabled])

  return {
    videoRef:  videoCallbackRef,
    canvasRef: canvasCallbackRef,
    modelsLoaded, modelsLoading,
    isPresent, faceCount, isFatigued, confidence,
    cameraActive, cameraError,
    // Fatigue detail metrics
    fatigueScore, blinkRate, perclos, yawnDetected, earValue,
    stopCamera,
  }
}
