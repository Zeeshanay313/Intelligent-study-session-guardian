const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  completeSession,
  getSessions,
  getBreakSuggestion
} = require('../controllers/sessionsController');

const router = express.Router();

// All session routes require authentication
router.use(authenticate);

// POST /api/sessions/complete - Log a completed session
router.post('/complete', completeSession);

// GET /api/sessions - Get session logs with pagination
router.get('/', getSessions);

// GET /api/sessions/suggestion - Get intelligent break suggestion
router.get('/suggestion', getBreakSuggestion);

module.exports = router;
