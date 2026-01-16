/**
 * Seed Motivational Tips
 *
 * Populates database with motivational tips, quotes, and messages
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');
const MotivationalTip = require('../models/MotivationalTip');
require('dotenv').config();

const motivationalTips = [
  // Quotes
  {
    content: 'The secret of getting ahead is getting started. - Mark Twain',
    type: 'quote',
    category: 'motivation',
    triggers: { context: 'session-start', performanceLevel: 'any' },
    icon: '💫',
    color: '#8B5CF6',
    author: 'Mark Twain',
    priority: 8
  },
  {
    content: 'Success is the sum of small efforts repeated day in and day out. - Robert Collier',
    type: 'quote',
    category: 'motivation',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '🌟',
    color: '#F59E0B',
    author: 'Robert Collier',
    priority: 7
  },
  {
    content: 'The only way to do great work is to love what you do. - Steve Jobs',
    type: 'quote',
    category: 'mindset',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '❤️',
    color: '#EF4444',
    author: 'Steve Jobs',
    priority: 7
  },
  
  // Study Tips
  {
    content: 'Break your study material into small chunks. Your brain retains information better in 25-30 minute intervals.',
    type: 'tip',
    category: 'study-technique',
    triggers: { context: 'session-start', performanceLevel: 'any' },
    icon: '📚',
    color: '#3B82F6',
    priority: 9
  },
  {
    content: 'Use the Feynman Technique: Explain concepts in simple terms to ensure you truly understand them.',
    type: 'tip',
    category: 'study-technique',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '🎓',
    color: '#10B981',
    priority: 8
  },
  {
    content: 'Active recall is more effective than passive reading. Test yourself regularly on what you\'ve learned.',
    type: 'tip',
    category: 'study-technique',
    triggers: { context: 'session-start', performanceLevel: 'any' },
    icon: '🧠',
    color: '#8B5CF6',
    priority: 9
  },
  
  // Encouragement for different performance levels
  {
    content: 'Great job staying consistent! Your dedication is building strong study habits that will serve you well.',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'session-end', performanceLevel: 'high' },
    icon: '🎉',
    color: '#10B981',
    priority: 8
  },
  {
    content: 'You\'re making progress! Remember, every expert was once a beginner. Keep pushing forward!',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'any', performanceLevel: 'medium' },
    icon: '💪',
    color: '#F59E0B',
    priority: 7
  },
  {
    content: 'Don\'t be discouraged! The fact that you\'re here shows commitment. Small steps lead to big achievements.',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'any', performanceLevel: 'low' },
    icon: '🌱',
    color: '#10B981',
    priority: 10
  },
  
  // Break reminders
  {
    content: 'Your brain needs rest to consolidate information. Take a short break and come back refreshed!',
    type: 'reminder',
    category: 'break',
    triggers: { context: 'break', performanceLevel: 'any' },
    icon: '☕',
    color: '#8B5CF6',
    priority: 8
  },
  {
    content: 'Stretch, hydrate, and rest your eyes. A healthy body supports a healthy mind!',
    type: 'reminder',
    category: 'health',
    triggers: { context: 'break', performanceLevel: 'any' },
    icon: '🧘',
    color: '#10B981',
    priority: 9
  },
  
  // Focus tips
  {
    content: 'Eliminate distractions before starting. Turn off notifications and create a dedicated study space.',
    type: 'tip',
    category: 'focus',
    triggers: { context: 'session-start', performanceLevel: 'any' },
    icon: '🎯',
    color: '#3B82F6',
    priority: 8
  },
  {
    content: 'Use background music or white noise to help maintain focus during your session.',
    type: 'tip',
    category: 'focus',
    triggers: { context: 'session-start', performanceLevel: 'any' },
    icon: '🎵',
    color: '#8B5CF6',
    priority: 6
  },
  
  // Goal-related
  {
    content: 'You\'re falling behind on your goals. Break them into smaller tasks and tackle one at a time!',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'behind-goal', performanceLevel: 'any' },
    icon: '🎯',
    color: '#F59E0B',
    priority: 10
  },
  {
    content: 'You\'re on track! Maintain this momentum and you\'ll reach your goals in no time.',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'on-track', performanceLevel: 'any' },
    icon: '✅',
    color: '#10B981',
    priority: 8
  },
  {
    content: 'Wow! You\'re ahead of schedule! Your hard work is paying off. Keep it up!',
    type: 'encouragement',
    category: 'motivation',
    triggers: { context: 'ahead-goal', performanceLevel: 'any' },
    icon: '🚀',
    color: '#10B981',
    priority: 9
  },
  
  // Time-of-day specific
  {
    content: 'Good morning! Your brain is fresh and ready to tackle challenging material. Make the most of your peak hours!',
    type: 'encouragement',
    category: 'productivity',
    triggers: { context: 'session-start', timeOfDay: 'morning' },
    icon: '🌅',
    color: '#F59E0B',
    priority: 7
  },
  {
    content: 'Afternoon study sessions are great for review and practice. Reinforce what you learned this morning!',
    type: 'tip',
    category: 'productivity',
    triggers: { context: 'session-start', timeOfDay: 'afternoon' },
    icon: '☀️',
    color: '#F59E0B',
    priority: 6
  },
  {
    content: 'Evening study? Perfect for reflection and consolidation. Review your day\'s learning!',
    type: 'tip',
    category: 'productivity',
    triggers: { context: 'session-start', timeOfDay: 'evening' },
    icon: '🌆',
    color: '#8B5CF6',
    priority: 6
  },
  
  // Achievement celebrations
  {
    content: 'Congratulations on completing another session! You\'re building a habit that will last a lifetime.',
    type: 'achievement',
    category: 'motivation',
    triggers: { context: 'session-end', performanceLevel: 'any' },
    icon: '🏆',
    color: '#F59E0B',
    priority: 8
  },
  
  // Productivity tips
  {
    content: 'Plan your study sessions in advance. Having a clear roadmap reduces decision fatigue.',
    type: 'tip',
    category: 'productivity',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '📅',
    color: '#3B82F6',
    priority: 7
  },
  {
    content: 'Use spaced repetition to maximize retention. Review material at increasing intervals.',
    type: 'tip',
    category: 'study-technique',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '🔄',
    color: '#10B981',
    priority: 8
  },
  
  // Mindset
  {
    content: 'Mistakes are proof that you\'re trying. Embrace them as learning opportunities!',
    type: 'encouragement',
    category: 'mindset',
    triggers: { context: 'any', performanceLevel: 'low' },
    icon: '💡',
    color: '#F59E0B',
    priority: 9
  },
  {
    content: 'Comparison is the thief of joy. Focus on your own progress and celebrate your victories!',
    type: 'encouragement',
    category: 'mindset',
    triggers: { context: 'any', performanceLevel: 'any' },
    icon: '🌈',
    color: '#8B5CF6',
    priority: 7
  }
];

const seedMotivationalTips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian');
    console.log('Connected to MongoDB');
    
    // Clear existing tips
    await MotivationalTip.deleteMany({});
    console.log('Cleared existing motivational tips');
    
    // Insert new tips
    const result = await MotivationalTip.insertMany(motivationalTips);
    console.log(`Inserted ${result.length} motivational tips`);
    
    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedMotivationalTips();
}

module.exports = seedMotivationalTips;
