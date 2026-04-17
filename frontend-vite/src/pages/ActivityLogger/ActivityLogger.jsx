import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import ActivityTimeline from '../../components/Activity/ActivityTimeline'
import Button from '../../components/UI/Button'
import { useAuth } from '../../contexts/AuthContext'
import { connectSocket, disconnectSocket } from '../../services/socket'

const formatSeconds = (value) => {
  if (!value && value !== 0) return '0s'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const ActivityLogger = () => {
  const [goals, setGoals] = useState([])
  const [selectedGoalId, setSelectedGoalId] = useState('all')
  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState(null)
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [distractionSummary, setDistractionSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState(null)
  const socketRef = useRef(null)
  const { user } = useAuth()
  const userId = user?.user?._id || user?._id || user?.user?.id || user?.id || null

  const totals = useMemo(() => {
    if (!sessions.length) {
      return {
        activeSeconds: 0,
        idleSeconds: 0,
        avgProductivity: 0,
        avgEngagement: 0
      }
    }

    const activeSeconds = sessions.reduce((sum, session) => sum + (session.activeSeconds || 0), 0)
    const idleSeconds = sessions.reduce((sum, session) => sum + (session.idleSeconds || 0), 0)
    const avgProductivity = Math.round(sessions.reduce((sum, session) => sum + (session.productivityScore || 0), 0) / sessions.length)
    const avgEngagement = Math.round(sessions.reduce((sum, session) => sum + (session.engagementScore || 0), 0) / sessions.length)

    return { activeSeconds, idleSeconds, avgProductivity, avgEngagement }
  }, [sessions])

  const loadGoals = useCallback(async () => {
    try {
      const response = await api.goals.list()
      if (response.success) {
        setGoals(response.data || response.goals || [])
      }
    } catch (loadError) {
      console.error('Failed to load goals:', loadError)
    }
  }, [])

  const loadSessions = useCallback(async (goalId = null) => {
    setLoading(true)
    setError(null)
    try {
      const response = goalId && goalId !== 'all'
        ? await api.activity.listSessionsByGoal(goalId, { limit: 12 })
        : await api.activity.listSessions({ limit: 12 })
      if (response.success) {
        const nextSessions = response.data || []
        setSessions(nextSessions)
        if (nextSessions.length === 0) {
          setSelectedSessionId(null)
          setSelectedDetails(null)
          setDistractionSummary(null)
        } else if (!nextSessions.some((session) => String(session.sessionId) === String(selectedSessionId))) {
          setSelectedSessionId(nextSessions[0].sessionId)
        }
      }
    } catch (loadError) {
      console.error('Failed to load activity sessions:', loadError)
      setError('Unable to load activity sessions right now.')
    } finally {
      setLoading(false)
    }
  }, [selectedSessionId])

  const loadSessionDetails = useCallback(async (sessionId) => {
    if (!sessionId) return
    setDetailsLoading(true)
    try {
      const response = await api.activity.getSession(sessionId)
      if (response.success) {
        setSelectedDetails(response.data)
      }
    } catch (detailError) {
      console.error('Failed to load activity session:', detailError)
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  const loadDistractionSummary = useCallback(async (sessionId) => {
    if (!sessionId) return
    try {
      const response = await api.distraction.getSession(sessionId)
      if (response.success) {
        setDistractionSummary(response.data?.summary || null)
      }
    } catch (error) {
      console.error('Failed to load distraction summary:', error)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  useEffect(() => {
    loadSessions(selectedGoalId)
  }, [selectedGoalId, loadSessions])

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails(selectedSessionId)
      loadDistractionSummary(selectedSessionId)
    }
  }, [selectedSessionId, loadSessionDetails, loadDistractionSummary])

  useEffect(() => {
    if (!userId) return

    const socket = connectSocket(userId)
    socketRef.current = socket

    const handleActivityUpdate = (payload = {}) => {
      loadSessions(selectedGoalId)
      if (payload.sessionId && String(payload.sessionId) === String(selectedSessionId)) {
        loadSessionDetails(payload.sessionId)
        loadDistractionSummary(payload.sessionId)
      }
    }

    socket.on('activity:updated', handleActivityUpdate)

    return () => {
      socket.off('activity:updated', handleActivityUpdate)
      if (socketRef.current === socket) {
        disconnectSocket()
        socketRef.current = null
      }
    }
  }, [userId, selectedGoalId, selectedSessionId, loadSessions, loadSessionDetails])

  const getProductivityLabel = (score = 0) => {
    if (score > 80) return 'High'
    if (score >= 50) return 'Medium'
    return 'Low'
  }

  const getGoalLabel = (goalId) => {
    if (!goalId) return 'No goal'
    const goal = goals.find((item) => String(item._id || item.id) === String(goalId))
    return goal?.title || 'Goal'
  }

  const selectedSummary = selectedDetails?.summary
  const selectedTimeline = selectedDetails?.timeline || []
  const distractionStats = distractionSummary || null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Activity Logger</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track focus engagement from keyboard and mouse activity during sessions.
          </p>
        </div>
        <Button variant="outline" onClick={() => loadSessions(selectedGoalId)} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Quick links</p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Pair activity insights with your goals and resources
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/goals">
              <Button variant="outline">Goals</Button>
            </Link>
            <Link to="/motivation">
              <Button variant="outline">Motivation</Button>
            </Link>
            <Link to="/resources">
              <Button variant="outline">Resource Hub</Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Time</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatSeconds(totals.activeSeconds)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Idle Time</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatSeconds(totals.idleSeconds)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Productivity</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.avgProductivity}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Engagement</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.avgEngagement}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Goal</label>
            <select
              value={selectedGoalId}
              onChange={(event) => setSelectedGoalId(event.target.value)}
              className="min-w-[220px] rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
            >
              <option value="all">All goals</option>
              {goals.map((goal) => {
                const goalValue = goal._id || goal.id
                return (
                  <option key={goalValue} value={goalValue}>
                    {goal.title}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Session</label>
            <select
              value={selectedSessionId || ''}
              onChange={(event) => setSelectedSessionId(event.target.value || null)}
              className="min-w-[220px] rounded-lg border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
              disabled={sessions.length === 0}
            >
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.sessionId} value={session.sessionId}>
                  {new Date(session.startTime).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-\[17px\] font-semibold text-gray-900 dark:text-white">Selected Session</h3>
            {detailsLoading && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Loading details...</span>
            )}
          </div>

          {selectedSummary ? (
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Productivity</div>
                <div className="mt-1 text-xl font-semibold">
                  {selectedSummary.productivityScore}% ({getProductivityLabel(selectedSummary.productivityScore)})
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Goal</div>
                <div className="mt-1 text-xl font-semibold">{getGoalLabel(selectedSummary.goalId)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Engagement</div>
                <div className="mt-1 text-xl font-semibold">{selectedSummary.engagementScore}%</div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Active</div>
                <div className="mt-1 text-xl font-semibold">{formatSeconds(selectedSummary.activeSeconds)}</div>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Idle</div>
                <div className="mt-1 text-xl font-semibold">{formatSeconds(selectedSummary.idleSeconds)}</div>
              </div>
              {distractionStats && (
                <>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Distraction Score</div>
                    <div className="mt-1 text-xl font-semibold">{distractionStats.distractionScore}%</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                    <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Blocked Attempts</div>
                    <div className="mt-1 text-xl font-semibold">{distractionStats.blocked}</div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4 text-sm text-gray-500 dark:text-gray-400">
              Select a session to see details.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <h3 className="text-\[17px\] font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
          <ActivityTimeline timeline={selectedTimeline} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/40 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/40">
          <h3 className="text-\[17px\] font-semibold text-gray-900 dark:text-white">Recent Sessions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a session to review engagement.</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-5 h-5" />
              No activity sessions logged yet.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Goal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Idle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Productivity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => {
                  const sessionId = session.sessionId
                  const isSelected = String(sessionId) === String(selectedSessionId)
                  return (
                    <tr
                      key={sessionId}
                      onClick={() => setSelectedSessionId(sessionId)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getGoalLabel(session.goalId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(session.startTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatSeconds(session.activeSeconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatSeconds(session.idleSeconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {session.productivityScore}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {session.engagementScore}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivityLogger
