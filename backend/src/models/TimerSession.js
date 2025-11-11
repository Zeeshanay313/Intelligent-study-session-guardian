const mongoose = require('mongoose');

const timerSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  sessionType: {
    type: String,
    enum: ['work', 'break', 'longBreak'],
    required: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  actualDuration: {
    type: Number, // actual time spent in seconds
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  cycle: {
    type: Number,
    default: 1
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimerPreset'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
timerSessionSchema.index({ userId: 1, startTime: -1 });
timerSessionSchema.index({ userId: 1, subject: 1 });
timerSessionSchema.index({ userId: 1, sessionType: 1 });

const TimerSession = mongoose.model('TimerSession', timerSessionSchema);

module.exports = TimerSession;
