/**
 * Rewards Component
 * Display achievements, badges, and reward system
 */

import React, { useState, useEffect } from 'react'
import { Trophy, Star, Award, TrendingUp, Zap, Target, Clock, Flame } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'

const Rewards = () => {
  const [userRewards, setUserRewards] = useState(null)
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const [userRewardsRes, badgesRes] = await Promise.all([
        api.rewards.getUserRewards(),
        api.rewards.list(),
      ])

      if (userRewardsRes.success) {
        setUserRewards(userRewardsRes.data)
      }

      if (badgesRes.success) {
        setBadges(badgesRes.data)
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (iconName) => {
    const icons = {
      trophy: Trophy,
      star: Star,
      award: Award,
      target: Target,
      clock: Clock,
      flame: Flame,
      zap: Zap,
    }
    return icons[iconName] || Award
  }

  const getLevelProgress = () => {
    if (!userRewards) return 0
    const pointsForCurrentLevel = userRewards.level * 100
    const pointsForNextLevel = (userRewards.level + 1) * 100
    const pointsInCurrentLevel = userRewards.totalPoints - pointsForCurrentLevel
    const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel
    return (pointsInCurrentLevel / pointsNeededForLevel) * 100
  }

  const getNextLevelPoints = () => {
    if (!userRewards) return 0
    return (userRewards.level + 1) * 100 - userRewards.totalPoints
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rewards & Achievements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your progress and unlock achievements
        </p>
      </div>

      {/* User Stats Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Your Level</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-bold">{userRewards?.level || 1}</span>
              <span className="text-2xl opacity-75">Level</span>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-full">
            <Trophy className="w-12 h-12" />
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="opacity-90">Level Progress</span>
            <span className="font-medium">{getNextLevelPoints()} points to next level</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${getLevelProgress()}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <Star className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{userRewards?.totalPoints || 0}</p>
            <p className="text-sm opacity-75">Total Points</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Award className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{badges.filter(b => b.earned).length}</p>
            <p className="text-sm opacity-75">Badges Earned</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <Flame className="w-6 h-6 mb-2" />
            <p className="text-2xl font-bold">{userRewards?.streak || 0}</p>
            <p className="text-sm opacity-75">Day Streak</p>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Badges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const Icon = getBadgeIcon(badge.icon)
            const isEarned = badge.earned

            return (
              <div
                key={badge.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all ${
                  isEarned
                    ? 'border-primary-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isEarned
                      ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  <Icon className="w-8 h-8" />
                </div>

                {/* Badge Info */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {badge.description}
                </p>

                {/* Points */}
                <div className="flex items-center space-x-2">
                  <Star className={`w-4 h-4 ${isEarned ? 'text-yellow-500' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {badge.points} points
                  </span>
                </div>

                {/* Earned Badge */}
                {isEarned && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Earned
                    </div>
                  </div>
                )}

                {/* Locked Badge */}
                {!isEarned && badge.requirement && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Requirement:</span> {badge.requirement}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Achievements Timeline */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Achievements
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {badges
            .filter(b => b.earned && b.earnedDate)
            .sort((a, b) => new Date(b.earnedDate) - new Date(a.earnedDate))
            .slice(0, 5)
            .map((badge) => {
              const Icon = getBadgeIcon(badge.icon)
              
              return (
                <div key={badge.id} className="p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earned {new Date(badge.earnedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <Star className="w-4 h-4" />
                    <span className="font-bold">+{badge.points}</span>
                  </div>
                </div>
              )
            })}
          
          {badges.filter(b => b.earned).length === 0 && (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No achievements yet. Keep studying to earn your first badge!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center">
        <Zap className="w-12 h-12 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
        <p className="opacity-90">
          Complete more sessions and reach your goals to unlock amazing rewards
        </p>
      </div>
    </div>
  )
}

export default Rewards
