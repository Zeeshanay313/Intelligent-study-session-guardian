const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getStudentInsights, getGuardianInsights, getTeacherInsights,
  getSummary, shareAccess, revokeAccess, listAccess,
  requestReminder, approveReminder, exportCSV, exportPDF
} = require('../controllers/insightsController');

router.use(authenticate);

// Student self-view
router.get('/student/:userId', getStudentInsights);
router.get('/summary/:userId', getSummary);

// Guardian / teacher views
router.get('/guardian/:userId', getGuardianInsights);
router.get('/teacher/:userId', getTeacherInsights);

// Access management
router.get('/access', listAccess);
router.post('/share', shareAccess);
router.delete('/share', revokeAccess);

// Reminder workflow
router.post('/reminder-request', requestReminder);
router.post('/reminder-approve', approveReminder);

// Exports
router.get('/export/csv/:userId', exportCSV);
router.get('/export/pdf/:userId', exportPDF);

module.exports = router;
