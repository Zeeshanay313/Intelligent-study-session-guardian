// Clear test users from MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');

async function clearTestUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all test users (emails containing 'test' or 'example.com')
    const result = await User.deleteMany({
      email: { 
        $regex: /@(test\.com|example\.com|gmail\.com|yahoo\.com)$/i 
      }
    });

    console.log(`✅ Deleted ${result.deletedCount} test user(s)`);
    
    // Show remaining users
    const remainingUsers = await User.find({}, 'email profile.displayName');
    console.log('\n📋 Remaining users in database:');
    if (remainingUsers.length === 0) {
      console.log('   (none)');
    } else {
      remainingUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.profile?.displayName || 'No name'})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! Database cleaned.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearTestUsers();
