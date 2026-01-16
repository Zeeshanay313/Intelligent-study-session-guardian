const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'Study Session'
  },
  subject: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planned'
  },
  sessionType: {
    type: String,
    enum: ['focus', 'break', 'long-break'],
    default: 'focus'
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  notes: {
    type: String,
    default: ''
  },
  productivity: {
    type: Number,
    min: 1,
    max: 5 // 1-5 rating
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    duration: Number // in minutes
  }],
  tags: [String],
  metadata: {
    pomodoroCount: { type: Number, default: 0 },
    totalBreakTime: { type: Number, default: 0 },
    distractions: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for actual duration
studySessionSchema.virtual('actualDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return this.duration || 0;
});

// Index for efficient queries
studySessionSchema.index({ userId: 1, startTime: -1 });
studySessionSchema.index({ userId: 1, status: 1 });
studySessionSchema.index({ goalId: 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession;