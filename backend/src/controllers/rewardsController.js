/**
 * Rewards Controller
 *
 * Handles HTTP requests for the rewards and gamification system
 *
 * @author Intelligent Study Session Guardian Team
 */

const {
  getUserRewardsProfile,
  getRewardsProgress,
  getLeaderboard,
  getUserRank,
  awardBonusPoints,
  getPendingNotifications,
  clearNotifications,
  shareAchievement,
  getStudySuggestions
} = require('../services/RewardsService');
const Reward = require('../models/Reward');
const UserRewards = require('../models/UserRewards');

/**
 * Get user's rewards profile
 * @route GET /api/rewards/me
 */
const getMyRewards = async (req, res) => {
  try {
    const profile = await getUserRewardsProfile(req.user._id);

    res.json({
      success: true,
      ...profile
    });
  } catch (error) {
    console.error('Error getting user rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards profile'
    });
  }
};

/**
 * Get all available rewards
 * @route GET /api/rewards
 */
const getAllRewards = async (req, res) => {
  try {
    const { type, category } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;
    if (category) filter.category = category;

    const rewards = await Reward.find(filter).sort({ displayOrder: 1 });

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error('Error getting rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards'
    });
  }
};

/**
 * Get progress towards unearned rewards
 * @route GET /api/rewards/progress
 */
const getProgress = async (req, res) => {
  try {
    const progress = await getRewardsProgress(req.user._id);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error getting rewards progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards progress'
    });
  }
};

/**
 * Get leaderboard
 * @route GET /api/rewards/leaderboard
 */
const getLeaderboardData = async (req, res) => {
  try {
    const { type = 'alltime', limit = 100 } = req.query;

    const leaderboard = await getLeaderboard(type, parseInt(limit, 10));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
};

/**
 * Get user's rank
 * @route GET /api/rewards/rank
 */
const getRank = async (req, res) => {
  try {
    const { type = 'alltime' } = req.query;

    const rank = await getUserRank(req.user._id, type);

    if (!rank) {
      return res.json({
        success: true,
        rank: null,
        message: 'User not ranked yet'
      });
    }

    res.json({
      success: true,
      ...rank
    });
  } catch (error) {
    console.error('Error getting user rank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user rank'
    });
  }
};

/**
 * Award bonus points (admin only)
 * @route POST /api/rewards/bonus
 */
const awardBonus = async (req, res) => {
  try {
    // Check if user is admin (you'll need to implement this check)
    // For now, we'll allow it but you should add admin verification

    const { userId, amount, reason } = req.body;

    if (!userId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, reason'
      });
    }

    const result = await awardBonusPoints(userId, amount, reason);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error awarding bonus points:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to award bonus points'
    });
  }
};

/**
 * Get pending achievement notifications
 * @route GET /api/rewards/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = getPendingNotifications(req.user._id);
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark notifications as read/cleared
 * @route POST /api/rewards/notifications/clear
 */
const clearUserNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    clearNotifications(req.user._id, notificationIds);
    
    res.json({
      success: true,
      message: 'Notifications cleared'
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications'
    });
  }
};

/**
 * Share an achievement
 * @route POST /api/rewards/achievements/share
 */
const shareUserAchievement = async (req, res) => {
  try {
    const { achievementId, shareWith, message, consent } = req.body;
    
    if (!consent) {
      return res.status(400).json({
        success: false,
        error: 'User consent is required to share achievements'
      });
    }
    
    if (!shareWith || !Array.isArray(shareWith) || shareWith.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please specify recipients to share with'
      });
    }
    
    // Get the achievement details
    const userRewards = await UserRewards.findOne({ userId: req.user._id })
      .populate('earnedRewards.rewardId');
    
    if (!userRewards) {
      return res.status(404).json({
        success: false,
        error: 'User rewards not found'
      });
    }
    
    const earnedReward = userRewards.earnedRewards.find(
      er => er.rewardId._id.toString() === achievementId || er._id.toString() === achievementId
    );
    
    if (!earnedReward) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found'
      });
    }
    
    const achievementData = {
      type: earnedReward.rewardId.type,
      title: earnedReward.rewardId.name,
      description: earnedReward.rewardId.description,
      earnedAt: earnedReward.earnedAt,
      icon: earnedReward.rewardId.icon,
      pointsValue: earnedReward.rewardId.pointsValue
    };
    
    const shareData = shareWith.map(recipient => ({
      recipientId: recipient.id,
      type: recipient.type,
      message: message || ''
    }));
    
    const sharedAchievement = await shareAchievement(
      req.user._id,
      achievementData,
      shareData,
      consent
    );
    
    res.json({
      success: true,
      message: 'Achievement shared successfully',
      data: sharedAchievement
    });
  } catch (error) {
    console.error('Error sharing achievement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to share achievement'
    });
  }
};

/**
 * Get study suggestions based on user performance
 * @route GET /api/rewards/suggestions
 */
const getSuggestions = async (req, res) => {
  try {
    const suggestions = await getStudySuggestions(req.user._id);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggestions'
    });
  }
};

/**
 * Get detailed streak information
 * @route GET /api/rewards/streak
 */
const getStreakInfo = async (req, res) => {
  try {
    const userRewards = await UserRewards.findOne({ userId: req.user._id });
    
    if (!userRewards) {
      return res.json({
        success: true,
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastStudyDate: null,
          streakStatus: 'none',
          nextMilestone: 7,
          daysToMilestone: 7
        }
      });
    }
    
    const { currentStreak, longestStreak, lastStudyDate } = userRewards.lifetimeStats;
    
    // Determine streak status
    let streakStatus = 'active';
    if (!lastStudyDate) {
      streakStatus = 'none';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastStudy = new Date(lastStudyDate);
      lastStudy.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        streakStatus = 'completed_today';
      } else if (daysDiff === 1) {
        streakStatus = 'at_risk';
      } else if (daysDiff > 1) {
        streakStatus = 'broken';
      }
    }
    
    // Calculate next milestone
    const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
    const nextMilestone = milestones.find(m => m > currentStreak) || currentStreak + 30;
    const daysToMilestone = nextMilestone - currentStreak;
    
    res.json({
      success: true,
      data: {
        currentStreak,
        longestStreak,
        lastStudyDate,
        streakStatus,
        nextMilestone,
        daysToMilestone,
        milestones: milestones.map(m => ({
          days: m,
          achieved: currentStreak >= m,
          isCurrent: m === nextMilestone
        }))
      }
    });
  } catch (error) {
    console.error('Error getting streak info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch streak information'
    });
  }
};

module.exports = {
  getMyRewards,
  getAllRewards,
  getProgress,
  getLeaderboardData,
  getRank,
  awardBonus,
  // New exports
  getNotifications,
  clearUserNotifications,
  shareUserAchievement,
  getSuggestions,
  getStreakInfo
};
