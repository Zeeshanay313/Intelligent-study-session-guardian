/**
 * Guardian Seeder Script
 *
 * Creates a demo guardian user and (optionally) a demo student, then links
 * them with an active GuardianAccess record so the guardian can sign in and
 * see the Guardian Dashboard immediately.
 *
 * Usage: node backend/seedGuardian.js
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const GuardianAccess = require('./src/models/GuardianAccess');

const GUARDIAN = {
  email: process.env.GUARDIAN_EMAIL || 'guardian@studyguardian.com',
  password: process.env.GUARDIAN_PASSWORD || 'Guardian@123',
  displayName: process.env.GUARDIAN_NAME || 'Demo Guardian'
};

const STUDENT = {
  email: process.env.STUDENT_EMAIL || 'student@studyguardian.com',
  password: process.env.STUDENT_PASSWORD || 'Student@123',
  displayName: process.env.STUDENT_NAME || 'Demo Student'
};

const run = async () => {
  console.log('🌱 Starting guardian seeder...\n');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian';
  console.log(`📡 Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  console.log('✅ Connected\n');

  // ── Guardian user ──────────────────────────────────────────────────────────
  let guardian = await User.findOne({ email: GUARDIAN.email });
  if (guardian) {
    console.log(`ℹ️  Guardian user already exists: ${guardian.email}`);
    guardian.password = GUARDIAN.password;
    guardian.markModified('password');
    guardian.role = 'guardian';
    guardian.verified = true;
    guardian.profile = guardian.profile || {};
    guardian.profile.displayName = GUARDIAN.displayName;
    guardian.profile.timezone = 'UTC';
    guardian.profile.bio = 'Demo guardian account';
    guardian.profile.preferences = guardian.profile.preferences || {
      theme: 'system',
      fontSize: 'medium',
      language: 'en'
    };
    await guardian.save();
    console.log(`✅ Updated guardian credentials: ${guardian.email}`);
  } else {
    guardian = new User({
      email: GUARDIAN.email,
      password: GUARDIAN.password,
      role: 'guardian',
      verified: true,
      profile: {
        displayName: GUARDIAN.displayName,
        timezone: 'UTC',
        bio: 'Demo guardian account'
      }
    });
    await guardian.save();
    console.log(`✅ Created guardian: ${guardian.email}`);
  }

  // ── Student to monitor ────────────────────────────────────────────────────
  // Prefer an existing non-admin, non-guardian user; otherwise create one.
  let student = await User.findOne({
    role: 'user',
    email: { $nin: [GUARDIAN.email] },
    deleted: { $ne: true }
  }).sort({ createdAt: 1 });

  if (!student) {
    console.log('ℹ️  No existing student found — creating demo student.');
    student = new User({
      email: STUDENT.email,
      password: STUDENT.password,
      role: 'user',
      verified: true,
      profile: {
        displayName: STUDENT.displayName,
        timezone: 'UTC',
        bio: 'Demo student account'
      }
    });
    await student.save();
    console.log(`✅ Created student: ${student.email}`);
  } else {
    console.log(`ℹ️  Linking guardian to existing student: ${student.email}`);
  }

  // ── GuardianAccess record (active, all fields shared) ─────────────────────
  const access = await GuardianAccess.findOneAndUpdate(
    { studentId: student._id, guardianEmail: GUARDIAN.email.toLowerCase() },
    {
      studentId: student._id,
      guardianEmail: GUARDIAN.email.toLowerCase(),
      guardianName: GUARDIAN.displayName,
      accessType: 'guardian',
      status: 'active',
      activatedAt: new Date(),
      canSendReminders: true,
      allowedFields: {
        studyHours: true,
        goalProgress: true,
        sessionDetails: true,
        presenceData: true,
        rewardsData: true,
        subjectBreakdown: true
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log('\n' + '='.repeat(60));
  console.log('📋 GUARDIAN CREDENTIALS');
  console.log('='.repeat(60));
  console.log(`📧 Email:    ${GUARDIAN.email}`);
  console.log(`🔒 Password: ${GUARDIAN.password}`);
  console.log(`👤 Name:     ${GUARDIAN.displayName}`);
  console.log('-'.repeat(60));
  console.log('📋 LINKED STUDENT');
  console.log('-'.repeat(60));
  console.log(`📧 Email:    ${student.email}`);
  if (student.email === STUDENT.email) {
    console.log(`🔒 Password: ${STUDENT.password}`);
  } else {
    console.log('🔒 Password: (existing user — use their own password)');
  }
  console.log(`👤 Name:     ${student.profile?.displayName || student.email}`);
  console.log(`🔗 Access:   ${access.status}, all fields visible`);
  console.log('='.repeat(60));
  console.log('\n👉 Sign in as the guardian and open /guardian to view the dashboard.\n');

  await mongoose.connection.close();
  console.log('👋 Database connection closed');
};

run().catch(err => {
  console.error('❌ Seeder failed:', err);
  mongoose.connection.close().finally(() => process.exit(1));
});
