/**
 * Seed Rewards Data
 * 
 * Creates badges, achievements, and default rewards for the gamification system
 * 
 * Run with: node backend/src/seeds/seedRewards.js
 */

const mongoose = require('mongoose');
const Reward = require('../models/Reward');

// Load environment variables
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const rewards = [
  // ============================================
  // STREAK BADGES
  // ============================================
  {
    name: 'First Flame',
    description: 'Study for 3 consecutive days',
    type: 'badge',
    category: 'streak',
    icon: 'flame',
    color: '#F97316',
    pointsValue: 25,
    rarity: 'common',
    criteria: {
      type: 'streak_days',
      threshold: 3,
      timeframe: 'alltime'
    },
    displayOrder: 1
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    type: 'badge',
    category: 'streak',
    icon: 'flame',
    color: '#EF4444',
    pointsValue: 75,
    rarity: 'uncommon',
    criteria: {
      type: 'streak_days',
      threshold: 7,
      timeframe: 'alltime'
    },
    displayOrder: 2
  },
  {
    name: 'Fortnight Focus',
    description: 'Maintain a 14-day study streak',
    type: 'badge',
    category: 'streak',
    icon: 'flame',
    color: '#DC2626',
    pointsValue: 150,
    rarity: 'rare',
    criteria: {
      type: 'streak_days',
      threshold: 14,
      timeframe: 'alltime'
    },
    displayOrder: 3
  },
  {
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    type: 'badge',
    category: 'streak',
    icon: 'trophy',
    color: '#B91C1C',
    pointsValue: 300,
    rarity: 'epic',
    criteria: {
      type: 'streak_days',
      threshold: 30,
      timeframe: 'alltime'
    },
    displayOrder: 4
  },
  {
    name: 'Legendary Learner',
    description: 'Achieve a 100-day study streak',
    type: 'achievement',
    category: 'streak',
    icon: 'crown',
    color: '#FFD700',
    pointsValue: 1000,
    rarity: 'legendary',
    criteria: {
      type: 'streak_days',
      threshold: 100,
      timeframe: 'alltime'
    },
    displayOrder: 5
  },

  // ============================================
  // SESSION BADGES
  // ============================================
  {
    name: 'First Steps',
    description: 'Complete your first study session',
    type: 'badge',
    category: 'study',
    icon: 'star',
    color: '#10B981',
    pointsValue: 10,
    rarity: 'common',
    criteria: {
      type: 'sessions_count',
      threshold: 1,
      timeframe: 'alltime'
    },
    displayOrder: 10
  },
  {
    name: 'Getting Started',
    description: 'Complete 10 study sessions',
    type: 'badge',
    category: 'study',
    icon: 'star',
    color: '#059669',
    pointsValue: 50,
    rarity: 'common',
    criteria: {
      type: 'sessions_count',
      threshold: 10,
      timeframe: 'alltime'
    },
    displayOrder: 11
  },
  {
    name: 'Dedicated Student',
    description: 'Complete 50 study sessions',
    type: 'badge',
    category: 'study',
    icon: 'award',
    color: '#047857',
    pointsValue: 150,
    rarity: 'uncommon',
    criteria: {
      type: 'sessions_count',
      threshold: 50,
      timeframe: 'alltime'
    },
    displayOrder: 12
  },
  {
    name: 'Century Scholar',
    description: 'Complete 100 study sessions',
    type: 'achievement',
    category: 'study',
    icon: 'award',
    color: '#065F46',
    pointsValue: 300,
    rarity: 'rare',
    criteria: {
      type: 'sessions_count',
      threshold: 100,
      timeframe: 'alltime'
    },
    displayOrder: 13
  },
  {
    name: 'Master Scholar',
    description: 'Complete 500 study sessions',
    type: 'achievement',
    category: 'study',
    icon: 'trophy',
    color: '#064E3B',
    pointsValue: 750,
    rarity: 'epic',
    criteria: {
      type: 'sessions_count',
      threshold: 500,
      timeframe: 'alltime'
    },
    displayOrder: 14
  },

  // ============================================
  // STUDY HOURS BADGES
  // ============================================
  {
    name: 'Hour Hero',
    description: 'Accumulate 1 hour of total study time',
    type: 'badge',
    category: 'study',
    icon: 'clock',
    color: '#3B82F6',
    pointsValue: 20,
    rarity: 'common',
    criteria: {
      type: 'study_hours',
      threshold: 1,
      timeframe: 'alltime'
    },
    displayOrder: 20
  },
  {
    name: 'Time Investor',
    description: 'Accumulate 10 hours of study time',
    type: 'badge',
    category: 'study',
    icon: 'clock',
    color: '#2563EB',
    pointsValue: 100,
    rarity: 'uncommon',
    criteria: {
      type: 'study_hours',
      threshold: 10,
      timeframe: 'alltime'
    },
    displayOrder: 21
  },
  {
    name: 'Study Marathon',
    description: 'Accumulate 50 hours of study time',
    type: 'achievement',
    category: 'study',
    icon: 'target',
    color: '#1D4ED8',
    pointsValue: 250,
    rarity: 'rare',
    criteria: {
      type: 'study_hours',
      threshold: 50,
      timeframe: 'alltime'
    },
    displayOrder: 22
  },
  {
    name: 'Century Hours',
    description: 'Accumulate 100 hours of study time',
    type: 'achievement',
    category: 'study',
    icon: 'zap',
    color: '#1E40AF',
    pointsValue: 500,
    rarity: 'epic',
    criteria: {
      type: 'study_hours',
      threshold: 100,
      timeframe: 'alltime'
    },
    displayOrder: 23
  },

  // ============================================
  // GOAL COMPLETION BADGES
  // ============================================
  {
    name: 'Goal Getter',
    description: 'Complete your first goal',
    type: 'badge',
    category: 'goal',
    icon: 'target',
    color: '#8B5CF6',
    pointsValue: 25,
    rarity: 'common',
    criteria: {
      type: 'goals_completed',
      threshold: 1,
      timeframe: 'alltime'
    },
    displayOrder: 30
  },
  {
    name: 'Goal Crusher',
    description: 'Complete 10 goals',
    type: 'badge',
    category: 'goal',
    icon: 'target',
    color: '#7C3AED',
    pointsValue: 100,
    rarity: 'uncommon',
    criteria: {
      type: 'goals_completed',
      threshold: 10,
      timeframe: 'alltime'
    },
    displayOrder: 31
  },
  {
    name: 'Ambitious Achiever',
    description: 'Complete 25 goals',
    type: 'achievement',
    category: 'goal',
    icon: 'award',
    color: '#6D28D9',
    pointsValue: 250,
    rarity: 'rare',
    criteria: {
      type: 'goals_completed',
      threshold: 25,
      timeframe: 'alltime'
    },
    displayOrder: 32
  },
  {
    name: 'Goal Legend',
    description: 'Complete 50 goals',
    type: 'achievement',
    category: 'goal',
    icon: 'trophy',
    color: '#5B21B6',
    pointsValue: 500,
    rarity: 'epic',
    criteria: {
      type: 'goals_completed',
      threshold: 50,
      timeframe: 'alltime'
    },
    displayOrder: 33
  },

  // ============================================
  // SPECIAL ACHIEVEMENTS
  // ============================================
  {
    name: 'Early Bird',
    description: 'Complete a study session before 7 AM',
    type: 'badge',
    category: 'special',
    icon: 'sunrise',
    color: '#F59E0B',
    pointsValue: 50,
    rarity: 'uncommon',
    criteria: {
      type: 'early_bird',
      threshold: 1,
      timeframe: 'alltime'
    },
    displayOrder: 40
  },
  {
    name: 'Night Owl',
    description: 'Complete a study session after 10 PM',
    type: 'badge',
    category: 'special',
    icon: 'moon',
    color: '#6366F1',
    pointsValue: 50,
    rarity: 'uncommon',
    criteria: {
      type: 'night_owl',
      threshold: 1,
      timeframe: 'alltime'
    },
    displayOrder: 41
  },
  {
    name: 'Weekend Warrior',
    description: 'Study on both Saturday and Sunday',
    type: 'badge',
    category: 'special',
    icon: 'calendar',
    color: '#EC4899',
    pointsValue: 75,
    rarity: 'uncommon',
    criteria: {
      type: 'custom',
      threshold: 1,
      timeframe: 'weekly'
    },
    displayOrder: 42
  },
  {
    name: 'Perfect Week',
    description: 'Study every day for a full week (Mon-Sun)',
    type: 'achievement',
    category: 'special',
    icon: 'star',
    color: '#14B8A6',
    pointsValue: 200,
    rarity: 'rare',
    criteria: {
      type: 'perfect_week',
      threshold: 1,
      timeframe: 'weekly'
    },
    displayOrder: 43
  }
];

async function seedRewards() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-study-session';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing rewards
    await Reward.deleteMany({});
    console.log('Cleared existing rewards');

    // Insert new rewards
    const insertedRewards = await Reward.insertMany(rewards);
    console.log(`Seeded ${insertedRewards.length} rewards/badges`);

    // Log summary
    const summary = rewards.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
    console.log('Summary by category:', summary);

    console.log('✅ Rewards seeding complete!');
  } catch (error) {
    console.error('Error seeding rewards:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedRewards();
}

module.exports = { seedRewards, rewards };
