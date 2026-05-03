const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  startPresence, recordEvent, manualCheckin,
  endPresence, getSessionById, getActiveSession,
  getHistory, getCameraAudit
} = require('../controllers/presenceController');

router.use(authenticate);

router.post('/start', startPresence);
router.post('/event', recordEvent);
router.post('/manual-checkin', manualCheckin);
router.post('/end', endPresence);
router.get('/active', getActiveSession);
router.get('/session/:sessionId', getSessionById);
router.get('/history', getHistory);
router.get('/camera-audit', getCameraAudit);

module.exports = router;
