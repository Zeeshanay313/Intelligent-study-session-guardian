const express = require('express');
const { authenticate } = require('../../middleware/auth');
const {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  startSession,
  pauseSession,
  stopSession,
  getSessionHistory
} = require('./timerController');
const { validateTimerPreset, validateStartSession } = require('./timerValidation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Timer preset routes
router.get('/', getPresets);
router.post('/', validateTimerPreset, createPreset);
router.put('/:id', validateTimerPreset, updatePreset);
router.delete('/:id', deletePreset);

// Session management routes
router.post('/start', validateStartSession, startSession);
router.post('/:sessionId/pause', pauseSession);
router.post('/:sessionId/stop', stopSession);

// Session history
router.get('/sessions', getSessionHistory);

module.exports = router;
