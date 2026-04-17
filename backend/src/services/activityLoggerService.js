const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');

const clampScore = value => Math.max(0, Math.min(100, Math.round(value)));

const calculateProductivityScore = (activeSeconds = 0, idleSeconds = 0) => {
  const total = activeSeconds + idleSeconds;
  if (total <= 0) return 0;
  return clampScore((activeSeconds / total) * 100);
};

const calculateEngagementScore = (counts = {}, activeSeconds = 0) => {
  if (activeSeconds <= 0) return 0;
  const interactions = (counts.mouseMoves || 0)
    + (counts.keyStrokes || 0)
    + (counts.clicks || 0)
    + (counts.scrolls || 0);
  const minutes = Math.max(1, activeSeconds / 60);
  const ratePerMinute = interactions / minutes;
  return clampScore(ratePerMinute * 2);
};

const recordActivity = async (activityData = {}) => {
  if (!activityData.userId || !activityData.sessionId) {
    return null;
  }

  const activeSeconds = activityData.activeSeconds || 0;
  const idleSeconds = activityData.idleSeconds || 0;
  const counts = {
    mouseMoves: activityData.mouseMoves || 0,
    keyStrokes: activityData.keyStrokes || 0,
    clicks: activityData.clicks || 0,
    scrolls: activityData.scrolls || 0
  };

  const focusPercent = activeSeconds + idleSeconds > 0
    ? Math.round((activeSeconds / (activeSeconds + idleSeconds)) * 100)
    : 0;

  const engagementScore = activityData.engagementScore
    ?? calculateEngagementScore(counts, activeSeconds);
  const productivityScore = activityData.productivityScore
    ?? calculateProductivityScore(activeSeconds, idleSeconds);

  const log = await ActivityLog.create({
    userId: activityData.userId,
    sessionId: activityData.sessionId,
    goalId: activityData.goalId || null,
    sessionSource: activityData.sessionSource || 'timer',
    eventType: activityData.eventType || 'session_update',
    timestamp: activityData.timestamp || new Date(),
    activeSeconds,
    idleSeconds,
    mouseMoves: counts.mouseMoves,
    keyStrokes: counts.keyStrokes,
    clicks: counts.clicks,
    scrolls: counts.scrolls,
    focusPercent,
    engagementScore,
    productivityScore,
    isIdle: Boolean(activityData.isIdle),
    timeline: activityData.timeline || [],
    details: activityData.details || {}
  });

  return log.toObject();
};

const getSessionSummary = async ({ userId, sessionId }) => {
  const logs = await ActivityLog.find({ userId, sessionId })
    .sort({ timestamp: 1 })
    .lean();

  if (!logs.length) {
    return null;
  }

  const latest = logs[logs.length - 1];
  const activeSeconds = latest.activeSeconds || 0;
  const idleSeconds = latest.idleSeconds || 0;
  const focusPercent = activeSeconds + idleSeconds > 0
    ? Math.round((activeSeconds / (activeSeconds + idleSeconds)) * 100)
    : 0;

  const summary = {
    sessionId,
    goalId: latest.goalId || null,
    sessionSource: latest.sessionSource || 'timer',
    startTime: logs[0].timestamp,
    endTime: latest.timestamp,
    activeSeconds,
    idleSeconds,
    focusPercent,
    engagementScore: latest.engagementScore || calculateEngagementScore({}, activeSeconds),
    productivityScore: latest.productivityScore || calculateProductivityScore(activeSeconds, idleSeconds)
  };

  const timeline = latest.timeline && latest.timeline.length > 0
    ? latest.timeline
    : [];

  return { summary, timeline, logs };
};

const listSessions = async ({ userId, goalId = null, limit = 10, sessionSource = null, sessionType = null }) => {
  const matchUserId = mongoose.Types.ObjectId.createFromHexString(String(userId));
  const matchStage = { userId: matchUserId };
  if (goalId && mongoose.Types.ObjectId.isValid(goalId)) {
    matchStage.goalId = mongoose.Types.ObjectId.createFromHexString(String(goalId));
  }
  if (sessionSource) {
    matchStage.sessionSource = sessionSource;
  }
  if (sessionType) {
    matchStage['details.sessionType'] = sessionType;
  }

  const summaries = await ActivityLog.aggregate([
    { $match: matchStage },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: '$sessionId',
        startTime: { $first: '$timestamp' },
        endTime: { $last: '$timestamp' },
        sessionSource: { $last: '$sessionSource' },
        goalId: { $last: '$goalId' },
        activeSeconds: { $max: '$activeSeconds' },
        idleSeconds: { $max: '$idleSeconds' },
        engagementScore: { $max: '$engagementScore' },
        productivityScore: { $max: '$productivityScore' }
      }
    },
    { $sort: { endTime: -1 } },
    { $limit: limit }
  ]);

  return summaries.map(summary => {
    const activeSeconds = summary.activeSeconds || 0;
    const idleSeconds = summary.idleSeconds || 0;

    return {
      sessionId: summary._id,
      goalId: summary.goalId || null,
      sessionSource: summary.sessionSource || 'timer',
      startTime: summary.startTime,
      endTime: summary.endTime,
      activeSeconds,
      idleSeconds,
      focusPercent: activeSeconds + idleSeconds > 0
        ? Math.round((activeSeconds / (activeSeconds + idleSeconds)) * 100)
        : 0,
      engagementScore: summary.engagementScore || calculateEngagementScore({}, activeSeconds),
      productivityScore: summary.productivityScore || calculateProductivityScore(activeSeconds, idleSeconds)
    };
  });
};

module.exports = {
  recordActivity,
  getSessionSummary,
  listSessions,
  calculateProductivityScore,
  calculateEngagementScore
};
