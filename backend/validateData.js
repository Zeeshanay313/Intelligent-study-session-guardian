/**
 * Data Persistence Validator
 * 
 * Utility to validate that all data from frontend is properly persisted
 * to the database without issues
 * 
 * @author Intelligent Study Session Guardian Team
 */

const dns = require('dns');
// Force Google DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('./src/models/User');
const Goal = require('./src/models/Goal');
const StudySession = require('./src/models/StudySession');
const SessionLog = require('./src/models/SessionLog');
const Preset = require('./src/models/Preset');
const Settings = require('./src/models/Settings');
const Reward = require('./src/models/Reward');
const UserRewards = require('./src/models/UserRewards');
const Resource = require('./src/models/Resource');
const AuditLog = require('./src/models/AuditLog');
const CommunityChallenge = require('./src/models/CommunityChallenge');
const MotivationalTip = require('./src/models/MotivationalTip');
const Guardian = require('./src/models/Guardian');
const DeviceAccess = require('./src/models/DeviceAccess');
const StudySchedule = require('./src/models/StudySchedule');
const TimerSession = require('./src/models/TimerSession');

const validateDataPersistence = async () => {
  try {
    console.log('🔍 Data Persistence Validation Tool\n');
    console.log('=' .repeat(60));

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian';
    console.log(`📡 Connecting to: ${mongoUri}\n`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Models to validate
    const models = [
      { name: 'User', model: User, critical: true },
      { name: 'Goal', model: Goal, critical: true },
      { name: 'StudySession', model: StudySession, critical: true },
      { name: 'SessionLog', model: SessionLog, critical: true },
      { name: 'Preset', model: Preset, critical: false },
      { name: 'Settings', model: Settings, critical: false },
      { name: 'Reward', model: Reward, critical: false },
      { name: 'UserRewards', model: UserRewards, critical: true },
      { name: 'Resource', model: Resource, critical: false },
      { name: 'AuditLog', model: AuditLog, critical: false },
      { name: 'CommunityChallenge', model: CommunityChallenge, critical: false },
      { name: 'MotivationalTip', model: MotivationalTip, critical: false },
      { name: 'Guardian', model: Guardian, critical: false },
      { name: 'DeviceAccess', model: DeviceAccess, critical: false },
      { name: 'StudySchedule', model: StudySchedule, critical: false },
      { name: 'TimerSession', model: TimerSession, critical: false }
    ];

    console.log('📊 VALIDATION RESULTS\n');
    console.log('-'.repeat(60));
    console.log('Model Name'.padEnd(25) + 'Count'.padEnd(10) + 'Status');
    console.log('-'.repeat(60));

    const results = [];
    let totalDocuments = 0;

    for (const { name, model, critical } of models) {
      try {
        const count = await model.countDocuments();
        totalDocuments += count;
        
        const status = count > 0 ? '✅ Active' : (critical ? '⚠️  Empty' : '○ Empty');
        console.log(name.padEnd(25) + count.toString().padEnd(10) + status);
        
        results.push({
          model: name,
          count,
          status: count > 0 ? 'active' : 'empty',
          critical
        });
      } catch (error) {
        console.log(name.padEnd(25) + 'Error'.padEnd(10) + '❌ Failed');
        results.push({
          model: name,
          count: 0,
          status: 'error',
          error: error.message,
          critical
        });
      }
    }

    console.log('-'.repeat(60));
    console.log('\n📈 SUMMARY\n');
    console.log(`Total Documents: ${totalDocuments}`);
    console.log(`Active Collections: ${results.filter(r => r.count > 0).length}/${results.length}`);
    console.log(`Empty Collections: ${results.filter(r => r.count === 0).length}/${results.length}`);
    
    const criticalEmpty = results.filter(r => r.critical && r.count === 0);
    if (criticalEmpty.length > 0) {
      console.log(`\n⚠️  Warning: ${criticalEmpty.length} critical collection(s) are empty:`);
      criticalEmpty.forEach(r => console.log(`   - ${r.model}`));
    }

    // Validate indexes
    console.log('\n🔍 INDEX VALIDATION\n');
    console.log('-'.repeat(60));

    for (const { name, model } of models.slice(0, 5)) { // Check first 5 models
      try {
        const indexes = await model.collection.getIndexes();
        const indexCount = Object.keys(indexes).length;
        console.log(`${name.padEnd(25)} ${indexCount} index(es) ✅`);
      } catch (error) {
        console.log(`${name.padEnd(25)} Error getting indexes ❌`);
      }
    }

    // Check data integrity
    console.log('\n🛡️  DATA INTEGRITY CHECKS\n');
    console.log('-'.repeat(60));

    // Check for users without email
    const usersWithoutEmail = await User.countDocuments({ email: { $exists: false } });
    console.log(`Users without email: ${usersWithoutEmail} ${usersWithoutEmail === 0 ? '✅' : '❌'}`);

    // Check for goals without userId
    const goalsWithoutUser = await Goal.countDocuments({ userId: { $exists: false } });
    console.log(`Goals without userId: ${goalsWithoutUser} ${goalsWithoutUser === 0 ? '✅' : '❌'}`);

    // Check for sessions without userId
    const sessionsWithoutUser = await SessionLog.countDocuments({ userId: { $exists: false } });
    console.log(`Sessions without userId: ${sessionsWithoutUser} ${sessionsWithoutUser === 0 ? '✅' : '❌'}`);

    // Check for orphaned data
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      const goalsWithInvalidUser = await Goal.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: { user: { $size: 0 } }
        },
        {
          $count: 'count'
        }
      ]);
      
      const orphanedGoals = goalsWithInvalidUser[0]?.count || 0;
      console.log(`Orphaned goals: ${orphanedGoals} ${orphanedGoals === 0 ? '✅' : '⚠️ '}`);
    }

    // Storage analysis
    console.log('\n💾 STORAGE ANALYSIS\n');
    console.log('-'.repeat(60));

    const dbStats = await mongoose.connection.db.stats();
    console.log(`Database: ${dbStats.db}`);
    console.log(`Collections: ${dbStats.collections}`);
    console.log(`Data Size: ${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Storage Size: ${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Indexes: ${dbStats.indexes}`);
    console.log(`Index Size: ${(dbStats.indexSize / 1024 / 1024).toFixed(2)} MB`);

    // Recent activity check
    console.log('\n⏰ RECENT ACTIVITY\n');
    console.log('-'.repeat(60));

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const recentGoals = await Goal.countDocuments({ createdAt: { $gte: oneDayAgo } });
    const recentSessions = await SessionLog.countDocuments({ createdAt: { $gte: oneDayAgo } });

    console.log(`New users (24h): ${recentUsers}`);
    console.log(`New goals (24h): ${recentGoals}`);
    console.log(`New sessions (24h): ${recentSessions}`);

    // Admin users check
    console.log('\n👑 ADMIN USERS\n');
    console.log('-'.repeat(60));

    const adminUsers = await User.find({ role: 'admin', deleted: false })
      .select('email profile.displayName createdAt')
      .lean();

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found! Run: npm run seed:admin');
    } else {
      console.log(`Total admin users: ${adminUsers.length}`);
      adminUsers.forEach((admin, i) => {
        console.log(`${i + 1}. ${admin.email} (${admin.profile.displayName})`);
      });
    }

    // Final verdict
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINAL VERDICT\n');

    const criticalIssues = criticalEmpty.length + 
                          (usersWithoutEmail > 0 ? 1 : 0) + 
                          (goalsWithoutUser > 0 ? 1 : 0) +
                          (sessionsWithoutUser > 0 ? 1 : 0);

    if (criticalIssues === 0 && totalDocuments > 0) {
      console.log('✅ All data is properly persisted!');
      console.log('✅ No critical issues found');
      console.log('✅ Database is healthy');
    } else if (totalDocuments === 0) {
      console.log('ℹ️  Database is empty (expected for new installations)');
      console.log('💡 Start using the application to populate data');
    } else {
      console.log(`⚠️  Found ${criticalIssues} critical issue(s)`);
      console.log('💡 Review the issues above and fix them');
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Validation Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
};

// Run validation
validateDataPersistence();
