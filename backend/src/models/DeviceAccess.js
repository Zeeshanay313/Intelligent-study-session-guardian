const mongoose = require('mongoose');

const deviceAccessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  deviceInfo: {
    name: String,
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    os: String,
    browser: String,
    userAgent: String
  },
  accessEnabled: {
    type: Boolean,
    default: true
  },
  permissions: {
    camera: {
      type: Boolean,
      default: false
    },
    microphone: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    },
    location: {
      type: Boolean,
      default: false
    }
  },
  // Security tracking
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastIP: String,
  registeredIP: String,
  loginCount: {
    type: Number,
    default: 0
  },
  // Trust level based on usage patterns
  trustScore: {
    type: Number,
    default: 50, // 0-100 scale
    min: 0,
    max: 100
  },
  // Security flags
  suspicious: {
    type: Boolean,
    default: false
  },
  blocked: {
    type: Boolean,
    default: false
  },
  blockedReason: String,
  blockedAt: Date,
  // Device fingerprinting (for security)
  fingerprint: {
    screen: String,
    timezone: String,
    language: String,
    platform: String
  }
}, {
  timestamps: true
});

// Compound indexes
deviceAccessSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
deviceAccessSchema.index({ userId: 1, lastSeen: -1 });
deviceAccessSchema.index({ userId: 1, accessEnabled: 1 });
deviceAccessSchema.index({ trustScore: 1 });
deviceAccessSchema.index({ suspicious: 1, blocked: 1 });

// TTL index for cleanup of old inactive devices (1 year)
deviceAccessSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 31536000 });

// Virtual for device status
deviceAccessSchema.virtual('status').get(function() {
  if (this.blocked) return 'blocked';
  if (this.suspicious) return 'suspicious';
  if (!this.accessEnabled) return 'disabled';
  
  const daysSinceLastSeen = (Date.now() - this.lastSeen) / (1000 * 60 * 60 * 24);
  if (daysSinceLastSeen > 30) return 'inactive';
  if (daysSinceLastSeen > 7) return 'idle';
  
  return 'active';
});

// Virtual for is trusted device
deviceAccessSchema.virtual('isTrusted').get(function() {
  return this.trustScore >= 70 && !this.suspicious && !this.blocked;
});

// Method to update last seen and increment login count
deviceAccessSchema.methods.updateActivity = function(ipAddress) {
  this.lastSeen = new Date();
  this.lastIP = ipAddress;
  this.loginCount += 1;
  
  // Increase trust score for regular usage (up to 80)
  if (this.trustScore < 80 && this.loginCount > 5) {
    this.trustScore = Math.min(80, this.trustScore + 1);
  }
  
  return this.save();
};

// Method to revoke access
deviceAccessSchema.methods.revokeAccess = function(reason = null) {
  this.accessEnabled = false;
  this.permissions = {
    camera: false,
    microphone: false,
    notifications: false,
    location: false
  };
  
  if (reason) {
    this.blocked = true;
    this.blockedReason = reason;
    this.blockedAt = new Date();
  }
  
  return this.save();
};

// Method to enable access
deviceAccessSchema.methods.enableAccess = function() {
  this.accessEnabled = true;
  this.blocked = false;
  this.blockedReason = null;
  this.blockedAt = null;
  this.suspicious = false;
  
  return this.save();
};

// Method to update permissions
deviceAccessSchema.methods.updatePermissions = function(permissions) {
  this.permissions = {
    ...this.permissions,
    ...permissions
  };
  
  return this.save();
};

// Static method to find user devices
deviceAccessSchema.statics.findUserDevices = function(userId, activeOnly = false) {
  const query = { userId };
  if (activeOnly) {
    query.accessEnabled = true;
    query.blocked = false;
  }
  
  return this.find(query).sort({ lastSeen: -1 });
};

// Static method to detect suspicious activity
deviceAccessSchema.statics.detectSuspiciousDevices = function() {
  const suspiciousThreshold = new Date();
  suspiciousThreshold.setHours(suspiciousThreshold.getHours() - 1); // Last hour
  
  return this.find({
    loginCount: { $gt: 20 }, // Too many logins
    lastSeen: { $gte: suspiciousThreshold },
    suspicious: false
  });
};

// Method to mark as suspicious
deviceAccessSchema.methods.markSuspicious = function(reason) {
  this.suspicious = true;
  this.trustScore = Math.max(0, this.trustScore - 20);
  this.blockedReason = reason;
  
  return this.save();
};

// Static method for device cleanup
deviceAccessSchema.statics.cleanupInactiveDevices = function(days = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.deleteMany({
    lastSeen: { $lt: cutoffDate },
    accessEnabled: false
  });
};

module.exports = mongoose.model('DeviceAccess', deviceAccessSchema);