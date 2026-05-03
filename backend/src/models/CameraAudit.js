const mongoose = require('mongoose');

const cameraAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  presenceSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PresenceSession',
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'camera_enabled',
      'camera_disabled',
      'permission_granted',
      'permission_denied',
      'permission_revoked',
      'detection_started',
      'detection_stopped'
    ]
  },
  // Confirmation: no image data is ever stored
  imageDataStored: {
    type: Boolean,
    default: false // Always false — enforced by system
  },
  metadata: {
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  }
}, {
  timestamps: true
});

cameraAuditSchema.index({ userId: 1, createdAt: -1 });

// TTL: auto-purge camera audit after 90 days
cameraAuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('CameraAudit', cameraAuditSchema);
