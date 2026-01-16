/**
 * Resource Model - Smart Resource Hub
 *
 * Manages user study resources including notes, links, documents, and files
 * with tagging, categorization, and cloud sync support
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['note', 'link', 'document', 'file', 'video', 'article', 'tool', 'other'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['study-tips', 'productivity', 'subject-material', 'reference', 'tool', 'general', 'other'],
    default: 'general',
    index: true
  },
  // Content based on type
  content: {
    // For notes
    text: {
      type: String,
      default: ''
    },
    // For links, videos, articles
    url: {
      type: String,
      trim: true,
      default: ''
    },
    // For files/documents
    filePath: {
      type: String,
      trim: true,
      default: ''
    },
    fileName: {
      type: String,
      trim: true,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      default: ''
    }
  },
  // Organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  folder: {
    type: String,
    trim: true,
    default: 'Unsorted'
  },
  // Usage tracking
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: null
  },
  // Session tracking
  usedInSessions: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudySession'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    },
    duration: {
      type: Number, // minutes
      default: 0
    }
  }],
  // Favorites and status
  isFavorite: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  // Cloud sync
  cloudSync: {
    enabled: {
      type: Boolean,
      default: false
    },
    provider: {
      type: String,
      enum: ['google-drive', 'dropbox', 'onedrive', 'none'],
      default: 'none'
    },
    externalId: {
      type: String,
      default: ''
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'error', 'none'],
      default: 'none'
    }
  },
  // AI suggestions
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiSuggestionScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  // Metadata
  thumbnail: {
    type: String,
    default: ''
  },
  metadata: {
    author: String,
    publisher: String,
    publishedDate: Date,
    language: String,
    pageCount: Number,
    duration: Number, // for videos in seconds
    customFields: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
resourceSchema.index({ userId: 1, createdAt: -1 });
resourceSchema.index({ userId: 1, type: 1 });
resourceSchema.index({ userId: 1, category: 1 });
resourceSchema.index({ userId: 1, tags: 1 });
resourceSchema.index({ userId: 1, subject: 1 });
resourceSchema.index({ userId: 1, isFavorite: 1 });
resourceSchema.index({ userId: 1, folder: 1 });

// Text search index
resourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'content.text': 'text'
});

// Virtual for file size in human readable format
resourceSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.content || !this.content.fileSize) return '0 B';
  const bytes = this.content.fileSize;
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
});

// Method to track resource access
resourceSchema.methods.recordAccess = function(sessionId = null, duration = 0) {
  this.accessCount += 1;
  this.lastAccessedAt = new Date();
  
  if (sessionId) {
    this.usedInSessions.push({
      sessionId,
      accessedAt: new Date(),
      duration
    });
  }
  
  return this.save();
};

// Method to sync with cloud storage
resourceSchema.methods.syncToCloud = async function() {
  if (!this.cloudSync.enabled) {
    return { success: false, message: 'Cloud sync not enabled' };
  }
  
  // This would integrate with actual cloud providers
  this.cloudSync.lastSyncedAt = new Date();
  this.cloudSync.syncStatus = 'synced';
  await this.save();
  
  return { success: true, message: 'Synced successfully' };
};

// Static method to get user statistics
resourceSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalResources: { $sum: 1 },
        favorites: { $sum: { $cond: ['$isFavorite', 1, 0] } },
        totalAccesses: { $sum: '$accessCount' },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalResources: 0,
    favorites: 0,
    totalAccesses: 0,
    byType: []
  };
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
