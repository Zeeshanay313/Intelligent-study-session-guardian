import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, Lock, FileText, Trash2, Download, Eye, EyeOff,
  CheckCircle, XCircle, AlertTriangle, ChevronRight, RefreshCw,
  Users, Database, Clock
} from 'lucide-react'
import { securityApi } from '../../services/newModulesApi'
import { useAuth } from '../../contexts/AuthContext'

// ─── Privacy Info Cards ───────────────────────────────────────────────────────
const PrivacyCard = ({ icon: Icon, title, description, color = 'blue' }) => (
  <div className={`bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800 rounded-xl p-4 flex gap-3`}>
    <div className={`flex-shrink-0 p-2 bg-${color}-100 dark:bg-${color}-800/40 rounded-lg`}>
      <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <div>
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{description}</p>
    </div>
  </div>
)

// ─── Toggle Row ───────────────────────────────────────────────────────────────
const ToggleRow = ({ label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
        value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
)

// ─── Tab Button ───────────────────────────────────────────────────────────────
const TabBtn = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    {children}
  </button>
)

// ─── CONSENT TYPES ────────────────────────────────────────────────────────────
const CONSENT_TYPES = [
  { type: 'camera_presence', label: 'Camera Presence Detection', desc: 'Allow on-device camera to detect your presence during study sessions. No images are ever stored.' },
  { type: 'guardian_sharing', label: 'Guardian Data Sharing', desc: 'Allow parents or guardians to view your study progress dashboard.' },
  { type: 'teacher_sharing', label: 'Teacher Data Sharing', desc: 'Allow teachers to view your study metrics and subject breakdown.' },
  { type: 'analytics_collection', label: 'Analytics Collection', desc: 'Allow collection of anonymized usage analytics to improve the app.' },
  { type: 'email_notifications', label: 'Email Notifications', desc: 'Allow the system to send study reminders and milestone emails.' }
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DataSecurity() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [settings, setSettings] = useState(null)
  const [consents, setConsents] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [retention, setRetention] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [auditTotal, setAuditTotal] = useState(0)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, cRes, rRes] = await Promise.all([
        securityApi.getSettings(),
        securityApi.getConsents(),
        securityApi.getRetention()
      ])
      setSettings(sRes.data.settings)
      setConsents(cRes.data.consents)
      setRetention(rRes.data.policy)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAuditLogs = useCallback(async (page = 1) => {
    try {
      const res = await securityApi.getAuditLog({ page, limit: 15 })
      setAuditLogs(res.data.logs)
      setAuditTotal(res.data.total)
      setAuditPage(page)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { if (activeTab === 'audit') loadAuditLogs(1) }, [activeTab, loadAuditLogs])

  const handleSettingChange = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    try {
      await securityApi.updateSettings({ [key]: value })
      showSuccess('Settings saved')
    } catch (e) {
      console.error(e)
    }
  }

  const handleConsentToggle = async (consentType, newValue) => {
    try {
      await securityApi.updateConsent(consentType, newValue)
      setConsents(prev => {
        const idx = prev.findIndex(c => c.consentType === consentType)
        if (idx >= 0) {
          const updated = [...prev]
          updated[idx] = { ...updated[idx], granted: newValue }
          return updated
        }
        return [...prev, { consentType, granted: newValue }]
      })
      showSuccess(`${newValue ? 'Consent granted' : 'Consent revoked'}`)
    } catch (e) {
      console.error(e)
    }
  }

  const getConsent = (type) => consents.find(c => c.consentType === type)

  const handleExport = async () => {
    try {
      const res = await securityApi.exportData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `study-guardian-data-export.json`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Data exported successfully')
    } catch (e) {
      console.error(e)
    }
  }

  const handlePermanentDelete = async () => {
    const email = user?.user?.email || user?.email
    if (deleteConfirm !== email) {
      setDeleteError('Email does not match your account email')
      return
    }
    if (!window.confirm('This will permanently delete ALL your data. This cannot be undone. Are you absolutely sure?')) return
    try {
      await securityApi.permanentDelete(deleteConfirm)
      window.location.href = '/login'
    } catch (e) {
      setDeleteError(e.response?.data?.error || 'Deletion failed')
    }
  }

  const handleRetentionSave = async () => {
    setSaving(true)
    try {
      await securityApi.updateRetention(retention)
      showSuccess('Retention policy saved')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
          <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Security & Privacy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your data, consents, and security settings</p>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {['overview', 'consent', 'access', 'audit', 'retention', 'data'].map(tab => (
          <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </TabBtn>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PrivacyCard
              icon={Lock} title="End-to-End Security"
              description="Your data is protected with JWT authentication, rate limiting, and encrypted sessions."
              color="blue"
            />
            <PrivacyCard
              icon={Eye} title="Camera Privacy"
              description="Camera presence detection is OFF by default. Only metadata is processed — no images are ever stored."
              color="purple"
            />
            <PrivacyCard
              icon={Users} title="Consent-Based Sharing"
              description="Guardians and teachers can only see data you explicitly choose to share. You can revoke at any time."
              color="green"
            />
            <PrivacyCard
              icon={FileText} title="Audit Trail"
              description="All sensitive actions on your account are logged and available for you to review at any time."
              color="amber"
            />
          </div>

          {settings && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary-500" /> Security Preferences
              </h3>
              <ToggleRow
                label="Alert on New Device Login"
                description="Receive a notification when a new device accesses your account"
                value={settings.alertOnNewDevice}
                onChange={v => handleSettingChange('alertOnNewDevice', v)}
              />
              <ToggleRow
                label="Alert on Data Export"
                description="Receive a notification when your data is exported"
                value={settings.alertOnDataExport}
                onChange={v => handleSettingChange('alertOnDataExport', v)}
              />
              <ToggleRow
                label="Alert on Access Changes"
                description="Receive a notification when guardian/teacher access changes"
                value={settings.alertOnAccessChange}
                onChange={v => handleSettingChange('alertOnAccessChange', v)}
              />
              <ToggleRow
                label="Allow Guardian Access"
                description="Allow guardians to see your study dashboard"
                value={settings.allowGuardianAccess}
                onChange={v => handleSettingChange('allowGuardianAccess', v)}
              />
              <ToggleRow
                label="Allow Teacher Access"
                description="Allow teachers to see your study metrics"
                value={settings.allowTeacherAccess}
                onChange={v => handleSettingChange('allowTeacherAccess', v)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── CONSENT TAB ── */}
      {activeTab === 'consent' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Consent Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You control exactly what this app can do with your data. Toggle any consent below.
          </p>
          {CONSENT_TYPES.map(ct => {
            const record = getConsent(ct.type)
            const isGranted = record?.granted === true
            return (
              <ToggleRow
                key={ct.type}
                label={ct.label}
                description={ct.desc}
                value={isGranted}
                onChange={v => handleConsentToggle(ct.type, v)}
              />
            )
          })}
          <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
            All consent changes are logged in your audit trail with a timestamp.
          </p>
        </div>
      )}

      {/* ── ACCESS TAB ── */}
      {activeTab === 'access' && settings && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" /> Shared Access Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guardian Email</label>
                <input
                  type="email"
                  value={settings.guardianEmail || ''}
                  onChange={e => setSettings(prev => ({ ...prev, guardianEmail: e.target.value }))}
                  onBlur={() => handleSettingChange('guardianEmail', settings.guardianEmail)}
                  placeholder="parent@email.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher Email</label>
                <input
                  type="email"
                  value={settings.teacherEmail || ''}
                  onChange={e => setSettings(prev => ({ ...prev, teacherEmail: e.target.value }))}
                  onBlur={() => handleSettingChange('teacherEmail', settings.teacherEmail)}
                  placeholder="teacher@school.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Shared Data Fields</h4>
                <div className="space-y-0">
                  {Object.entries(settings.sharedFields || {}).map(([field, value]) => (
                    <ToggleRow
                      key={field}
                      label={field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                      value={value}
                      onChange={v => handleSettingChange('sharedFields', { ...settings.sharedFields, [field]: v })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT TAB ── */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" /> Audit Log
              <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{auditTotal} entries</span>
            </h3>
            <button onClick={() => loadAuditLogs(1)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-600">No audit entries yet</div>
            ) : (
              auditLogs.map(log => (
                <div key={log._id} className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    log.privacyImpact === 'high' ? 'bg-red-500' :
                    log.privacyImpact === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action.replace(/_/g, ' ')}</p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {JSON.stringify(log.details).slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </time>
                </div>
              ))
            )}
          </div>
          {auditTotal > 15 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-center gap-3">
              <button
                disabled={auditPage <= 1}
                onClick={() => loadAuditLogs(auditPage - 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >Previous</button>
              <span className="px-3 py-1.5 text-xs text-gray-500">Page {auditPage}</span>
              <button
                disabled={auditPage * 15 >= auditTotal}
                onClick={() => loadAuditLogs(auditPage + 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* ── RETENTION TAB ── */}
      {activeTab === 'retention' && retention && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" /> Data Retention Policy
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Control how long different types of data are kept. Data older than these limits will be eligible for auto-deletion.
          </p>
          <div className="space-y-4">
            {[
              { key: 'sessionDataDays', label: 'Study Session Data', min: 30, max: 3650 },
              { key: 'activityLogDays', label: 'Activity Logs', min: 30, max: 3650 },
              { key: 'auditLogDays', label: 'Audit Logs', min: 90, max: 3650 },
              { key: 'presenceDataDays', label: 'Presence Data', min: 7, max: 365 },
              { key: 'insightsDays', label: 'Insights Summaries', min: 30, max: 3650 }
            ].map(({ key, label, min, max }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{retention[key]} days</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={30}
                  value={retention[key]}
                  onChange={e => setRetention(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-600">
                  <span>{min}d</span><span>{max}d</span>
                </div>
              </div>
            ))}
          </div>
          <ToggleRow
            label="Enable Auto-Delete"
            description="Automatically delete data older than the limits above"
            value={retention.autoDeleteEnabled}
            onChange={v => setRetention(prev => ({ ...prev, autoDeleteEnabled: v }))}
          />
          <button
            onClick={handleRetentionSave}
            disabled={saving}
            className="mt-4 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Retention Policy'}
          </button>
        </div>
      )}

      {/* ── DATA TAB ── */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          {/* Export */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Download className="w-4 h-4 text-green-500" /> Export Your Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Download a complete copy of all your data including sessions, goals, consents, and audit logs.
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" /> Export All Data (JSON)
            </button>
          </div>

          {/* Delete */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-5">
            <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Permanently Delete Account
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This will permanently delete your account and ALL associated data. This action cannot be undone.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                value={deleteConfirm}
                onChange={e => { setDeleteConfirm(e.target.value); setDeleteError('') }}
                placeholder={`Type your email to confirm: ${user?.user?.email || user?.email}`}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              {deleteError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {deleteError}
                </p>
              )}
              <button
                onClick={handlePermanentDelete}
                disabled={!deleteConfirm}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Permanently Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
