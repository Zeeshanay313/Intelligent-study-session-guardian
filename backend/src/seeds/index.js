/**
 * Master Seed Script
 * 
 * Seeds all default data for the application:
 * - Community Challenges
 * - Motivational Tips
 * - Rewards (Badges & Achievements)
 * 
 * Run with: npm run seed
 */

const mongoose = require('mongoose');
const seedCommunityChallenges = require('./seedCommunityChallenges');
const seedMotivationalTips = require('./seedMotivationalTips');
const { seedRewards } = require('./seedRewards');

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const runAllSeeds = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intelligent-study-session';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Run all seed scripts
    console.log('📊 Seeding Community Challenges...');
    await seedCommunityChallenges();
    
    console.log('\n💡 Seeding Motivational Tips...');
    await seedMotivationalTips();
    
    console.log('\n🏆 Seeding Rewards & Badges...');
    await seedRewards();

    console.log('\n✨ All seeding completed successfully!');
    console.log('🎉 Your database is ready with all motivation and rewards data.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  runAllSeeds();
}

module.exports = runAllSeeds;
