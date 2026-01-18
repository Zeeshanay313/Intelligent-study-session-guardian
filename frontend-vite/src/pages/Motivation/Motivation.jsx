/**
 * Enhanced Motivation Component
 * Community challenges, motivational content, and achievement celebrations
 */

import React, { useState, useEffect, useCallback } from 'react'
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
  Zap,
  Sparkles,
  Medal,
  Gift,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import { useAchievementToast } from '../../components/UI/AchievementToast'

// Personal Records Card with celebration
const PersonalRecordsCard = ({ records }) => {
  if (!records) return null

  const stats = [
    { icon: Flame, label: 'Current Streak', value: `${records.currentStreak || 0} days`, color: 'text-orange-500' },
    { icon: Trophy, label: 'Level', value: records.level || 1, color: 'text-yellow-500' },
    { icon: Star, label: 'Total Points', value: (records.totalPoints || 0).toLocaleString(), color: 'text-blue-500' },
    { icon: Award, label: 'Badges', value: records.totalBadges || 0, color: 'text-purple-500' },
    { icon: Clock, label: 'Study Hours', value: `${Math.round(records.totalStudyHours || 0)}h`, color: 'text-green-500' },
    { icon: Target, label: 'Sessions', value: records.totalSessions || 0, color: 'text-indigo-500' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Motivational Tip Display
const MotivationalTipCard = ({ tip, onRefresh }) => {
  if (!tip) return null

  return (
    <div
      className="rounded-xl p-6 border-2 relative overflow-hidden"
      style={{
        backgroundColor: (tip.color || '#10B981') + '15',
        borderColor: (tip.color || '#10B981') + '40',
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Sparkles className="w-full h-full" style={{ color: tip.color || '#10B981' }} />
      </div>
      <div className="flex items-start space-x-4 relative z-10">
        <div className="text-4xl flex-shrink-0">{tip.icon || '💡'}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                {tip.type || 'Tip'}
              </span>
            </div>
          </div>
          <p className="text-lg text-gray-900 dark:text-white font-medium mt-3">
            {tip.content}
          </p>
          {tip.author && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
              — {tip.author}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Challenge Card Component
const ChallengeCard = ({ challenge, onJoin, getDifficultyColor, getDaysRemaining }) => {
  const daysRemaining = getDaysRemaining(challenge.endDate)
  const progress = challenge.userProgress || 0
  const progressPercent = (progress / challenge.target) * 100
  
  // Format progress to avoid floating point display issues
  const formatProgress = (value) => {
    const num = Number(value)
    return Number(num.toFixed(2))
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{challenge.icon}</div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
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
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{challenge.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{challenge.description}</p>

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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{formatProgress(progress)} / {challenge.target}</span>
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
            <Gift className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {challenge.rewards?.points || 0} points
              </p>
              {challenge.rewards?.customReward && (
                <p className="text-xs text-gray-600 dark:text-gray-400">{challenge.rewards.customReward}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!challenge.isParticipating && challenge.status === 'active' && (
          <Button onClick={() => onJoin(challenge._id)} className="w-full">
            Join Challenge
          </Button>
        )}
        {challenge.isParticipating && challenge.status === 'active' && (
          <Button variant="secondary" className="w-full" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            Participating
          </Button>
        )}
        {challenge.status === 'upcoming' && (
          <Button variant="secondary" className="w-full" disabled>
            <Calendar className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        )}
      </div>
    </div>
  )
}

const Motivation = () => {
  const [challenges, setChallenges] = useState([])
  const [personalRecords, setPersonalRecords] = useState(null)
  const [motivationalTip, setMotivationalTip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [joiningChallenge, setJoiningChallenge] = useState(null)
  
  // Get achievement toast - safely handle when not wrapped in provider
  let achievementToast = null
  try {
    achievementToast = useAchievementToast()
  } catch (e) {
    // Not wrapped in AchievementToastProvider
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        api.motivation.getChallenges(),
        api.motivation.getPersonalRecords(),
        api.motivation.getTip({ context: 'any' }),
      ])

      const [challengesRes, recordsRes, tipRes] = results.map(r => 
        r.status === 'fulfilled' ? r.value : null
      )

      if (challengesRes?.success) setChallenges(challengesRes.data || [])
      if (recordsRes?.success) setPersonalRecords(recordsRes.data)
      if (tipRes?.success) setMotivationalTip(tipRes.data)
    } catch (error) {
      console.error('Failed to fetch motivation data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleJoinChallenge = async (challengeId) => {
    try {
      setJoiningChallenge(challengeId)
      const response = await api.motivation.joinChallenge(challengeId)
      if (response.success) {
        fetchData()
        // Show celebration for joining
        if (achievementToast) {
          achievementToast.showAchievement('🎯', 'Challenge Joined!', 'Good luck!')
        }
      }
    } catch (error) {
      console.error('Failed to join challenge:', error)
      alert(error.response?.data?.error || 'Failed to join challenge')
    } finally {
      setJoiningChallenge(null)
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
          Join community challenges, track achievements, and stay motivated
        </p>
      </div>

      {/* Motivational Tip */}
      <MotivationalTipCard tip={motivationalTip} />

      {/* Personal Records */}
      <PersonalRecordsCard records={personalRecords} />

      {/* Quick Stats Banner */}
      {personalRecords && personalRecords.currentStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Flame className="w-10 h-10" />
              <div>
                <p className="text-lg font-bold">🔥 You're on a {personalRecords.currentStreak}-day streak!</p>
                <p className="text-sm opacity-90">Keep it up to earn streak badges and bonus points</p>
              </div>
            </div>
            {personalRecords.longestStreak > personalRecords.currentStreak && (
              <div className="text-right hidden md:block">
                <p className="text-sm opacity-75">Personal Best</p>
                <p className="text-xl font-bold">{personalRecords.longestStreak} days</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Challenges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Challenges</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {challenges.length} total challenges
          </span>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'active', label: 'Active', count: challenges.filter(c => c.status === 'active').length },
            { id: 'my', label: 'My Challenges', count: challenges.filter(c => c.isParticipating).length },
            { id: 'upcoming', label: 'Upcoming', count: challenges.filter(c => c.status === 'upcoming').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
              {activeTab === 'my' ? 'You haven\'t joined any challenges yet' : 'No challenges found'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {activeTab === 'my' ? 'Join an active challenge to get started!' : 'Check back soon for new challenges'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge._id}
                challenge={challenge}
                onJoin={handleJoinChallenge}
                getDifficultyColor={getDifficultyColor}
                getDaysRemaining={getDaysRemaining}
              />
            ))}
          </div>
        )}
      </div>

      {/* How Challenges Work */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2" />
          How Challenges Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h4 className="font-semibold mb-1">Join a Challenge</h4>
            <p className="text-sm opacity-90">Pick a challenge that matches your goals and click "Join"</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h4 className="font-semibold mb-1">Complete the Goal</h4>
            <p className="text-sm opacity-90">Study sessions automatically count towards your progress</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h4 className="font-semibold mb-1">Earn Rewards</h4>
            <p className="text-sm opacity-90">Complete challenges to earn points, badges, and climb the leaderboard</p>
          </div>
        </div>
      </div>

      {/* Unlock Premium Features */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-xl p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 opacity-20">
          <Star className="w-full h-full text-white" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 opacity-20">
          <Sparkles className="w-full h-full text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Gift className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Unlock Premium Features</h3>
                  <p className="text-white/90 text-sm">Earn points through study sessions & challenges</p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                Keep earning points to unlock exclusive premium features! Complete study sessions, 
                join challenges, and maintain your streak to accumulate points faster.
              </p>
            </div>

            {/* Points Progress Card */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Your Points</span>
                <span className="text-2xl font-bold text-white">
                  {(personalRecords?.totalPoints || 0).toLocaleString()}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Next unlock at 5,000 pts</span>
                  <span className="text-white font-medium">
                    {Math.min(100, Math.round(((personalRecords?.totalPoints || 0) / 5000) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2.5">
                  <div 
                    className="bg-white h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((personalRecords?.totalPoints || 0) / 5000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { icon: '🎨', name: 'Custom Themes', points: 2000, unlocked: (personalRecords?.totalPoints || 0) >= 2000 },
              { icon: '📊', name: 'Advanced Analytics', points: 5000, unlocked: (personalRecords?.totalPoints || 0) >= 5000 },
              { icon: '🏆', name: 'Exclusive Badges', points: 10000, unlocked: (personalRecords?.totalPoints || 0) >= 10000 },
              { icon: '⚡', name: 'Priority Support', points: 15000, unlocked: (personalRecords?.totalPoints || 0) >= 15000 }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`rounded-lg p-3 text-center transition-all ${
                  feature.unlocked 
                    ? 'bg-white/30 ring-2 ring-white/50' 
                    : 'bg-white/10 opacity-80'
                }`}
              >
                <div className="text-2xl mb-1">{feature.icon}</div>
                <p className="text-white text-sm font-medium">{feature.name}</p>
                <p className="text-white/70 text-xs mt-1">
                  {feature.unlocked ? (
                    <span className="text-green-200 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> Unlocked
                    </span>
                  ) : (
                    `${feature.points.toLocaleString()} pts`
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Tips to earn more */}
          <div className="mt-5 flex items-center justify-center space-x-6 text-white/90 text-sm flex-wrap gap-2">
            <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Complete sessions +10 pts</span>
            <span className="flex items-center"><Flame className="w-4 h-4 mr-1" /> Daily streak +5 pts</span>
            <span className="flex items-center"><Trophy className="w-4 h-4 mr-1" /> Win challenges +100 pts</span>
          </div>
        </div>
      </div>

      {/* Motivational Footer */}
      <div className="text-center py-8">
        <Medal className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Every Step Counts
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Challenges are optional but a great way to stay motivated and connect with other learners
        </p>
      </div>
    </div>
  )
}

export default Motivation
