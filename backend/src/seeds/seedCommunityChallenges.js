/**
 * Seed Community Challenges
 *
 * Populates database with sample community challenges
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');
const CommunityChallenge = require('../models/CommunityChallenge');
require('dotenv').config();

const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

const communityChallenges = [
  {
    title: '7-Day Study Streak',
    description: 'Complete at least one study session every day for 7 consecutive days. Build the habit of daily learning!',
    type: 'streak',
    target: 7,
    unit: 'days',
    startDate: now,
    endDate: oneWeekFromNow,
    duration: 7,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 500,
      customReward: '🔥 Streak Master Badge'
    },
    icon: '🔥',
    color: '#EF4444',
    difficulty: 'medium',
    status: 'active',
    showLeaderboard: true,
    category: 'weekly'
  },
  {
    title: 'Focus Master Challenge',
    description: 'Complete 20 focused study sessions in 2 weeks. No interruptions, just pure concentration!',
    type: 'session-count',
    target: 20,
    unit: 'sessions',
    startDate: now,
    endDate: twoWeeksFromNow,
    duration: 14,
    participants: [],
    maxParticipants: 100,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 750,
      customReward: '🎯 Focus Champion Badge'
    },
    icon: '🎯',
    color: '#3B82F6',
    difficulty: 'hard',
    status: 'active',
    showLeaderboard: true,
    category: 'weekly'
  },
  {
    title: '30-Hour Study Marathon',
    description: 'Accumulate 30 hours of study time this month. Consistency and dedication will get you there!',
    type: 'study-hours',
    target: 30,
    unit: 'hours',
    startDate: now,
    endDate: oneMonthFromNow,
    duration: 30,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 1000,
      customReward: '📚 Study Marathon Finisher'
    },
    icon: '📚',
    color: '#10B981',
    difficulty: 'hard',
    status: 'active',
    showLeaderboard: true,
    category: 'monthly'
  },
  {
    title: 'Goal Crusher',
    description: 'Complete 5 of your personal goals this week. Set them, achieve them, celebrate them!',
    type: 'goal-completion',
    target: 5,
    unit: 'goals',
    startDate: now,
    endDate: oneWeekFromNow,
    duration: 7,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 600,
      customReward: '🏆 Goal Achiever Badge'
    },
    icon: '🏆',
    color: '#F59E0B',
    difficulty: 'medium',
    status: 'active',
    showLeaderboard: true,
    category: 'weekly'
  },
  {
    title: 'Early Bird Special',
    description: 'Complete 10 study sessions before 9 AM. Rise and shine, scholars!',
    type: 'custom',
    target: 10,
    unit: 'sessions',
    startDate: now,
    endDate: twoWeeksFromNow,
    duration: 14,
    participants: [],
    maxParticipants: 50,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 400,
      customReward: '🌅 Early Bird Badge'
    },
    icon: '🌅',
    color: '#F59E0B',
    difficulty: 'easy',
    status: 'active',
    showLeaderboard: true,
    category: 'special'
  },
  {
    title: 'Weekend Warrior',
    description: 'Study for at least 5 hours this weekend. Make your weekends count!',
    type: 'study-hours',
    target: 5,
    unit: 'hours',
    startDate: now,
    endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    duration: 3,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 300,
      customReward: '💪 Weekend Warrior Badge'
    },
    icon: '💪',
    color: '#8B5CF6',
    difficulty: 'easy',
    status: 'active',
    showLeaderboard: true,
    category: 'special'
  },
  {
    title: 'Pomodoro Pro',
    description: 'Complete 50 Pomodoro sessions (25-minute focused sessions) this month.',
    type: 'session-count',
    target: 50,
    unit: 'sessions',
    startDate: now,
    endDate: oneMonthFromNow,
    duration: 30,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 800,
      customReward: '🍅 Pomodoro Master Badge'
    },
    icon: '🍅',
    color: '#EF4444',
    difficulty: 'hard',
    status: 'active',
    showLeaderboard: true,
    category: 'monthly'
  },
  {
    title: 'New Year Learning Blitz',
    description: 'Kickstart the year with 100 hours of focused study in January!',
    type: 'study-hours',
    target: 100,
    unit: 'hours',
    startDate: new Date(now.getFullYear(), 0, 1),
    endDate: new Date(now.getFullYear(), 0, 31, 23, 59, 59),
    duration: 31,
    participants: [],
    maxParticipants: null,
    isPublic: true,
    requiresOptIn: true,
    rewards: {
      points: 2000,
      customReward: '⭐ New Year Champion'
    },
    icon: '⭐',
    color: '#F59E0B',
    difficulty: 'extreme',
    status: now.getMonth() === 0 ? 'active' : 'upcoming',
    showLeaderboard: true,
    category: 'seasonal'
  }
];

const seedCommunityChallenges = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian');
    console.log('Connected to MongoDB');
    
    // Clear existing challenges
    await CommunityChallenge.deleteMany({});
    console.log('Cleared existing community challenges');
    
    // Insert new challenges
    const result = await CommunityChallenge.insertMany(communityChallenges);
    console.log(`Inserted ${result.length} community challenges`);
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedCommunityChallenges();
}

module.exports = seedCommunityChallenges;
