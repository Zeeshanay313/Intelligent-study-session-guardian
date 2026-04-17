import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '../../services/api'
import Button from '../UI/Button'
import { useAuth } from '../../contexts/AuthContext'
import SessionReportCard from './SessionReportCard'
import TimelineChart from './TimelineChart'
import HeatmapChart from './HeatmapChart'
import ComparisonInsights from './ComparisonInsights'
import CommentsSection from './CommentsSection'
import ExportButtons from './ExportButtons'

const ReportDashboard = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [reports, setReports] = useState([])
  const [activitySessions, setActivitySessions] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [reportDetail, setReportDetail] = useState(null)
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState(null)
  const reportRef = useRef(null)

  const loadGoals = useCallback(async () => {
    try {
      const response = await api.goals.list()
      if (response?.success) {
        setGoals(response.goals || response.data || [])
      }
    } catch (error) {
      console.error('Failed to load goals:', error)
    }
  }, [])

  const loadReports = useCallback(async (goalId) => {
    setLoading(true)
    setError(null)
    // Clear stale data from previous goal/session immediately
    setReportDetail(null)
    setComparison(null)
    setSelectedSessionId('')
    setReports([])
    try {
      let response = null
      const userId = user?.user?.id || user?.user?._id || user?._id || null
      const refetchReports = async () => {
        if (goalId) {
          return api.reports.getGoal(goalId)
        } else if (userId) {
          return api.reports.getUser(userId)
        }
        return null
      }

      if (!goalId && !userId) {
        setError('Unable to determine user. Please log in again.')
        setLoading(false)
        return
      }

      response = await refetchReports()

      if (response?.success) {
        let list = response.data || []
        if (list.length === 0) {
          try {
            // Try activity sessions — filter by goalId if one is selected
            const activityParams = {
              limit: 10,
              sessionSource: 'timer',
              sessionType: 'focus'
            }
            if (goalId) activityParams.goalId = goalId

            const activityResponse = await api.activity.listSessions(activityParams)
            const activityList = activityResponse?.success ? activityResponse.data || [] : []
            setActivitySessions(activityList)
            let sessionToGenerate = activityList[0]?.sessionId || null

            // If no activity sessions, try timer sessions directly
            if (!sessionToGenerate) {
              const timerResponse = await api.sessions.timerHistory({ limit: 10 })
              if (timerResponse?.success) {
                const sessions = timerResponse.data || []
                // If goal is selected, prefer sessions matching that goal
                const match = goalId
                  ? sessions.find(s => String(s.goalId) === String(goalId) && (s.endTime || s.status === 'completed' || s.status === 'stopped'))
                  : sessions.find(s => s.endTime || s.status === 'completed' || s.status === 'stopped')
                sessionToGenerate = match?._id || null
              }
            }

            if (sessionToGenerate) {
              await api.reports.generate(sessionToGenerate, true)
              const refreshed = await refetchReports()
              if (refreshed?.success) {
                list = refreshed.data || []
              }
            }
          } catch (err) {
            console.error('Failed to auto-generate report:', err)
          }
        }

        setReports(list)
        if (list.length > 0) {
          setSelectedSessionId(String(list[0].sessionId))
        } else {
          setSelectedSessionId('')
          setReportDetail(null)
          setComparison(null)
        }
      } else {
        setError('Failed to load reports. Please try again.')
      }
    } catch (err) {
      console.error('Failed to load reports:', err)
      setError('Something went wrong loading reports.')
    } finally {
      setLoading(false)
    }
  }, [user])

  const ensureReportDetail = useCallback(async (sessionId) => {
    if (!sessionId) return
    setDetailLoading(true)
    try {
      let response = await api.reports.getSession(sessionId)
      if (!response?.success) {
        await api.reports.generate(sessionId)
        response = await api.reports.getSession(sessionId)
      }
      if (response?.success) {
        setReportDetail(response.data)
      }
    } catch (error) {
      console.error('Failed to load report detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const loadComparison = useCallback(async (sessionId) => {
    if (!sessionId) return
    try {
      const response = await api.reports.compare(sessionId)
      if (response?.success) {
        setComparison(response.data || null)
      }
    } catch (error) {
      console.error('Failed to load comparison:', error)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  useEffect(() => {
    loadReports(selectedGoalId)
  }, [selectedGoalId, loadReports])

  useEffect(() => {
    if (selectedSessionId) {
      ensureReportDetail(selectedSessionId)
      loadComparison(selectedSessionId)
    }
  }, [selectedSessionId, ensureReportDetail, loadComparison])

  const sessionOptions = useMemo(() => {
    if (reports.length > 0) {
      return reports.map((report) => ({
        value: String(report.sessionId),
        label: report.sessionStartTime
          ? new Date(report.sessionStartTime).toLocaleString()
          : String(report.sessionId)
      }))
    }

    return activitySessions.map((session) => ({
      value: String(session.sessionId),
      label: session.startTime
        ? new Date(session.startTime).toLocaleString()
        : String(session.sessionId)
    }))
  }, [reports, activitySessions])

  const selectedReport = reportDetail?.report || null
  const comments = reportDetail?.comments || []
  const distractionLogs = reportDetail?.distractionLogs || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Session Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics from focus sessions, activity, and distraction data.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-4 shadow-card sm:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Goal</label>
          <select
            value={selectedGoalId}
            onChange={(event) => setSelectedGoalId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="">All goals</option>
            {goals.map((goal) => (
              <option key={goal._id || goal.id} value={goal._id || goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Session</label>
          <select
            value={selectedSessionId}
            onChange={(event) => setSelectedSessionId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            <option value="">Select session</option>
            {sessionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && !selectedReport && (
        <div className="rounded-2xl border border-dashed border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No session reports found yet. Complete a focus session to generate reports.
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Reports are automatically generated when you finish a timer session.
          </p>
        </div>
      )}

      {selectedReport && (
        <div className="space-y-6" ref={reportRef}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SessionReportCard report={selectedReport} loading={detailLoading} />
            <ExportButtons
              report={selectedReport}
              distractionLogs={distractionLogs}
              fileName={`session-report-${selectedReport.sessionId}`}
              reportRef={reportRef}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TimelineChart timeline={selectedReport.activityTimeline || []} totalDuration={selectedReport.totalDuration} />
            <HeatmapChart reports={reports} />
          </div>

          <ComparisonInsights comparison={comparison} />

          <CommentsSection sessionId={selectedReport.sessionId} comments={comments} onCommentSaved={ensureReportDetail} />
        </div>
      )}
    </div>
  )
}

export default ReportDashboard
