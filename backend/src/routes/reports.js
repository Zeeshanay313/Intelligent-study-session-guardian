const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const SessionReport = require('../models/SessionReport');
const SessionComment = require('../models/SessionComment');
const DistractionLog = require('../models/DistractionLog');
const { generateSessionReport, getComparison } = require('../services/sessionReportService');

const Session = require('../modules/timer/Session');

const router = express.Router();

router.use(authenticate);

const ensureValid = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

const requireCoach = (req, res, next) => {
  const role = req.user?.role;
  if (role === 'teacher' || role === 'coach' || role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Not authorized to comment' });
};

router.post('/generate', [body('sessionId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const report = await generateSessionReport({
      sessionId: req.body.sessionId,
      userId: req.user._id,
      force: Boolean(req.body.force)
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Session data not found' });
    }

    return res.json({ success: true, data: report });
  } catch (error) {
    console.error('Generate report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

router.get('/session/:sessionId', [param('sessionId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const report = await SessionReport.findOne({ sessionId: req.params.sessionId, userId: req.user._id }).lean();
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const comments = await SessionComment.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: -1 })
      .populate('userId', 'profile.displayName role')
      .lean();

    let distractionLogs = await DistractionLog.find({ userId: req.user._id, sessionId: req.params.sessionId })
      .sort({ timestamp: -1 })
      .lean();

    // Fallback: recover untagged logs by session time range
    if (distractionLogs.length === 0 && report.sessionStartTime) {
      const sessionEnd = report.sessionEndTime || new Date();
      const untaggedLogs = await DistractionLog.find({
        userId: req.user._id,
        sessionId: null,
        timestamp: { $gte: new Date(report.sessionStartTime), $lte: new Date(sessionEnd) }
      }).sort({ timestamp: -1 }).lean();

      if (untaggedLogs.length > 0) {
        const logIds = untaggedLogs.map(l => l._id);
        await DistractionLog.updateMany(
          { _id: { $in: logIds } },
          { $set: { sessionId: req.params.sessionId } }
        );
        distractionLogs = untaggedLogs;
      }
    }

    return res.json({ success: true, data: { report, comments, distractionLogs } });
  } catch (error) {
    console.error('Get session report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

router.get('/goal/:goalId', [param('goalId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const reports = await SessionReport.find({ goalId: req.params.goalId, userId: req.user._id })
      .sort({ sessionStartTime: -1 })
      .lean();
    return res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get goal reports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch goal reports' });
  }
});

router.get('/user/:userId', [param('userId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    if (String(req.user._id) !== String(req.params.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const query = { userId: req.params.userId };
    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    const reports = await SessionReport.find(query)
      .sort({ sessionStartTime: -1 })
      .lean();
    return res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Get user reports error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch user reports' });
  }
});

router.get('/compare/:sessionId', [param('sessionId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const comparison = await getComparison(req.params.sessionId);
    return res.json({ success: true, data: comparison?.comparisonData || null });
  } catch (error) {
    console.error('Get comparison error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch comparison' });
  }
});

router.post('/comment', [
  body('sessionId').isMongoId(),
  body('text').isString().trim().isLength({ min: 2, max: 2000 })
], requireCoach, async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;
    const comment = await SessionComment.create({
      sessionId: req.body.sessionId,
      userId: req.user._id,
      text: req.body.text
    });

    const populated = await comment.populate('userId', 'profile.displayName role');
    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

module.exports = router;
