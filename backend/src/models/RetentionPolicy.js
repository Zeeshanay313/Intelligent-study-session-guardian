const mongoose = require('mongoose');

const retentionPolicySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // How long to keep different data types (days)
  sessionDataDays: {
    type: Number,
    default: 365,
    min: 30,
    max: 3650
  },
  activityLogDays: {
    type: Number,
    default: 180,
    min: 30,
    max: 3650
  },
  auditLogDays: {
    type: Number,
    default: 730,
    min: 90,
    max: 3650
  },
  presenceDataDays: {
    type: Number,
    default: 90,
    min: 7,
    max: 365
  },
  insightsDays: {
    type: Number,
    default: 365,
    min: 30,
    max: 3650
  },
  autoDeleteEnabled: {
    type: Boolean,
    default: false
  },
  lastReviewedAt: {
    type: Date,
    default: Date.now
  },
  nextReviewAt: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      return d;
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RetentionPolicy', retentionPolicySchema);
