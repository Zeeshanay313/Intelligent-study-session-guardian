const mongoose = require('mongoose');

const sessionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Preset',
    default: null
  },
  presetName: {
    type: String,
    default: 'Quick Session'
  },
  durationSeconds: {
    type: Number,
    required: true,
    min: 1
  },
  startedAt: {
    type: Date,
    required: true,
    index: true
  },
  endedAt: {
    type: Date,
    required: true
  },
  completedSuccessfully: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
sessionLogSchema.index({ userId: 1, startedAt: -1 });
sessionLogSchema.index({ userId: 1, createdAt: -1 });

// Virtual for duration in minutes
sessionLogSchema.virtual('durationMinutes').get(function () {
  return Math.round(this.durationSeconds / 60);
});

// Ensure virtuals are included in JSON
sessionLogSchema.set('toJSON', { virtuals: true });
sessionLogSchema.set('toObject', { virtuals: true });

const SessionLog = mongoose.model('SessionLog', sessionLogSchema);

module.exports = SessionLog;
