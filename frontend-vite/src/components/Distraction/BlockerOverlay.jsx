import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Clock, ShieldOff, X } from 'lucide-react'
import { useDistraction } from '../../contexts/DistractionContext'

const BlockerOverlay = () => {
  const {
    blockingActive,
    evaluateUrl,
    consumeWarning,
    logEvent,
    settings,
    timerContext
  } = useDistraction()

  const [visible, setVisible] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [initialCountdown, setInitialCountdown] = useState(0)
  const [canOverride, setCanOverride] = useState(false)
  const countdownRef = useRef(null)

  const show = useCallback((evalResult) => {
    setEvaluation(evalResult)
    setVisible(true)
    setCanOverride(false)

    if (evalResult.requiresDelay) {
      const delay = evalResult.overrideDelaySeconds || 10
      setCountdown(delay)
      setInitialCountdown(delay)
    } else {
      setCountdown(0)
      setInitialCountdown(0)
      setCanOverride(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setEvaluation(null)
    setCountdown(0)
    setInitialCountdown(0)
    setCanOverride(false)
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const handleOverride = useCallback(async () => {
    if (!evaluation) return
    consumeWarning()
    const payload = {
      site: evaluation.host || evaluation.matchedSite || 'unknown',
      action: 'override',
      overrideType: evaluation.strictnessLevel || 'soft',
      sessionId: timerContext.sessionId || undefined,
      goalId: timerContext.goalId || undefined,
      source: 'app'
    }
    await logEvent(payload)
    dismiss()
  }, [evaluation, timerContext, consumeWarning, logEvent, dismiss])

  // Countdown timer
  useEffect(() => {
    if (!visible || countdown <= 0) return
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
          setCanOverride(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [visible, countdown > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // Expose trigger on window for extension/socket events
  useEffect(() => {
    const handleBlockEvent = (event) => {
      const url = event.detail?.url || event.detail?.site
      if (!url || !blockingActive) return
      const result = evaluateUrl(url)
      if (result.blocked) {
        show(result)
        logEvent({
          site: result.host || result.matchedSite || url,
          action: 'blocked',
          sessionId: timerContext.sessionId || undefined,
          goalId: timerContext.goalId || undefined,
          source: 'app'
        })
      }
    }
    window.addEventListener('distraction:check', handleBlockEvent)
    return () => window.removeEventListener('distraction:check', handleBlockEvent)
  }, [blockingActive, evaluateUrl, show, logEvent, timerContext])

  useEffect(() => {
    window.__checkDistraction = (url) => {
      if (!blockingActive) return { blocked: false }
      const result = evaluateUrl(url)
      if (result.blocked) {
        show(result)
        logEvent({
          site: result.host || result.matchedSite || url,
          action: 'blocked',
          sessionId: timerContext.sessionId || undefined,
          goalId: timerContext.goalId || undefined,
          source: 'app'
        })
      }
      return result
    }
    return () => { delete window.__checkDistraction }
  }, [blockingActive, evaluateUrl, show, logEvent, timerContext])

  if (!visible || !evaluation) return null

  const isSoft = evaluation.strictnessLevel === 'soft' && evaluation.warningsRemaining > 0
  const siteName = evaluation.matchedSite || evaluation.host || 'this site'
  const progressPct = initialCountdown > 0 ? ((initialCountdown - countdown) / initialCountdown) * 100 : 100

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md animate-[fadeIn_200ms_ease-out]">
      <div className="mx-4 w-full max-w-md animate-[slideUp_300ms_ease-out] rounded-3xl border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 shadow-2xl overflow-hidden">

        {/* Color bar at top */}
        <div className={`h-1.5 w-full ${isSoft ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-500 to-red-600'}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isSoft
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {isSoft
                  ? <AlertTriangle className="h-7 w-7 text-amber-600" />
                  : <ShieldOff className="h-7 w-7 text-red-600" />
                }
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isSoft ? 'Distraction Warning' : 'Site Blocked'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{siteName}</p>
              </div>
            </div>
            {isSoft && (
              <button onClick={dismiss} className="rounded-xl p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Message */}
          <div className={`mt-5 rounded-2xl p-4 text-sm leading-relaxed ${
            isSoft
              ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-200'
              : 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
          }`}>
            {isSoft ? (
              <>
                <strong>{siteName}</strong> is on your blocklist. You have{' '}
                <span className="inline-flex items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800/50 px-2 py-0.5 text-xs font-bold">
                  {evaluation.warningsRemaining}
                </span>{' '}
                warning{evaluation.warningsRemaining !== 1 ? 's' : ''} remaining this session.
              </>
            ) : (
              <>
                <strong>{siteName}</strong> is blocked during your focus session.
                {evaluation.matchedKeyword && (
                  <> Matched keyword: <strong>{evaluation.matchedKeyword}</strong>.</>
                )}
              {countdown > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> Override available in</span>
                    <span className="font-bold text-base">{countdown}s</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs opacity-80">You may override, but it will be logged.</p>
              )}
            </>
          )}
        </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {isSoft ? (
              <>
                <button
                  onClick={dismiss}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Stay focused
                </button>
                <button
                  onClick={handleOverride}
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all"
                >
                  Continue anyway
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={dismiss}
                  className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-primary-600 hover:to-primary-700 transition-all"
                >
                  Back to work
                </button>
                <button
                  onClick={handleOverride}
                  disabled={!canOverride}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    canOverride
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {canOverride ? 'Override (logged)' : `Wait ${countdown}s…`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockerOverlay
