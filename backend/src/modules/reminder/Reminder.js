const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true
  },
  title: {
    type: String, required: true, trim: true, maxlength: 200
  },
  message: { type: String, trim: true, maxlength: 1000 },
  type: { type: String, enum: ['one-off', 'recurring'], required: true },
  cronExpression: { type: String, default: null },
  datetime: { type: Date, default: null },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  calendarLinked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
