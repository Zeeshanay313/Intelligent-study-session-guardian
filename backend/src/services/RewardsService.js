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

// In-memory notifications queue (in production, use Redis or a message queue)
const notificationsQueue = new Map();

/**
 * Queue an achievement notification for a user
 */
function queueAchievementNotification(userId, notification) {
  const userNotifications = notificationsQueue.get(userId.toString()) || [];
  userNotifications.push({
    ...notification,
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    read: false
  });
  notificationsQueue.set(userId.toString(), userNotifications);
}

/**
 * Get pending notifications for a user
 */
function getPendingNotifications(userId) {
  return notificationsQueue.get(userId.toString()) || [];
}

/**
 * Clear notifications for a user
 */
function clearNotifications(userId, notificationIds = null) {
  if (!notificationIds) {
    notificationsQueue.delete(userId.toString());
  } else {
    const current = notificationsQueue.get(userId.toString()) || [];
    const filtered = current.filter(n => !notificationIds.includes(n.id));
    notificationsQueue.set(userId.toString(), filtered);
  }
}

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

/**
 * Check for personal records and queue notifications
 */
async function checkPersonalRecords(userId, statType, newValue, previousValue) {
  const userRewards = await initializeUserRewards(userId);
  const records = [];
  
  // Check if this is a new personal best
  if (statType === 'streak' && newValue > previousValue) {
    if (newValue >= 7 && previousValue < 7) {
      records.push({
        type: 'streak_milestone',
        title: '🔥 7-Day Streak!',
        message: 'You\'ve studied for 7 days in a row! Keep the momentum going!',
        milestone: 7
      });
    }
    if (newValue >= 14 && previousValue < 14) {
      records.push({
        type: 'streak_milestone',
        title: '🔥🔥 2-Week Streak!',
        message: 'Two weeks of consistent studying! You\'re building great habits!',
        milestone: 14
      });
    }
    if (newValue >= 30 && previousValue < 30) {
      records.push({
        type: 'streak_milestone',
        title: '🏆 30-Day Streak!',
        message: 'A full month of dedication! You\'re unstoppable!',
        milestone: 30
      });
    }
    
    // Longest streak record
    if (newValue > userRewards.lifetimeStats.longestStreak) {
      records.push({
        type: 'personal_best',
        title: '⭐ New Longest Streak!',
        message: `You've set a new personal record: ${newValue} days!`,
        stat: 'longestStreak',
        value: newValue
      });
    }
  }
  
  if (statType === 'session_duration' && newValue > (userRewards.lifetimeStats.longestSession || 0)) {
    records.push({
      type: 'personal_best',
      title: '⏱️ Longest Session!',
      message: `New personal best: ${Math.round(newValue / 60)} minutes of focused study!`,
      stat: 'longestSession',
      value: newValue
    });
  }
  
  // Queue notifications for each record
  for (const record of records) {
    queueAchievementNotification(userId, {
      type: 'personal_record',
      ...record,
      category: 'achievement'
    });
  }
  
  return records;
}

/**
 * Share achievement with guardian or peer
 */
async function shareAchievement(userId, achievementData, shareWith, consentGiven = false) {
  if (!consentGiven) {
    throw new Error('User consent is required to share achievements');
  }
  
  const userRewards = await initializeUserRewards(userId);
  
  // Create a shareable achievement record
  const sharedAchievement = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    userId,
    achievement: {
      type: achievementData.type,
      title: achievementData.title,
      description: achievementData.description,
      earnedAt: achievementData.earnedAt || new Date(),
      icon: achievementData.icon || '🏆',
      pointsValue: achievementData.pointsValue || 0
    },
    sharedWith: shareWith.map(s => ({
      recipientId: s.recipientId,
      recipientType: s.type, // 'guardian' or 'peer'
      sharedAt: new Date(),
      message: s.message || ''
    })),
    visibility: 'shared', // 'private', 'shared', 'public'
    consentTimestamp: new Date()
  };
  
  // In a real implementation, you would:
  // 1. Save to database
  // 2. Send notifications to recipients
  // 3. Handle email/push notifications
  
  return sharedAchievement;
}

/**
 * Get user's study suggestions based on performance
 */
async function getStudySuggestions(userId) {
  const userRewards = await initializeUserRewards(userId);
  const suggestions = [];
  
  const { currentStreak, totalStudyHours, totalSessionsCompleted, lastStudyDate } = userRewards.lifetimeStats;
  
  // Streak-based suggestions
  if (currentStreak === 0) {
    suggestions.push({
      type: 'streak_start',
      priority: 'high',
      title: 'Start Your Streak!',
      message: 'Begin your study journey today. Even 15 minutes makes a difference!',
      icon: '🔥',
      action: 'start_session'
    });
  } else if (currentStreak >= 1 && currentStreak < 7) {
    const daysToMilestone = 7 - currentStreak;
    suggestions.push({
      type: 'streak_maintain',
      priority: 'medium',
      title: `${daysToMilestone} Days to 7-Day Badge!`,
      message: `Keep going! You're ${daysToMilestone} days away from your first streak badge.`,
      icon: '🎯',
      action: 'start_session'
    });
  }
  
  // Last study date suggestions
  if (lastStudyDate) {
    const daysSinceLastStudy = Math.floor((new Date() - new Date(lastStudyDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceLastStudy >= 1 && currentStreak > 0) {
      suggestions.push({
        type: 'streak_warning',
        priority: 'critical',
        title: 'Don\'t Break Your Streak!',
        message: `Study today to maintain your ${currentStreak}-day streak!`,
        icon: '⚠️',
        action: 'start_session'
      });
    }
  }
  
  // Session count suggestions
  const averageSessionLength = totalSessionsCompleted > 0 
    ? (totalStudyHours * 60) / totalSessionsCompleted 
    : 0;
  
  if (averageSessionLength > 0 && averageSessionLength < 25) {
    suggestions.push({
      type: 'session_length',
      priority: 'low',
      title: 'Try Longer Sessions',
      message: 'Your average session is short. Try the Pomodoro technique with 25-minute focused sessions!',
      icon: '⏱️',
      action: 'settings'
    });
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return suggestions;
}

/**
 * Award points for challenge completion
 */
async function awardChallengeCompletionPoints(userId, challengeData) {
  const userRewards = await initializeUserRewards(userId);

  // Base points from challenge + bonus based on difficulty
  let points = challengeData.rewards?.points || 100;
  
  // Difficulty bonus
  const difficultyMultiplier = {
    'easy': 1,
    'medium': 1.25,
    'hard': 1.5,
    'extreme': 2
  };
  
  points = Math.floor(points * (difficultyMultiplier[challengeData.difficulty] || 1));

  userRewards.addPoints(
    points,
    `Completed challenge: ${challengeData.title}`,
    'achievement',
    challengeData._id
  );

  const levelUpResult = userRewards.checkLevelUp();
  await userRewards.save();
  
  // Queue achievement notification
  queueAchievementNotification(userId, {
    type: 'challenge_completed',
    title: '🏆 Challenge Complete!',
    message: `You conquered "${challengeData.title}"!`,
    pointsAwarded: points,
    challengeId: challengeData._id
  });

  return {
    pointsAwarded: points,
    newTotalPoints: userRewards.totalPoints,
    levelUp: levelUpResult.leveledUp ? { didLevelUp: true, newLevel: userRewards.currentLevel } : null,
    currentLevel: userRewards.currentLevel
  };
}

/**
 * Update active challenges progress after a session
 */
async function updateChallengesFromSession(userId, sessionData) {
  const CommunityChallenge = require('../models/CommunityChallenge');
  
  const userRewards = await initializeUserRewards(userId);
  const durationHours = sessionData.duration / 3600;
  const results = [];
  
  // Find active challenges the user is participating in
  const activeChallenges = await CommunityChallenge.find({
    status: 'active',
    'participants.userId': userId
  });
  
  for (const challenge of activeChallenges) {
    const participant = challenge.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    
    if (!participant || participant.completed) continue;
    
    let progressIncrement = 0;
    
    // Calculate progress increment based on challenge type
    switch (challenge.type) {
      case 'study-hours':
        progressIncrement = durationHours;
        break;
      case 'session-count':
        progressIncrement = 1;
        break;
      case 'streak':
        progressIncrement = userRewards.lifetimeStats.currentStreak;
        break;
      default:
        continue;
    }
    
    const wasCompleted = participant.completed;
    const newProgress = Math.min(participant.progress + progressIncrement, challenge.target);
    // Round to avoid floating point issues
    const roundedProgress = Math.round(newProgress * 100) / 100;
    
    challenge.updateProgress(userId, roundedProgress);
    await challenge.save();
    
    // Re-fetch the updated participant to check completion status
    const updatedParticipant = challenge.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    const nowCompleted = updatedParticipant?.completed || roundedProgress >= challenge.target;
    
    // If just completed, award points
    if (!wasCompleted && nowCompleted) {
      const rewardResult = await awardChallengeCompletionPoints(userId, challenge);
      results.push({
        challengeId: challenge._id,
        title: challenge.title,
        completed: true,
        progress: roundedProgress,
        target: challenge.target,
        rewardResult
      });
    } else {
      results.push({
        challengeId: challenge._id,
        title: challenge.title,
        newProgress: roundedProgress,
        target: challenge.target,
        completed: false,
        percentComplete: Math.round((roundedProgress / challenge.target) * 100)
      });
    }
  }
  
  return results;
}

/**
 * Update challenge progress when a goal is completed
 * @param {ObjectId} userId - The user's ID
 * @param {Object} goal - The completed goal object
 * @returns {Array} Challenge update results
 */
async function updateChallengesFromGoal(userId, goal) {
  const CommunityChallenge = require('../models/CommunityChallenge');
  
  // Find all active challenges the user has joined that are goal-completion type
  const activeChallenges = await CommunityChallenge.find({
    status: 'active',
    type: 'goal-completion',
    'participants.userId': userId
  });
  
  const results = [];
  
  for (const challenge of activeChallenges) {
    const participant = challenge.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    
    if (!participant || participant.completed) continue;
    
    // Each goal completion adds 1 to progress
    const progressIncrement = 1;
    
    const wasCompleted = participant.completed;
    const newProgress = Math.min(participant.progress + progressIncrement, challenge.target);
    
    challenge.updateProgress(userId, newProgress);
    await challenge.save();
    
    // Re-fetch the updated participant to check completion status
    const updatedParticipant = challenge.participants.find(
      p => p.userId.toString() === userId.toString()
    );
    const nowCompleted = updatedParticipant?.completed || newProgress >= challenge.target;
    
    // If just completed, award points
    if (!wasCompleted && nowCompleted) {
      const rewardResult = await awardChallengeCompletionPoints(userId, challenge);
      results.push({
        challengeId: challenge._id,
        title: challenge.title,
        completed: true,
        progress: newProgress,
        target: challenge.target,
        rewardResult
      });
    } else {
      results.push({
        challengeId: challenge._id,
        title: challenge.title,
        newProgress: newProgress,
        target: challenge.target,
        completed: false,
        percentComplete: Math.round((newProgress / challenge.target) * 100)
      });
    }
  }
  
  return results;
}

module.exports = {
  initializeUserRewards,
  awardSessionPoints,
  awardGoalCompletionPoints,
  awardChallengeCompletionPoints,
  updateChallengesFromSession,
  updateChallengesFromGoal,
  checkAndAwardRewards,
  getUserRewardsProfile,
  getLeaderboard,
  getUserRank,
  awardBonusPoints,
  getRewardsProgress,
  // New exports
  queueAchievementNotification,
  getPendingNotifications,
  clearNotifications,
  checkPersonalRecords,
  shareAchievement,
  getStudySuggestions
};
