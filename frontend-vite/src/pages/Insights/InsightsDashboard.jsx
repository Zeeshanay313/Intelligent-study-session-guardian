import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3, Users, BookOpen, Target, TrendingUp, Download,
  Share2, UserX, CheckCircle, Clock, Zap, Award,
  RefreshCw, Calendar, ChevronDown, Eye, EyeOff, Bell, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { insightsApi } from '../../services/newModulesApi'
import { useAuth } from '../../contexts/AuthContext'
import jsPDF from 'jspdf'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// ─── Metric Card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex gap-4">
    <div className={`flex-shrink-0 p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>
      <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
)

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
    if (!email) return
    setSharing(true)
    try {
      await onShare({ guardianEmail: email, guardianName: name, accessType: type, allowedFields: fields })
      setEmail(''); setName('')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-500" /> Share Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Guardian / Teacher email"
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
            <option value="guardian">Guardian (Parent)</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Allowed data fields:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(fields).map(([f, v]) => (
              <button
                key={f}
                onClick={() => setFields(prev => ({ ...prev, [f]: !v }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                }`}
              >
                {f.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleShare}
          disabled={!email || sharing}
          className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {sharing ? 'Sharing…' : 'Grant Access'}
        </button>
      </div>

      {accesses.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Active Shared Access</h4>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {accesses.map(a => (
              <div key={a._id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {a.guardianName || a.guardianEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.guardianEmail} · {a.accessType}</p>
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
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InsightsDashboard() {
  const { user } = useAuth()
  const userId = user?.user?._id || user?._id
  const [insights, setInsights] = useState(null)
  const [accesses, setAccesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [successMsg, setSuccessMsg] = useState('')

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const dateParams = () => {
    const to = new Date().toISOString()
    const from = new Date()
    const days = { '7d': 7, '30d': 30, '90d': 90, 'all': 3650 }
    from.setDate(from.getDate() - (days[dateRange] || 30))
    return { from: from.toISOString(), to }
  }

  const loadData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [insRes, accessRes] = await Promise.all([
        insightsApi.getStudentInsights(userId, dateParams()),
        insightsApi.listAccess()
      ])
      setInsights(insRes.data.insights)
      setAccesses(accessRes.data.accesses || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userId, dateRange])

  useEffect(() => { loadData() }, [loadData])

  const handleShare = async (data) => {
    try {
      await insightsApi.shareAccess(data)
      const res = await insightsApi.listAccess()
      setAccesses(res.data.accesses || [])
      showSuccess('Access shared successfully')
    } catch (e) {
      console.error(e)
    }
  }

  const handleRevoke = async (email) => {
    if (!window.confirm(`Revoke access for ${email}?`)) return
    try {
      await insightsApi.revokeAccess(email)
      setAccesses(prev => prev.map(a => a.guardianEmail === email ? { ...a, status: 'revoked' } : a))
      showSuccess('Access revoked')
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await insightsApi.exportCSV(userId, dateParams())
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `insights-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('CSV exported')
    } catch (e) {
      console.error(e)
    }
  }

  const handleExportPDF = async () => {
    try {
      const res = await insightsApi.exportPDF(userId, dateParams())
      const { pdfData: d, user: u } = res.data
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Study Guardian - Insights Report', 20, 20)
      doc.setFontSize(12)
      doc.text(`Student: ${u?.profile?.displayName || u?.email || 'User'}`, 20, 35)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42)
      doc.setFontSize(11)
      let y = 55
      const lines = [
        ['Total Study Minutes', `${d.totalStudyMinutes} min`],
        ['Total Sessions', d.totalSessions],
        ['Avg Session Length', `${d.avgSessionMinutes} min`],
        ['Avg Presence %', `${d.avgPresencePercent}%`],
        ['Goals Completed', d.goalsCompleted],
        ['Goals In Progress', d.goalsInProgress]
      ]
      lines.forEach(([lbl, val]) => {
        doc.text(`${lbl}:  ${val}`, 20, y)
        y += 8
      })
      doc.save(`study-insights-${new Date().toISOString().split('T')[0]}.pdf`)
      showSuccess('PDF exported')
    } catch (e) {
      console.error(e)
    }
  }

  const subjectData = insights?.subjectBreakdown?.map(s => ({
    name: s.subject,
    minutes: s.minutes,
    sessions: s.sessions
  })) || []

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
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
        </div>
      </div>

      {/* Success */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-green-700 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[['overview', 'Overview'], ['subjects', 'Subjects'], ['access', 'Shared Access']].map(([val, label]) => (
          <Tab key={val} active={activeTab === val} onClick={() => setActiveTab(val)}>{label}</Tab>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && insights && (
        <div className="space-y-5">
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
              sub="Total session interruptions"
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--tooltip-bg, #fff)', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
                    formatter={(val) => [`${val} min`, 'Time']}
                  />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ── SUBJECTS TAB ── */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {subjectData.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center text-gray-400 dark:text-gray-600">
              No subject data yet. Start study sessions to see breakdown.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pie chart */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={subjectData} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(val) => [`${val} min`, 'Time']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Subject list */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white">By Subject</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {subjectData.map((s, i) => (
                      <div key={s.name} className="p-4 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{s.sessions} sessions</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{s.minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACCESS TAB ── */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <EyeOff className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              Only data fields you explicitly allow will be visible to guardians or teachers. You can revoke access at any time.
            </p>
          </div>
          <SharePanel
            accesses={accesses.filter(a => a.status === 'active')}
            onShare={handleShare}
            onRevoke={handleRevoke}
          />
        </div>
      )}
    </div>
  )
}
