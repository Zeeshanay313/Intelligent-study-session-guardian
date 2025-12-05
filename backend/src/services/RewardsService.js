/**
 * Rewards Service
 *
 * Handles the gamification logic: awarding points, checking achievements,
 * granting rewards, and managing the rewards system
 *
 * @author Intelligent Study Session Guardian Team
 */

const Reward = require('../models/Reward');
const UserRewards = require('../models/UserRewards');

/**
 * Initialize user rewards profile if it doesn't exist
 */
async function initializeUserRewards(userId) {
  let userRewards = await UserRewards.findOne({ userId });

  if (!userRewards) {
    userRewards = new UserRewards({
      userId,
      totalPoints: 0,
      currentLevel: 1,
      pointsToNextLevel: 100
    });
    await userRewards.save();
  }

  return userRewards;
}

/**
 * Award points to a user for completing a session
 */
async function awardSessionPoints(userId, sessionData) {
  const userRewards = await initializeUserRewards(userId);

  // Calculate points based on session duration
  const durationMinutes = sessionData.duration / 60;
  const basePoints = Math.floor(durationMinutes * 2); // 2 points per minute

  // Bonus for longer sessions
  let bonusPoints = 0;
  if (durationMinutes >= 60) {
    bonusPoints = 20; // 1 hour bonus
  } else if (durationMinutes >= 30) {
    bonusPoints = 10; // 30 min bonus
  }

  const totalPoints = basePoints + bonusPoints;

  userRewards.addPoints(
    totalPoints,
    `Completed ${Math.floor(durationMinutes)} minute study session`,
    'session',
    sessionData._id
  );

  userRewards.updateSessionStats(sessionData.duration);

  // Check for session-based rewards
  await checkAndAwardRewards(userId, 'sessions_count', {
    alltime: userRewards.lifetimeStats.totalSessionsCompleted
  });

  // Check for study hours rewards
  await checkAndAwardRewards(userId, 'study_hours', {
    alltime: userRewards.lifetimeStats.totalStudyHours
  });

  // Check for streak rewards
  await checkAndAwardRewards(userId, 'streak_days', {
    alltime: userRewards.lifetimeStats.currentStreak
  });

  const levelUpResult = userRewards.checkLevelUp();

  await userRewards.save();

  return {
    pointsAwarded: totalPoints,
    newTotalPoints: userRewards.totalPoints,
    levelUp: levelUpResult,
    currentLevel: userRewards.currentLevel
  };
}

/**
 * Award points for goal completion
 */
async function awardGoalCompletionPoints(userId, goalData) {
  const userRewards = await initializeUserRewards(userId);

  // Points based on goal type and difficulty
  let points = 50; // Base points

  if (goalData.type === 'hours') {
    points += Math.floor(goalData.target * 5);
  } else if (goalData.type === 'sessions') {
    points += goalData.target * 10;
  } else if (goalData.type === 'streak') {
    points += goalData.target * 15;
  }

  // Bonus for priority
  if (goalData.priority === 'high') {
    points = Math.floor(points * 1.5);
  } else if (goalData.priority === 'critical') {
    points = Math.floor(points * 2);
  }

  userRewards.addPoints(
    points,
    `Completed goal: ${goalData.title}`,
    'goal',
    goalData._id
  );

  userRewards.updateGoalStats();

  // Check for goal completion rewards
  await checkAndAwardRewards(userId, 'goals_completed', {
    alltime: userRewards.lifetimeStats.totalGoalsCompleted
  });

  const levelUpResult = userRewards.checkLevelUp();

  await userRewards.save();

  return {
    pointsAwarded: points,
    newTotalPoints: userRewards.totalPoints,
    levelUp: levelUpResult,
    currentLevel: userRewards.currentLevel
  };
}

/**
 * Check and award eligible rewards based on user stats
 */
async function checkAndAwardRewards(userId, criteriaType, userStats) {
  const userRewards = await initializeUserRewards(userId);
  const eligibleRewards = await Reward.checkEligibleRewards(criteriaType, userStats);

  const newlyEarned = [];

  for (const reward of eligibleRewards) {
    // Check if user already has this reward
    if (!userRewards.hasReward(reward._id)) {
      const earned = userRewards.earnReward(reward._id);

      if (earned) {
        // Award points for earning the reward
        userRewards.addPoints(
          reward.pointsValue,
          `Earned reward: ${reward.name}`,
          'achievement',
          reward._id
        );

        newlyEarned.push(reward);
      }
    }
  }

  if (newlyEarned.length > 0) {
    await userRewards.save();
  }

  return newlyEarned;
}

/**
 * Get user's rewards profile with statistics
 */
async function getUserRewardsProfile(userId) {
  const userRewards = await initializeUserRewards(userId);

  await userRewards.populate('earnedRewards.rewardId');

  return {
    userId: userRewards.userId,
    totalPoints: userRewards.totalPoints,
    currentLevel: userRewards.currentLevel,
    levelProgress: userRewards.levelProgress,
    pointsToNextLevel: userRewards.pointsToNextLevel,
    weeklyPoints: userRewards.weeklyPoints,
    monthlyPoints: userRewards.monthlyPoints,
    lifetimeStats: userRewards.lifetimeStats,
    earnedRewards: userRewards.earnedRewards,
    totalBadges: userRewards.totalBadges,
    recentPoints: userRewards.pointsHistory.slice(-10).reverse()
  };
}

/**
 * Get leaderboard
 */
async function getLeaderboard(type = 'alltime', limit = 100) {
  return UserRewards.getLeaderboard(type, limit);
}

/**
 * Get user's rank on leaderboard
 */
async function getUserRank(userId, type = 'alltime') {
  return UserRewards.getUserRank(userId, type);
}

/**
 * Award bonus points manually (admin function)
 */
async function awardBonusPoints(userId, amount, reason) {
  const userRewards = await initializeUserRewards(userId);

  userRewards.addPoints(amount, reason, 'bonus');

  const levelUpResult = userRewards.checkLevelUp();

  await userRewards.save();

  return {
    pointsAwarded: amount,
    newTotalPoints: userRewards.totalPoints,
    levelUp: levelUpResult
  };
}

/**
 * Get progress towards unearned rewards
 */
async function getRewardsProgress(userId) {
  const userRewards = await initializeUserRewards(userId);
  const allRewards = await Reward.find({ isActive: true });

  const progress = [];

  for (const reward of allRewards) {
    const hasEarned = userRewards.hasReward(reward._id);

    if (!hasEarned) {
      let currentValue = 0;
      const { type, threshold, timeframe } = reward.criteria;

      // Get current progress value
      switch (type) {
        case 'sessions_count':
          currentValue = userRewards.lifetimeStats.totalSessionsCompleted;
          break;
        case 'study_hours':
          currentValue = userRewards.lifetimeStats.totalStudyHours;
          break;
        case 'streak_days':
          currentValue = userRewards.lifetimeStats.currentStreak;
          break;
        case 'goals_completed':
          currentValue = userRewards.lifetimeStats.totalGoalsCompleted;
          break;
        default:
          currentValue = 0;
      }

      const progressPercent = Math.min(Math.round((currentValue / threshold) * 100), 100);

      progress.push({
        reward,
        currentValue,
        targetValue: threshold,
        progressPercent,
        timeframe
      });
    }
  }

  // Sort by progress (closest to completion first)
  progress.sort((a, b) => b.progressPercent - a.progressPercent);

  return progress;
}

module.exports = {
  initializeUserRewards,
  awardSessionPoints,
  awardGoalCompletionPoints,
  checkAndAwardRewards,
  getUserRewardsProfile,
  getLeaderboard,
  getUserRank,
  awardBonusPoints,
  getRewardsProgress
};
