/**
 * AdminDashboard Page
 * 
 * Main admin panel with system overview and quick statistics
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Target, 
  Clock, 
  Award,
  TrendingUp,
  AlertCircle,
  Activity,
  Shield,
  ChevronRight
} from 'lucide-react'
import adminApi from '../../services/adminApi'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getDashboardStats()
      if (response.success) {
        // Map backend stats structure to frontend expected format
        const backendStats = response.stats
        setStats({
          totalUsers: backendStats?.users?.total || 0,
          activeUsers: backendStats?.users?.active || 0,
          adminUsers: backendStats?.users?.admins || 0,
          totalGoals: backendStats?.goals?.total || 0,
          completedGoals: backendStats?.goals?.completed || 0,
          totalSessions: backendStats?.sessions?.total || 0,
          totalStudyMinutes: parseFloat(backendStats?.sessions?.totalHours || 0) * 60,
          totalRewardsEarned: backendStats?.rewards?.totalEarned || 0,
          totalPoints: backendStats?.rewards?.totalPoints || 0,
          recentUsers: backendStats?.recentUsers || [],
          topUsers: backendStats?.topUsers || [],
          newUsersToday: backendStats?.users?.newToday || 0
        })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard stats')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      link: '/admin/users',
      change: stats?.newUsersToday ? `+${stats.newUsersToday} today` : null
    },
    {
      title: 'Active Users (24h)',
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: 'green',
      change: null
    },
    {
      title: 'Total Goals',
      value: stats?.totalGoals || 0,
      icon: Target,
      color: 'purple',
      change: stats?.completedGoals ? `${stats.completedGoals} completed` : null
    },
    {
      title: 'Study Sessions',
      value: stats?.totalSessions || 0,
      icon: Clock,
      color: 'orange',
      change: stats?.totalStudyMinutes ? `${Math.round(stats.totalStudyMinutes / 60)}h total` : null
    },
    {
      title: 'Rewards Earned',
      value: stats?.totalRewardsEarned || 0,
      icon: Award,
      color: 'yellow',
      change: stats?.totalPoints ? `${stats.totalPoints} points` : null
    },
    {
      title: 'Admin Users',
      value: stats?.adminUsers || 0,
      icon: Shield,
      color: 'red',
      change: null
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            System overview and management
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {card.link && (
                  <Link
                    to={card.link}
                    className="text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {card.value.toLocaleString()}
              </p>
              {card.change && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {card.change}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Manage Users</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, delete users</p>
            </div>
          </Link>
          <Link
            to="/admin/users?action=create"
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 text-xl font-bold">+</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Create User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a new user account</p>
            </div>
          </Link>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Activity className="w-8 h-8 text-purple-600" />
            <div className="text-left">
              <h3 className="font-medium text-gray-900 dark:text-white">Refresh Stats</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update dashboard data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity - Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Status
        </h2>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 dark:text-green-400 font-medium">
            All systems operational
          </span>
        </div>
      </div>

      {/* Top Users & Recent Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users by Points */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Users by Points
          </h2>
          {stats?.topUsers && stats.topUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.topUsers.slice(0, 5).map((userReward, index) => (
                <div key={userReward._id || index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {userReward.userId?.profile?.displayName || userReward.userId?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {userReward.userId?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary-600 dark:text-primary-400">
                      {userReward.totalPoints?.toLocaleString() || 0} pts
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userReward.earnedRewards?.length || 0} rewards
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No reward data yet</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Recent Users
          </h2>
          {stats?.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-3">
              {stats.recentUsers.map((user, index) => (
                <div key={user._id || index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                        {(user.profile?.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.profile?.displayName || user.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Joined
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
