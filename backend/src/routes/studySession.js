const express = require('express');
const { body, validationResult } = require('express-validator');
const StudySessionOrchestrator = require('../services/StudySessionOrchestrator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize orchestrator with socket.io (will be set by main app)
let orchestrator = null;

// Set socket.io instance
const setSocketIO = io => {
  orchestrator = new StudySessionOrchestrator(io);
};

// Validation middleware for integrated session
const validateIntegratedSession = [
  body('subject').optional().isLength({ max: 200 }).trim(),
  body('workDuration').optional().isInt({ min: 1, max: 120 }),
  body('breakDuration').optional().isInt({ min: 1, max: 30 }),
  body('presetId').optional().isMongoId(),
  body('linkedGoalId').optional().isMongoId(),
  body('syncToCalendar').optional().isBoolean(),
  body('timezone').optional().isString()
];

// Start integrated study session
router.post('/start', validateIntegratedSession, async (req, res) => {
  try {
    // Add fake user for development
    req.user = { _id: '507f1f77bcf86cd799439011' };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    const sessionConfig = {
      subject: req.body.subject || 'Focus Session',
      workDuration: req.body.workDuration || 25,
      breakDuration: req.body.breakDuration || 5,
      presetId: req.body.presetId,
      linkedGoalId: req.body.linkedGoalId,
      syncToCalendar: req.body.syncToCalendar || false,
      timezone: req.body.timezone || 'UTC',
      customDurations: req.body.customDurations
    };

    const result = await orchestrator.startIntegratedSession(req.user._id, sessionConfig);
    res.json(result);
  } catch (error) {
    console.error('Error starting integrated session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start integrated study session'
    });
  }
});

// Pause active session
router.post('/pause', authenticate, async (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    const result = await orchestrator.pauseSession(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause session'
    });
  }
});

// Resume paused session
router.post('/resume', authenticate, async (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    const result = await orchestrator.resumeSession(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume session'
    });
  }
});

// Stop active session
router.post('/stop', authenticate, async (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    await orchestrator.completeSession(req.user._id, req.body.sessionId);
    res.json({ success: true, message: 'Session stopped successfully' });
  } catch (error) {
    console.error('Error stopping session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop session'
    });
  }
});

// Get current active session
router.get('/current', authenticate, async (req, res) => {
  try {
    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    const activeSession = orchestrator.getActiveSession(req.user._id);

    if (!activeSession) {
      return res.json({
        success: true,
        activeSession: null,
        message: 'No active session'
      });
    }

    res.json({
      success: true,
      activeSession: {
        sessionId: activeSession.sessionId,
        status: activeSession.status,
        config: activeSession.config,
        startTime: activeSession.startTime,
        pausedAt: activeSession.pausedAt
      }
    });
  } catch (error) {
    console.error('Error getting current session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get current session'
    });
  }
});

// Quick start with smart defaults
router.post('/quick-start', async (req, res) => {
  try {
    // Add fake user for development
    req.user = { _id: '507f1f77bcf86cd799439011' };

    if (!orchestrator) {
      return res.status(500).json({
        success: false,
        error: 'Study session orchestrator not initialized'
      });
    }

    const Goal = require('../models/Goal');
    const TimerPreset = require('../modules/timer/TimerPreset');

    // Get user's most recent active goal
    const activeGoal = await Goal.findOne({
      userId: req.user._id,
      isActive: true,
      endDate: { $gte: new Date() }
    }).sort({ lastProgressUpdate: -1 });

    // Get user's default timer preset or use system default
    const defaultPreset = await TimerPreset.findOne({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    const sessionConfig = {
      subject: activeGoal ? `Study: ${activeGoal.title}` : 'Quick Focus Session',
      workDuration: (defaultPreset?.workDuration || 1500) / 60, // Convert from seconds to minutes
      breakDuration: (defaultPreset?.breakDuration || 300) / 60,
      presetId: defaultPreset?._id,
      linkedGoalId: activeGoal?._id,
      syncToCalendar: true, // Auto-enable calendar sync for quick start
      timezone: req.user.profile?.timezone || 'UTC'
    };

    const result = await orchestrator.startIntegratedSession(req.user._id, sessionConfig);
    res.json({
      ...result,
      message: 'Quick study session started with smart defaults'
    });
  } catch (error) {
    console.error('Error starting quick session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start quick study session'
    });
  }
});

module.exports = {
  router,
  setSocketIO
};
