const mongoose = require('mongoose');

const presenceEventSchema = new mongoose.Schema({
  presenceSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PresenceSession',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'presence_detected',   // camera-based detection (metadata only, no image)
      'absence_detected',
      'manual_checkin',
      'absence_warning',
      'fatigue_alert',
      'session_start',
      'session_end'
    ]
  },
  // Only metadata - NO raw image data ever stored
  detectionMethod: {
    type: String,
    enum: ['camera_metadata', 'manual', 'system'],
    default: 'manual'
  },
  // Presence confidence score 0-100 (from on-device detection, metadata only)
  confidenceScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

presenceEventSchema.index({ presenceSessionId: 1, createdAt: -1 });

module.exports = mongoose.model('PresenceEvent', presenceEventSchema);
