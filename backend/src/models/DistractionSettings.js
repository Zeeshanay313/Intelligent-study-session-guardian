const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const distractionSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  blockedSites: {
    type: [String],
    default: []
  },
  blockedKeywords: {
    type: [String],
    default: []
  },
  strictnessLevel: {
    type: String,
    enum: ['soft', 'hard'],
    default: 'soft'
  },
  strictnessIntensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  schedule: {
    type: [scheduleEntrySchema],
    default: []
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DistractionSettings', distractionSettingsSchema);
