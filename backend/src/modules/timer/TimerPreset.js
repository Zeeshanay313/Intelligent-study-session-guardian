const mongoose = require('mongoose');

const timerPresetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  subject: { type: String, default: 'General', trim: true, maxlength: 100, index: true },
  workDuration: { type: Number, required: true }, // seconds
  breakDuration: { type: Number, required: true }, // seconds
  longBreakDuration: { type: Number, required: true },
  cyclesBeforeLongBreak: { type: Number, required: true },
  isDefault: { type: Boolean, default: false },
  color: { type: String, default: '#3B82F6', trim: true },
  icon: { type: String, default: '📚', trim: true }
}, { timestamps: true });

// Compound index for efficient queries by user and subject
timerPresetSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('TimerPreset', timerPresetSchema);
