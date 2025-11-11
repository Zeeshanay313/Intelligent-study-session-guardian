const mongoose = require('mongoose');

const presetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  workDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 240 // 4 hours max
  },
  breakDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 60 // 1 hour max
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
presetSchema.index({ userId: 1, createdAt: -1 });

// Ensure only one default preset per user
presetSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const Preset = mongoose.model('Preset', presetSchema);

module.exports = Preset;
