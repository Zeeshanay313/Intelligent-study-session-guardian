const Session = require('../modules/timer/Session');
const ActivityLog = require('../models/ActivityLog');
const DistractionLog = require('../models/DistractionLog');
const SessionReport = require('../models/SessionReport');
const SessionComparison = require('../models/SessionComparison');

const buildSummaryFromActivity = (activitySummary) => {
  if (!activitySummary) {
    return {
      activeTime: 0,
      idleTime: 0,
      productivityScore: 0
    };
  }

  return {
    activeTime: activitySummary.activeSeconds || 0,
    idleTime: activitySummary.idleSeconds || 0,
    productivityScore: activitySummary.productivityScore || 0
  };
};

const calculateFocusPercentage = (activeTime, totalDuration) => {
  if (!totalDuration || totalDuration <= 0) return 0;
  return Math.round((activeTime / totalDuration) * 100);
};

const countIdleSegments = (timeline = [], idleTime = 0) => {
  if (!timeline.length) {
    return idleTime > 0 ? 1 : 0;
  }
  return timeline.filter(segment => segment.status === 'idle').length;
};

const buildDistractionSummary = (logs = []) => {
  const totalAttempts = logs.length;
  const blocked = logs.filter(log => log.action === 'blocked').length;
  const overrides = logs.filter(log => log.action === 'override').length;
  const siteCounts = logs.reduce((acc, log) => {
    const site = log.site || 'unknown';
    acc[site] = (acc[site] || 0) + 1;
    return acc;
  }, {});

  const mostDistractingSite = Object.keys(siteCounts).reduce((top, site) => {
    if (!top) return site;
    return siteCounts[site] > siteCounts[top] ? site : top;
  }, null);

  const distractionScore = Math.min(100, Math.round((blocked * 10) + (overrides * 20)));

  return {
    totalAttempts,
    blocked,
    overrides,
    mostDistractingSite,
    distractionScore
  };
};

const compareMetric = (current, previous) => {
  const diff = current - previous;
  const direction = diff >= 0 ? 'improved' : 'declined';
  return {
    current,
    previous,
    diff: Math.round(diff * 100) / 100,
    direction,
    percentChange: previous > 0 ? Math.round((diff / previous) * 100) : null
  };
};

const getNestedValue = (report, key) => {
  if (!report) return 0;
  if (key.includes('.')) {
    return key.split('.').reduce((acc, part) => (acc ? acc[part] : 0), report) || 0;
  }
  return report[key] || 0;
};

const buildComparison = (currentReport, historyReports) => {
  if (!currentReport) return null;
  const sorted = [...historyReports].sort((a, b) => new Date(b.sessionStartTime) - new Date(a.sessionStartTime));
  const lastSession = sorted[0] || null;

  const rangeAverage = (reports, key) => {
    if (!reports.length) return 0;
    const total = reports.reduce((sum, report) => sum + getNestedValue(report, key), 0);
    return total / reports.length;
  };

  const last7 = historyReports.filter(report => {
    if (!report.sessionStartTime) return false;
    return new Date(report.sessionStartTime) >= new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
  });

  const last30 = historyReports.filter(report => {
    if (!report.sessionStartTime) return false;
    return new Date(report.sessionStartTime) >= new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  });

  return {
    lastSession: lastSession ? {
      focusPercentage: compareMetric(currentReport.focusPercentage, lastSession.focusPercentage || 0),
      productivityScore: compareMetric(currentReport.productivityScore, lastSession.productivityScore || 0),
      distractions: compareMetric(currentReport.distractionSummary?.totalAttempts || 0, lastSession.distractionSummary?.totalAttempts || 0)
    } : null,
    last7Days: {
      focusPercentage: compareMetric(currentReport.focusPercentage, rangeAverage(last7, 'focusPercentage')),
      productivityScore: compareMetric(currentReport.productivityScore, rangeAverage(last7, 'productivityScore')),
      distractions: compareMetric(currentReport.distractionSummary?.totalAttempts || 0, rangeAverage(last7, 'distractionSummary.totalAttempts'))
    },
    last30Days: {
      focusPercentage: compareMetric(currentReport.focusPercentage, rangeAverage(last30, 'focusPercentage')),
      productivityScore: compareMetric(currentReport.productivityScore, rangeAverage(last30, 'productivityScore')),
      distractions: compareMetric(currentReport.distractionSummary?.totalAttempts || 0, rangeAverage(last30, 'distractionSummary.totalAttempts'))
    }
  };
};

const generateSessionReport = async ({ sessionId, userId, force = false }) => {
  const existing = await SessionReport.findOne({ sessionId });
  if (existing && !force) {
    return existing;
  }

  console.log('Report generation started:', { sessionId: String(sessionId), userId: String(userId) });

  const session = await Session.findOne({ _id: sessionId, userId }).lean();
  const activitySummary = await ActivityLog.find({ userId, sessionId })
    .sort({ timestamp: 1 })
    .lean();

  // If neither session nor activity data exists, we can't generate a report
  if ((!session || !session.startTime) && (!activitySummary || activitySummary.length === 0)) {
    return null;
  }

  let activeTime = 0;
  let idleTime = 0;
  let productivityScore = 0;
  let timeline = [];
  let goalId = session?.goalId || null;
  let subject = session?.subject || null;

  if (activitySummary && activitySummary.length > 0) {
    const latestActivity = activitySummary[activitySummary.length - 1];
    timeline = latestActivity.timeline || [];
    goalId = goalId || latestActivity.goalId || null;
    subject = subject || latestActivity.details?.sessionSubject || null;
    const summary = buildSummaryFromActivity(latestActivity);
    activeTime = summary.activeTime;
    idleTime = summary.idleTime;
    productivityScore = summary.productivityScore;
  } else if (session) {
    // No activity logs — build minimal report from session data
    const totalSec = session.totalDurationSec ||
      (session.startTime && session.endTime
        ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)
        : 0);
    activeTime = session.productiveSeconds || totalSec;
    idleTime = Math.max(0, totalSec - activeTime);
    productivityScore = session.presencePercent || (totalSec > 0 ? Math.round((activeTime / totalSec) * 100) : 0);
  }

  const totalDuration = session?.totalDurationSec
    ? session.totalDurationSec
    : session?.startTime && session?.endTime
      ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)
      : activeTime + idleTime;

  const focusPercentage = calculateFocusPercentage(activeTime, totalDuration || 0);

  let distractionLogs = await DistractionLog.find({ userId, sessionId }).lean();

  // Fallback: if no logs found by sessionId, search by time range for untagged logs
  if ((!distractionLogs || distractionLogs.length === 0) && session?.startTime) {
    const sessionStart = new Date(session.startTime);
    const sessionEnd = session.endTime ? new Date(session.endTime) : new Date();
    const untaggedLogs = await DistractionLog.find({
      userId,
      sessionId: null,
      timestamp: { $gte: sessionStart, $lte: sessionEnd }
    }).lean();

    if (untaggedLogs.length > 0) {
      // Tag these orphaned logs with the sessionId for future queries
      const logIds = untaggedLogs.map(l => l._id);
      await DistractionLog.updateMany(
        { _id: { $in: logIds } },
        { $set: { sessionId } }
      );
      distractionLogs = untaggedLogs;
    }
  }

  const distractionSummary = buildDistractionSummary(distractionLogs || []);
  const idleInterruptions = countIdleSegments(timeline, idleTime);
  const interruptions = idleInterruptions + (distractionSummary.totalAttempts || 0);

  console.log('Report data fetched:', {
    totalDuration,
    activeTime,
    idleTime,
    focusPercentage,
    interruptions,
    distractionAttempts: distractionSummary.totalAttempts || 0
  });

  const latestActivity = activitySummary && activitySummary.length > 0
    ? activitySummary[activitySummary.length - 1]
    : null;

  const reportData = {
    userId,
    sessionId,
    goalId,
    subject,
    sessionStartTime: session?.startTime || latestActivity?.timestamp || new Date(),
    sessionEndTime: session?.endTime || latestActivity?.timestamp || new Date(),
    totalDuration,
    activeTime,
    idleTime,
    focusPercentage,
    interruptions,
    productivityScore,
    distractionSummary,
    activityTimeline: timeline
  };

  const report = await SessionReport.findOneAndUpdate(
    { sessionId },
    reportData,
    { new: true, upsert: true }
  );

  const historyReports = await SessionReport.find({
    userId,
    sessionId: { $ne: sessionId },
    sessionStartTime: { $ne: null }
  }).lean();

  const comparisonData = buildComparison(report, historyReports);
  if (comparisonData) {
    await SessionComparison.findOneAndUpdate(
      { sessionId },
      { sessionId, comparisonData },
      { new: true, upsert: true }
    );
  }

  return report;
};

const getComparison = async (sessionId) => {
  return SessionComparison.findOne({ sessionId }).lean();
};

module.exports = {
  generateSessionReport,
  getComparison
};
