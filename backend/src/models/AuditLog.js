const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'ACCOUNT_CREATED',
      'ACCOUNT_DELETED',
      'ACCOUNT_RESTORED',
      'PROFILE_UPDATED',
      'PRIVACY_UPDATED',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET_REQUESTED',
      'PASSWORD_RESET_SUCCESS',
      'PASSWORD_RESET_COMPLETED',
      'PASSWORD_RESET_FAILED',
      'PASSWORD_RESET_SAME_PASSWORD',
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'TOKEN_REFRESHED',
      'CAMERA_CONSENT_CHANGED',
      'GUARDIAN_SHARING_CHANGED',
      'GUARDIAN_INVITED',
      'GUARDIAN_REMOVED',
      'DEVICE_REGISTERED',
      'DEVICE_ACCESS_CHANGED',
      'DATA_EXPORTED',
      'AVATAR_UPDATED',
      // Admin actions
      'USER_CREATED_BY_ADMIN',
      'USER_UPDATED_BY_ADMIN',
      'USER_DELETED_BY_ADMIN',
      'USER_SOFT_DELETED_BY_ADMIN',
      'USER_HARD_DELETED_BY_ADMIN',
      'USER_RESTORED_BY_ADMIN',
      'ADMIN_LOGIN',
      'ADMIN_ACTION',
      'ADMIN_USER_UPDATE_FAILED',
      'ADMIN_USER_DELETE_FAILED',
      'ADMIN_USER_CREATE_FAILED',
      'ADMIN_USER_RESTORE_FAILED'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for action-specific data
    default: {}
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String,
    location: {
      country: String,
      city: String
    }
  },
  // Privacy-specific fields
  privacyImpact: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none'
  },
  dataCategories: [{
    type: String,
    enum: ['profile', 'preferences', 'consent', 'access', 'biometric']
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ privacyImpact: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For cleanup operations

// TTL index for automatic cleanup after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

// Static method to log privacy-related actions
auditLogSchema.statics.logPrivacyAction = function (userId, action, details = {}, metadata = {}) {
  const privacyActions = {
    PRIVACY_UPDATED: 'high',
    CAMERA_CONSENT_CHANGED: 'high',
    GUARDIAN_SHARING_CHANGED: 'high',
    GUARDIAN_INVITED: 'medium',
    DATA_EXPORTED: 'medium',
    ACCOUNT_DELETED: 'high'
  };

  const dataCategories = {
    PRIVACY_UPDATED: ['consent', 'preferences'],
    CAMERA_CONSENT_CHANGED: ['consent', 'biometric'],
    GUARDIAN_SHARING_CHANGED: ['consent', 'access'],
    GUARDIAN_INVITED: ['access'],
    DATA_EXPORTED: ['profile', 'preferences', 'consent'],
    PROFILE_UPDATED: ['profile'],
    AVATAR_UPDATED: ['profile']
  };

  return this.create({
    userId,
    action,
    details,
    metadata,
    privacyImpact: privacyActions[action] || 'low',
    dataCategories: dataCategories[action] || []
  });
};

// Static method to get user audit trail with pagination
auditLogSchema.statics.getUserAuditTrail = function (userId, options = {}) {
  const {
    page = 1,
    limit = 50,
    action = null,
    privacyOnly = false,
    startDate = null,
    endDate = null
  } = options;

  const query = { userId };

  if (action) query.action = action;
  if (privacyOnly) query.privacyImpact = { $in: ['medium', 'high'] };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'email profile.displayName')
    .lean();
};

// Static method for compliance reporting
auditLogSchema.statics.getPrivacyReport = function (userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        privacyImpact: { $in: ['medium', 'high'] },
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
        dataCategories: { $addToSet: '$dataCategories' }
      }
    },
    {
      $sort: { lastOccurrence: -1 }
    }
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
