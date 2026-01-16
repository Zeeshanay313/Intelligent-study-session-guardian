/**
 * RewardsWidget Component
 * Compact rewards display for dashboard showing level, points, and next badge
 */

import React, { useState, useEffect } from 'react'
import { Trophy, Star, TrendingUp, Award, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const RewardsWidget = () => {
  const navigate = useNavigate()
  const [rewardsData, setRewardsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRewardsData()
  }, [])

  const fetchRewardsData = async () => {
    try {
      const response = await api.rewards.get()
      if (response.success) {
        setRewardsData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  const {
    level = 1,
    totalPoints = 0,
    pointsToNextLevel = 100,
    currentLevelPoints = 0,
    badges = [],
    nextBadge = null,
  } = rewardsData || {}

  const progressToNextLevel = currentLevelPoints > 0 
    ? Math.round((currentLevelPoints / pointsToNextLevel) * 100)
    : 0

  const getNextBadgeInfo = () => {
    if (!nextBadge) {
      const upcomingBadges = [
        { name: 'First Steps', icon: '🎯', requirement: 'Complete 5 sessions' },
        { name: 'Consistent Learner', icon: '📚', requirement: '7-day streak' },
        { name: 'Goal Achiever', icon: '🏆', requirement: 'Complete first goal' },
        { name: 'Time Master', icon: '⏰', requirement: '50 hours studied' },
      ]
      return upcomingBadges[Math.min(badges.length, upcomingBadges.length - 1)]
    }
    return nextBadge
  }

  const nextBadgeInfo = getNextBadgeInfo()

  return (
    <div
      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/rewards')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Rewards</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* Level and Points */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Level {level}
              </span>
              {level >= 10 && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalPoints.toLocaleString()} total points
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {currentLevelPoints}/{pointsToNextLevel}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">to next level</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          />
        </div>
      </div>

      {/* Badges Summary */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Badges Earned
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {badges.length}
          </span>
        </div>

        {/* Recent Badges */}
        {badges.length > 0 && (
          <div className="flex items-center space-x-1">
            {badges.slice(-5).map((badge, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                title={badge.name}
              >
                {badge.icon || '🏅'}
              </div>
            ))}
            {badges.length > 5 && (
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                +{badges.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Badge */}
      {nextBadgeInfo && (
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl shadow-md">
              {nextBadgeInfo.icon || '🎯'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                Next: {nextBadgeInfo.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {nextBadgeInfo.requirement}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-center text-sm text-purple-600 dark:text-purple-400 font-medium">
          <TrendingUp className="w-4 h-4 mr-1" />
          Keep earning rewards!
        </div>
      </div>
    </div>
  )
}

export default RewardsWidget
