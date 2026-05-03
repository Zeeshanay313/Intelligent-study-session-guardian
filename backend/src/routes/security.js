const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getSettings, updateSettings,
  grantConsent, getConsents,
  getAuditLog, createAuditEntry,
  exportUserData, permanentDelete,
  getRetention, updateRetention
} = require('../controllers/securityController');

// All security routes require authentication
router.use(authenticate);

// Security settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Consent management
router.get('/consent', getConsents);
router.post('/consent', grantConsent);

// Audit log
router.get('/audit-log', getAuditLog);
router.post('/audit-log', createAuditEntry);

// Data export
router.post('/export', exportUserData);

// Permanent delete
router.delete('/permanent-delete', permanentDelete);

// Retention policy
router.get('/retention', getRetention);
router.put('/retention', updateRetention);

module.exports = router;
