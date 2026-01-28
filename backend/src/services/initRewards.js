/**
 * Initialize Default Rewards
 * 
 * This ensures that the reward system always has default badges and achievements
 * available for users to earn. Unlike seeding, this only adds rewards if they
 * don't already exist, making it safe to run on every app start.
 */

const Reward = require('../models/Reward');

const defaultRewards = [
  // ============ BADGES - Study Sessions ============
  {
    name: 'First Steps',
    description: 'Complete your first study session',
    type: 'badge',
    category: 'study',
    icon: '🎯',
    color: '#4CAF50',
    pointsValue: 10,
    rarity: 'common',
    criteria: { type: 'sessions_count', threshold: 1, timeframe: 'alltime' },
    displayOrder: 1
  },
  {
    name: 'Getting Started',
    description: 'Complete 5 study sessions',
    type: 'badge',
    category: 'study',
    icon: '📚',
    color: '#2196F3',
    pointsValue: 25,
    rarity: 'common',
    criteria: { type: 'sessions_count', threshold: 5, timeframe: 'alltime' },
    displayOrder: 2
  },
  {
    name: 'Dedicated Learner',
    description: 'Complete 25 study sessions',
    type: 'badge',
    category: 'study',
    icon: '⭐',
    color: '#9C27B0',
    pointsValue: 50,
    rarity: 'uncommon',
    criteria: { type: 'sessions_count', threshold: 25, timeframe: 'alltime' },
    displayOrder: 3
  },
  {
    name: 'Study Champion',
    description: 'Complete 50 study sessions',
    type: 'badge',
    category: 'study',
    icon: '🏆',
    color: '#FF9800',
    pointsValue: 100,
    rarity: 'rare',
    criteria: { type: 'sessions_count', threshold: 50, timeframe: 'alltime' },
    displayOrder: 4
  },
  {
    name: 'Study Master',
    description: 'Complete 100 study sessions',
    type: 'badge',
    category: 'study',
    icon: '👑',
    color: '#FFD700',
    pointsValue: 250,
    rarity: 'epic',
    criteria: { type: 'sessions_count', threshold: 100, timeframe: 'alltime' },
    displayOrder: 5
  },
  {
    name: 'Study Legend',
    description: 'Complete 500 study sessions',
    type: 'badge',
    category: 'study',
    icon: '🌟',
    color: '#E91E63',
    pointsValue: 1000,
    rarity: 'legendary',
    criteria: { type: 'sessions_count', threshold: 500, timeframe: 'alltime' },
    displayOrder: 6
  },

  // ============ BADGES - Study Hours ============
  {
    name: 'Hour Hero',
    description: 'Study for 1 hour total',
    type: 'badge',
    category: 'study',
    icon: '⏰',
    color: '#00BCD4',
    pointsValue: 15,
    rarity: 'common',
    criteria: { type: 'study_hours', threshold: 1, timeframe: 'alltime' },
    displayOrder: 10
  },
  {
    name: 'Time Investor',
    description: 'Study for 10 hours total',
    type: 'badge',
    category: 'study',
    icon: '⏱️',
    color: '#3F51B5',
    pointsValue: 50,
    rarity: 'uncommon',
    criteria: { type: 'study_hours', threshold: 10, timeframe: 'alltime' },
    displayOrder: 11
  },
  {
    name: 'Marathon Learner',
    description: 'Study for 50 hours total',
    type: 'badge',
    category: 'study',
    icon: '🏃',
    color: '#673AB7',
    pointsValue: 150,
    rarity: 'rare',
    criteria: { type: 'study_hours', threshold: 50, timeframe: 'alltime' },
    displayOrder: 12
  },
  {
    name: 'Century Club',
    description: 'Study for 100 hours total',
    type: 'badge',
    category: 'study',
    icon: '💯',
    color: '#FF5722',
    pointsValue: 300,
    rarity: 'epic',
    criteria: { type: 'study_hours', threshold: 100, timeframe: 'alltime' },
    displayOrder: 13
  },

  // ============ BADGES - Streaks ============
  {
    name: 'Streak Starter',
    description: 'Maintain a 3-day study streak',
    type: 'badge',
    category: 'streak',
    icon: '🔥',
    color: '#FF5722',
    pointsValue: 20,
    rarity: 'common',
    criteria: { type: 'streak_days', threshold: 3, timeframe: 'none' },
    displayOrder: 20
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    type: 'badge',
    category: 'streak',
    icon: '🔥',
    color: '#F44336',
    pointsValue: 50,
    rarity: 'uncommon',
    criteria: { type: 'streak_days', threshold: 7, timeframe: 'none' },
    displayOrder: 21
  },
  {
    name: 'Two Week Titan',
    description: 'Maintain a 14-day study streak',
    type: 'badge',
    category: 'streak',
    icon: '💪',
    color: '#E91E63',
    pointsValue: 100,
    rarity: 'rare',
    criteria: { type: 'streak_days', threshold: 14, timeframe: 'none' },
    displayOrder: 22
  },
  {
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    type: 'badge',
    category: 'streak',
    icon: '🌟',
    color: '#9C27B0',
    pointsValue: 250,
    rarity: 'epic',
    criteria: { type: 'streak_days', threshold: 30, timeframe: 'none' },
    displayOrder: 23
  },
  {
    name: 'Streak Legend',
    description: 'Maintain a 100-day study streak',
    type: 'badge',
    category: 'streak',
    icon: '👑',
    color: '#FFD700',
    pointsValue: 1000,
    rarity: 'legendary',
    criteria: { type: 'streak_days', threshold: 100, timeframe: 'none' },
    displayOrder: 24
  },

  // ============ BADGES - Goals ============
  {
    name: 'Goal Getter',
    description: 'Complete your first goal',
    type: 'badge',
    category: 'goal',
    icon: '🎯',
    color: '#4CAF50',
    pointsValue: 25,
    rarity: 'common',
    criteria: { type: 'goals_completed', threshold: 1, timeframe: 'alltime' },
    displayOrder: 30
  },
  {
    name: 'Goal Crusher',
    description: 'Complete 5 goals',
    type: 'badge',
    category: 'goal',
    icon: '💎',
    color: '#00BCD4',
    pointsValue: 75,
    rarity: 'uncommon',
    criteria: { type: 'goals_completed', threshold: 5, timeframe: 'alltime' },
    displayOrder: 31
  },
  {
    name: 'Goal Master',
    description: 'Complete 25 goals',
    type: 'badge',
    category: 'goal',
    icon: '🏅',
    color: '#FF9800',
    pointsValue: 200,
    rarity: 'rare',
    criteria: { type: 'goals_completed', threshold: 25, timeframe: 'alltime' },
    displayOrder: 32
  },
  {
    name: 'Goal Champion',
    description: 'Complete 50 goals',
    type: 'badge',
    category: 'goal',
    icon: '🏆',
    color: '#9C27B0',
    pointsValue: 500,
    rarity: 'epic',
    criteria: { type: 'goals_completed', threshold: 50, timeframe: 'alltime' },
    displayOrder: 33
  },

  // ============ ACHIEVEMENTS - Special ============
  {
    name: 'Early Bird',
    description: 'Complete a study session before 8 AM',
    type: 'achievement',
    category: 'special',
    icon: '🌅',
    color: '#FFC107',
    pointsValue: 30,
    rarity: 'uncommon',
    criteria: { type: 'early_bird', threshold: 1, timeframe: 'none' },
    displayOrder: 40
  },
  {
    name: 'Night Owl',
    description: 'Complete a study session after 10 PM',
    type: 'achievement',
    category: 'special',
    icon: '🦉',
    color: '#673AB7',
    pointsValue: 30,
    rarity: 'uncommon',
    criteria: { type: 'night_owl', threshold: 1, timeframe: 'none' },
    displayOrder: 41
  },
  {
    name: 'Focus Master',
    description: 'Complete a 60-minute focused session without breaks',
    type: 'achievement',
    category: 'special',
    icon: '🧘',
    color: '#009688',
    pointsValue: 75,
    rarity: 'rare',
    criteria: { type: 'focus_master', threshold: 60, timeframe: 'none' },
    displayOrder: 42
  },
  {
    name: 'Perfect Week',
    description: 'Study every day for a week',
    type: 'achievement',
    category: 'special',
    icon: '✨',
    color: '#E91E63',
    pointsValue: 100,
    rarity: 'rare',
    criteria: { type: 'perfect_week', threshold: 1, timeframe: 'weekly' },
    isRecurring: true,
    displayOrder: 43
  },

  // ============ MILESTONES ============
  {
    name: 'Welcome!',
    description: 'Join the Study Guardian community',
    type: 'milestone',
    category: 'special',
    icon: '👋',
    color: '#4CAF50',
    pointsValue: 5,
    rarity: 'common',
    criteria: { type: 'custom', threshold: 1, timeframe: 'none' },
    displayOrder: 50
  },
  {
    name: 'Profile Complete',
    description: 'Complete your profile setup',
    type: 'milestone',
    category: 'special',
    icon: '✅',
    color: '#2196F3',
    pointsValue: 10,
    rarity: 'common',
    criteria: { type: 'custom', threshold: 1, timeframe: 'none' },
    displayOrder: 51
  }
];

/**
 * Initialize default rewards in the database
 * Only adds rewards that don't already exist (by name)
 */
const initializeDefaultRewards = async () => {
  try {
    console.log('🎮 Checking for default rewards...');
    
    let addedCount = 0;
    let existingCount = 0;

    for (const rewardData of defaultRewards) {
      // Check if reward with this name already exists
      const exists = await Reward.findOne({ name: rewardData.name });
      
      if (!exists) {
        await Reward.create(rewardData);
        addedCount++;
      } else {
        existingCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`✅ Added ${addedCount} new rewards/badges`);
    }
    if (existingCount > 0) {
      console.log(`📦 ${existingCount} rewards already exist`);
    }
    
    const totalRewards = await Reward.countDocuments({ isActive: true });
    console.log(`🏆 Total active rewards: ${totalRewards}`);

    return { added: addedCount, existing: existingCount, total: totalRewards };
  } catch (error) {
    console.error('❌ Error initializing default rewards:', error);
    throw error;
  }
};

module.exports = { initializeDefaultRewards, defaultRewards };
