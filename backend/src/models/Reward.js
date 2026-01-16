/**
 * Reward Model - Gamification System
 *
 * Defines rewards, badges, achievements, and points that users can earn
 * through completing study sessions, achieving goals, and maintaining streaks
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['badge', 'achievement', 'milestone', 'streak', 'bonus'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['study', 'goal', 'streak', 'social', 'special'],
    default: 'study'
  },
  icon: {
    type: String,
    trim: true,
    maxlength: 100
  },
  color: {
    type: String,
    trim: true,
    default: '#4CAF50'
  },
  pointsValue: {
    type: Number,
    default: 0,
    min: 0
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  // Criteria to earn this reward
  criteria: {
    type: {
      type: String,
      enum: [
        'sessions_count',
        'study_hours',
        'streak_days',
        'goals_completed',
        'perfect_week',
        'early_bird',
        'night_owl',
        'focus_master',
        'custom'
      ],
      required: true
    },
    threshold: {
      type: Number,
      required: true,
      min: 1
    },
    timeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'alltime', 'none'],
      default: 'alltime'
    }
  },
  // Is this reward active and available to earn?
  isActive: {
    type: Boolean,
    default: true
  },
  // Is this a recurring reward (can be earned multiple times)?
  isRecurring: {
    type: Boolean,
    default: false
  },
  // Order for display
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
rewardSchema.index({ type: 1, isActive: 1 });
rewardSchema.index({ 'criteria.type': 1 });
rewardSchema.index({ displayOrder: 1 });

// Virtual for rarity score
rewardSchema.virtual('rarityScore').get(function () {
  const rarityMap = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };
  return rarityMap[this.rarity] || 1;
});

// Static method to get rewards by type
rewardSchema.statics.getByType = function (type) {
  return this.find({ type, isActive: true }).sort({ displayOrder: 1 });
};

// Static method to check and award appropriate rewards for a user action
rewardSchema.statics.checkEligibleRewards = async function (criteriaType, userStats) {
  const rewards = await this.find({
    'criteria.type': criteriaType,
    isActive: true
  });

  const eligible = [];

  for (const reward of rewards) {
    const { threshold, timeframe } = reward.criteria;
    let userValue = 0;

    // Get the relevant stat based on timeframe
    switch (timeframe) {
      case 'daily':
        userValue = userStats.daily || 0;
        break;
      case 'weekly':
        userValue = userStats.weekly || 0;
        break;
      case 'monthly':
        userValue = userStats.monthly || 0;
        break;
      case 'alltime':
        userValue = userStats.alltime || 0;
        break;
      default:
        userValue = userStats.value || 0;
    }

    if (userValue >= threshold) {
      eligible.push(reward);
    }
  }

  return eligible;
};

module.exports = mongoose.model('Reward', rewardSchema);
