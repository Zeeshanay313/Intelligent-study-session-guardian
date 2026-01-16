/**
 * Community Challenge Model
 *
 * Manages community-wide challenges that users can participate in
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  rank: {
    type: Number,
    default: null
  }
}, { _id: false });

const communityChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['study-hours', 'session-count', 'streak', 'goal-completion', 'custom'],
    required: true
  },
  // Challenge criteria
  target: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    enum: ['hours', 'sessions', 'days', 'goals', 'points'],
    required: true
  },
  // Time period
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // in days
    required: true
  },
  // Participation
  participants: [participantSchema],
  maxParticipants: {
    type: Number,
    default: null // null = unlimited
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  requiresOptIn: {
    type: Boolean,
    default: true
  },
  // Rewards
  rewards: {
    points: {
      type: Number,
      default: 100
    },
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      default: null
    },
    customReward: {
      type: String,
      default: ''
    }
  },
  // Display
  icon: {
    type: String,
    default: '🏆'
  },
  color: {
    type: String,
    default: '#F59E0B'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'extreme'],
    default: 'medium'
  },
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  // Statistics
  stats: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    completedCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageProgress: {
      type: Number,
      default: 0
    }
  },
  // Leaderboard settings
  showLeaderboard: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'seasonal'],
    default: 'weekly'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
communityChallengeSchema.index({ status: 1, startDate: -1 });
communityChallengeSchema.index({ status: 1, endDate: 1 });
communityChallengeSchema.index({ 'participants.userId': 1 });

// Virtual for days remaining
communityChallengeSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'active') return 0;
  const now = new Date();
  const diff = this.endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method to add participant
communityChallengeSchema.methods.addParticipant = function(userId) {
  // Check if already participating
  const existing = this.participants.find(p => p.userId.toString() === userId.toString());
  if (existing) {
    return { success: false, message: 'Already participating' };
  }
  
  // Check max participants
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) {
    return { success: false, message: 'Challenge is full' };
  }
  
  this.participants.push({
    userId,
    joinedAt: new Date(),
    progress: 0,
    completed: false
  });
  
  this.stats.totalParticipants = this.participants.length;
  
  return { success: true, message: 'Successfully joined challenge' };
};

// Method to update participant progress
communityChallengeSchema.methods.updateProgress = function(userId, progress) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (!participant) {
    return { success: false, message: 'Not participating in this challenge' };
  }
  
  participant.progress = progress;
  
  // Check if completed
  if (progress >= this.target && !participant.completed) {
    participant.completed = true;
    participant.completedAt = new Date();
    this.stats.completedCount += 1;
  }
  
  // Recalculate stats
  this.calculateStats();
  
  return { success: true, message: 'Progress updated' };
};

// Method to calculate statistics
communityChallengeSchema.methods.calculateStats = function() {
  const participants = this.participants;
  
  this.stats.totalParticipants = participants.length;
  this.stats.completedCount = participants.filter(p => p.completed).length;
  this.stats.completionRate = participants.length > 0 
    ? (this.stats.completedCount / participants.length) * 100 
    : 0;
  this.stats.averageProgress = participants.length > 0
    ? participants.reduce((sum, p) => sum + p.progress, 0) / participants.length
    : 0;
};

// Method to get leaderboard
communityChallengeSchema.methods.getLeaderboard = function(limit = 10) {
  return this.participants
    .sort((a, b) => {
      // Sort by completion first, then by progress
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      return b.progress - a.progress;
    })
    .slice(0, limit)
    .map((p, index) => ({
      ...p.toObject(),
      rank: index + 1
    }));
};

// Static method to get active challenges
communityChallengeSchema.statics.getActiveChallenges = async function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ endDate: 1 });
};

// Static method to get user's challenges
communityChallengeSchema.statics.getUserChallenges = async function(userId) {
  return this.find({
    'participants.userId': userId
  }).sort({ createdAt: -1 });
};

const CommunityChallenge = mongoose.model('CommunityChallenge', communityChallengeSchema);

module.exports = CommunityChallenge;
