const mongoose = require('mongoose');

const securitySettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Role-based access
  role: {
    type: String,
    enum: ['student', 'guardian', 'teacher', 'admin'],
    default: 'student'
  },
  // Two-factor auth
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  // Session management
  sessionTimeout: {
    type: Number,
    default: 60, // minutes
    min: 5,
    max: 1440
  },
  // Login history retention
  loginHistoryDays: {
    type: Number,
    default: 30,
    min: 7,
    max: 365
  },
  // Trusted devices
  trustedDevicesEnabled: {
    type: Boolean,
    default: false
  },
  // Data sharing
  allowGuardianAccess: {
    type: Boolean,
    default: false
  },
  allowTeacherAccess: {
    type: Boolean,
    default: false
  },
  guardianEmail: {
    type: String,
    default: ''
  },
  teacherEmail: {
    type: String,
    default: ''
  },
  // Which fields to share
  sharedFields: {
    studyHours: { type: Boolean, default: false },
    goalProgress: { type: Boolean, default: false },
    sessionDetails: { type: Boolean, default: false },
    presenceData: { type: Boolean, default: false },
    rewardsData: { type: Boolean, default: false },
    subjectBreakdown: { type: Boolean, default: false }
  },
  // Security alerts
  alertOnNewDevice: {
    type: Boolean,
    default: true
  },
  alertOnDataExport: {
    type: Boolean,
    default: true
  },
  alertOnAccessChange: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SecuritySettings', securitySettingsSchema);
