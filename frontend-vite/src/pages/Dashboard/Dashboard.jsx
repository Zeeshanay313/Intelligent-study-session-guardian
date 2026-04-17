/**
 * Dashboard Component
 * 
 * Main dashboard view with:
 * - Welcome hero section with greeting and quick start
 * - Metric cards: Total Focus Time, Avg Session, Sessions Today, Current Streak
 * - Weekly focus bar chart (Recharts)
 * - Goal progress donut chart (Recharts)
 * - Recent activity feed
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  Clock,
  Target,
  TrendingUp,
  Flame,
  Play,
  Award,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

// Mock data for fallback
const mockWeeklyData = [
  { day: 'Mon', minutes: 120 },
  { day: 'Tue', minutes: 90 },
  { day: 'Wed', minutes: 150 },
  { day: 'Thu', minutes: 180 },
  { day: 'Fri', minutes: 135 },
  { day: 'Sat', minutes: 60 },
  { day: 'Sun', minutes: 45 },
]

const mockGoalsData = [
  { name: 'Completed', value: 65, color: '#10b981' },
  { name: 'In Progress', value: 25, color: '#0ea5e9' },
  { name: 'Not Started', value: 10, color: '#94a3b8' },
]

const mockRecentActivity = [
  { id: 1, type: 'session', title: 'Deep Work Session', duration: '45 min', time: '2 hours ago' },
  { id: 2, type: 'goal', title: 'Completed Math Assignment', time: '5 hours ago' },
  { id: 3, type: 'reward', title: 'Earned Focus Master Badge', time: '1 day ago' },
  { id: 4, type: 'session', title: 'Quick Study Break', duration: '15 min', time: '1 day ago' },
]

const Dashboard = () => {
  const { user, refreshAuth } = useAuth()
  const [metrics, setMetrics] = useState({
    totalFocusTime: 0,
    avgSessionLength: 0,
    sessionsToday: 0,
    currentStreak: 0,
  })
  const [weeklyData, setWeeklyData] = useState(mockWeeklyData)
  const [goalsData, setGoalsData] = useState(mockGoalsData)
  const [recentActivity, setRecentActivity] = useState(mockRecentActivity)
  const [loading, setLoading] = useState(true)
  const [activeGoals, setActiveGoals] = useState([])
  const [progressSummary, setProgressSummary] = useState(null)

  useEffect(() => {
    // Check for OAuth success redirect
    const urlParams = new URLSearchParams(window.location.search)
    const oauthSuccess = urlParams.get('oauth')
    
    if (oauthSuccess) {
      console.log('OAuth success detected:', oauthSuccess)
      // Backend has set cookies, now fetch user profile to update AuthContext
      fetchUserAfterOAuth()
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    } else {
      fetchDashboardData()
    }
  }, [])

  // Real-time polling for goal progress updates every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshGoalProgress()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(pollInterval)
  }, [])

  // Refresh goal progress data without full reload
  const refreshGoalProgress = async () => {
    try {
      const getSessionTime = (s) => new Date(s.startedAt || s.startTime || s.createdAt)
      const getSessionDuration = (s) => s.durationSeconds || s.totalDurationSec || s.actualDuration || 0

      // Refresh session data for weekly chart and metrics
      const sessionsResponse = await api.sessions.list()
      if (sessionsResponse.success) {
        const sessions = sessionsResponse.data
        
        // Calculate total focus time (this week)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const weekSessions = sessions.filter(s => getSessionTime(s) >= oneWeekAgo)
        const totalMinutes = weekSessions.reduce((sum, s) => sum + (getSessionDuration(s) / 60), 0)
        
        // Calculate avg session length
        const avgMinutes = weekSessions.length > 0 ? totalMinutes / weekSessions.length : 0
        
        // Count today's sessions
        const today = new Date().toDateString()
        const todaySessions = sessions.filter(s => getSessionTime(s).toDateString() === today)
        
        setMetrics(prev => ({
          ...prev,
          totalFocusTime: Math.round(totalMinutes),
          avgSessionLength: Math.round(avgMinutes),
          sessionsToday: todaySessions.length,
        }))
        
        // Build weekly data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekData = days.map((day, index) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - index))
          const daySessions = sessions.filter(s => {
            const sessionDate = getSessionTime(s)
            return sessionDate.toDateString() === date.toDateString()
          })
          const minutes = daySessions.reduce((sum, s) => sum + (getSessionDuration(s) / 60), 0)
          return { day: days[date.getDay()], minutes: Math.round(minutes) }
        })
        setWeeklyData(weekData)
      }

      // Refresh goals data
      const goalsResponse = await api.goals.list()
      if (goalsResponse.success && goalsResponse.goals) {
        const goals = goalsResponse.goals
        const completed = goals.filter(g => g.status === 'completed').length
        const active = goals.filter(g => g.status === 'active').length
        const notStarted = goals.filter(g => g.status === 'not_started').length
        const total = goals.length
        
        // Update active goals
        const activeGoalsList = goals.filter(g => g.status === 'active')
        setActiveGoals(activeGoalsList)
        
        if (total > 0) {
          setGoalsData([
            { name: 'Completed', value: Math.round((completed / total) * 100), color: '#10b981' },
            { name: 'In Progress', value: Math.round((active / total) * 100), color: '#0ea5e9' },
            { name: 'Not Started', value: Math.round((notStarted / total) * 100), color: '#94a3b8' },
          ])
        }
      }
      
      // Also refresh progress summary
      try {
        const progressResponse = await api.goals.getProgressSummary()
        if (progressResponse.success && progressResponse.summary) {
          setProgressSummary(progressResponse.summary)
        }
      } catch (err) {
        // Silent fail for progress summary
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    }
  }

  const fetchUserAfterOAuth = async () => {
    try {
      console.log('Fetching user profile after OAuth...')
      // Backend has set HTTP-only cookies, call refreshAuth to update context
      const result = await refreshAuth()
      if (result.success) {
        console.log('OAuth authentication complete, loading dashboard...')
        fetchDashboardData()
      } else {
        console.error('Failed to authenticate after OAuth redirect')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching user after OAuth:', error)
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Helper to normalize session fields from either SessionLog or Session model
      const getSessionTime = (s) => new Date(s.startedAt || s.startTime || s.createdAt)
      const getSessionDuration = (s) => s.durationSeconds || s.totalDurationSec || s.actualDuration || 0
      
      // Fetch sessions and calculate metrics
      const sessionsResponse = await api.sessions.list()
      if (sessionsResponse.success) {
        const sessions = sessionsResponse.data
        
        // Calculate total focus time (this week)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const weekSessions = sessions.filter(s => getSessionTime(s) >= oneWeekAgo)
        const totalMinutes = weekSessions.reduce((sum, s) => sum + (getSessionDuration(s) / 60), 0)
        
        // Calculate avg session length
        const avgMinutes = weekSessions.length > 0 ? totalMinutes / weekSessions.length : 0
        
        // Count today's sessions
        const today = new Date().toDateString()
        const todaySessions = sessions.filter(s => getSessionTime(s).toDateString() === today)
        
        // Fetch streak from rewards API
        let currentStreak = 0
        try {
          const streakRes = await api.rewards.getStreak()
          if (streakRes.success) {
            currentStreak = streakRes.data?.currentStreak || streakRes.currentStreak || 0
          }
        } catch (e) {
          // streak endpoint may not be available
        }

        setMetrics({
          totalFocusTime: Math.round(totalMinutes),
          avgSessionLength: Math.round(avgMinutes),
          sessionsToday: todaySessions.length,
          currentStreak,
        })
        
        // Build weekly data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekData = days.map((day, index) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - index))
          const daySessions = sessions.filter(s => {
            const sessionDate = getSessionTime(s)
            return sessionDate.toDateString() === date.toDateString()
          })
          const minutes = daySessions.reduce((sum, s) => sum + (getSessionDuration(s) / 60), 0)
          return { day: days[date.getDay()], minutes: Math.round(minutes) }
        })
        setWeeklyData(weekData)
      }
      
      // Fetch goals data
      const goalsResponse = await api.goals.list()
      if (goalsResponse.success && goalsResponse.goals) {
        const goals = goalsResponse.goals
        const completed = goals.filter(g => g.status === 'completed').length
        const active = goals.filter(g => g.status === 'active').length
        const notStarted = goals.filter(g => g.status === 'not_started').length
        const total = goals.length
        
        // Store active goals for progress bars
        const activeGoalsList = goals.filter(g => g.status === 'active')
        setActiveGoals(activeGoalsList)
        
        if (total > 0) {
          setGoalsData([
            { name: 'Completed', value: Math.round((completed / total) * 100), color: '#10b981' },
            { name: 'In Progress', value: Math.round((active / total) * 100), color: '#0ea5e9' },
            { name: 'Not Started', value: Math.round((notStarted / total) * 100), color: '#94a3b8' },
          ])
        }
      }
      
      // Fetch real-time progress summary
      try {
        const progressResponse = await api.goals.getProgressSummary()
        if (progressResponse.success && progressResponse.summary) {
          setProgressSummary(progressResponse.summary)
        }
      } catch (err) {
        console.log('Progress summary not available:', err)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Format number to avoid floating point display issues
  const formatNumber = (num) => {
    if (num === null || num === undefined) return 0
    // If it's a whole number, return as integer
    if (Number.isInteger(num)) return num
    // Otherwise round to 1 decimal place and remove trailing zeros
    return parseFloat(num.toFixed(1))
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Calculate progress percentage for goals
  const getGoalProgress = (goal) => {
    const current = goal?.currentValue ?? goal?.currentProgress ?? 0
    const target = goal?.targetValue ?? goal?.target ?? 1
    return Math.min(100, Math.round((current / target) * 100))
  }

  // Calculate overall goal completion for progress bar
  const getOverallGoalCompletion = () => {
    if (progressSummary?.overallCompletion) {
      return Math.round(progressSummary.overallCompletion)
    }
    if (activeGoals.length === 0) return 0
    const totalProgress = activeGoals.reduce((sum, goal) => sum + getGoalProgress(goal), 0)
    return Math.round(totalProgress / activeGoals.length)
  }

  // Calculate focus time progress (based on weekly goal of 10 hours = 600 minutes)
  const getFocusTimeProgress = () => {
    const weeklyGoal = 600 // 10 hours per week target
    return Math.min(100, Math.round((metrics.totalFocusTime / weeklyGoal) * 100))
  }

  // Calculate session goal progress
  const getSessionsProgress = () => {
    const dailyGoal = 3 // target 3 sessions per day
    return Math.min(100, Math.round((metrics.sessionsToday / dailyGoal) * 100))
  }

  // Calculate streak progress (based on 30-day goal)
  const getStreakProgress = () => {
    const streakGoal = 30
    return Math.min(100, Math.round((metrics.currentStreak / streakGoal) * 100))
  }

  // Calculate avg session progress (target 45 minutes)
  const getAvgSessionProgress = () => {
    const targetAvg = 45
    return Math.min(100, Math.round((metrics.avgSessionLength / targetAvg) * 100))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-7 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA2KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative max-w-3xl">
          <p className="text-primary-200 text-sm font-medium mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">
            {getGreeting()}, {user?.profile?.displayName || user?.user?.email?.split('@')[0] || 'Student'}!
          </h1>
          <p className="text-primary-100 text-[15px] mb-6">
            Ready to make today productive? Start a focus session or check your goals.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/focus"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-primary-700 rounded-xl font-semibold text-sm hover:bg-primary-50 transition-colors shadow-md"
            >
              <Play className="w-4 h-4" />
              <span>Start Session</span>
            </Link>
            <Link
              to="/goals"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              <Target className="w-4 h-4" />
              <span>View Goals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Clock,
            label: 'Total Focus Time',
            value: formatTime(metrics.totalFocusTime),
            progress: getFocusTimeProgress(),
            accent: 'primary',
            iconBg: 'bg-primary-50 dark:bg-primary-900/20',
            iconColor: 'text-primary-600 dark:text-primary-400',
            barColor: 'bg-primary-500',
          },
          {
            icon: TrendingUp,
            label: 'Avg Session',
            value: `${metrics.avgSessionLength} min`,
            progress: getAvgSessionProgress(),
            accent: 'accent',
            iconBg: 'bg-accent-50 dark:bg-accent-900/20',
            iconColor: 'text-accent-600 dark:text-accent-400',
            barColor: 'bg-accent-500',
          },
          {
            icon: Calendar,
            label: 'Sessions Today',
            value: metrics.sessionsToday,
            progress: getSessionsProgress(),
            accent: 'green',
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            iconColor: 'text-green-600 dark:text-green-400',
            barColor: 'bg-green-500',
          },
          {
            icon: Flame,
            label: 'Current Streak',
            value: `${metrics.currentStreak} days`,
            progress: getStreakProgress(),
            accent: 'orange',
            iconBg: 'bg-orange-50 dark:bg-orange-900/20',
            iconColor: 'text-orange-600 dark:text-orange-400',
            barColor: 'bg-orange-500',
          },
        ].map((metric, i) => (
          <div key={i} className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${metric.iconBg} rounded-xl flex items-center justify-center`}>
                <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                {metric.progress}%
              </span>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5 tracking-tight">
              {metric.value}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {metric.label}
            </p>
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${metric.barColor} transition-all duration-700 ease-out rounded-full`} 
                style={{ width: `${metric.progress}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Goals Progress Section */}
      {activeGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                Active Goals
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                {getOverallGoalCompletion()}% overall completion
              </p>
            </div>
            <Link
              to="/goals"
              className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeGoals.slice(0, 5).map((goal) => {
              const progress = getGoalProgress(goal)
              const current = formatNumber(goal?.currentValue ?? goal?.currentProgress ?? 0)
              const target = formatNumber(goal?.targetValue ?? goal?.target ?? 1)
              const progressColor = progress >= 75 ? 'bg-accent-500' : progress >= 50 ? 'bg-amber-500' : progress >= 25 ? 'bg-orange-500' : 'bg-red-400'
              
              return (
                <div key={goal._id || goal.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {goal.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {goal.category || 'General'} &middot; {current}/{target} {goal.progressUnit || goal.type || 'units'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-3 flex-shrink-0">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} transition-all duration-700 ease-out rounded-full`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Weekly Focus Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                Weekly Focus Time
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                Past 7 days overview
              </p>
            </div>
            <Link
              to="/reports"
              className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1 transition-colors"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
                formatter={(value) => [`${Math.round(value)} min`, 'Focus Time']}
              />
              <Bar dataKey="minutes" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Progress Pie Chart */}
        <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
          <div className="mb-5">
            <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
              Goal Progress
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
              Achievement status
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={goalsData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {goalsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2.5">
            {goalsData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[13px] text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link
            to="/reports"
            className="text-[13px] font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="space-y-1">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className={`
                w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                ${activity.type === 'session' ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                ${activity.type === 'goal' ? 'bg-accent-50 dark:bg-accent-900/20' : ''}
                ${activity.type === 'reward' ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
              `}>
                {activity.type === 'session' && <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                {activity.type === 'goal' && <Target className="w-4 h-4 text-accent-600 dark:text-accent-400" />}
                {activity.type === 'reward' && <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <div className="flex items-center space-x-2 mt-0.5">
                  {activity.duration && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.duration}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
