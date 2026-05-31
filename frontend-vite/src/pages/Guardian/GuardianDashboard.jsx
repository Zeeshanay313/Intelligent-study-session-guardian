/**
 * Guardian Dashboard
 *
 * A read-only dashboard for guardians/teachers to view student progress,
 * strictly filtered by the consent (allowedFields) the student has granted.
 * Hidden fields are never rendered. Revocation immediately removes access on
 * the next data fetch (the API returns 403 and we surface a clear message).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, Clock, Zap, Eye, Target, TrendingUp, Award, BarChart3,
  Download, RefreshCw, AlertTriangle, Bell, Send, CheckCircle,
  ShieldCheck, ChevronDown, Flame, Activity, BookOpen
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import jsPDF from 'jspdf'
import { insightsApi } from '../../services/newModulesApi'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const FIELD_LABELS = {
  studyHours: 'Study Hours',
  goalProgress: 'Goal Progress',
  subjectBreakdown: 'Subject Breakdown',
  sessionDetails: 'Session Details',
  presenceData: 'Presence Data',
  rewardsData: 'Rewards & Points'
}

const colorMap = {
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
}

const MetricCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => (
  <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700/40 p-5 flex gap-4">
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

const Section = ({ title, icon: Icon, children, right }) => (
  <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700/40 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />} {title}
      </h3>
      {right}
    </div>
    {children}
  </div>
)

const EmptyState = ({ icon: Icon = BarChart3, title, hint }) => (
  <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/40 p-10 text-center">
    <Icon className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
    <p className="text-gray-600 dark:text-gray-300 font-medium">{title}</p>
    {hint && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
  </div>
)

const StudentCard = ({ student, active, onSelect }) => (
  <button
    onClick={() => onSelect(student)}
    className={`w-full text-left p-3 rounded-xl border transition-colors ${
      active
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 bg-white dark:bg-gray-800/60'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold flex-shrink-0">
        {(student.displayName || student.email || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{student.displayName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
      </div>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 capitalize flex-shrink-0">
        {student.accessType}
      </span>
    </div>
  </button>
)

export default function GuardianDashboard() {
  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState(null)
  const [insights, setInsights] = useState(null)
  const [allowedFields, setAllowedFields] = useState({})
  const [loadingList, setLoadingList] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [dateRange, setDateRange] = useState('30d')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reminderMsg, setReminderMsg] = useState('')
  const [reminderFreq, setReminderFreq] = useState('once')
  const [sendingReminder, setSendingReminder] = useState(false)

  const showSuccess = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }
  const showError = (m) => { setError(m); setTimeout(() => setError(''), 4500) }

  const dateParams = useCallback(() => {
    const to = new Date().toISOString()
    const from = new Date()
    const days = { '7d': 7, '30d': 30, '90d': 90, 'all': 3650 }
    from.setDate(from.getDate() - (days[dateRange] || 30))
    return { from: from.toISOString(), to }
  }, [dateRange])

  // Initial: load students this user is guardian for
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoadingList(true)
      try {
        const res = await insightsApi.listGuardianStudents()
        if (cancelled) return
        const list = res.data?.students || []
        setStudents(list)
        if (list.length > 0) setSelected(list[0])
      } catch (e) {
        if (!cancelled) showError('Failed to load students')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  // Load insights for selected student whenever selection or range changes
  const loadInsights = useCallback(async () => {
    if (!selected) return
    setLoadingData(true)
    setError('')
    try {
      const res = await insightsApi.getGuardianInsights(selected.studentId, dateParams())
      setInsights(res.data?.insights || {})
      setAllowedFields(res.data?.allowedFields || selected.allowedFields || {})
    } catch (e) {
      const code = e.response?.status
      if (code === 403) {
        setInsights(null)
        showError('Access has been revoked by the student.')
        // Refresh student list so the revoked one disappears
        try {
          const r = await insightsApi.listGuardianStudents()
          setStudents(r.data?.students || [])
          setSelected((r.data?.students || [])[0] || null)
        } catch { /* ignore */ }
      } else {
        showError(e.response?.data?.error || 'Failed to load insights')
        setInsights(null)
      }
    } finally {
      setLoadingData(false)
    }
  }, [selected, dateParams])

  useEffect(() => { loadInsights() }, [loadInsights])

  const subjectData = useMemo(() => (
    (insights?.subjectBreakdown || []).map(s => ({
      name: s.subject, minutes: s.minutes, sessions: s.sessions
    }))
  ), [insights])

  const timelineData = useMemo(() => (
    (insights?.timeline || []).map(d => ({
      date: d.date.slice(5), // MM-DD
      minutes: d.minutes
    }))
  ), [insights])

  const handleExportCSV = async () => {
    if (!selected) return
    try {
      const res = await insightsApi.exportCSV(selected.studentId, dateParams())
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${selected.displayName.replace(/\s+/g, '_')}-insights.csv`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('CSV exported')
    } catch {
      showError('Failed to export CSV')
    }
  }

  const handleExportPDF = async () => {
    if (!selected) return
    try {
      const res = await insightsApi.exportPDF(selected.studentId, dateParams())
      const d = res.data?.pdfData || {}
      const u = res.data?.user || {}
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.setTextColor(99, 102, 241)
      doc.text('Study Guardian — Guardian Report', 20, 22)
      doc.setFontSize(11)
      doc.setTextColor(55, 65, 81)
      doc.text(`Student: ${u?.profile?.displayName || u?.email || selected.displayName}`, 20, 34)
      doc.text(`Period: ${dateRange === 'all' ? 'All time' : `Last ${dateRange}`}`, 20, 41)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 48)
      doc.setDrawColor(229, 231, 235); doc.line(20, 53, 190, 53)

      doc.setFontSize(13); doc.setTextColor(17, 24, 39); doc.text('Summary', 20, 62)
      let y = 72
      const rows = [
        ['Total Study Time', `${Math.floor((d.totalStudyMinutes || 0) / 60)}h ${(d.totalStudyMinutes || 0) % 60}m`],
        ['Sessions', String(d.totalSessions ?? '—')],
        ['Avg Session', `${d.avgSessionMinutes ?? '—'} min`],
        ['Productivity Score', `${d.productivityScore ?? 0}/100`],
        ['Streak (days)', String(d.streakDays ?? 0)],
        ['Avg Presence', d.avgPresencePercent != null ? `${d.avgPresencePercent}%` : 'Hidden'],
        ['Goals Completed', d.goalsCompleted != null ? String(d.goalsCompleted) : 'Hidden'],
        ['Points Earned', d.pointsEarned != null ? String(d.pointsEarned) : 'Hidden']
      ]
      doc.setFontSize(11)
      rows.forEach(([k, v]) => {
        doc.setFont(undefined, 'bold'); doc.text(k + ':', 25, y)
        doc.setFont(undefined, 'normal'); doc.text(String(v), 110, y)
        y += 9
      })
      if (d.subjectBreakdown?.length) {
        y += 5
        doc.setFontSize(13); doc.text('Subjects', 20, y); y += 9
        doc.setFontSize(10)
        d.subjectBreakdown.forEach(s => {
          doc.text(`• ${s.subject}: ${s.minutes} min (${s.sessions} sessions)`, 25, y)
          y += 7
          if (y > 270) { doc.addPage(); y = 20 }
        })
      }
      doc.save(`${selected.displayName.replace(/\s+/g, '_')}-guardian-report.pdf`)
      showSuccess('PDF exported')
    } catch (e) {
      console.error('PDF export error:', e)
      showError('Failed to export PDF')
    }
  }

  const handleSendReminder = async () => {
    if (!reminderMsg.trim() || !selected) return
    setSendingReminder(true)
    try {
      await insightsApi.requestReminder({
        studentId: selected.studentId,
        message: reminderMsg.trim(),
        frequency: reminderFreq
      })
      setReminderMsg('')
      showSuccess('Reminder request sent. The student must approve before delivery.')
    } catch (e) {
      showError(e.response?.data?.error || 'Failed to send reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  // ── Empty: no students ──────────────────────────────────────────────────────
  if (!loadingList && students.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guardian Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor student progress with consent-controlled visibility
            </p>
          </div>
        </div>
        <EmptyState
          icon={Users}
          title="No students share their progress with you yet"
          hint="When a student grants you guardian access from their Insights dashboard, they will appear here."
        />
      </div>
    )
  }

  // ── Loading: initial student list ──────────────────────────────────────────
  if (loadingList) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 space-y-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guardian Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {students.length} student{students.length === 1 ? '' : 's'} sharing progress with you
            </p>
          </div>
        </div>

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
            disabled={!selected}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!selected}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> PDF
          </button>
          <button
            onClick={loadInsights}
            disabled={!selected || loadingData}
            title="Refresh"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Layout: students sidebar + dashboard body */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Students list */}
        <aside className="space-y-2 lg:max-h-[80vh] lg:overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
            Students ({students.length})
          </p>
          {students.map(s => (
            <StudentCard
              key={s.accessId}
              student={s}
              active={selected?.studentId === s.studentId}
              onSelect={setSelected}
            />
          ))}
        </aside>

        {/* Body */}
        <div className="space-y-5 min-w-0">
          {!selected ? (
            <EmptyState icon={Users} title="Select a student" hint="Choose a student from the list to see their dashboard." />
          ) : loadingData ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 space-y-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : !insights ? (
            <EmptyState icon={AlertTriangle} title="Unable to load student data" hint="Try refreshing or check that access is still active." />
          ) : (
            <>
              {/* Visibility banner */}
              <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-indigo-800 dark:text-indigo-300">
                  Showing only fields {selected.displayName} has chosen to share:{' '}
                  <span className="font-medium">
                    {Object.entries(allowedFields).filter(([, v]) => v).map(([k]) => FIELD_LABELS[k] || k).join(', ') || 'None'}
                  </span>
                </p>
              </div>

              {/* Alerts */}
              {Array.isArray(insights.alerts) && insights.alerts.length > 0 && (
                <div className="space-y-2">
                  {insights.alerts.map((a, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${
                        a.severity === 'warning'
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{a.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allowedFields.studyHours && (
                  <>
                    <MetricCard
                      icon={Clock} label="Total Study Time"
                      value={`${Math.floor((insights.totalStudyMinutes || 0) / 60)}h ${(insights.totalStudyMinutes || 0) % 60}m`}
                      sub={`${insights.totalSessions || 0} sessions`}
                      color="indigo"
                    />
                    <MetricCard
                      icon={Zap} label="Avg Session"
                      value={`${insights.avgSessionMinutes || 0}m`}
                      sub={`This week: ${Math.floor((insights.weeklyMinutes || 0) / 60)}h ${(insights.weeklyMinutes || 0) % 60}m`}
                      color="blue"
                    />
                  </>
                )}
                <MetricCard
                  icon={Activity} label="Productivity Score"
                  value={`${insights.productivityScore || 0}/100`}
                  sub="Presence × focus"
                  color="purple"
                />
                <MetricCard
                  icon={Flame} label="Streak"
                  value={`${insights.streakDays || 0} ${insights.streakDays === 1 ? 'day' : 'days'}`}
                  sub="Consecutive study days"
                  color="amber"
                />
                {allowedFields.presenceData && (
                  <MetricCard
                    icon={Eye} label="Avg Presence"
                    value={`${insights.avgPresencePercent || 0}%`}
                    sub={`${insights.totalAbsenceWarnings || 0} absence warnings`}
                    color="purple"
                  />
                )}
                {allowedFields.goalProgress && (
                  <MetricCard
                    icon={Target} label="Goals Completed"
                    value={insights.goalsCompleted || 0}
                    sub={`${insights.goalsInProgress || 0} active · ${insights.weeklyGoalProgress || 0}% avg`}
                    color="green"
                  />
                )}
                {allowedFields.studyHours && (
                  <MetricCard
                    icon={TrendingUp} label="Distractions Blocked"
                    value={insights.totalInterruptions || 0}
                    sub="During this period"
                    color="red"
                  />
                )}
                {allowedFields.rewardsData && (
                  <MetricCard
                    icon={Award} label="Points Earned"
                    value={insights.pointsEarned || 0}
                    sub="During this period"
                    color="yellow"
                  />
                )}
              </div>

              {/* Timeline + Subjects */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {allowedFields.studyHours && timelineData.length > 0 && (
                  <Section title="Session Timeline" icon={BarChart3}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [`${v} min`, 'Study time']}
                        />
                        <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Section>
                )}

                {allowedFields.subjectBreakdown && subjectData.length > 0 && (
                  <Section title="Subject Breakdown" icon={BookOpen}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={subjectData} dataKey="minutes" nameKey="name" outerRadius={80} label={(e) => e.name}>
                          {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${v} min`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Section>
                )}
              </div>

              {allowedFields.subjectBreakdown && subjectData.length > 0 && (
                <Section title="Time per Subject" icon={BarChart3}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip formatter={(v) => [`${v} min`, 'Study time']} />
                      <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Section>
              )}

              {/* Recent sessions (only if student grants sessionDetails) */}
              {allowedFields.sessionDetails && (
                <Section title="Recent Sessions" icon={Clock}>
                  {(insights.recentSessions || []).length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No sessions in this period.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {insights.recentSessions.map(s => (
                        <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {s.subject}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(s.date).toLocaleString()} · {s.source}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {s.minutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* Reminder composer (always — student approval required) */}
              <Section
                title="Send a supportive reminder"
                icon={Bell}
                right={
                  <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Student must approve
                  </span>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                  <textarea
                    rows={3}
                    value={reminderMsg}
                    onChange={e => setReminderMsg(e.target.value)}
                    placeholder={'Encouraging message — e.g. "Great job this week! Keep going."'}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <select
                      value={reminderFreq}
                      onChange={e => setReminderFreq(e.target.value)}
                      className="px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="once">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <button
                      onClick={handleSendReminder}
                      disabled={!reminderMsg.trim() || sendingReminder}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {sendingReminder ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Reminders are queued for the student's approval before delivery. They stay in control.
                </p>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
