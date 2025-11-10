const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema({
  userId: {
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
  guardianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be set when guardian accepts invite
  },
  relationship: {
    type: String,
    enum: ['parent', 'teacher', 'tutor', 'mentor', 'other'],
    required: true
  },
  // Consent and status
  consentStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'revoked'],
    default: 'pending'
  },
  inviteToken: {
    type: String,
    required: true,
    unique: true
  },
  inviteExpires: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  },
  // Sharing permissions
  shareFields: [{
    type: String,
    enum: ['profile', 'studyTime', 'progress', 'schedule', 'attendance'],
    default: ['progress']
  }],
  accessLevel: {
    type: String,
    enum: ['view', 'limited', 'full'],
    default: 'view'
  },
  // Notification preferences
  notifications: {
    studyStart: {
      type: Boolean,
      default: false
    },
    studyEnd: {
      type: Boolean,
      default: false
    },
    missedSession: {
      type: Boolean,
      default: true
    },
    progressReport: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly'],
      default: 'weekly'
    }
  },
  // Activity tracking
  lastAccess: Date,
  accessCount: {
    type: Number,
    default: 0
  },
  // Audit trail
  consentGivenAt: Date,
  consentRevokedAt: Date,
  invitedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
guardianSchema.index({ userId: 1, guardianEmail: 1 }, { unique: true });
guardianSchema.index({ guardianId: 1 });
guardianSchema.index({ inviteToken: 1 });
guardianSchema.index({ consentStatus: 1 });
guardianSchema.index({ inviteExpires: 1 });

// TTL index for expired invites
guardianSchema.index({ inviteExpires: 1 }, { expireAfterSeconds: 0 });

// Virtual for invitation status
guardianSchema.virtual('inviteStatus').get(function () {
  if (this.consentStatus === 'accepted') return 'active';
  if (this.consentStatus === 'declined' || this.consentStatus === 'revoked') return 'inactive';
  if (this.inviteExpires < new Date()) return 'expired';
  return 'pending';
});

// Method to accept invitation
guardianSchema.methods.acceptInvite = function (guardianUserId) {
  this.guardianId = guardianUserId;
  this.consentStatus = 'accepted';
  this.consentGivenAt = new Date();
  this.inviteToken = null; // Clear token after acceptance

  return this.save();
};

// Method to decline invitation
guardianSchema.methods.declineInvite = function () {
  this.consentStatus = 'declined';
  this.inviteToken = null;

  return this.save();
};

// Method to revoke consent
guardianSchema.methods.revokeConsent = function () {
  this.consentStatus = 'revoked';
  this.consentRevokedAt = new Date();
  this.shareFields = [];
  this.accessLevel = 'view';

  return this.save();
};

// Method to update sharing preferences
guardianSchema.methods.updateSharing = function (shareFields, accessLevel) {
  if (this.consentStatus !== 'accepted') {
    throw new Error('Cannot update sharing for non-accepted guardian');
  }

  this.shareFields = shareFields;
  this.accessLevel = accessLevel;

  return this.save();
};

// Method to track access
guardianSchema.methods.trackAccess = function () {
  this.lastAccess = new Date();
  this.accessCount += 1;

  return this.save();
};

// Static method to find active guardians for user
guardianSchema.statics.findActiveGuardians = function (userId) {
  return this.find({
    userId,
    consentStatus: 'accepted'
  }).populate('guardianId', 'email profile.displayName');
};

// Static method to find pending invites
guardianSchema.statics.findPendingInvites = function (guardianEmail) {
  return this.find({
    guardianEmail,
    consentStatus: 'pending',
    inviteExpires: { $gt: new Date() }
  }).populate('userId', 'email profile.displayName');
};

// Static method to cleanup expired invites
guardianSchema.statics.cleanupExpiredInvites = function () {
  return this.deleteMany({
    consentStatus: 'pending',
    inviteExpires: { $lt: new Date() }
  });
};

// Static method to get guardian statistics
guardianSchema.statics.getGuardianStats = function (userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$consentStatus',
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Guardian', guardianSchema);
