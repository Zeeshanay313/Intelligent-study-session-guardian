const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  consentType: {
    type: String,
    required: true,
    enum: [
      'camera_presence',
      'guardian_sharing',
      'teacher_sharing',
      'analytics_collection',
      'email_notifications',
      'data_retention_extended',
      'third_party_integrations'
    ]
  },
  granted: {
    type: Boolean,
    required: true
  },
  grantedAt: {
    type: Date,
    default: null
  },
  revokedAt: {
    type: Date,
    default: null
  },
  version: {
    type: String,
    default: '1.0'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

consentRecordSchema.index({ userId: 1, consentType: 1 });

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);
