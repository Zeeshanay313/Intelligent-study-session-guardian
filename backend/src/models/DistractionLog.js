const mongoose = require('mongoose');

const distractionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    index: true
  },
  site: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['blocked', 'override'],
    required: true
  },
  overrideType: {
    type: String,
    enum: ['soft', 'hard', null],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  duration: {
    type: Number,
    default: 0
  },
  source: {
    type: String,
    default: 'timer'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DistractionLog', distractionLogSchema);
