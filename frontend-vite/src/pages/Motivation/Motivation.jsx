/**
 * Motivation Component
 * Community challenges and motivational content
 */

import React, { useState, useEffect } from 'react'
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Award,
  Flame,
  Star,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'

const Motivation = () => {
  const [challenges, setChallenges] = useState([])
  const [myChallenges, setMyChallenges] = useState([])
  const [personalRecords, setPersonalRecords] = useState(null)
  const [motivationalTip, setMotivationalTip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [challengesRes, myChallengesRes, recordsRes, tipRes] = await Promise.all([
        api.motivation.getChallenges(),
        api.motivation.getMyChallenges(),
        api.motivation.getPersonalRecords(),
        api.motivation.getTip({ context: 'any' }),
      ])

      if (challengesRes.success) setChallenges(challengesRes.data || [])
      if (myChallengesRes.success) setMyChallenges(myChallengesRes.data || [])
      if (recordsRes.success) setPersonalRecords(recordsRes.data)
      if (tipRes.success) setMotivationalTip(tipRes.data)
    } catch (error) {
      console.error('Failed to fetch motivation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinChallenge = async (challengeId) => {
    try {
      const response = await api.motivation.joinChallenge(challengeId)
      if (response.success) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to join challenge:', error)
      alert(error.response?.data?.error || 'Failed to join challenge')
    }
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      hard: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      extreme: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    }
    return colors[difficulty] || colors.medium
  }

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === 'active') return c.status === 'active'
    if (activeTab === 'upcoming') return c.status === 'upcoming'
    if (activeTab === 'my') return c.isParticipating
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Motivation & Challenges
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Join community challenges and track your achievements
        </p>
      </div>

      {/* Motivational Tip */}
      {motivationalTip && (
        <div
          className="rounded-xl p-6 border-2"
          style={{
            backgroundColor: motivationalTip.color + '10',
            borderColor: motivationalTip.color + '40',
          }}
        >
          <div className="flex items-start space-x-4">
            <div className="text-4xl">{motivationalTip.icon}</div>
            <div className="flex-1">
              <p className="text-lg text-gray-900 dark:text-white font-medium">
                {motivationalTip.content}
              </p>
              {motivationalTip.author && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  — {motivationalTip.author}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personal Records */}
      {personalRecords && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {personalRecords.currentStreak} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {personalRecords.level}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Star className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {personalRecords.totalPoints.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {personalRecords.totalBadges}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Active Challenges
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'my'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          My Challenges
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Upcoming
        </button>
      </div>

      {/* Challenges Grid */}
      {filteredChallenges.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No challenges found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => {
            const daysRemaining = getDaysRemaining(challenge.endDate)
            const progress = challenge.userProgress || 0
            const progressPercent = (progress / challenge.target) * 100

            return (
              <div
                key={challenge._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{challenge.icon}</div>
                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                          challenge.difficulty
                        )}`}
                      >
                        {challenge.difficulty}
                      </span>
                      {challenge.isParticipating && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Joined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {challenge.description}
                  </p>

                  {/* Target */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {challenge.target} {challenge.unit}
                    </span>
                  </div>

                  {/* Progress (if participating) */}
                  {challenge.isParticipating && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progress
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {progress} / {challenge.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressPercent, 100)}%` }}
                        />
                      </div>
                      {challenge.userCompleted && (
                        <div className="flex items-center space-x-2 mt-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Completed!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{challenge.stats?.totalParticipants || 0} joined</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{daysRemaining}d left</span>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {challenge.rewards.points} points
                        </p>
                        {challenge.rewards.customReward && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {challenge.rewards.customReward}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {!challenge.isParticipating && challenge.status === 'active' && (
                    <Button
                      onClick={() => handleJoinChallenge(challenge._id)}
                      className="w-full"
                    >
                      Join Challenge
                    </Button>
                  )}

                  {challenge.isParticipating && challenge.status === 'active' && (
                    <Button variant="secondary" className="w-full" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Participating
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Motivation
