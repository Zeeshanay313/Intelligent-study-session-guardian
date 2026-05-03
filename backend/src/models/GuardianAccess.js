const mongoose = require('mongoose');

const guardianAccessSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  guardianEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  guardianName: {
    type: String,
    default: ''
  },
  accessType: {
    type: String,
    enum: ['guardian', 'teacher'],
    default: 'guardian'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'revoked'],
    default: 'pending'
  },
  // Fields the guardian/teacher can see
  allowedFields: {
    studyHours: { type: Boolean, default: true },
    goalProgress: { type: Boolean, default: true },
    sessionDetails: { type: Boolean, default: false },
    presenceData: { type: Boolean, default: false },
    rewardsData: { type: Boolean, default: true },
    subjectBreakdown: { type: Boolean, default: true }
  },
  invitedAt: { type: Date, default: Date.now },
  activatedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null },
  // Reminder approval workflow
  canSendReminders: { type: Boolean, default: false },
  pendingReminderRequests: [{
    message: String,
    requestedAt: { type: Date, default: Date.now },
    approved: { type: Boolean, default: false },
    approvedAt: Date
  }]
}, {
  timestamps: true
});

guardianAccessSchema.index({ studentId: 1, guardianEmail: 1 }, { unique: true });

module.exports = mongoose.model('GuardianAccess', guardianAccessSchema);
