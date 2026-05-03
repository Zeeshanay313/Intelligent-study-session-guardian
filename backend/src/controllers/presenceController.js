const PresenceSession = require('../models/PresenceSession');
const PresenceEvent = require('../models/PresenceEvent');
const CameraAudit = require('../models/CameraAudit');
const User = require('../models/User');

// ─── Start Presence Session ───────────────────────────────────────────────────

const startPresence = async (req, res) => {
  try {
    const { timerSessionId, goalId, cameraEnabled } = req.body;

    // Check camera consent if camera is requested
    if (cameraEnabled) {
      const user = await User.findById(req.user._id);
      if (!user.privacy?.cameraConsent) {
        return res.status(403).json({
          error: 'Camera consent not granted. Please enable camera consent in privacy settings.'
        });
      }
    }

    // End any existing active session for this user
    await PresenceSession.updateMany(
      { userId: req.user._id, status: 'active' },
      { $set: { status: 'ended', endedAt: new Date() } }
    );

    const session = await PresenceSession.create({
      userId: req.user._id,
      timerSessionId: timerSessionId || null,
      goalId: goalId || null,
      cameraEnabled: cameraEnabled || false,
      startedAt: new Date(),
      status: 'active'
    });

    await PresenceEvent.create({
      presenceSessionId: session._id,
      userId: req.user._id,
      eventType: 'session_start',
      detectionMethod: 'system'
    });

    if (cameraEnabled) {
      await CameraAudit.create({
        userId: req.user._id,
        presenceSessionId: session._id,
        action: 'camera_enabled',
        imageDataStored: false,
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' }
      });
    }

    res.status(201).json({ success: true, session });
  } catch (err) {
    console.error('startPresence error:', err);
    res.status(500).json({ error: 'Failed to start presence session' });
  }
};

// ─── Record Presence Event ────────────────────────────────────────────────────

const recordEvent = async (req, res) => {
  try {
    const { presenceSessionId, eventType, confidenceScore, detectionMethod } = req.body;

    if (!presenceSessionId || !eventType) {
      return res.status(400).json({ error: 'presenceSessionId and eventType are required' });
    }

    const session = await PresenceSession.findOne({
      _id: presenceSessionId,
      userId: req.user._id,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({ error: 'Active presence session not found' });
    }

    const event = await PresenceEvent.create({
      presenceSessionId,
      userId: req.user._id,
      eventType,
      detectionMethod: detectionMethod || 'camera_metadata',
      confidenceScore: confidenceScore || null
    });

    // Update session counters
    const updates = { $inc: { totalChecks: 1 } };
    if (eventType === 'presence_detected') updates.$inc.presentCount = 1;
    if (eventType === 'absence_warning') updates.$inc.absenceWarnings = 1;
    if (eventType === 'fatigue_alert') updates.$inc.fatigueAlerts = 1;

    await PresenceSession.updateOne({ _id: presenceSessionId }, updates);

    res.json({ success: true, event });
  } catch (err) {
    console.error('recordEvent error:', err);
    res.status(500).json({ error: 'Failed to record presence event' });
  }
};

// ─── Manual Check-In ─────────────────────────────────────────────────────────

const manualCheckin = async (req, res) => {
  try {
    const { presenceSessionId } = req.body;

    // Find active session - use provided or latest active
    const query = { userId: req.user._id, status: 'active' };
    if (presenceSessionId) query._id = presenceSessionId;

    const session = await PresenceSession.findOne(query);
    if (!session) {
      return res.status(404).json({ error: 'No active presence session found' });
    }

    const event = await PresenceEvent.create({
      presenceSessionId: session._id,
      userId: req.user._id,
      eventType: 'manual_checkin',
      detectionMethod: 'manual',
      confidenceScore: 100
    });

    await PresenceSession.updateOne(
      { _id: session._id },
      { $inc: { manualCheckIns: 1, totalChecks: 1, presentCount: 1 } }
    );

    res.json({ success: true, event, message: 'Check-in recorded!' });
  } catch (err) {
    console.error('manualCheckin error:', err);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
};

// ─── End Presence Session ─────────────────────────────────────────────────────

const endPresence = async (req, res) => {
  try {
    const { presenceSessionId } = req.body;

    const query = { userId: req.user._id, status: 'active' };
    if (presenceSessionId) query._id = presenceSessionId;

    const session = await PresenceSession.findOne(query);
    if (!session) {
      return res.status(404).json({ error: 'No active presence session found' });
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt - session.startedAt) / 1000);
    const presencePercent = session.totalChecks > 0
      ? Math.round((session.presentCount / session.totalChecks) * 100)
      : 0;

    const updated = await PresenceSession.findByIdAndUpdate(
      session._id,
      {
        $set: {
          status: 'ended',
          endedAt,
          durationSeconds,
          presencePercent
        }
      },
      { new: true }
    );

    await PresenceEvent.create({
      presenceSessionId: session._id,
      userId: req.user._id,
      eventType: 'session_end',
      detectionMethod: 'system'
    });

    if (session.cameraEnabled) {
      await CameraAudit.create({
        userId: req.user._id,
        presenceSessionId: session._id,
        action: 'camera_disabled',
        imageDataStored: false,
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] || '' }
      });
    }

    res.json({ success: true, session: updated });
  } catch (err) {
    console.error('endPresence error:', err);
    res.status(500).json({ error: 'Failed to end presence session' });
  }
};

// ─── Get Session Details ──────────────────────────────────────────────────────

const getSessionById = async (req, res) => {
  try {
    const session = await PresenceSession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const events = await PresenceEvent.find({ presenceSessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, session, events });
  } catch (err) {
    console.error('getSessionById error:', err);
    res.status(500).json({ error: 'Failed to load session' });
  }
};

// ─── Get Active Session ───────────────────────────────────────────────────────

const getActiveSession = async (req, res) => {
  try {
    const session = await PresenceSession.findOne({
      userId: req.user._id,
      status: 'active'
    });
    res.json({ success: true, session });
  } catch (err) {
    console.error('getActiveSession error:', err);
    res.status(500).json({ error: 'Failed to load active session' });
  }
};

// ─── Get History ──────────────────────────────────────────────────────────────

const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await PresenceSession.countDocuments({ userId: req.user._id });
    const sessions = await PresenceSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, sessions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: 'Failed to load history' });
  }
};

// ─── Camera Audit Log ─────────────────────────────────────────────────────────

const getCameraAudit = async (req, res) => {
  try {
    const audits = await CameraAudit.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, audits });
  } catch (err) {
    console.error('getCameraAudit error:', err);
    res.status(500).json({ error: 'Failed to load camera audit' });
  }
};

module.exports = {
  startPresence, recordEvent, manualCheckin,
  endPresence, getSessionById, getActiveSession,
  getHistory, getCameraAudit
};
