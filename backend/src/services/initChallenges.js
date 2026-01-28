/**
 * Initialize Default Challenges
 * 
 * Creates recurring/permanent community challenges that users can participate in.
 * These challenges reset weekly/monthly to provide continuous engagement.
 */

const CommunityChallenge = require('../models/CommunityChallenge');

/**
 * Get next occurrence dates for recurring challenges
 */
const getWeeklyDates = () => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 13); // 2 weeks instead of 1
  endOfWeek.setHours(23, 59, 59, 999);
  
  return { start: startOfWeek, end: endOfWeek };
};

const getBiWeeklyDates = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 14);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

const getMonthlyDates = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start: startOfMonth, end: endOfMonth };
};

const getQuarterlyDates = () => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 90);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Default challenges that are always available
 */
const getDefaultChallenges = () => {
  const weekly = getWeeklyDates();
  const biweekly = getBiWeeklyDates();
  const monthly = getMonthlyDates();
  const quarterly = getQuarterlyDates();
  
  return [
    // ============== WEEKLY CHALLENGES (14 days) ==============
    {
      title: 'Weekly Study Sprint',
      description: 'Complete 10 hours of study over the next 2 weeks. Great for building consistent habits!',
      type: 'study-hours',
      target: 10,
      unit: 'hours',
      startDate: weekly.start,
      endDate: weekly.end,
      duration: 14,
      isPublic: true,
      requiresOptIn: false,
      category: 'weekly',
      rewards: {
        points: 100,
        badge: null
      },
      status: 'active',
      difficulty: 'easy',
      icon: '📚'
    },
    {
      title: 'Session Warrior',
      description: 'Complete 25 study sessions in 2 weeks. Consistency is key!',
      type: 'session-count',
      target: 25,
      unit: 'sessions',
      startDate: weekly.start,
      endDate: weekly.end,
      duration: 14,
      isPublic: true,
      requiresOptIn: false,
      category: 'weekly',
      rewards: {
        points: 150,
        badge: null
      },
      status: 'active',
      difficulty: 'medium',
      icon: '🎯'
    },
    {
      title: 'Perfect Fortnight',
      description: 'Study every day for 2 weeks - maintain a 14-day streak!',
      type: 'streak',
      target: 14,
      unit: 'days',
      startDate: weekly.start,
      endDate: weekly.end,
      duration: 14,
      isPublic: true,
      requiresOptIn: false,
      category: 'weekly',
      rewards: {
        points: 300,
        badge: null
      },
      status: 'active',
      difficulty: 'hard',
      icon: '🔥'
    },
    {
      title: 'Early Bird',
      description: 'Complete 15 study sessions before noon over 2 weeks. Start your day productively!',
      type: 'session-count',
      target: 15,
      unit: 'sessions',
      startDate: weekly.start,
      endDate: weekly.end,
      duration: 14,
      isPublic: true,
      requiresOptIn: false,
      category: 'weekly',
      rewards: {
        points: 175,
        badge: null
      },
      status: 'active',
      difficulty: 'medium',
      icon: '🌅'
    },
    {
      title: 'Focus Master',
      description: 'Accumulate 20 hours of focused study in 2 weeks. Quality over quantity!',
      type: 'study-hours',
      target: 20,
      unit: 'hours',
      startDate: weekly.start,
      endDate: weekly.end,
      duration: 14,
      isPublic: true,
      requiresOptIn: false,
      category: 'weekly',
      rewards: {
        points: 200,
        badge: null
      },
      status: 'active',
      difficulty: 'medium',
      icon: '🧘'
    },

    // ============== MONTHLY CHALLENGES (30 days) ==============
    {
      title: 'Monthly Marathon',
      description: 'Accumulate 50 hours of study this month. Become a study champion!',
      type: 'study-hours',
      target: 50,
      unit: 'hours',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 500,
        badge: null
      },
      status: 'active',
      difficulty: 'hard',
      icon: '🏆'
    },
    {
      title: 'Goal Crusher',
      description: 'Complete 10 goals this month. Set ambitious targets and crush them!',
      type: 'goal-completion',
      target: 10,
      unit: 'goals',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 400,
        badge: null
      },
      status: 'active',
      difficulty: 'medium',
      icon: '💎'
    },
    {
      title: 'Century Sessions',
      description: 'Complete 100 study sessions this month. Become unstoppable!',
      type: 'session-count',
      target: 100,
      unit: 'sessions',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 750,
        badge: null
      },
      status: 'active',
      difficulty: 'extreme',
      icon: '👑'
    },
    {
      title: 'Consistency King',
      description: 'Maintain a 21-day study streak this month. Build lasting habits!',
      type: 'streak',
      target: 21,
      unit: 'days',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 600,
        badge: null
      },
      status: 'active',
      difficulty: 'hard',
      icon: '👑'
    },
    {
      title: 'Goal Starter',
      description: 'Complete 5 goals this month. Every completed goal counts!',
      type: 'goal-completion',
      target: 5,
      unit: 'goals',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 250,
        badge: null
      },
      status: 'active',
      difficulty: 'easy',
      icon: '🎯'
    },
    {
      title: 'Study Scholar',
      description: 'Study for 75 hours this month. Serious dedication required!',
      type: 'study-hours',
      target: 75,
      unit: 'hours',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 800,
        badge: null
      },
      status: 'active',
      difficulty: 'extreme',
      icon: '🎓'
    },
    {
      title: 'Session Specialist',
      description: 'Complete 50 study sessions this month. Find your rhythm!',
      type: 'session-count',
      target: 50,
      unit: 'sessions',
      startDate: monthly.start,
      endDate: monthly.end,
      duration: 30,
      isPublic: true,
      requiresOptIn: false,
      category: 'monthly',
      rewards: {
        points: 350,
        badge: null
      },
      status: 'active',
      difficulty: 'medium',
      icon: '⚡'
    },

    // ============== QUARTERLY CHALLENGES (90 days) ==============
    {
      title: 'Quarter Master',
      description: 'Study for 200 hours over 3 months. True dedication to learning!',
      type: 'study-hours',
      target: 200,
      unit: 'hours',
      startDate: quarterly.start,
      endDate: quarterly.end,
      duration: 90,
      isPublic: true,
      requiresOptIn: false,
      category: 'seasonal',
      rewards: {
        points: 2000,
        badge: null
      },
      status: 'active',
      difficulty: 'extreme',
      icon: '🏅'
    },
    {
      title: 'Goal Champion',
      description: 'Complete 30 goals over 3 months. Become a goal-achieving machine!',
      type: 'goal-completion',
      target: 30,
      unit: 'goals',
      startDate: quarterly.start,
      endDate: quarterly.end,
      duration: 90,
      isPublic: true,
      requiresOptIn: false,
      category: 'seasonal',
      rewards: {
        points: 1500,
        badge: null
      },
      status: 'active',
      difficulty: 'hard',
      icon: '🌟'
    },
    {
      title: 'Session Legend',
      description: 'Complete 300 study sessions over 3 months. Legendary dedication!',
      type: 'session-count',
      target: 300,
      unit: 'sessions',
      startDate: quarterly.start,
      endDate: quarterly.end,
      duration: 90,
      isPublic: true,
      requiresOptIn: false,
      category: 'seasonal',
      rewards: {
        points: 2500,
        badge: null
      },
      status: 'active',
      difficulty: 'extreme',
      icon: '🦁'
    },
    {
      title: 'Streak Master',
      description: 'Achieve a 60-day study streak over 3 months. Unbreakable habits!',
      type: 'streak',
      target: 60,
      unit: 'days',
      startDate: quarterly.start,
      endDate: quarterly.end,
      duration: 90,
      isPublic: true,
      requiresOptIn: false,
      category: 'seasonal',
      rewards: {
        points: 1800,
        badge: null
      },
      status: 'active',
      difficulty: 'extreme',
      icon: '💪'
    }
  ];
};

/**
 * Initialize or refresh default challenges
 * Creates new challenges if they don't exist for the current period
 */
const initializeDefaultChallenges = async () => {
  try {
    console.log('🏁 Checking for default challenges...');
    
    const weekly = getWeeklyDates();
    const monthly = getMonthlyDates();
    
    let addedCount = 0;
    let existingCount = 0;
    
    const defaultChallenges = getDefaultChallenges();
    
    for (const challengeData of defaultChallenges) {
      // Check if this challenge already exists for the current period
      const exists = await CommunityChallenge.findOne({
        title: challengeData.title,
        startDate: { $gte: challengeData.startDate },
        endDate: { $lte: new Date(challengeData.endDate.getTime() + 24 * 60 * 60 * 1000) }
      });
      
      if (!exists) {
        await CommunityChallenge.create(challengeData);
        addedCount++;
      } else {
        existingCount++;
      }
    }
    
    if (addedCount > 0) {
      console.log(`✅ Created ${addedCount} new challenges`);
    }
    if (existingCount > 0) {
      console.log(`📦 ${existingCount} challenges already exist for this period`);
    }
    
    // Update status of old challenges
    const now = new Date();
    await CommunityChallenge.updateMany(
      { endDate: { $lt: now }, status: 'active' },
      { status: 'completed' }
    );
    
    const totalActive = await CommunityChallenge.countDocuments({ status: 'active' });
    console.log(`🏁 Total active challenges: ${totalActive}`);
    
    return { added: addedCount, existing: existingCount, total: totalActive };
  } catch (error) {
    console.error('❌ Error initializing default challenges:', error);
    throw error;
  }
};

module.exports = { initializeDefaultChallenges, getDefaultChallenges };
