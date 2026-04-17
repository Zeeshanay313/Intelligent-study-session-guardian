const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  recordActivity,
  getSessionSummary,
  listSessions
} = require('../services/activityLoggerService');

const router = express.Router();

router.use(authenticate);

const emitActivityUpdate = (req, payload) => {
  if (!req.io) return;
  const room = `user:${req.user._id}`;
  req.io.to(room).emit('activity:updated', payload);
};

const ensureValid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

const buildActivityPayload = (req, eventTypeOverride = null) => ({
  userId: req.user._id,
  sessionId: req.body.sessionId,
  goalId: req.body.goalId || null,
  sessionSource: req.body.sessionSource || 'timer',
  eventType: eventTypeOverride || req.body.eventType || (req.body.status === 'idle' ? 'idle' : 'active'),
  timestamp: req.body.timestamp,
  activeSeconds: req.body.activeSeconds || 0,
  idleSeconds: req.body.idleSeconds || 0,
  mouseMoves: req.body.mouseMoves,
  keyStrokes: req.body.keyStrokes,
  clicks: req.body.clicks,
  scrolls: req.body.scrolls,
  isIdle: req.body.status === 'idle',
  focusPercent: req.body.focusPercent,
  engagementScore: req.body.engagementScore,
  productivityScore: req.body.productivityScore,
  timeline: req.body.timeline || [],
  details: req.body.details
});

const startValidators = [
  body('sessionId').isMongoId(),
  body('goalId').optional().isMongoId()
];

const updateValidators = [
  body('sessionId').isMongoId(),
  body('goalId').optional().isMongoId(),
  body('activeSeconds').optional().isInt({ min: 0 }),
  body('idleSeconds').optional().isInt({ min: 0 })
];

const endValidators = updateValidators;

const startHandler = async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const log = await recordActivity({
      ...buildActivityPayload(req, 'session_start'),
      activeSeconds: 0,
      idleSeconds: 0,
      details: { ...(req.body.details || {}), status: 'active' }
    });

    emitActivityUpdate(req, {
      sessionId: req.body.sessionId,
      eventType: 'session_start',
      timestamp: log?.timestamp || new Date().toISOString()
    });

    return res.json({ success: true, data: log });
  } catch (error) {
    console.error('Activity start error:', error);
    return res.status(500).json({ success: false, error: 'Failed to start activity session' });
  }
};

const updateHandler = async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const log = await recordActivity(buildActivityPayload(req));
    emitActivityUpdate(req, {
      sessionId: req.body.sessionId,
      eventType: log?.eventType || 'session_update',
      timestamp: log?.timestamp || new Date().toISOString()
    });
    return res.json({ success: true, data: log });
  } catch (error) {
    console.error('Activity update error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update activity session' });
  }
};

const endHandler = async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const log = await recordActivity(buildActivityPayload(req, 'session_end'));
    const summaryPayload = await getSessionSummary({
      userId: req.user._id,
      sessionId: req.body.sessionId
    });

    emitActivityUpdate(req, {
      sessionId: req.body.sessionId,
      eventType: 'session_end',
      timestamp: log?.timestamp || new Date().toISOString(),
      summary: summaryPayload?.summary,
      timeline: summaryPayload?.timeline
    });

    return res.json({
      success: true,
      data: {
        log,
        summary: summaryPayload?.summary,
        timeline: summaryPayload?.timeline
      }
    });
  } catch (error) {
    console.error('Activity end error:', error);
    return res.status(500).json({ success: false, error: 'Failed to end activity session' });
  }
};

const sessionHandler = async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const summaryPayload = await getSessionSummary({
      userId: req.user._id,
      sessionId: req.params.sessionId
    });

    if (!summaryPayload) {
      return res.status(404).json({ success: false, error: 'Session activity not found' });
    }

    return res.json({ success: true, data: summaryPayload });
  } catch (error) {
    console.error('Get activity session error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity session' });
  }
};

router.post('/start', startValidators, startHandler);

router.post('/start-session', startValidators, startHandler);

router.post('/update', updateValidators, updateHandler);

router.post('/end', endValidators, endHandler);

router.post('/end-session', endValidators, endHandler);

router.get('/sessions', async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);
    const goalId = req.query.goalId || null;
    const sessionSource = req.query.sessionSource || null;
    const sessionType = req.query.sessionType || null;
    const sessions = await listSessions({ userId: req.user._id, goalId, limit, sessionSource, sessionType });
    return res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('List activity sessions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity sessions' });
  }
});

router.get('/session/:sessionId', [param('sessionId').isMongoId()], sessionHandler);

router.get('/sessions/:sessionId', [param('sessionId').isMongoId()], sessionHandler);

router.get('/goal/:goalId', [param('goalId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const sessions = await listSessions({
      userId: req.user._id,
      goalId: req.params.goalId,
      limit: Number(req.query.limit || 50)
    });
    return res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get activity goal sessions error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch goal activity sessions' });
  }
});

module.exports = router;