const mongoose = require('mongoose');

const sessionCommentSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  }
}, {
  timestamps: true
});

sessionCommentSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('SessionComment', sessionCommentSchema);
