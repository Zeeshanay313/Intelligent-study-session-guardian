const mongoose = require('mongoose');

const presenceSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timerSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimerSession',
    default: null
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  cameraEnabled: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  // Aggregated stats (populated on end)
  presencePercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalChecks: {
    type: Number,
    default: 0
  },
  presentCount: {
    type: Number,
    default: 0
  },
  manualCheckIns: {
    type: Number,
    default: 0
  },
  absenceWarnings: {
    type: Number,
    default: 0
  },
  fatigueAlerts: {
    type: Number,
    default: 0
  },
  // Duration in seconds
  durationSeconds: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

presenceSessionSchema.index({ userId: 1, createdAt: -1 });
presenceSessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('PresenceSession', presenceSessionSchema);
