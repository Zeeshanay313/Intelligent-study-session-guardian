const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const DistractionSettings = require('../models/DistractionSettings');
const DistractionLog = require('../models/DistractionLog');
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

const normalizeSite = (value) => {
  if (!value) return null;
  let site = String(value).trim().toLowerCase();
  if (!site) return null;
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
  site = site.split('/')[0];
  return site || null;
};

const normalizeKeyword = (value) => {
  if (!value) return null;
  const keyword = String(value).trim().toLowerCase();
  return keyword || null;
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return (hours * 60) + minutes;
};

const isScheduleActive = (schedule = []) => {
  if (!Array.isArray(schedule) || schedule.length === 0) return false;
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();

  return schedule.some(entry => {
    if (!entry || entry.enabled === false) return false;
    if (Number(entry.dayOfWeek) !== day) return false;

    const startMinutes = parseTimeToMinutes(entry.startTime);
    const endMinutes = parseTimeToMinutes(entry.endTime);
    if (startMinutes === null || endMinutes === null) return false;

    if (endMinutes < startMinutes) {
      return minutes >= startMinutes || minutes <= endMinutes;
    }

    return minutes >= startMinutes && minutes <= endMinutes;
  });
};

const normalizeSchedule = (schedule = []) => {
  if (!Array.isArray(schedule)) return [];
  return schedule
    .map(entry => ({
      dayOfWeek: Number(entry.dayOfWeek),
      startTime: String(entry.startTime || '').trim(),
      endTime: String(entry.endTime || '').trim(),
      enabled: entry.enabled !== false
    }))
    .filter(entry =>
      Number.isInteger(entry.dayOfWeek)
      && entry.dayOfWeek >= 0
      && entry.dayOfWeek <= 6
      && entry.startTime
      && entry.endTime
    );
};

const getOrCreateSettings = async (userId) => {
  let settings = await DistractionSettings.findOne({ userId });
  if (!settings) {
    settings = await DistractionSettings.create({ userId });
  }
  return settings;
};

const buildSummary = (logs = []) => {
  const totalAttempts = logs.length;
  const blocked = logs.filter(log => log.action === 'blocked').length;
  const overrides = logs.filter(log => log.action === 'override').length;
  const siteCounts = new Map();

  logs.forEach(log => {
    const site = log.site || 'unknown';
    siteCounts.set(site, (siteCounts.get(site) || 0) + 1);
  });

  let mostDistractingSite = null;
  let maxCount = 0;
  siteCounts.forEach((count, site) => {
    if (count > maxCount) {
      maxCount = count;
      mostDistractingSite = site;
    }
  });

  const distractionScore = Math.min(100, Math.round((blocked * 10) + (overrides * 20)));

  return {
    totalAttempts,
    blocked,
    overrides,
    mostDistractingSite,
    distractionScore
  };
};

const settingsValidators = [
  body('blockedSites').optional().isArray(),
  body('blockedKeywords').optional().isArray(),
  body('strictnessLevel').optional().isIn(['soft', 'hard']),
  body('strictnessIntensity').optional().isIn(['low', 'medium', 'high']),
  body('schedule').optional().isArray(),
  body('enabled').optional().isBoolean()
];

router.get('/settings', async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.user._id);
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get distraction settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch distraction settings' });
  }
});

router.post('/settings', settingsValidators, async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const blockedSites = (req.body.blockedSites || [])
      .map(normalizeSite)
      .filter(Boolean);
    const blockedKeywords = (req.body.blockedKeywords || [])
      .map(normalizeKeyword)
      .filter(Boolean);
    const schedule = normalizeSchedule(req.body.schedule || []);

    const update = {
      blockedSites,
      blockedKeywords,
      schedule,
      strictnessLevel: req.body.strictnessLevel || 'soft',
      strictnessIntensity: req.body.strictnessIntensity || 'medium',
      enabled: req.body.enabled !== false
    };

    const settings = await DistractionSettings.findOneAndUpdate(
      { userId: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Update distraction settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update distraction settings' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const settings = await getOrCreateSettings(req.user._id);
    const scheduleActive = isScheduleActive(settings?.schedule || []);
    const sessionCutoff = new Date(Date.now() - (12 * 60 * 60 * 1000));
    const activeSession = await Session.findOne({
      userId: req.user._id,
      endTime: null,
      startTime: { $gte: sessionCutoff }
    }).select('_id startTime').lean();

    const sessionActive = Boolean(activeSession);
    const blockingActive = Boolean(settings?.enabled) && (scheduleActive || sessionActive);

    const recentLogs = await DistractionLog.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      data: {
        blockingActive,
        scheduleActive,
        sessionActive,
        blockedSites: settings?.blockedSites || [],
        blockedKeywords: settings?.blockedKeywords || [],
        strictnessLevel: settings?.strictnessLevel || 'soft',
        strictnessIntensity: settings?.strictnessIntensity || 'medium',
        recentLogs
      }
    });
  } catch (error) {
    console.error('Get distraction status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch distraction status' });
  }
});

router.post('/log', [
  body('site').isString().notEmpty(),
  body('action').isIn(['blocked', 'override']),
  body('sessionId').optional().isMongoId(),
  body('goalId').optional().isMongoId(),
  body('overrideType').optional().isIn(['soft', 'hard']),
  body('duration').optional().isInt({ min: 0 }),
  body('timestamp').optional().isISO8601(),
  body('source').optional().isString()
], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const normalizedSite = normalizeSite(req.body.site) || String(req.body.site).trim();

    const log = await DistractionLog.create({
      userId: req.user._id,
      sessionId: req.body.sessionId || null,
      goalId: req.body.goalId || null,
      site: normalizedSite,
      action: req.body.action,
      overrideType: req.body.overrideType || null,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
      duration: req.body.duration || 0,
      source: req.body.source || 'timer'
    });

    if (req.io) {
      req.io.to(`user:${req.user._id}`).emit('distraction:updated', {
        sessionId: req.body.sessionId || null,
        goalId: req.body.goalId || null,
        action: req.body.action,
        site: normalizedSite,
        timestamp: log.timestamp
      });
    }

    return res.json({ success: true, data: log });
  } catch (error) {
    console.error('Create distraction log error:', error);
    return res.status(500).json({ success: false, error: 'Failed to log distraction event' });
  }
});

router.get('/session/:sessionId', [param('sessionId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const sessionId = req.params.sessionId;
    let logs = await DistractionLog.find({
      userId: req.user._id,
      sessionId
    }).sort({ timestamp: -1 }).lean();

    // Fallback: if no logs found by sessionId, check for untagged logs within session time range
    if (logs.length === 0) {
      const session = await Session.findOne({ _id: sessionId, userId: req.user._id }).select('startTime endTime').lean();
      if (session?.startTime) {
        const sessionEnd = session.endTime ? new Date(session.endTime) : new Date();
        const untaggedLogs = await DistractionLog.find({
          userId: req.user._id,
          sessionId: null,
          timestamp: { $gte: new Date(session.startTime), $lte: sessionEnd }
        }).sort({ timestamp: -1 }).lean();

        if (untaggedLogs.length > 0) {
          // Tag orphaned logs with the sessionId for future queries
          const logIds = untaggedLogs.map(l => l._id);
          await DistractionLog.updateMany(
            { _id: { $in: logIds } },
            { $set: { sessionId } }
          );
          logs = untaggedLogs;
        }
      }
    }

    const summary = buildSummary(logs);

    return res.json({ success: true, data: { summary, logs } });
  } catch (error) {
    console.error('Get distraction session error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch distraction session data' });
  }
});

router.get('/goal/:goalId', [param('goalId').isMongoId()], async (req, res) => {
  try {
    if (!ensureValid(req, res)) return;

    const logs = await DistractionLog.find({
      userId: req.user._id,
      goalId: req.params.goalId
    }).sort({ timestamp: -1 }).lean();

    const summary = buildSummary(logs);

    return res.json({ success: true, data: { summary, logs } });
  } catch (error) {
    console.error('Get distraction goal error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch distraction goal data' });
  }
});

module.exports = router;
