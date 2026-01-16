/**
 * Rewards Routes
 *
 * RESTful API endpoints for rewards and gamification system
 *
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getMyRewards,
  getAllRewards,
  getProgress,
  getLeaderboardData,
  getRank,
  awardBonus
} = require('../controllers/rewardsController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/rewards/me - Get user's rewards profile
router.get('/me', getMyRewards);

// GET /api/rewards/progress - Get progress towards unearned rewards
router.get('/progress', getProgress);

// GET /api/rewards/leaderboard - Get leaderboard
// Query params: ?type=alltime|weekly|monthly&limit=100
router.get('/leaderboard', getLeaderboardData);

// GET /api/rewards/rank - Get user's rank on leaderboard
// Query params: ?type=alltime|weekly|monthly
router.get('/rank', getRank);

// GET /api/rewards - Get all available rewards
// Query params: ?type=badge|achievement&category=study|goal|streak
router.get('/', getAllRewards);

// POST /api/rewards/bonus - Award bonus points (admin only)
// Body: { userId, amount, reason }
router.post('/bonus', awardBonus);

module.exports = router;
