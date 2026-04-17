import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'

const DistractionContext = createContext(null)

const strictnessMap = {
  low: { overrideDelaySeconds: 5, warningsAllowed: 3 },
  medium: { overrideDelaySeconds: 10, warningsAllowed: 1 },
  high: { overrideDelaySeconds: 15, warningsAllowed: 0 },
}

const parseTimeToMinutes = (value) => {
  if (!value) return null
  const [hours, minutes] = String(value).split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return (hours * 60) + minutes
}

const isScheduleActive = (schedule = []) => {
  if (!Array.isArray(schedule) || schedule.length === 0) return false
  const now = new Date()
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()

  return schedule.some(entry => {
    if (!entry || entry.enabled === false) return false
    if (Number(entry.dayOfWeek) !== day) return false

    const startMinutes = parseTimeToMinutes(entry.startTime)
    const endMinutes = parseTimeToMinutes(entry.endTime)
    if (startMinutes === null || endMinutes === null) return false

    if (endMinutes < startMinutes) {
      return minutes >= startMinutes || minutes <= endMinutes
    }

    return minutes >= startMinutes && minutes <= endMinutes
  })
}

const normalizeSite = (value) => {
  if (!value) return null
  let site = String(value).trim().toLowerCase()
  if (!site) return null
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '')
  site = site.split('/')[0]
  return site || null
}

const matchBlockedSite = (host, blockedSites = []) => {
  if (!host) return null
  const normalized = normalizeSite(host)
  if (!normalized) return null

  for (const site of blockedSites) {
    const blocked = normalizeSite(site)
    if (!blocked) continue
    if (normalized === blocked || normalized.endsWith(`.${blocked}`)) {
      return blocked
    }
  }

  return null
}

const matchBlockedKeyword = (url, keywords = []) => {
  if (!url) return null
  const haystack = String(url).toLowerCase()
  return keywords.find(keyword => keyword && haystack.includes(String(keyword).toLowerCase())) || null
}

export const DistractionProvider = ({ children }) => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scheduleActive, setScheduleActive] = useState(false)
  const [timerContext, setTimerContext] = useState({
    sessionId: null,
    goalId: null,
    isRunning: false
  })

  const warningCountRef = useRef(0)

  const refreshSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.distraction.getSettings()
      if (response.success) {
        setSettings(response.data)
      }
    } catch (err) {
      console.error('Failed to load distraction settings:', err)
      setError('Unable to load distraction settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (payload) => {
    try {
      const response = await api.distraction.updateSettings(payload)
      if (response.success) {
        setSettings(response.data)
        return response.data
      }
    } catch (err) {
      console.error('Failed to save distraction settings:', err)
      throw err
    }
    return null
  }, [])

  const logEvent = useCallback(async (payload) => {
    try {
      const enriched = {
        ...payload,
        sessionId: payload.sessionId || timerContext.sessionId || undefined,
        goalId: payload.goalId || timerContext.goalId || undefined
      }
      return await api.distraction.logEvent(enriched)
    } catch (err) {
      console.error('Failed to log distraction event:', err)
      return null
    }
  }, [timerContext.sessionId, timerContext.goalId])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  useEffect(() => {
    const updateSchedule = () => {
      setScheduleActive(isScheduleActive(settings?.schedule || []))
    }

    updateSchedule()
    const interval = setInterval(updateSchedule, 30000)
    return () => clearInterval(interval)
  }, [settings])

  useEffect(() => {
    warningCountRef.current = 0
  }, [timerContext.sessionId, scheduleActive, settings?.enabled])

  const strictnessConfig = strictnessMap[settings?.strictnessIntensity || 'medium'] || strictnessMap.medium
  const blockingActive = Boolean(settings?.enabled) && (timerContext.isRunning || scheduleActive)

  const evaluateUrl = useCallback((url) => {
    if (!blockingActive) {
      return { blocked: false }
    }

    const host = normalizeSite(url)
    const siteMatch = matchBlockedSite(host, settings?.blockedSites || [])
    const keywordMatch = matchBlockedKeyword(url, settings?.blockedKeywords || [])

    if (!siteMatch && !keywordMatch) {
      return { blocked: false }
    }

    const warningsAllowed = strictnessConfig.warningsAllowed
    const warningsRemaining = Math.max(0, warningsAllowed - warningCountRef.current)
    const strictnessLevel = settings?.strictnessLevel || 'soft'
    const requiresDelay = strictnessLevel === 'hard' || warningsRemaining <= 0

    return {
      blocked: true,
      host: siteMatch || host,
      matchedSite: siteMatch,
      matchedKeyword: keywordMatch,
      strictnessLevel,
      warningsRemaining,
      overrideDelaySeconds: strictnessConfig.overrideDelaySeconds,
      requiresDelay
    }
  }, [blockingActive, settings, strictnessConfig])

  const consumeWarning = useCallback(() => {
    warningCountRef.current += 1
  }, [])

  const value = useMemo(() => ({
    settings,
    loading,
    error,
    scheduleActive,
    blockingActive,
    timerContext,
    refreshSettings,
    saveSettings,
    setTimerContext,
    evaluateUrl,
    consumeWarning,
    logEvent
  }), [settings, loading, error, scheduleActive, blockingActive, timerContext, refreshSettings, saveSettings, setTimerContext, evaluateUrl, consumeWarning, logEvent])

  return (
    <DistractionContext.Provider value={value}>
      {children}
    </DistractionContext.Provider>
  )
}

export const useDistraction = () => {
  const context = useContext(DistractionContext)
  if (!context) {
    throw new Error('useDistraction must be used within DistractionProvider')
  }
  return context
}

export default DistractionContext
