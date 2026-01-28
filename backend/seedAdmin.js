/**
 * Admin Seeder Script
 * 
 * Creates the initial admin user for the system
 * Run this script once to set up the first admin account
 * 
 * Usage: node backend/seedAdmin.js
 * 
 * @author Intelligent Study Session Guardian Team
 */

const dns = require('dns');
// Force Google DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

// Admin credentials - CHANGE THESE IN PRODUCTION!
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@studyguardian.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  displayName: process.env.ADMIN_NAME || 'System Administrator'
};

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin seeder...\n');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian';
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Name: ${existingAdmin.profile.displayName}`);
      console.log(`🔑 Role: ${existingAdmin.role}`);
      console.log(`📅 Created: ${existingAdmin.createdAt}\n`);
      
      // Ask if user wants to update to admin role
      if (existingAdmin.role !== 'admin') {
        console.log('🔄 Updating user role to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.verified = true;
        await existingAdmin.save();
        console.log('✅ User role updated to admin!\n');
      } else {
        console.log('ℹ️  User is already an admin. No changes needed.\n');
      }
    } else {
      // Create new admin user
      console.log('👤 Creating new admin user...');
      
      const adminUser = new User({
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password,
        role: 'admin',
        verified: true,
        profile: {
          displayName: ADMIN_CREDENTIALS.displayName,
          timezone: 'UTC',
          preferences: {
            theme: 'system',
            fontSize: 'medium',
            language: 'en'
          },
          phoneNumber: '',
          dateOfBirth: null,
          studyLevel: '',
          institution: '',
          bio: 'System Administrator'
        },
        privacy: {
          cameraConsent: false,
          guardianSharing: false,
          notifications: {
            inApp: true,
            email: true,
            studyReminders: true,
            goalUpdates: true,
            achievementAlerts: true,
            breakReminders: true
          }
        },
        refreshTokens: [],
        loginCount: 0
      });

      await adminUser.save();
      
      console.log('✅ Admin user created successfully!\n');
      console.log('='.repeat(50));
      console.log('📋 ADMIN CREDENTIALS');
      console.log('='.repeat(50));
      console.log(`📧 Email:    ${ADMIN_CREDENTIALS.email}`);
      console.log(`🔒 Password: ${ADMIN_CREDENTIALS.password}`);
      console.log(`👤 Name:     ${ADMIN_CREDENTIALS.displayName}`);
      console.log('='.repeat(50));
      console.log('\n⚠️  IMPORTANT: Change the password after first login!');
      console.log('⚠️  Store these credentials securely!\n');
    }

    // Display all admin users
    const allAdmins = await User.find({ role: 'admin', deleted: false })
      .select('email profile.displayName createdAt lastLogin')
      .lean();
    
    console.log('📊 Current Admin Users:');
    console.log('-'.repeat(50));
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Name: ${admin.profile.displayName}`);
      console.log(`   Created: ${admin.createdAt}`);
      console.log(`   Last Login: ${admin.lastLogin || 'Never'}`);
      console.log('-'.repeat(50));
    });

    console.log('\n🎉 Admin seeder completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
seedAdmin();
