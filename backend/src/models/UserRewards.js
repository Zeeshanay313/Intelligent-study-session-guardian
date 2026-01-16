/**
 * UserRewards Model - User's Reward Tracking
 *
 * Tracks rewards earned by users, points balance, badges collected,
 * achievements unlocked, and leaderboard statistics
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const earnedRewardSchema = new mongoose.Schema({
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  progress: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  }
}, { _id: true });

const pointsHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  source: {
    type: String,
    enum: ['session', 'goal', 'streak', 'achievement', 'bonus', 'penalty', 'other'],
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { _id: false });

const userRewardsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Points system
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  currentLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  pointsToNextLevel: {
    type: Number,
    default: 100
  },
  // Lifetime statistics
  lifetimeStats: {
    totalSessionsCompleted: {
      type: Number,
      default: 0
    },
    totalStudyHours: {
      type: Number,
      default: 0
    },
    totalGoalsCompleted: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    lastStudyDate: {
      type: Date,
      default: null
    }
  },
  // Rewards earned
  earnedRewards: [earnedRewardSchema],
  // Points history
  pointsHistory: [pointsHistorySchema],
  // Leaderboard preferences
  leaderboardSettings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    showStats: {
      type: Boolean,
      default: true
    }
  },
  // Weekly/Monthly resets
  weeklyPoints: {
    type: Number,
    default: 0
  },
  monthlyPoints: {
    type: Number,
    default: 0
  },
  lastWeeklyReset: {
    type: Date,
    default: Date.now
  },
  lastMonthlyReset: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userRewardsSchema.index({ totalPoints: -1 });
userRewardsSchema.index({ currentLevel: -1 });
userRewardsSchema.index({ weeklyPoints: -1 });
userRewardsSchema.index({ monthlyPoints: -1 });
userRewardsSchema.index({ 'leaderboardSettings.isPublic': 1, totalPoints: -1 });

// Virtual for progress to next level as percentage
userRewardsSchema.virtual('levelProgress').get(function () {
  const pointsInCurrentLevel = this.totalPoints % this.pointsToNextLevel;
  return Math.round((pointsInCurrentLevel / this.pointsToNextLevel) * 100);
});

// Virtual for total badges earned
userRewardsSchema.virtual('totalBadges').get(function () {
  return this.earnedRewards.length;
});

// Method to add points
userRewardsSchema.methods.addPoints = function (amount, reason, source = 'other', relatedId = null) {
  this.totalPoints += amount;
  this.weeklyPoints += amount;
  this.monthlyPoints += amount;

  // Add to history
  this.pointsHistory.push({
    date: new Date(),
    amount,
    reason,
    source,
    relatedId
  });

  // Check for level up
  this.checkLevelUp();

  return this;
};

// Method to check and handle level up
userRewardsSchema.methods.checkLevelUp = function () {
  const levelsGained = Math.floor(this.totalPoints / this.pointsToNextLevel) - (this.currentLevel - 1);

  if (levelsGained > 0) {
    this.currentLevel += levelsGained;
    // Increase points needed for next level (progressive difficulty)
    this.pointsToNextLevel = Math.floor(100 * (1.2 ** (this.currentLevel - 1)));
    return { leveledUp: true, newLevel: this.currentLevel };
  }

  return { leveledUp: false };
};

// Method to earn a reward
userRewardsSchema.methods.earnReward = function (rewardId, progress = 100) {
  // Check if already earned (for non-recurring rewards)
  const alreadyEarned = this.earnedRewards.some(
    er => er.rewardId.toString() === rewardId.toString()
  );

  if (!alreadyEarned) {
    this.earnedRewards.push({
      rewardId,
      earnedAt: new Date(),
      progress
    });
    return true;
  }

  return false;
};

// Method to check if user has earned a specific reward
userRewardsSchema.methods.hasReward = function (rewardId) {
  return this.earnedRewards.some(
    er => er.rewardId.toString() === rewardId.toString()
  );
};

// Method to update session stats
userRewardsSchema.methods.updateSessionStats = function (durationSeconds) {
  const hours = durationSeconds / 3600;

  this.lifetimeStats.totalSessionsCompleted += 1;
  this.lifetimeStats.totalStudyHours += hours;

  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastStudy = this.lifetimeStats.lastStudyDate
    ? new Date(this.lifetimeStats.lastStudyDate)
    : null;

  if (lastStudy) {
    lastStudy.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastStudy) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change to streak
    } else if (daysDiff === 1) {
      // Consecutive day
      this.lifetimeStats.currentStreak += 1;
      if (this.lifetimeStats.currentStreak > this.lifetimeStats.longestStreak) {
        this.lifetimeStats.longestStreak = this.lifetimeStats.currentStreak;
      }
    } else {
      // Streak broken
      this.lifetimeStats.currentStreak = 1;
    }
  } else {
    // First session
    this.lifetimeStats.currentStreak = 1;
    this.lifetimeStats.longestStreak = 1;
  }

  this.lifetimeStats.lastStudyDate = today;

  return this;
};

// Method to update goal completion stats
userRewardsSchema.methods.updateGoalStats = function () {
  this.lifetimeStats.totalGoalsCompleted += 1;
  return this;
};

// Method to reset weekly points
userRewardsSchema.methods.resetWeekly = function () {
  this.weeklyPoints = 0;
  this.lastWeeklyReset = new Date();
  return this;
};

// Method to reset monthly points
userRewardsSchema.methods.resetMonthly = function () {
  this.monthlyPoints = 0;
  this.lastMonthlyReset = new Date();
  return this;
};

// Static method to get leaderboard
userRewardsSchema.statics.getLeaderboard = function (type = 'alltime', limit = 100) {
  let sortField = 'totalPoints';
  if (type === 'weekly') {
    sortField = 'weeklyPoints';
  } else if (type === 'monthly') {
    sortField = 'monthlyPoints';
  }

  return this.find({ 'leaderboardSettings.isPublic': true })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('userId', 'displayName email')
    .lean();
};

// Static method to get user's rank
userRewardsSchema.statics.getUserRank = async function (userId, type = 'alltime') {
  let sortField = 'totalPoints';
  if (type === 'weekly') {
    sortField = 'weeklyPoints';
  } else if (type === 'monthly') {
    sortField = 'monthlyPoints';
  }

  const userReward = await this.findOne({ userId });
  if (!userReward) return null;

  const userPoints = userReward[sortField];

  const rank = await this.countDocuments({
    [sortField]: { $gt: userPoints }
  }) + 1;

  return {
    rank,
    points: userPoints,
    type
  };
};

module.exports = mongoose.model('UserRewards', userRewardsSchema);
