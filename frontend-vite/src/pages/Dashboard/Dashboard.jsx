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
import { api } from '../../services/api'

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
  const { user } = useAuth()
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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch sessions and calculate metrics
      const sessionsResponse = await api.sessions.list()
      if (sessionsResponse.success) {
        const sessions = sessionsResponse.data
        
        // Calculate total focus time (this week)
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const weekSessions = sessions.filter(s => new Date(s.startTime) >= oneWeekAgo)
        const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.actualDuration / 60), 0)
        
        // Calculate avg session length
        const avgMinutes = weekSessions.length > 0 ? totalMinutes / weekSessions.length : 0
        
        // Count today's sessions
        const today = new Date().toDateString()
        const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === today)
        
        setMetrics({
          totalFocusTime: Math.round(totalMinutes),
          avgSessionLength: Math.round(avgMinutes),
          sessionsToday: todaySessions.length,
          currentStreak: 7, // This would come from API
        })
        
        // Build weekly data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekData = days.map((day, index) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - index))
          const daySessions = sessions.filter(s => {
            const sessionDate = new Date(s.startTime)
            return sessionDate.toDateString() === date.toDateString()
          })
          const minutes = daySessions.reduce((sum, s) => sum + (s.actualDuration / 60), 0)
          return { day: days[date.getDay()], minutes: Math.round(minutes) }
        })
        setWeeklyData(weekData)
      }
      
      // Fetch goals data
      const goalsResponse = await api.goals.list()
      if (goalsResponse.success) {
        const goals = goalsResponse.data
        const completed = goals.filter(g => g.status === 'completed').length
        const active = goals.filter(g => g.status === 'active').length
        const notStarted = goals.filter(g => g.status === 'not_started').length
        const total = goals.length
        
        if (total > 0) {
          setGoalsData([
            { name: 'Completed', value: Math.round((completed / total) * 100), color: '#10b981' },
            { name: 'In Progress', value: Math.round((active / total) * 100), color: '#0ea5e9' },
            { name: 'Not Started', value: Math.round((notStarted / total) * 100), color: '#94a3b8' },
          ])
        }
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">
            {getGreeting()}, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-primary-100 mb-6">
            You're doing great! Ready to make today productive?
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/focus"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors shadow-md"
            >
              <Play className="w-5 h-5" />
              <span>Start Focus Session</span>
            </Link>
            <Link
              to="/goals"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-700/50 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-primary-700/70 transition-colors border border-white/20"
            >
              <Target className="w-5 h-5" />
              <span>View Goals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              +12%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatTime(metrics.totalFocusTime)}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Focus Time
          </p>
          <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 dark:bg-primary-500" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Avg Session Length */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-600 dark:text-accent-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              +5%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.avgSessionLength} min
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Avg Session Length
          </p>
          <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-accent-600 dark:bg-accent-500" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Sessions Today */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.sessionsToday}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sessions Today
          </p>
          <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 dark:bg-green-500" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
              🔥
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics.currentStreak} days
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current Streak
          </p>
          <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-600 dark:bg-orange-500" style={{ width: '85%' }} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Focus Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Weekly Focus Time
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your focus time over the past 7 days
              </p>
            </div>
            <Link
              to="/reports"
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
            >
              <span>Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="day"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => [`${value} min`, 'Focus Time']}
              />
              <Bar dataKey="minutes" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Goal Progress Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Goal Progress
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your achievement status
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={goalsData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {goalsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {goalsData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <Link
            to="/reports"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${activity.type === 'session' ? 'bg-primary-100 dark:bg-primary-900/30' : ''}
                ${activity.type === 'goal' ? 'bg-green-100 dark:bg-green-900/30' : ''}
                ${activity.type === 'reward' ? 'bg-orange-100 dark:bg-orange-900/30' : ''}
              `}>
                {activity.type === 'session' && <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                {activity.type === 'goal' && <Target className="w-5 h-5 text-green-600 dark:text-green-400" />}
                {activity.type === 'reward' && <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {activity.duration && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.duration}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-500">
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
