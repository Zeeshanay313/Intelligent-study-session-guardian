import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, BookOpen, Target, TrendingUp, Download,
  Share2, UserX, CheckCircle, Clock, Zap, Award,
  RefreshCw, ChevronDown, Eye, EyeOff, Bell,
  ShieldCheck, AlertTriangle, UserCheck,
  Lock, FileText, Trash2, Archive, KeyRound, ScrollText
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { insightsApi, securityApi } from '../../services/newModulesApi'
import { useAuth } from '../../contexts/AuthContext'
import jsPDF from 'jspdf'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// ─── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  }
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
      <div className={`flex-shrink-0 p-3 rounded-xl ${colorMap[color] || colorMap.indigo}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
)

// ─── Share Access Panel ───────────────────────────────────────────────────────
const FIELD_LABELS = {
  studyHours: 'Study Hours', goalProgress: 'Goal Progress',
  subjectBreakdown: 'Subject Breakdown', sessionDetails: 'Session Details',
  presenceData: 'Presence Data', rewardsData: 'Rewards & Points'
}

const SharePanel = ({ accesses, onShare, onRevoke }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('guardian')
  const [fields, setFields] = useState({
    studyHours: true, goalProgress: true, subjectBreakdown: true,
    sessionDetails: false, presenceData: false, rewardsData: true
  })
  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    if (!email.trim()) return
    setSharing(true)
    try {
      await onShare({ guardianEmail: email.trim(), guardianName: name.trim(), accessType: type, allowedFields: fields })
      setEmail('')
      setName('')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-500" /> Grant Access to Guardian or Teacher
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address *"
            className="col-span-1 sm:col-span-2 px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Name (optional)"
            className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={type} onChange={e => setType(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="guardian">Guardian / Parent</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Data fields to share:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(fields).map(([f, v]) => (
              <button
                key={f}
                onClick={() => setFields(prev => ({ ...prev, [f]: !v }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                }`}
              >
                {FIELD_LABELS[f] || f}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleShare}
          disabled={!email.trim() || sharing}
          className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sharing ? 'Granting Access…' : 'Grant Access'}
        </button>
      </div>

      {accesses.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-500" /> Shared Access
            </h4>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {accesses.map(a => (
              <div key={a._id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {a.guardianName || a.guardianEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.guardianEmail} · {a.accessType}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 truncate">
                    Sees: {Object.entries(a.allowedFields || {}).filter(([, v]) => v).map(([k]) => FIELD_LABELS[k] || k).join(', ') || 'Nothing selected'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>{a.status}</span>
                  {a.status === 'active' && (
                    <button
                      onClick={() => onRevoke(a.guardianEmail)}
                      title="Revoke access"
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <EyeOff className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No shared access yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Add a guardian or teacher above to share your progress.</p>
        </div>
      )}
    </div>
  )
}

// ─── Reminders Panel ──────────────────────────────────────────────────────────
const RemindersPanel = ({ accesses, onApprove }) => {
  const pending = accesses.flatMap(a =>
    (a.pendingReminderRequests || [])
      .map((r, ri) => ({ ...r, accessId: a._id, requestIndex: ri, from: a.guardianName || a.guardianEmail }))
      .filter(r => !r.approved)
  )

  if (pending.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <Bell className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending reminder requests.</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">When a guardian sends a supportive reminder, it appears here for your approval first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          All reminder messages from guardians require your approval before they are delivered. You stay in control.
        </p>
      </div>
      {pending.map((r, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">From: {r.from}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{r.message}"</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{new Date(r.requestedAt).toLocaleString()}</p>
            </div>
            <button
              onClick={() => onApprove({ accessId: r.accessId, requestIndex: r.requestIndex })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Privacy & Data Panel ─────────────────────────────────────────────────────
// Surfaces the platform's compliance & security posture for the student:
//   • Encryption-in-transit / at-rest transparency
//   • Role-based access (student / guardian / teacher / admin)
//   • Consent records (granular, revocable)
//   • Audit log of privacy-sensitive actions
//   • Data-retention policy (auto-archival)
//   • Full data export (GDPR-style portability)
//   • Permanent account deletion (right to be forgotten)
const CONSENT_LABELS = {
  camera_presence:        'Camera presence detection',
  guardian_sharing:       'Share progress with guardian',
  teacher_sharing:        'Share progress with teacher',
  analytics_collection:   'Analytics & usage statistics',
  email_notifications:    'Email notifications',
  data_retention_extended:'Extended data retention',
  third_party_integrations:'Third-party integrations'
}

const CONSENT_PURPOSES = {
  camera_presence:        'Used by the focus module to detect presence locally. Frames are analysed in-browser and never uploaded raw.',
  guardian_sharing:       'Lets a parent/guardian view the fields you explicitly select. Revoke any time.',
  teacher_sharing:        'Lets a teacher/coach view the fields you explicitly select. Revoke any time.',
  analytics_collection:   'Aggregated metrics that power your Insights dashboard. No third-party trackers.',
  email_notifications:    'Reminders, weekly summaries, and account alerts.',
  data_retention_extended:'Keeps your study data beyond the default retention window for richer long-term insights.',
  third_party_integrations:'Connect Google Calendar / external services.'
}

const PRIVACY_IMPACT_COLOR = {
  none:   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  low:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  high:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}

const PrivacyPanel = ({ user, onSuccess, onError }) => {
  const [consents, setConsents]   = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [retention, setRetention] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [busy, setBusy]           = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [showDeleteBox, setShowDeleteBox] = useState(false)

  const userEmail   = user?.user?.email || user?.email || ''
  const displayRole = user?.user?.role  || user?.role  || 'student'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, a, r] = await Promise.all([
        securityApi.getConsents(),
        securityApi.getAuditLog({ limit: 15 }),
        securityApi.getRetention()
      ])
      setConsents(c.data.consents || [])
      setAuditLogs(a.data.logs || [])
      setRetention(r.data.policy || null)
    } catch (e) {
      onError && onError('Failed to load privacy data')
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => { load() }, [load])

  const consentMap = consents.reduce((acc, c) => { acc[c.consentType] = c; return acc }, {})

  const toggleConsent = async (type, granted) => {
    setBusy(true)
    try {
      await securityApi.updateConsent(type, granted)
      await load()
      onSuccess && onSuccess(`${CONSENT_LABELS[type] || type} ${granted ? 'granted' : 'revoked'}`)
    } catch (e) {
      onError && onError('Failed to update consent')
    } finally {
      setBusy(false)
    }
  }

  const updateRetention = async (patch) => {
    setBusy(true)
    try {
      const res = await securityApi.updateRetention({ ...retention, ...patch })
      setRetention(res.data.policy)
      onSuccess && onSuccess('Retention policy updated')
    } catch (e) {
      onError && onError('Failed to update retention policy')
    } finally {
      setBusy(false)
    }
  }

  const exportFullArchive = async () => {
    setBusy(true)
    try {
      const res = await securityApi.exportData()
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `study-guardian-archive-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      onSuccess && onSuccess('Full data archive downloaded')
      await load() // refresh audit log – DATA_EXPORTED is recorded server-side
    } catch (e) {
      onError && onError('Failed to export archive')
    } finally {
      setBusy(false)
    }
  }

  const permanentDelete = async () => {
    if (confirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
      onError && onError('Email confirmation does not match')
      return
    }
    if (!window.confirm('This permanently deletes your account and all associated data. This cannot be undone. Continue?')) return
    setBusy(true)
    try {
      await securityApi.permanentDelete(confirmEmail.trim())
      onSuccess && onSuccess('Account deleted. You will be signed out.')
      setTimeout(() => {
        localStorage.removeItem('authToken')
        window.location.href = '/'
      }, 1500)
    } catch (e) {
      onError && onError(e.response?.data?.error || 'Failed to delete account')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading privacy & compliance data…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Encryption / transport transparency */}
      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-900/20 dark:to-indigo-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
            <Lock className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white">How your data is protected</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              We use industry-standard protocols on every layer.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>In transit:</strong> TLS 1.2+ / HTTPS with HSTS (Helmet headers)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>At rest:</strong> MongoDB encrypted storage + AES-256 disk volume</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>Passwords:</strong> bcrypt one-way hashing (cost 12)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>Tokens:</strong> Signed JWT, httpOnly refresh cookies</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>Camera frames:</strong> Processed in-browser, never uploaded</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>Backups:</strong> Encrypted, retention-policy aware</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based access */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-500" /> Role-based access
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">You are signed in as</span>
          <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 capitalize">
            {displayRole}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{userEmail}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { role: 'Student',  desc: 'Owns their data. Sees full insights, controls all sharing & consent.' },
            { role: 'Guardian', desc: 'Read-only view of fields the student grants. Cannot send messages without approval.' },
            { role: 'Teacher',  desc: 'Read-only view of class-relevant fields. Same approval rules as guardians.' }
          ].map(r => (
            <div key={r.role} className={`p-3 rounded-xl border text-xs ${
              displayRole.toLowerCase() === r.role.toLowerCase()
                ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30'
            }`}>
              <p className="font-semibold text-gray-900 dark:text-white">{r.role}</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consent records */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" /> Consent records
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Every grant or revoke is timestamped and version-stamped. Toggle any item below — the change is recorded immediately.
        </p>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {Object.keys(CONSENT_LABELS).map(type => {
            const c = consentMap[type]
            const granted = c?.granted === true
            return (
              <div key={type} className="py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{CONSENT_LABELS[type]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{CONSENT_PURPOSES[type]}</p>
                  {c && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                      v{c.version} · {granted
                        ? `Granted ${new Date(c.grantedAt || c.updatedAt).toLocaleString()}`
                        : c.revokedAt ? `Revoked ${new Date(c.revokedAt).toLocaleString()}` : 'Not granted'}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleConsent(type, !granted)}
                  disabled={busy}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    granted ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                  } disabled:opacity-50`}
                  title={granted ? 'Revoke consent' : 'Grant consent'}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    granted ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Retention policy */}
      {retention && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Archive className="w-4 h-4 text-indigo-500" /> Data retention & archival
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Decide how long each category is kept. When auto-archive is on, older records are moved to cold storage and removed from live queries.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['sessionDataDays',  'Study sessions',     30, 3650],
              ['activityLogDays',  'Activity log',       30, 3650],
              ['auditLogDays',     'Audit log',          90, 3650],
              ['presenceDataDays', 'Presence data',       7, 365],
              ['insightsDays',     'Insights summaries', 30, 3650]
            ].map(([key, label, min, max]) => (
              <label key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{label}</span>
                <input
                  type="number"
                  min={min} max={max}
                  value={retention[key]}
                  onChange={e => setRetention({ ...retention, [key]: Number(e.target.value) })}
                  onBlur={e => updateRetention({ [key]: Number(e.target.value) })}
                  className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-gray-400">days</span>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!retention.autoDeleteEnabled}
              onChange={e => updateRetention({ autoDeleteEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            Enable automatic archival when records exceed the retention window
          </label>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">
            Last reviewed {new Date(retention.lastReviewedAt).toLocaleDateString()} · Next review {new Date(retention.nextReviewAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Audit log */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-indigo-500" /> Audit log
            <span className="text-xs font-normal text-gray-400">(last {auditLogs.length})</span>
          </h3>
          <button
            onClick={load}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            title="Refresh audit log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No audit entries yet.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
            {auditLogs.map(l => (
              <div key={l._id} className="p-3 flex items-start gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIVACY_IMPACT_COLOR[l.privacyImpact || 'none']}`}>
                  {l.privacyImpact || 'none'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{l.action.replace(/_/g, ' ')}</p>
                  {l.dataCategories?.length > 0 && (
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Categories: {l.dataCategories.join(', ')}
                    </p>
                  )}
                  {l.metadata?.ipAddress && (
                    <p className="text-gray-400 dark:text-gray-600 truncate">From {l.metadata.ipAddress}</p>
                  )}
                </div>
                <span className="text-gray-400 dark:text-gray-600 flex-shrink-0">
                  {new Date(l.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export & delete */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" /> Export your full archive
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Downloads a single JSON file containing your profile, goals, sessions, consents and audit log. Useful for portability or personal records.
          </p>
          <button
            onClick={exportFullArchive}
            disabled={busy}
            className="w-full py-2.5 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
          >
            Download archive (JSON)
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/40 p-5">
          <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Permanently delete account
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
            Removes your account and erases all associated study, presence, consent and audit data. This cannot be undone.
          </p>
          {!showDeleteBox ? (
            <button
              onClick={() => setShowDeleteBox(true)}
              className="w-full py-2.5 text-sm font-medium rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Begin deletion…
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="email"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                placeholder={`Type ${userEmail} to confirm`}
                className="w-full px-3 py-2 text-sm rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteBox(false); setConfirmEmail('') }}
                  className="flex-1 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={permanentDelete}
                  disabled={busy || !confirmEmail.trim()}
                  className="flex-1 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  Delete forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InsightsDashboard() {
  const { user, loading: authLoading } = useAuth()
  // Profile endpoint returns user.user.id (not _id); keep a wide fallback so
  // the dashboard works regardless of which auth path populated `user`.
  const userId = user?.user?._id || user?.user?.id || user?._id || user?.id || null
  const [insights, setInsights] = useState(null)
  const [accesses, setAccesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }
  const showError = (msg) => {
    setError(msg)
    setTimeout(() => setError(''), 4000)
  }

  const dateParams = useCallback(() => {
    const to = new Date().toISOString()
    const from = new Date()
    const days = { '7d': 7, '30d': 30, '90d': 90, 'all': 3650 }
    from.setDate(from.getDate() - (days[dateRange] || 30))
    return { from: from.toISOString(), to }
  }, [dateRange])

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [insRes, accessRes] = await Promise.all([
        insightsApi.getStudentInsights(userId, dateParams()),
        insightsApi.listAccess()
      ])
      setInsights(insRes.data.insights)
      setAccesses(accessRes.data.accesses || [])
    } catch (e) {
      console.error('loadData error:', e)
      setError('Failed to load insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [userId, dateParams])

  useEffect(() => { loadData() }, [loadData])

  const handleShare = async (data) => {
    try {
      await insightsApi.shareAccess(data)
      const res = await insightsApi.listAccess()
      setAccesses(res.data.accesses || [])
      showSuccess('Access granted successfully')
    } catch (e) {
      showError(e.response?.data?.error || 'Failed to grant access')
    }
  }

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke access for ${email}? They will no longer see your dashboard.`)) return
    try {
      await insightsApi.revokeAccess(email)
      const res = await insightsApi.listAccess()
      setAccesses(res.data.accesses || [])
      showSuccess('Access revoked')
    } catch (e) {
      showError(e.response?.data?.error || 'Failed to revoke access')
    }
  }

  const handleApproveReminder = async (data) => {
    try {
      await insightsApi.approveReminder(data)
      const res = await insightsApi.listAccess()
      setAccesses(res.data.accesses || [])
      showSuccess('Reminder approved')
    } catch (e) {
      showError(e.response?.data?.error || 'Failed to approve reminder')
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await insightsApi.exportCSV(userId, dateParams())
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `study-insights-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('CSV exported')
    } catch (e) {
      showError('Failed to export CSV')
    }
  }

  const handleExportPDF = async () => {
    try {
      const res = await insightsApi.exportPDF(userId, dateParams())
      const { pdfData: d, user: u } = res.data
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.setTextColor(99, 102, 241)
      doc.text('Study Guardian — Insights Report', 20, 22)
      doc.setFontSize(11)
      doc.setTextColor(55, 65, 81)
      doc.text(`Student: ${u?.profile?.displayName || u?.email || 'User'}`, 20, 34)
      doc.text(`Period: ${dateRange === 'all' ? 'All time' : `Last ${dateRange}`}`, 20, 41)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 48)
      doc.setDrawColor(229, 231, 235)
      doc.line(20, 53, 190, 53)
      doc.setFontSize(13)
      doc.setTextColor(17, 24, 39)
      doc.text('Summary Metrics', 20, 62)
      doc.setFontSize(11)
      doc.setTextColor(55, 65, 81)
      let y = 72
      const rows = [
        ['Total Study Time', `${Math.floor((d.totalStudyMinutes || 0) / 60)}h ${(d.totalStudyMinutes || 0) % 60}m`],
        ['Total Sessions', String(d.totalSessions || 0)],
        ['Avg Session Length', `${d.avgSessionMinutes || 0} min`],
        ['Longest Session', `${d.longestSessionMinutes || 0} min`],
        ['Avg Presence', `${d.avgPresencePercent || 0}%`],
        ['Interruptions', String(d.totalInterruptions || 0)],
        ['Goals Completed', String(d.goalsCompleted || 0)],
        ['Goals In Progress', String(d.goalsInProgress || 0)],
        ['Points Earned', String(d.pointsEarned || 0)],
      ]
      rows.forEach(([label, val]) => {
        doc.setFont(undefined, 'bold')
        doc.text(label + ':', 25, y)
        doc.setFont(undefined, 'normal')
        doc.text(val, 110, y)
        y += 9
      })
      if (d.subjectBreakdown?.length) {
        y += 5
        doc.setFontSize(13)
        doc.setTextColor(17, 24, 39)
        doc.text('Subject Breakdown', 20, y)
        y += 10
        doc.setFontSize(10)
        doc.setTextColor(55, 65, 81)
        d.subjectBreakdown.forEach(s => {
          doc.text(`• ${s.subject}: ${s.minutes} min (${s.sessions} sessions)`, 25, y)
          y += 8
          if (y > 270) { doc.addPage(); y = 20 }
        })
      }
      doc.save(`study-insights-${new Date().toISOString().split('T')[0]}.pdf`)
      showSuccess('PDF exported')
    } catch (e) {
      console.error('PDF error:', e)
      showError('Failed to export PDF')
    }
  }

  const subjectData = insights?.subjectBreakdown?.map(s => ({
    name: s.subject,
    minutes: s.minutes,
    sessions: s.sessions
  })) || []

  const pendingReminders = accesses.flatMap(a =>
    (a.pendingReminderRequests || []).filter(r => !r.approved)
  )

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 shadow-card space-y-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Insights Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your study analytics and progress overview</p>
          </div>
        </div>

        {/* Date range + export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={loadData}
            title="Refresh data"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</Tab>
        <Tab active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')}>Subjects</Tab>
        <Tab active={activeTab === 'access'} onClick={() => setActiveTab('access')}>
          Shared Access
          {accesses.filter(a => a.status === 'active').length > 0 && (
            <span className="ml-1.5 bg-indigo-500 text-white text-[10px] rounded-full px-1.5 py-px align-middle">
              {accesses.filter(a => a.status === 'active').length}
            </span>
          )}
        </Tab>
        <Tab active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')}>
          Reminders
          {pendingReminders.length > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-px align-middle">
              {pendingReminders.length}
            </span>
          )}
        </Tab>
        <Tab active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')}>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Privacy &amp; Data
          </span>
        </Tab>
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {!insights || insights.totalSessions === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No study data yet for this period.</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Start a study session to see your analytics here.</p>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              icon={Clock} label="Total Study Time"
              value={`${Math.floor((insights.totalStudyMinutes || 0) / 60)}h ${(insights.totalStudyMinutes || 0) % 60}m`}
              sub={`${insights.totalSessions || 0} sessions`}
              color="indigo"
            />
            <MetricCard
              icon={Zap} label="Avg Session"
              value={`${insights.avgSessionMinutes || 0}m`}
              sub={`Longest: ${insights.longestSessionMinutes || 0}m`}
              color="blue"
            />
            <MetricCard
              icon={Eye} label="Avg Presence"
              value={`${insights.avgPresencePercent || 0}%`}
              sub={`${insights.totalAbsenceWarnings || 0} absence warnings`}
              color="purple"
            />
            <MetricCard
              icon={Target} label="Goals Completed"
              value={insights.goalsCompleted || 0}
              sub={`${insights.goalsInProgress || 0} in progress`}
              color="green"
            />
            <MetricCard
              icon={TrendingUp} label="Interruptions"
              value={insights.totalInterruptions || 0}
              sub="Distractions blocked"
              color="amber"
            />
            <MetricCard
              icon={Award} label="Points Earned"
              value={insights.pointsEarned || 0}
              sub="During this period"
              color="yellow"
            />
          </div>

          {/* Subject bar chart */}
          {subjectData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Study Time by Subject</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [`${val} min`, 'Study Time']}
                  />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {subjectData.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No subject data yet. Start study sessions with a subject to see the breakdown.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Time Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={subjectData} dataKey="minutes" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(val) => [`${val} min`, 'Study Time']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Breakdown</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {subjectData.map((s, i) => (
                    <div key={s.name} className="p-4 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.sessions} session{s.sessions !== 1 ? 's' : ''}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACCESS TAB ── */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              Only data fields you explicitly choose will be visible to guardians or teachers. You can revoke access at any time and the change takes effect immediately.
            </p>
          </div>
          <SharePanel
            accesses={accesses}
            onShare={handleShare}
            onRevoke={handleRevoke}
          />
        </div>
      )}

      {/* ── REMINDERS TAB ── */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <RemindersPanel
            accesses={accesses}
            onApprove={handleApproveReminder}
          />
        </div>
      )}

      {/* ── PRIVACY & DATA TAB ── */}
      {activeTab === 'privacy' && (
        <PrivacyPanel
          user={user}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}
    </div>
  )
}
