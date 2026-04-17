import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle, CheckCircle, Clock, Eye, Globe, Hash, List, Lock,
  Plus, RefreshCw, Search, Settings, Shield, ShieldCheck, ShieldOff,
  Sparkles, Target, Trash2, TrendingUp, Unlock, X, XCircle, Zap
} from 'lucide-react'
import Button from '../../components/UI/Button'
import { useNotification } from '../../contexts/NotificationContext'
import { useAuth } from '../../contexts/AuthContext'
import { useDistraction } from '../../contexts/DistractionContext'
import { connectSocket, disconnectSocket } from '../../services/socket'
import api from '../../services/api'

const days = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
]

const QUICK_ADD_PRESETS = [
  { label: 'YouTube', value: 'youtube.com', icon: '▶' },
  { label: 'Facebook', value: 'facebook.com', icon: 'f' },
  { label: 'Twitter / X', value: 'twitter.com', icon: '𝕏' },
  { label: 'Instagram', value: 'instagram.com', icon: '📷' },
  { label: 'Reddit', value: 'reddit.com', icon: '🔴' },
  { label: 'TikTok', value: 'tiktok.com', icon: '♪' },
  { label: 'Netflix', value: 'netflix.com', icon: '🎬' },
  { label: 'Twitch', value: 'twitch.tv', icon: '🎮' },
]

const TAB_CONFIG = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'dashboard', label: 'Dashboard', icon: Target },
  { id: 'live', label: 'Live Log', icon: Zap },
]

const formatSeconds = (value) => {
  if (!value && value !== 0) return '0s'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

/* ── Reusable mini-components ── */
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
      checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
)

const StatCard = ({ icon: Icon, label, value, color = 'primary', sub }) => {
  const colors = {
    primary: 'from-primary-500/10 to-primary-600/5 border-primary-200 dark:border-primary-800/40',
    red: 'from-red-500/10 to-red-600/5 border-red-200 dark:border-red-800/40',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800/40',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800/40',
  }
  const iconColors = {
    primary: 'text-primary-600 dark:text-primary-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colors[color]} p-5`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm ${iconColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

const Tag = ({ children, onRemove, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  }
  return (
    <span className={`group inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${colors[color]}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

const SectionCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 shadow-sm backdrop-blur-sm ${className}`}>
    {children}
  </div>
)

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between">
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
          <Icon className="h-4.5 w-4.5" />
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
)

const DistractionBlocker = () => {
  const { success, info } = useNotification()
  const { user } = useAuth()
  const userId = user?.user?._id || user?._id || user?.user?.id || user?.id || null
  const socketRef = useRef(null)

  const {
    settings,
    loading,
    saveSettings,
    blockingActive,
    evaluateUrl
  } = useDistraction()

  const [activeTab, setActiveTab] = useState('settings')
  const [formState, setFormState] = useState({
    blockedSites: [],
    blockedKeywords: [],
    strictnessLevel: 'soft',
    strictnessIntensity: 'medium',
    schedule: [],
    enabled: true
  })
  const [siteInput, setSiteInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [sessionSummary, setSessionSummary] = useState(null)
  const [sessionLogs, setSessionLogs] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [testUrl, setTestUrl] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [liveLogs, setLiveLogs] = useState([])
  const [liveLoading, setLiveLoading] = useState(false)
  const intensityOptions = ['low', 'medium', 'high']
  const intensityIndex = Math.max(0, intensityOptions.indexOf(formState.strictnessIntensity))

  useEffect(() => {
    if (settings) {
      setFormState({
        blockedSites: settings.blockedSites || [],
        blockedKeywords: settings.blockedKeywords || [],
        strictnessLevel: settings.strictnessLevel || 'soft',
        strictnessIntensity: settings.strictnessIntensity || 'medium',
        schedule: settings.schedule || [],
        enabled: settings.enabled !== false
      })
    }
  }, [settings])

  const loadSessions = useCallback(async () => {
    try {
      // Load from timer Session model directly (not ActivityLog)
      const response = await api.sessions.timerHistory({ limit: 12 })
      const list = response.success ? (response.data || []) : (Array.isArray(response) ? response : [])
      const mapped = list.map(s => ({
        sessionId: s._id || s.sessionId,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject,
        sessionType: s.sessionType
      }))
      setSessions(mapped)
      if (!selectedSessionId && mapped.length > 0) {
        setSelectedSessionId(mapped[0].sessionId)
      }
    } catch (error) {
      console.error('Failed to load sessions for dashboard:', error)
    }
  }, [selectedSessionId])

  // Load per-session distraction logs
  const loadSessionReport = useCallback(async (sessionId) => {
    if (!sessionId) return
    setDashboardLoading(true)
    try {
      const response = await api.distraction.getSession(sessionId)
      if (response?.success) {
        setSessionSummary(response.data?.summary || null)
        setSessionLogs(response.data?.logs || [])
        setDashboardLoading(false)
        return
      }
    } catch (error) {
      // Session may not have distraction data — that's OK
      console.warn('No distraction data for session:', sessionId, error?.response?.status)
    }
    // Fallback: show empty but don't error
    setSessionSummary({ totalAttempts: 0, blocked: 0, overrides: 0, distractionScore: 0, mostDistractingSite: null })
    setSessionLogs([])
    setDashboardLoading(false)
  }, [])

  // Load ALL recent distraction logs from /status endpoint
  const loadAllLogs = useCallback(async () => {
    try {
      const response = await api.distraction.getStatus()
      if (response?.success && response.data?.recentLogs) {
        return response.data.recentLogs
      }
    } catch (error) {
      console.error('Failed to load all distraction logs:', error)
    }
    return []
  }, [])

  const loadLiveLogs = useCallback(async () => {
    setLiveLoading(true)
    try {
      const logs = await loadAllLogs()
      setLiveLogs(logs)
    } catch (error) {
      console.error('Failed to load live logs:', error)
    } finally {
      setLiveLoading(false)
    }
  }, [loadAllLogs])

  // Simulate a block event for testing
  const simulateBlock = useCallback(async (site) => {
    if (!site) return
    try {
      await api.distraction.logEvent({
        site,
        action: 'blocked',
        sessionId: selectedSessionId || undefined,
        source: 'test'
      })
      success(`Simulated block for ${site}`)
      // Refresh data
      if (activeTab === 'dashboard') {
        if (selectedSessionId) loadSessionReport(selectedSessionId)
        loadAllLogs().then(logs => setLiveLogs(logs))
      }
      if (activeTab === 'live') loadLiveLogs()
    } catch (error) {
      info('Failed to simulate block event')
    }
  }, [activeTab, selectedSessionId, loadSessionReport, loadAllLogs, loadLiveLogs, success, info])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadSessions()
      // Also load all logs for the overview section
      loadAllLogs().then(logs => setLiveLogs(logs))
    }
  }, [activeTab, loadSessions, loadAllLogs])

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionReport(selectedSessionId)
    }
  }, [selectedSessionId, loadSessionReport])

  useEffect(() => {
    if (activeTab === 'live') {
      loadLiveLogs()
    }
  }, [activeTab, loadLiveLogs])

  useEffect(() => {
    if (!userId) return

    const socket = connectSocket(userId)
    socketRef.current = socket

    const handleUpdate = () => {
      if (activeTab === 'dashboard') {
        loadSessions()
        if (selectedSessionId) {
          loadSessionReport(selectedSessionId)
        }
        loadAllLogs().then(logs => setLiveLogs(logs))
      }
      if (activeTab === 'live') {
        loadLiveLogs()
      }
    }

    socket.on('distraction:updated', handleUpdate)

    return () => {
      socket.off('distraction:updated', handleUpdate)
      if (socketRef.current === socket) {
        disconnectSocket()
        socketRef.current = null
      }
    }
  }, [userId, activeTab, selectedSessionId, loadSessions, loadSessionReport, loadLiveLogs])

  const handleSave = async () => {
    try {
      await saveSettings(formState)
      success('Distraction settings updated')
    } catch (error) {
      info('Failed to save settings. Please try again.')
    }
  }

  const addSite = () => {
    const value = siteInput.trim().toLowerCase()
    if (!value) return
    if (formState.blockedSites.includes(value)) {
      setSiteInput('')
      return
    }
    const nextState = {
      ...formState,
      blockedSites: [...formState.blockedSites, value]
    }
    setFormState(nextState)
    saveSettings(nextState)
      .then(() => success('Added to blocklist'))
      .catch(() => {
        info('Failed to save blocklist. Please try again.')
      })
    setSiteInput('')
  }

  const addKeyword = () => {
    const value = keywordInput.trim().toLowerCase()
    if (!value) return
    if (formState.blockedKeywords.includes(value)) {
      setKeywordInput('')
      return
    }
    const nextState = {
      ...formState,
      blockedKeywords: [...formState.blockedKeywords, value]
    }
    setFormState(nextState)
    saveSettings(nextState)
      .then(() => success('Keyword added'))
      .catch(() => {
        info('Failed to save keywords. Please try again.')
      })
    setKeywordInput('')
  }

  const removeSite = (site) => {
    const nextState = {
      ...formState,
      blockedSites: formState.blockedSites.filter(item => item !== site)
    }
    setFormState(nextState)
    saveSettings(nextState).catch(() => {
      info('Failed to save blocklist. Please try again.')
    })
  }

  const removeKeyword = (keyword) => {
    const nextState = {
      ...formState,
      blockedKeywords: formState.blockedKeywords.filter(item => item !== keyword)
    }
    setFormState(nextState)
    saveSettings(nextState).catch(() => {
      info('Failed to save keywords. Please try again.')
    })
  }

  const updateScheduleEntry = (index, updates) => {
    setFormState(prev => {
      const nextSchedule = [...prev.schedule]
      nextSchedule[index] = { ...nextSchedule[index], ...updates }
      return { ...prev, schedule: nextSchedule }
    })
  }

  const addScheduleEntry = () => {
    setFormState(prev => ({
      ...prev,
      schedule: [...prev.schedule, { dayOfWeek: 1, startTime: '18:00', endTime: '21:00', enabled: true }]
    }))
  }

  const removeScheduleEntry = (index) => {
    setFormState(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, idx) => idx !== index)
    }))
  }

  const quickAddSite = (site) => {
    if (formState.blockedSites.includes(site)) return
    const nextState = {
      ...formState,
      blockedSites: [...formState.blockedSites, site]
    }
    setFormState(nextState)
    saveSettings(nextState)
      .then(() => success(`Added ${site}`))
      .catch(() => info('Failed to save'))
  }

  const handleTestUrl = () => {
    const url = testUrl.trim()
    if (!url) return
    const result = evaluateUrl(url)
    setTestResult(result)
  }

  const topSites = useMemo(() => {
    const counts = sessionLogs.reduce((acc, log) => {
      const site = log.site || 'unknown'
      acc[site] = (acc[site] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [sessionLogs])

  if (loading && !settings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-primary-100 dark:border-primary-900/30" />
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading blocker settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
            blockingActive
              ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
              : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-500 dark:text-gray-400'
          }`}>
            {blockingActive ? <ShieldCheck className="h-7 w-7" /> : <ShieldOff className="h-7 w-7" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Distraction Blocker</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Block distracting sites, track overrides, and stay focused.
            </p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          blockingActive
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
            : 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700/40'
        }`}>
          <span className={`h-2 w-2 rounded-full ${blockingActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
          {blockingActive ? 'Protection Active' : 'Protection Off'}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1">
        {TAB_CONFIG.map(({ id, label, icon: TabIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <TabIcon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

    

      {/* ═══════════ SETTINGS TAB ═══════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-6">

          {/* ── Master Toggle ── */}
          <SectionCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  formState.enabled
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-800/60 text-gray-400'
                }`}>
                  {formState.enabled ? <Shield className="h-6 w-6" /> : <ShieldOff className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {formState.enabled ? 'Blocker Enabled' : 'Blocker Disabled'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formState.enabled ? 'Distracting sites will be blocked during focus time.' : 'Turn on to start blocking distracting sites.'}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={formState.enabled}
                onChange={(val) => setFormState(prev => ({ ...prev, enabled: val }))}
              />
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Blocked Sites ── */}
            <SectionCard className="p-6 space-y-5">
              <SectionHeader icon={Globe} title="Blocked Websites" subtitle="Sites that will be intercepted" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={siteInput}
                    onChange={(e) => setSiteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSite()}
                    placeholder="e.g. youtube.com"
                    className="w-full rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <Button variant="primary" size="md" onClick={addSite} className="rounded-xl">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {formState.blockedSites.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No sites blocked yet</p>
                )}
                {formState.blockedSites.map((site) => (
                  <Tag key={site} color="red" onRemove={() => removeSite(site)}>
                    <Globe className="h-3 w-3 opacity-60" /> {site}
                  </Tag>
                ))}
              </div>
            </SectionCard>

            {/* ── Blocked Keywords ── */}
            <SectionCard className="p-6 space-y-5">
              <SectionHeader icon={Hash} title="Blocked Keywords" subtitle="URLs containing these words get blocked" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                    placeholder="e.g. shorts, reels"
                    className="w-full rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <Button variant="primary" size="md" onClick={addKeyword} className="rounded-xl">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[36px]">
                {formState.blockedKeywords.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">No keywords blocked yet</p>
                )}
                {formState.blockedKeywords.map((keyword) => (
                  <Tag key={keyword} color="amber" onRemove={() => removeKeyword(keyword)}>
                    <Hash className="h-3 w-3 opacity-60" /> {keyword}
                  </Tag>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ── Strictness ── */}
          <SectionCard className="p-6 space-y-5">
            <SectionHeader icon={Lock} title="Strictness Settings" subtitle="Control how aggressively distractions are handled" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Blocking Mode</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'soft', label: 'Soft', desc: 'Show warnings', icon: Unlock },
                    { value: 'hard', label: 'Hard', desc: 'Block immediately', icon: Lock },
                  ].map(({ value, label, desc, icon: ModeIcon }) => (
                    <button
                      key={value}
                      onClick={() => setFormState(prev => ({ ...prev, strictnessLevel: value }))}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        formState.strictnessLevel === value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <ModeIcon className={`h-5 w-5 mb-2 ${
                        formState.strictnessLevel === value ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                      {formState.strictnessLevel === value && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Intensity Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {intensityOptions.map((option, idx) => (
                    <button
                      key={option}
                      onClick={() => setFormState(prev => ({ ...prev, strictnessIntensity: option }))}
                      className={`rounded-xl border-2 py-3 px-2 text-center transition-all ${
                        formState.strictnessIntensity === option
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-center gap-0.5 mb-1.5">
                        {[...Array(idx + 1)].map((_, i) => (
                          <div key={i} className={`h-1.5 w-3 rounded-full ${
                            formState.strictnessIntensity === option ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`} />
                        ))}
                      </div>
                      <p className={`text-xs font-semibold capitalize ${
                        formState.strictnessIntensity === option
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>{option}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                  Higher intensity increases override delay and reduces warnings.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── Quick Add ── */}
          <SectionCard className="p-6 space-y-4">
            <SectionHeader icon={Sparkles} title="Quick Add" subtitle="One-click add common distracting sites" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_ADD_PRESETS.map((preset) => {
                const alreadyAdded = formState.blockedSites.includes(preset.value)
                return (
                  <button
                    key={preset.value}
                    disabled={alreadyAdded}
                    onClick={() => quickAddSite(preset.value)}
                    className={`group flex items-center gap-2.5 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      alreadyAdded
                        ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 cursor-default'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 cursor-pointer'
                    }`}
                  >
                    <span className="text-lg leading-none">{preset.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{preset.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{preset.value}</p>
                    </div>
                    {alreadyAdded && <CheckCircle className="ml-auto h-4 w-4 text-emerald-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </SectionCard>

          {/* ── URL Tester ── */}
          <SectionCard className="p-6 space-y-4">
            <SectionHeader icon={Search} title="URL Tester" subtitle="Check if a URL would be blocked with your current settings" />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={testUrl}
                  onChange={(e) => { setTestUrl(e.target.value); setTestResult(null) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleTestUrl()}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/50 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <Button variant="outline" onClick={handleTestUrl} className="rounded-xl">
                <Eye className="h-4 w-4 mr-1.5" /> Test
              </Button>
            </div>
            {testResult && (
              <div className={`rounded-xl p-4 flex items-start gap-3 border ${
                testResult.blocked
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40'
                  : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
              }`}>
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  testResult.blocked ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  {testResult.blocked
                    ? <XCircle className="h-4 w-4 text-red-600" />
                    : <CheckCircle className="h-4 w-4 text-emerald-600" />
                  }
                </div>
                <div>
                  <p className={`text-sm font-semibold ${
                    testResult.blocked ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {testResult.blocked ? 'Would be Blocked' : 'Allowed'}
                  </p>
                  {testResult.blocked && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                      {testResult.matchedSite && <span className="rounded-md bg-white/60 dark:bg-gray-800/60 px-2 py-0.5">Site: <strong>{testResult.matchedSite}</strong></span>}
                      {testResult.matchedKeyword && <span className="rounded-md bg-white/60 dark:bg-gray-800/60 px-2 py-0.5">Keyword: <strong>{testResult.matchedKeyword}</strong></span>}
                      <span className="rounded-md bg-white/60 dark:bg-gray-800/60 px-2 py-0.5">{testResult.strictnessLevel} mode</span>
                      {testResult.warningsRemaining != null && <span className="rounded-md bg-white/60 dark:bg-gray-800/60 px-2 py-0.5">{testResult.warningsRemaining} warnings</span>}
                      {testResult.overrideDelaySeconds > 0 && <span className="rounded-md bg-white/60 dark:bg-gray-800/60 px-2 py-0.5">{testResult.overrideDelaySeconds}s delay</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Schedule ── */}
          <SectionCard className="p-6 space-y-4">
            <SectionHeader
              icon={Clock}
              title="Focus Schedule"
              subtitle="Auto-enable blocking during focus hours"
              action={
                <Button variant="outline" size="sm" onClick={addScheduleEntry} className="rounded-xl">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
                </Button>
              }
            />
            {formState.schedule.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No schedule set yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add time slots to automatically enable blocking</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formState.schedule.map((entry, index) => (
                  <div key={`${entry.dayOfWeek}-${index}`} className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/30 p-3">
                    <select
                      value={entry.dayOfWeek}
                      onChange={(e) => updateScheduleEntry(index, { dayOfWeek: Number(e.target.value) })}
                      className="rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                      {days.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={entry.startTime}
                        onChange={(e) => updateScheduleEntry(index, { startTime: e.target.value })}
                        className="rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <span className="text-xs text-gray-400">to</span>
                      <input
                        type="time"
                        value={entry.endTime}
                        onChange={(e) => updateScheduleEntry(index, { endTime: e.target.value })}
                        className="rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <ToggleSwitch
                      checked={entry.enabled !== false}
                      onChange={(val) => updateScheduleEntry(index, { enabled: val })}
                    />
                    <button
                      onClick={() => removeScheduleEntry(index)}
                      className="ml-auto rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Save ── */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} loading={loading} size="lg" className="rounded-xl px-8">
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* ═══════════ DASHBOARD TAB ═══════════ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* ── Session Filter ── */}
          <SectionCard className="p-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Filter by Session</label>
                <select
                  value={selectedSessionId || ''}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">All sessions</option>
                  {sessions.map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>
                      {session.subject ? `${session.subject} — ` : ''}{new Date(session.startTime).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                if (selectedSessionId) loadSessionReport(selectedSessionId)
                loadAllLogs().then(logs => setLiveLogs(logs))
              }} loading={dashboardLoading} className="rounded-xl">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
              </Button>
            </div>

            {/* Simulate block */}
            {formState.blockedSites.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Simulate a block event</p>
                <div className="flex flex-wrap gap-2">
                  {formState.blockedSites.slice(0, 6).map((site) => (
                    <button
                      key={site}
                      onClick={() => simulateBlock(site)}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <XCircle className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                      {site}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Summary Stats ── */}
          {(() => {
            const hasSessionData = selectedSessionId && sessionSummary && sessionSummary.totalAttempts > 0
            const summary = hasSessionData
              ? sessionSummary
              : {
                  totalAttempts: liveLogs.length,
                  blocked: liveLogs.filter(l => l.action === 'blocked').length,
                  overrides: liveLogs.filter(l => l.action === 'override').length,
                  distractionScore: Math.min(100, Math.round(
                    (liveLogs.filter(l => l.action === 'blocked').length * 10) +
                    (liveLogs.filter(l => l.action === 'override').length * 20)
                  )),
                  mostDistractingSite: (() => {
                    const counts = {}
                    liveLogs.forEach(l => { counts[l.site] = (counts[l.site] || 0) + 1 })
                    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
                  })()
                }
            const blockedPct = summary.totalAttempts > 0 ? Math.round((summary.blocked / summary.totalAttempts) * 100) : 0
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Shield} label="Total Events" value={summary.totalAttempts} color="primary" />
                <StatCard icon={XCircle} label="Blocked" value={summary.blocked} color="red" sub={`${blockedPct}% of attempts`} />
                <StatCard icon={AlertCircle} label="Overrides" value={summary.overrides} color="amber" />
                <StatCard icon={TrendingUp} label="Focus Score" value={`${Math.max(0, 100 - summary.distractionScore)}%`} color="emerald" sub={summary.mostDistractingSite ? `Top: ${summary.mostDistractingSite}` : undefined} />
              </div>
            )
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Currently Blocked ── */}
            <SectionCard className="p-6">
              <SectionHeader icon={Shield} title="Active Blocklist" subtitle={`${formState.blockedSites.length} sites · ${formState.blockedKeywords.length} keywords`} />
              <div className="mt-4 space-y-3">
                {formState.blockedSites.length === 0 && formState.blockedKeywords.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">No items in your blocklist. Go to Settings to add.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {formState.blockedSites.map((site) => (
                        <Tag key={site} color="red"><Globe className="h-3 w-3 opacity-60" /> {site}</Tag>
                      ))}
                    </div>
                    {formState.blockedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                        {formState.blockedKeywords.map((kw) => (
                          <Tag key={kw} color="amber"><Hash className="h-3 w-3 opacity-60" /> {kw}</Tag>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </SectionCard>

            {/* ── Top Distracting Sites ── */}
            <SectionCard className="p-6">
              <SectionHeader icon={TrendingUp} title="Top Distractions" subtitle="Most frequently blocked sites" />
              <div className="mt-4">
                {(() => {
                  const activeLogs = (selectedSessionId && sessionLogs.length > 0) ? sessionLogs : liveLogs
                  const counts = {}
                  activeLogs.forEach(l => { counts[l.site] = (counts[l.site] || 0) + 1 })
                  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  const maxCount = sorted[0]?.[1] || 1

                  if (sorted.length === 0) {
                    return (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                        <Target className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-400 dark:text-gray-500">No data yet</p>
                      </div>
                    )
                  }
                  return (
                    <div className="space-y-3">
                      {sorted.map(([site, count]) => (
                        <div key={site} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{site}</span>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{count}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                              style={{ width: `${(count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </SectionCard>
          </div>

          {/* ── Recent Events ── */}
          <SectionCard>
            <div className="px-6 pt-5 pb-3">
              <SectionHeader
                icon={List}
                title={(selectedSessionId && sessionLogs.length > 0) ? 'Session Events' : 'Recent Block Events'}
                subtitle="Latest blocking and override activity"
              />
            </div>
            {(() => {
              const activeLogs = (selectedSessionId && sessionLogs.length > 0) ? sessionLogs : liveLogs
              if (activeLogs.length === 0) {
                return (
                  <div className="px-6 pb-6">
                    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                      <Shield className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No events yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use the simulate buttons above or browse blocked sites during a session</p>
                    </div>
                  </div>
                )
              }
              return (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/40 max-h-80 overflow-y-auto scrollbar-thin">
                  {activeLogs.map((log, idx) => (
                    <div key={log._id || idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        log.action === 'blocked'
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
                          : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                      }`}>
                        {log.action === 'blocked' ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.site}</span>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            log.action === 'blocked'
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
                              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                          {log.source && log.source !== 'timer' && <> · {log.source}</>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </SectionCard>
        </div>
      )}

      {/* ═══════════ LIVE LOG TAB ═══════════ */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <SectionCard>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{liveLogs.length} event{liveLogs.length !== 1 ? 's' : ''} recorded</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadLiveLogs} loading={liveLoading} className="rounded-xl">
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${liveLoading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            {liveLogs.length === 0 ? (
              <div className="px-6 pb-8">
                <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800/60">
                    <Shield className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No blocking events yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                    Events appear here when sites are blocked or overridden during focus sessions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700/40 max-h-[520px] overflow-y-auto scrollbar-thin">
                {liveLogs.map((log, idx) => (
                  <div key={log._id || idx} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      log.action === 'blocked'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
                        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                    }`}>
                      {log.action === 'blocked' ? <XCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{log.site}</span>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          log.action === 'blocked'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-600'
                            : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600'
                        }`}>
                          {log.action}
                        </span>
                        {log.overrideType && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-gray-700/50 rounded px-1.5 py-0.5">
                            {log.overrideType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.source && <> · {log.source}</>}
                        {log.duration > 0 && <> · {formatSeconds(log.duration)}</>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  )
}

export default DistractionBlocker
