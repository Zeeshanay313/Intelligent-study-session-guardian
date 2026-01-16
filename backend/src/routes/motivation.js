/**
 * Motivation Routes
 *
 * API endpoints for motivational tips and community challenges
 *
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const router = express.Router();
const MotivationalTip = require('../models/MotivationalTip');
const CommunityChallenge = require('../models/CommunityChallenge');
const UserRewards = require('../models/UserRewards');
const { authenticate } = require('../middleware/auth');
const { 
  initializeUserRewards,
  queueAchievementNotification,
  checkAndAwardRewards
} = require('../services/RewardsService');

// ============================================
// MOTIVATIONAL TIPS ENDPOINTS
// ============================================

// GET /api/motivation/tip - Get random motivational tip
router.get('/tip', authenticate, async (req, res) => {
  try {
    const {
      type,
      performanceLevel,
      context,
      timeOfDay
    } = req.query;
    
    // Get user's session count and streak from rewards
    const userRewards = await UserRewards.findOne({ userId: req.user._id });
    
    const criteria = {
      type,
      performanceLevel: performanceLevel || 'any',
      context: context || 'any',
      timeOfDay: timeOfDay || 'any',
      sessionCount: userRewards?.lifetimeStats?.sessionsCompleted || 0,
      streakCount: userRewards?.lifetimeStats?.currentStreak || 0
    };
    
    const tip = await MotivationalTip.getRandomTip(criteria);
    
    if (!tip) {
      return res.json({
        success: true,
        data: {
          content: 'Keep up the great work! Every study session brings you closer to your goals. 🌟',
          type: 'encouragement',
          icon: '🌟',
          color: '#10B981'
        }
      });
    }
    
    res.json({ success: true, data: tip });
  } catch (error) {
    console.error('Get motivational tip error:', error);
    res.status(500).json({ error: 'Failed to fetch motivational tip' });
  }
});

// GET /api/motivation/tips - Get all tips (admin or for display)
router.get('/tips', authenticate, async (req, res) => {
  try {
    const { type, category, context } = req.query;
    
    const query = { isActive: true };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (context) query['triggers.context'] = context;
    
    const tips = await MotivationalTip.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: tips });
  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
});

// ============================================
// COMMUNITY CHALLENGES ENDPOINTS
// ============================================

// GET /api/motivation/challenges - Get all active challenges
router.get('/challenges', authenticate, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    } else {
      // Default to active and upcoming
      query.status = { $in: ['active', 'upcoming'] };
    }
    
    if (category) {
      query.category = category;
    }
    
    const challenges = await CommunityChallenge.find(query)
      .sort({ startDate: -1 })
      .lean();
    
    // Add user participation status
    const challengesWithStatus = challenges.map(challenge => {
      const isParticipating = challenge.participants.some(
        p => p.userId.toString() === req.user._id.toString()
      );
      const userParticipant = challenge.participants.find(
        p => p.userId.toString() === req.user._id.toString()
      );
      
      return {
        ...challenge,
        isParticipating,
        userProgress: userParticipant?.progress || 0,
        userCompleted: userParticipant?.completed || false
      };
    });
    
    res.json({ success: true, data: challengesWithStatus });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// GET /api/motivation/challenges/my - Get user's challenges
router.get('/challenges/my', authenticate, async (req, res) => {
  try {
    const challenges = await CommunityChallenge.getUserChallenges(req.user._id);
    
    const userChallenges = challenges.map(challenge => {
      const userParticipant = challenge.participants.find(
        p => p.userId.toString() === req.user._id.toString()
      );
      
      return {
        ...challenge.toObject(),
        userProgress: userParticipant?.progress || 0,
        userCompleted: userParticipant?.completed || false,
        userJoinedAt: userParticipant?.joinedAt,
        userCompletedAt: userParticipant?.completedAt
      };
    });
    
    res.json({ success: true, data: userChallenges });
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ error: 'Failed to fetch user challenges' });
  }
});

// GET /api/motivation/challenges/:id - Get single challenge
router.get('/challenges/:id', authenticate, async (req, res) => {
  try {
    const challenge = await CommunityChallenge.findById(req.params.id).lean();
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    const isParticipating = challenge.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );
    const userParticipant = challenge.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );
    
    res.json({
      success: true,
      data: {
        ...challenge,
        isParticipating,
        userProgress: userParticipant?.progress || 0,
        userCompleted: userParticipant?.completed || false
      }
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

// POST /api/motivation/challenges/:id/join - Join a challenge
router.post('/challenges/:id/join', authenticate, async (req, res) => {
  try {
    const challenge = await CommunityChallenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
      return res.status(400).json({ error: 'Challenge is not available to join' });
    }
    
    const result = challenge.addParticipant(req.user._id);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    await challenge.save();
    
    res.json({
      success: true,
      message: result.message,
      data: challenge
    });
  } catch (error) {
    console.error('Join challenge error:', error);
    res.status(500).json({ error: 'Failed to join challenge' });
  }
});

// POST /api/motivation/challenges/:id/update-progress - Update challenge progress
router.post('/challenges/:id/update-progress', authenticate, async (req, res) => {
  try {
    const { progress } = req.body;
    
    if (progress === undefined) {
      return res.status(400).json({ error: 'Progress value required' });
    }
    
    const challenge = await CommunityChallenge.findById(req.params.id);
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    // Track if already completed before update
    const participant = challenge.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );
    const wasCompleted = participant?.completed || false;
    
    const result = challenge.updateProgress(req.user._id, progress);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    await challenge.save();
    
    // Get updated participant
    const updatedParticipant = challenge.participants.find(
      p => p.userId.toString() === req.user._id.toString()
    );
    
    let rewardResult = null;
    
    // If just completed, award rewards with proper level progression
    if (!wasCompleted && updatedParticipant?.completed && challenge.rewards.points > 0) {
      const userRewards = await initializeUserRewards(req.user._id);
      
      // Add points with level check
      userRewards.addPoints(
        challenge.rewards.points,
        `Completed challenge: ${challenge.title}`,
        'achievement',
        challenge._id
      );
      
      const levelUpResult = userRewards.checkLevelUp();
      await userRewards.save();
      
      rewardResult = {
        pointsAwarded: challenge.rewards.points,
        newTotalPoints: userRewards.totalPoints,
        levelUp: levelUpResult.leveledUp ? { didLevelUp: true, newLevel: userRewards.currentLevel } : null,
        currentLevel: userRewards.currentLevel
      };
      
      // Queue achievement notification
      queueAchievementNotification(req.user._id, {
        type: 'challenge_completed',
        title: '🏆 Challenge Complete!',
        message: `You conquered "${challenge.title}"!`,
        pointsAwarded: challenge.rewards.points,
        challengeId: challenge._id
      });
      
      // Award badge if challenge has one
      if (challenge.rewards.badgeId) {
        const badgeEarned = userRewards.earnReward(challenge.rewards.badgeId);
        if (badgeEarned) {
          await userRewards.save();
        }
      }
    }
    
    res.json({
      success: true,
      message: result.message,
      data: {
        progress: updatedParticipant.progress,
        completed: updatedParticipant.completed
      },
      rewardResult
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/motivation/challenges/:id/leaderboard - Get challenge leaderboard
router.get('/challenges/:id/leaderboard', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const challenge = await CommunityChallenge.findById(req.params.id)
      .populate('participants.userId', 'profile.displayName profile.avatar');
    
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    
    if (!challenge.showLeaderboard) {
      return res.status(403).json({ error: 'Leaderboard is not enabled for this challenge' });
    }
    
    const leaderboard = challenge.getLeaderboard(parseInt(limit));
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/motivation/personal-records - Get user's personal records
router.get('/personal-records', authenticate, async (req, res) => {
  try {
    const userRewards = await UserRewards.findOne({ userId: req.user._id });
    
    if (!userRewards) {
      return res.json({
        success: true,
        data: {
          longestStreak: 0,
          totalStudyHours: 0,
          totalSessions: 0,
          level: 1,
          totalPoints: 0
        }
      });
    }
    
    const records = {
      longestStreak: userRewards.lifetimeStats.longestStreak,
      currentStreak: userRewards.lifetimeStats.currentStreak,
      totalStudyHours: userRewards.lifetimeStats.totalStudyMinutes / 60,
      totalSessions: userRewards.lifetimeStats.sessionsCompleted,
      level: userRewards.level,
      totalPoints: userRewards.currentBalance,
      totalBadges: userRewards.badges.length,
      joinedDate: userRewards.createdAt
    };
    
    res.json({ success: true, data: records });
  } catch (error) {
    console.error('Get personal records error:', error);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
});

module.exports = router;
