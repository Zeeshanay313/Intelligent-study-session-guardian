const mongoose = require('mongoose');

const timerPresetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  workDuration: { type: Number, required: true }, // seconds
  breakDuration: { type: Number, required: true }, // seconds
  longBreakDuration: { type: Number, required: true },
  cyclesBeforeLongBreak: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('TimerPreset', timerPresetSchema);
