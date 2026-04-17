const mongoose = require('mongoose');

const sessionReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    unique: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
    index: true
  },
  subject: {
    type: String,
    default: null,
    trim: true,
    index: true
  },
  sessionStartTime: {
    type: Date,
    default: null
  },
  sessionEndTime: {
    type: Date,
    default: null
  },
  totalDuration: {
    type: Number,
    default: 0
  },
  activeTime: {
    type: Number,
    default: 0
  },
  idleTime: {
    type: Number,
    default: 0
  },
  focusPercentage: {
    type: Number,
    default: 0
  },
  interruptions: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    default: 0
  },
  distractionSummary: {
    type: Object,
    default: null
  },
  activityTimeline: {
    type: Array,
    default: []
  }
}, {
  timestamps: true
});

sessionReportSchema.index({ userId: 1, sessionStartTime: -1 });
sessionReportSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('SessionReport', sessionReportSchema);
