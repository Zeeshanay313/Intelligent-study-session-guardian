const mongoose = require('mongoose');

const timelineSegmentSchema = new mongoose.Schema({
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['active', 'idle']
  }
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    index: true
  },
  sessionSource: {
    type: String,
    enum: ['timer', 'study', 'manual'],
    default: 'timer'
  },
  eventType: {
    type: String,
    enum: ['session_start', 'session_update', 'session_end', 'active', 'idle', 'nudge'],
    default: 'session_update'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  activeSeconds: {
    type: Number,
    default: 0
  },
  idleSeconds: {
    type: Number,
    default: 0
  },
  mouseMoves: {
    type: Number,
    default: 0
  },
  keyStrokes: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  scrolls: {
    type: Number,
    default: 0
  },
  focusPercent: {
    type: Number,
    default: 0
  },
  engagementScore: {
    type: Number,
    default: 0
  },
  productivityScore: {
    type: Number,
    default: 0
  },
  isIdle: {
    type: Boolean,
    default: false
  },
  timeline: {
    type: [timelineSegmentSchema],
    default: []
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

activityLogSchema.index({ userId: 1, sessionId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, goalId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
