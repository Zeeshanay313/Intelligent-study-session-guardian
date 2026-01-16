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
  awardBonusPoints
} = require('../services/RewardsService');
const Reward = require('../models/Reward');

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

module.exports = {
  getMyRewards,
  getAllRewards,
  getProgress,
  getLeaderboardData,
  getRank,
  awardBonus
};
