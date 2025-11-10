const { validationResult } = require('express-validator');
const TimerPreset = require('./TimerPreset');
const Session = require('./Session');

// Get all timer presets for the authenticated user
const getPresets = async (req, res) => {
  try {
    const presets = await TimerPreset.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: presets });
  } catch (error) {
    console.error('Error fetching timer presets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timer presets' });
  }
};

// Create a new timer preset
const createPreset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name, workDuration, breakDuration, longBreakDuration, cyclesBeforeLongBreak
    } = req.body;

    const preset = new TimerPreset({
      userId: req.user._id,
      name,
      workDuration,
      breakDuration,
      longBreakDuration,
      cyclesBeforeLongBreak
    });

    await preset.save();
    res.status(201).json({ success: true, data: preset });
  } catch (error) {
    console.error('Error creating timer preset:', error);
    res.status(500).json({ success: false, error: 'Failed to create timer preset' });
  }
};

// Update timer preset
const updatePreset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const preset = await TimerPreset.findOne({ _id: req.params.id, userId: req.user._id });
    if (!preset) {
      return res.status(404).json({ success: false, error: 'Timer preset not found' });
    }

    const {
      name, workDuration, breakDuration, longBreakDuration, cyclesBeforeLongBreak
    } = req.body;

    preset.name = name;
    preset.workDuration = workDuration;
    preset.breakDuration = breakDuration;
    preset.longBreakDuration = longBreakDuration;
    preset.cyclesBeforeLongBreak = cyclesBeforeLongBreak;

    await preset.save();
    res.json({ success: true, data: preset });
  } catch (error) {
    console.error('Error updating timer preset:', error);
    res.status(500).json({ success: false, error: 'Failed to update timer preset' });
  }
};

// Delete timer preset
const deletePreset = async (req, res) => {
  try {
    const preset = await TimerPreset.findOne({ _id: req.params.id, userId: req.user._id });
    if (!preset) {
      return res.status(404).json({ success: false, error: 'Timer preset not found' });
    }

    await preset.deleteOne();
    res.json({ success: true, message: 'Timer preset deleted successfully' });
  } catch (error) {
    console.error('Error deleting timer preset:', error);
    res.status(500).json({ success: false, error: 'Failed to delete timer preset' });
  }
};

// Start a timer session
const startSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { presetId, customDurations } = req.body;

    // If using a preset, verify ownership
    if (presetId) {
      const preset = await TimerPreset.findOne({ _id: presetId, userId: req.user._id });
      if (!preset) {
        return res.status(404).json({ success: false, error: 'Timer preset not found' });
      }
    }

    const session = new Session({
      userId: req.user._id,
      presetId: presetId || null,
      startTime: new Date()
    });

    await session.save();

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.to(`user_${req.user._id}`).emit('timer:started', { sessionId: session._id });
    }

    res.status(201).json({ success: true, data: { sessionId: session._id } });
  } catch (error) {
    console.error('Error starting timer session:', error);
    res.status(500).json({ success: false, error: 'Failed to start timer session' });
  }
};

// Pause a timer session
const pauseSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.endTime) {
      return res.status(400).json({ success: false, error: 'Session already ended' });
    }

    // Add interruption record
    session.interruptions.push({ time: new Date(), type: 'pause' });
    await session.save();

    // Emit socket event
    if (req.io) {
      req.io.to(`user_${req.user._id}`).emit('timer:paused', { sessionId: session._id });
    }

    res.json({ success: true, message: 'Session paused' });
  } catch (error) {
    console.error('Error pausing timer session:', error);
    res.status(500).json({ success: false, error: 'Failed to pause timer session' });
  }
};

// Stop and finalize a timer session
const stopSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.sessionId, userId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.endTime) {
      return res.status(400).json({ success: false, error: 'Session already ended' });
    }

    const endTime = new Date();
    session.endTime = endTime;
    session.totalDurationSec = Math.floor((endTime - session.startTime) / 1000);

    // TODO: Integrate with activity logger to compute productiveSeconds and presencePercent
    // This would call the existing activity logger API to get session data
    try {
      // Placeholder for activity logger integration
      // const activityData = await getActivityData(session._id);
      // session.productiveSeconds = activityData.productiveSeconds;
      // session.presencePercent = activityData.presencePercent;

      // For now, use placeholder values
      session.productiveSeconds = Math.floor(session.totalDurationSec * 0.8); // 80% productive
      session.presencePercent = 85;
    } catch (activityError) {
      console.error('Error fetching activity data:', activityError);
      // Continue with default values
    }

    await session.save();

    // Emit socket event
    if (req.io) {
      req.io.to(`user_${req.user._id}`).emit('timer:stopped', {
        sessionId: session._id,
        summary: {
          totalDuration: session.totalDurationSec,
          productiveSeconds: session.productiveSeconds,
          presencePercent: session.presencePercent
        }
      });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error stopping timer session:', error);
    res.status(500).json({ success: false, error: 'Failed to stop timer session' });
  }
};

// Get session history
const getSessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({ userId: req.user._id })
      .populate('presetId', 'name')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Session.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session history' });
  }
};

module.exports = {
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  startSession,
  pauseSession,
  stopSession,
  getSessionHistory
};
