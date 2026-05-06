const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  completeSession,
  getSessions,
  getSessionById,
  getBreakSuggestion
} = require('../controllers/sessionsController');

const router = express.Router();

router.use(authenticate);

router.post('/complete', completeSession);
router.get('/suggestion', getBreakSuggestion);
router.get('/:id', getSessionById);
router.get('/', getSessions);

module.exports = router;
