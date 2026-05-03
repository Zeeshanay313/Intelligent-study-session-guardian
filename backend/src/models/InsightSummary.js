const mongoose = require('mongoose');

const insightSummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'alltime'],
    default: 'weekly'
  },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  // Core metrics
  totalStudyMinutes: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 },
  avgSessionMinutes: { type: Number, default: 0 },
  longestSessionMinutes: { type: Number, default: 0 },

  // Focus & presence
  avgFocusPercent: { type: Number, default: 0 },
  avgPresencePercent: { type: Number, default: 0 },
  totalInterruptions: { type: Number, default: 0 },
  totalAbsenceWarnings: { type: Number, default: 0 },

  // Subject/goal breakdown
  subjectBreakdown: [{
    subject: String,
    minutes: Number,
    sessions: Number
  }],

  // Streak
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },

  // Goals
  goalsCompleted: { type: Number, default: 0 },
  goalsInProgress: { type: Number, default: 0 },

  // Points/rewards
  pointsEarned: { type: Number, default: 0 },

  // Computed at
  computedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

insightSummarySchema.index({ userId: 1, period: 1, periodStart: -1 });

module.exports = mongoose.model('InsightSummary', insightSummarySchema);
