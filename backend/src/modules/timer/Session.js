const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  presetId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimerPreset', default: null },
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  totalDurationSec: { type: Number, default: 0 },
  productiveSeconds: { type: Number, default: 0 },
  presencePercent: { type: Number, default: 0 },
  interruptions: [{ time: Date, type: String }],
  notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
