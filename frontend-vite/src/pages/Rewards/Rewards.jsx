/**
 * Enhanced Rewards Component
 * Display achievements, badges, streaks, leaderboard, and sharing features
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Trophy,
  Star,
  Award,
  TrendingUp,
  Zap,
  Target,
  Clock,
  Flame,
  Share2,
  Crown,
  Gift,
  Medal,
  Users,
  Lock,
  Check,
  X,
  Lightbulb
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'

// Achievement Share Modal Component
const ShareAchievementModal = ({ achievement, onClose, onShare }) => {
  const [shareWith, setShareWith] = useState([])
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleShare = async () => {
    if (!consent) return
    
    setLoading(true)
    try {
      await onShare(achievement, shareWith, message, consent)
      onClose()
    } catch (error) {
      console.error('Failed to share:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Share Achievement
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">{achievement?.name || 'Achievement'}</p>
              <p className="text-sm opacity-90">{achievement?.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
            <input
              type="checkbox"
              checked={shareWith.includes('guardian')}
              onChange={(e) => {
                if (e.target.checked) {
                  setShareWith([...shareWith, 'guardian'])
                } else {
                  setShareWith(shareWith.filter(s => s !== 'guardian'))
                }
              }}
              className="w-4 h-4 text-primary-600"
            />
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">Share with Guardian</span>
          </label>

          <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
            <input
              type="checkbox"
              checked={shareWith.includes('peers')}
              onChange={(e) => {
                if (e.target.checked) {
                  setShareWith([...shareWith, 'peers'])
                } else {
                  setShareWith(shareWith.filter(s => s !== 'peers'))
                }
              }}
              className="w-4 h-4 text-primary-600"
            />
            <Users className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700 dark:text-gray-300">Share with Study Peers</span>
          </label>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal message (optional)"
          className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={2}
        />

        <label className="flex items-start space-x-3 mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-4 h-4 mt-1 text-primary-600"
          />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              I consent to sharing this achievement
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Your achievement details will be shared with the selected recipients
            </p>
          </div>
        </label>

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!consent || shareWith.length === 0 || loading}
            className="flex-1"
          >
            {loading ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Streak Card Component
const StreakCard = ({ streakData }) => {
  const currentStreak = streakData?.currentStreak || 0
  const longestStreak = streakData?.longestStreak || 0
  const streakStatus = streakData?.streakStatus || 'none'
  const nextMilestone = streakData?.nextMilestone || 7
  const daysToMilestone = streakData?.daysToMilestone || 7
  const milestones = streakData?.milestones || []

  const getStatusColor = () => {
    switch (streakStatus) {
      case 'completed_today': return 'text-green-300'
      case 'at_risk': return 'text-yellow-300'
      case 'broken': return 'text-red-300'
      default: return 'text-white/80'
    }
  }

  const getStatusText = () => {
    switch (streakStatus) {
      case 'completed_today': return '✓ Studied today!'
      case 'at_risk': return '⚠ Study today to keep streak!'
      case 'broken': return '💔 Streak broken - start fresh!'
      default: return 'Start your streak!'
    }
  }

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm opacity-90 mb-1">Current Streak</p>
          <div className="flex items-baseline space-x-2">
            <Flame className="w-8 h-8" />
            <span className="text-5xl font-bold">{currentStreak}</span>
            <span className="text-xl opacity-75">days</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-90 mb-1">Longest Streak</p>
          <p className="text-2xl font-bold">{longestStreak} days</p>
        </div>
      </div>

      <p className={`text-sm font-medium mb-4 ${getStatusColor()}`}>
        {getStatusText()}
      </p>

      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="opacity-90">Next Milestone: {nextMilestone} days</span>
          <span className="font-medium">{daysToMilestone} days to go</span>
        </div>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(100, (currentStreak / nextMilestone) * 100)}%` }}
          />
        </div>
      </div>

      {milestones.length > 0 && (
        <div className="flex space-x-2 mt-4">
          {milestones.slice(0, 6).map((milestone) => (
            <div
              key={milestone.days}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
                milestone.achieved
                  ? 'bg-white text-orange-600'
                  : 'bg-white/20 text-white/60'
              }`}
              title={`${milestone.days}-day streak`}
            >
              {milestone.days}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Study Suggestions Component
const StudySuggestions = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      default: return 'border-gray-300 bg-gray-50 dark:bg-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
        Study Suggestions
      </h3>
      {suggestions.slice(0, 3).map((suggestion, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)}`}
        >
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{suggestion.icon}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{suggestion.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const Rewards = () => {
  const [userRewards, setUserRewards] = useState(null)
  const [badges, setBadges] = useState([])
  const [progress, setProgress] = useState([])
  const [streakData, setStreakData] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('badges')
  const [shareModal, setShareModal] = useState(null)

  const fetchRewards = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.rewards.getUserRewards(),
        api.rewards.list(),
        api.rewards.getProgress(),
        api.rewards.getStreak(),
        api.rewards.getSuggestions(),
        api.rewards.getLeaderboard('alltime', 10),
        api.rewards.getRank('alltime')
      ])

      const [
        userRewardsRes,
        badgesRes,
        progressRes,
        streakRes,
        suggestionsRes,
        leaderboardRes,
        rankRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : null)

      if (userRewardsRes && userRewardsRes.success !== false) {
        setUserRewards(userRewardsRes)
      }
      
      if (badgesRes && badgesRes.success) {
        const allBadges = badgesRes.rewards || badgesRes.data || []
        const earnedIds = userRewardsRes?.earnedRewards?.map(er => 
          (er.rewardId?._id || er.rewardId)?.toString()
        ) || []
        
        const badgesWithStatus = allBadges.map(badge => ({
          ...badge,
          id: badge._id,
          earned: earnedIds.includes(badge._id?.toString()),
          earnedDate: userRewardsRes?.earnedRewards?.find(
            er => (er.rewardId?._id || er.rewardId)?.toString() === badge._id?.toString()
          )?.earnedAt
        }))
        setBadges(badgesWithStatus)
      }
      
      if (progressRes && progressRes.success) {
        setProgress(progressRes.progress || [])
      }
      
      if (streakRes && streakRes.success) {
        setStreakData(streakRes.data)
      }
      
      if (suggestionsRes && suggestionsRes.success) {
        setSuggestions(suggestionsRes.suggestions || [])
      }
      
      if (leaderboardRes && leaderboardRes.success) {
        setLeaderboard(leaderboardRes.leaderboard || [])
      }
      
      if (rankRes && rankRes.success) {
        setUserRank(rankRes)
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRewards()
  }, [fetchRewards])

  const handleShareAchievement = async (achievement, shareWith, message, consent) => {
    try {
      const recipients = shareWith.map(type => ({ id: type, type: type }))
      await api.rewards.shareAchievement(achievement._id || achievement.id, recipients, message, consent)
      alert('Achievement shared successfully!')
    } catch (error) {
      console.error('Failed to share achievement:', error)
      alert('Failed to share achievement')
    }
  }

  const getBadgeIcon = (iconName) => {
    const icons = { trophy: Trophy, star: Star, award: Award, target: Target, clock: Clock, flame: Flame, zap: Zap, crown: Crown, gift: Gift, medal: Medal }
    return icons[iconName] || Award
  }

  const getRarityStyle = (rarity) => {
    const styles = {
      common: 'border-gray-300 dark:border-gray-600',
      uncommon: 'border-green-400 dark:border-green-600',
      rare: 'border-blue-400 dark:border-blue-600',
      epic: 'border-purple-400 dark:border-purple-600',
      legendary: 'border-yellow-400 dark:border-yellow-500'
    }
    return styles[rarity] || styles.common
  }

  const getRarityBadge = (rarity) => {
    const badgeStyles = {
      common: { bg: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Common' },
      uncommon: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', label: 'Uncommon' },
      rare: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', label: 'Rare' },
      epic: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', label: 'Epic' },
      legendary: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300', label: 'Legendary' }
    }
    return badgeStyles[rarity] || badgeStyles.common
  }

  // Format progress value to avoid floating point display issues
  const formatProgress = (value) => {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    return Number(num.toFixed(2))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading rewards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Rewards & Achievements</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your progress, earn badges, and celebrate your achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Your Level</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold">{userRewards?.currentLevel || 1}</span>
                <span className="text-xl opacity-75">Level</span>
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded-full"><Trophy className="w-10 h-10" /></div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-90">Level Progress</span>
              <span className="font-medium">{userRewards?.pointsToNextLevel ? `${userRewards.pointsToNextLevel - (userRewards.totalPoints % userRewards.pointsToNextLevel)} pts to next` : '0 pts to next'}</span>
            </div>
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${userRewards?.levelProgress || 0}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-lg font-bold">{userRewards?.totalPoints || 0}</p>
              <p className="text-xs opacity-75">Total Points</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Award className="w-5 h-5 mx-auto mb-1" />
              <p className="text-lg font-bold">{badges.filter(b => b.earned).length}</p>
              <p className="text-xs opacity-75">Badges</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1" />
              <p className="text-lg font-bold">{userRewards?.lifetimeStats?.totalGoalsCompleted || 0}</p>
              <p className="text-xs opacity-75">Goals</p>
            </div>
          </div>
        </div>

        <StreakCard streakData={streakData} />
      </div>

      {suggestions.length > 0 && <StudySuggestions suggestions={suggestions} />}

      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        {['badges', 'progress', 'leaderboard'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium transition-colors capitalize ${activeTab === tab ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No badges available yet</p>
            </div>
          ) : (
            badges.map((badge) => {
              const Icon = getBadgeIcon(badge.icon)
              const isEarned = badge.earned
              const rarityStyle = getRarityStyle(badge.rarity)
              const rarityBadge = getRarityBadge(badge.rarity)

              return (
                <div key={badge.id || badge._id} className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 border-2 transition-all ${rarityStyle} ${isEarned ? 'shadow-lg' : 'opacity-70'}`}>
                  <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${rarityBadge.bg}`}>{rarityBadge.label}</span>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isEarned ? 'text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`} style={isEarned ? { backgroundColor: badge.color || '#6B7280' } : {}}>
                    {isEarned ? <Icon className="w-7 h-7" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{badge.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className={`w-4 h-4 ${isEarned ? 'text-yellow-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{badge.pointsValue || 0} points</span>
                    </div>
                    {isEarned && (
                      <button onClick={() => setShareModal(badge)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors" title="Share achievement">
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {isEarned && badge.earnedDate && <p className="text-xs text-gray-500 mt-2">Earned {new Date(badge.earnedDate).toLocaleDateString()}</p>}
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Track your progress towards unlocking new badges</p>
          {progress.length === 0 ? (
            <div className="text-center py-8">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Keep studying to see your progress here!</p>
            </div>
          ) : (
            progress.slice(0, 10).map((item, index) => {
              const Icon = getBadgeIcon(item.reward?.icon)
              return (
                <div key={item.reward?._id || index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: item.reward?.color || '#6B7280' }}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.reward?.name || 'Badge'}</h4>
                        <span className="text-sm text-gray-500">{formatProgress(item.currentValue || 0)} / {item.targetValue || 1}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${item.progressPercent || 0}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.progressPercent || 0}% complete</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Your Rank Banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">#{userRank?.rank || '—'}</span>
                </div>
                <div>
                  <p className="font-bold">Your Rank</p>
                  <p className="text-sm opacity-90">{(userRewards?.totalPoints || userRank?.points || 0).toLocaleString()} points</p>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 opacity-75" />
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Learners</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This week's leaderboard</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full font-medium">
                  Updated hourly
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                { rank: 1, name: 'Sarah Johnson', avatar: '👩‍💻', points: 12450, streak: 28, badge: '🥇' },
                { rank: 2, name: 'Michael Chen', avatar: '👨‍🎓', points: 11280, streak: 21, badge: '🥈' },
                { rank: 3, name: 'Emma Williams', avatar: '👩‍🔬', points: 10890, streak: 19, badge: '🥉' },
                { rank: 4, name: 'James Rodriguez', avatar: '👨‍💼', points: 9750, streak: 15, badge: null },
                { rank: 5, name: 'Aisha Patel', avatar: '👩‍⚕️', points: 9320, streak: 14, badge: null },
                { rank: 6, name: 'David Kim', avatar: '👨‍🏫', points: 8890, streak: 12, badge: null },
                { rank: 7, name: 'Sofia Martinez', avatar: '👩‍🎨', points: 8450, streak: 10, badge: null },
                { rank: 8, name: 'You', avatar: '⭐', points: userRewards?.totalPoints || 0, streak: streakData?.currentStreak || 0, badge: null, isCurrentUser: true },
              ].sort((a, b) => b.points - a.points).map((user, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 transition-colors ${
                    user.isCurrentUser 
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                      index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    
                    {/* Avatar & Name */}
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{user.avatar}</span>
                      <div>
                        <p className={`font-medium ${user.isCurrentUser ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                          {user.name} {user.badge && <span className="ml-1">{user.badge}</span>}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <Flame className="w-3 h-3 mr-1 text-orange-500" /> {user.streak} day streak
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div className="text-right">
                    <p className={`font-bold ${user.isCurrentUser ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                      {user.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keep studying to climb the leaderboard! 🚀
              </p>
            </div>
          </div>
        </div>
      )}

      {shareModal && <ShareAchievementModal achievement={shareModal} onClose={() => setShareModal(null)} onShare={handleShareAchievement} />}

      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white text-center">
        <Zap className="w-10 h-10 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
        <p className="opacity-90">Every study session brings you closer to your next achievement</p>
      </div>
    </div>
  )
}

export default Rewards
