const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if no OAuth provider is connected
      return !this.oauth || 
             (!this.oauth.google?.id && 
              !this.oauth.github?.id && 
              !this.oauth.facebook?.id && 
              !this.oauth.twitter?.id);
    },
    minlength: 8
  },
  profile: {
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    avatar: {
      type: String, // File path or base64
      default: null
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      language: {
        type: String,
        default: 'en'
      }
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    studyLevel: {
      type: String,
      enum: ['', 'high-school', 'undergraduate', 'graduate', 'postgraduate', 'other'],
      default: ''
    },
    institution: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ''
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    }
  },
  privacy: {
    cameraConsent: {
      type: Boolean,
      default: false // Camera off by default
    },
    guardianSharing: {
      type: Boolean,
      default: false // Opt-in for guardian sharing  
    },
    shareFields: [{
      type: String,
      enum: ['profile', 'studyTime', 'progress', 'schedule']
    }],
    notifications: {
      inApp: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      },
      studyReminders: {
        type: Boolean,
        default: true
      },
      guardianUpdates: {
        type: Boolean,
        default: false
      },
      goalUpdates: {
        type: Boolean,
        default: true
      },
      achievementAlerts: {
        type: Boolean,
        default: true
      },
      breakReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Third-party integrations
  integrations: {
    googleCalendar: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Date,
      connected: {
        type: Boolean,
        default: false
      },
      lastSync: Date
    },
    email: {
      provider: {
        type: String,
        enum: ['gmail', 'outlook', 'custom'],
        default: 'gmail'
      },
      smtpHost: String,
      smtpPort: Number,
      smtpUser: String,
      smtpPass: String,
      enabled: {
        type: Boolean,
        default: false
      }
    },
    pushNotifications: {
      fcmToken: String,
      enabled: {
        type: Boolean,
        default: false
      },
      lastUpdated: Date
    }
  },
  // OAuth provider data
  oauth: {
    google: {
      id: {
        type: String,
        sparse: true,
        index: true
      },
      email: String,
      name: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: {
        type: Date,
        default: Date.now
      }
    },
    github: {
      id: {
        type: String,
        sparse: true,
        index: true
      },
      username: String,
      email: String,
      name: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: {
        type: Date,
        default: Date.now
      }
    },
    facebook: {
      id: {
        type: String,
        sparse: true,
        index: true
      },
      email: String,
      name: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: {
        type: Date,
        default: Date.now
      }
    },
    twitter: {
      id: {
        type: String,
        sparse: true,
        index: true
      },
      username: String,
      email: String,
      name: String,
      accessToken: String,
      refreshToken: String,
      connectedAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  // Soft delete
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deleteRequestedAt: {
    type: Date,
    default: null
  },
  // Account verification
  verified: {
    type: Boolean,
    default: false
  },
  // Password reset functionality
  passwordReset: {
    token: {
      type: String,
      sparse: true
    },
    expiresAt: {
      type: Date,
      sparse: true
    }
  },
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  verificationToken: String,
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Account activity
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ deleted: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'privacy.cameraConsent': 1 });

// Virtual for full name
userSchema.virtual('name').get(function() {
  return this.profile.displayName;
});

// Post-find middleware to ensure refreshTokens array exists
userSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  if (docs) {
    // Handle single document
    if (!Array.isArray(docs)) {
      if (!docs.refreshTokens) {
        docs.refreshTokens = [];
      }
    } else {
      // Handle array of documents
      docs.forEach(doc => {
        if (doc && !doc.refreshTokens) {
          doc.refreshTokens = [];
        }
      });
    }
  }
});

// Pre-save middleware to hash password and initialize arrays
userSchema.pre('save', async function(next) {
  // Ensure refreshTokens array exists
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(token) {
  console.log(`Adding refresh token for user ID: ${this._id}`);
  
  try {
    // Ensure refreshTokens array exists
    if (!this.refreshTokens) {
      console.log('Initializing refreshTokens array');
      this.refreshTokens = [];
    }
    
    // Use atomic operation to avoid version conflicts
    console.log('Attempting atomic update for refresh token');
    const result = await this.constructor.findByIdAndUpdate(
      this._id,
      { 
        $push: { 
          refreshTokens: {
            $each: [{ token }],
            $slice: -5 // Keep only last 5 tokens
          }
        }
      },
      { new: true, runValidators: false } // Skip validation for performance
    );
    
    if (!result) {
      console.error('Atomic update returned null - user may not exist');
      throw new Error('Failed to update user with refresh token');
    }
    
    // Update the current instance with the new data
    this.refreshTokens = result.refreshTokens;
    console.log(`Successfully added refresh token. Total tokens: ${this.refreshTokens.length}`);
    
    return result;
  } catch (error) {
    console.error('Error in atomic refresh token update:', error);
    console.log('Falling back to traditional method');
    
    try {
      // Fallback to traditional method
      if (!this.refreshTokens) {
        this.refreshTokens = [];
      }
      
      this.refreshTokens.push({ token });
      // Keep only last 5 refresh tokens
      if (this.refreshTokens.length > 5) {
        this.refreshTokens = this.refreshTokens.slice(-5);
      }
      
      const saved = await this.save();
      console.log('Fallback method successful');
      return saved;
    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  try {
    // Use atomic operation to avoid version conflicts
    const result = await this.constructor.findByIdAndUpdate(
      this._id,
      { $pull: { refreshTokens: { token: token } } },
      { new: true }
    );
    
    // Update the current instance with the new data
    if (result) {
      this.refreshTokens = result.refreshTokens;
    }
    
    return result;
  } catch (error) {
    console.error('Error removing refresh token:', error);
    // Fallback to traditional method
    if (!this.refreshTokens) {
      this.refreshTokens = [];
    }
    this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
    return await this.save();
  }
};

// Method to soft delete
userSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deleteRequestedAt = new Date();
  return this.save();
};

// Method to restore from soft delete
userSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = null;
  this.deleteRequestedAt = null;
  return this.save();
};

// Static method to find non-deleted users
userSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, deleted: false });
};

// Static method for cleanup (hard delete after retention period)
userSchema.statics.hardDeleteExpired = async function() {
  const retentionDays = parseInt(process.env.USER_RETENTION_DAYS) || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  return this.deleteMany({
    deleted: true,
    deletedAt: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('User', userSchema);