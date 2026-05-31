const InsightSummary = require('../models/InsightSummary');
const GuardianAccess = require('../models/GuardianAccess');
const SecuritySettings = require('../models/SecuritySettings');
const PresenceSession = require('../models/PresenceSession');
const StudySession = require('../models/StudySession');
const SessionLog = require('../models/SessionLog');           // manual timer completions
const TimerSession = require('../modules/timer/Session');    // orchestrated timer sessions
const DistractionLog = require('../models/DistractionLog');
const UserRewards = require('../models/UserRewards');
const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// ─── Build Insight Data from DB ───────────────────────────────────────────────

const buildInsightData = async (userId, from, to) => {
  const now = new Date();
  const startDefault = new Date();
  startDefault.setDate(startDefault.getDate() - 30);

  const dateFrom = from ? new Date(from) : startDefault;
  const dateTo = to ? new Date(to) : now;
  const dateFilter = { $gte: dateFrom, $lte: dateTo };

  // ── Gather sessions from all three stores ──────────────────────────────────
  // 1. SessionLog — created by sessionsController (manual timer completions)
  const sessionLogs = await SessionLog.find({
    userId, startedAt: dateFilter
  }).lean();

  // 2. TimerSession — created by StudySessionOrchestrator (integrated sessions)
  const timerSessions = await TimerSession.find({
    userId,
    startTime: dateFilter,
    status: { $in: ['completed', 'stopped'] }
  }).lean();

  // 3. StudySession — externally created or seeded sessions
  const studySessions = await StudySession.find({
    userId,
    startTime: dateFilter,
    status: { $in: ['completed', 'active'] }
  }).lean();

  // Compute durations (all normalised to minutes)
  const toMin = (sec) => Math.round(sec / 60);
  const sessionLogMins = sessionLogs.map(s => toMin(s.durationSeconds || 0));
  const timerSessionMins = timerSessions.map(s => toMin(s.totalDurationSec || s.productiveSeconds || 0));
  const studySessionMins = studySessions.map(s => {
    const d = s.duration || (s.endTime && s.startTime
      ? Math.round((new Date(s.endTime) - new Date(s.startTime)) / 60000)
      : 0);
    return d;
  });

  const allMins = [...sessionLogMins, ...timerSessionMins, ...studySessionMins];
  const totalStudyMinutes = allMins.reduce((a, b) => a + b, 0);
  const totalSessions = allMins.length;
  const avgSessionMinutes = totalSessions > 0 ? Math.round(totalStudyMinutes / totalSessions) : 0;
  const longestSessionMinutes = allMins.length > 0 ? Math.max(...allMins) : 0;

  // Subject breakdown — timer + study sessions have a subject field;
  // SessionLog uses presetName as the label
  const subjectMap = {};
  const addSubj = (subj, mins) => {
    const key = (subj && subj !== 'Quick Session') ? subj : 'General';
    if (!subjectMap[key]) subjectMap[key] = { subject: key, minutes: 0, sessions: 0 };
    subjectMap[key].minutes += mins;
    subjectMap[key].sessions += 1;
  };
  timerSessions.forEach((s, i) => addSubj(s.subject, timerSessionMins[i]));
  studySessions.forEach((s, i) => addSubj(s.subject, studySessionMins[i]));
  sessionLogs.forEach((s, i) => addSubj(s.presetName, sessionLogMins[i]));
  const subjectBreakdown = Object.values(subjectMap).sort((a, b) => b.minutes - a.minutes);

  // Presence data
  const presenceSessions = await PresenceSession.find({
    userId, status: 'ended', startedAt: dateFilter
  }).lean();
  const avgPresencePercent = presenceSessions.length > 0
    ? Math.round(presenceSessions.reduce((s, p) => s + (p.presencePercent || 0), 0) / presenceSessions.length)
    : 0;
  const totalAbsenceWarnings = presenceSessions.reduce((s, p) => s + (p.absenceWarnings || 0), 0);

  // Interruptions from DistractionLog
  const totalInterruptions = await DistractionLog.countDocuments({
    userId,
    timestamp: dateFilter
  });

  // Goals
  const goals = await Goal.find({ userId }).lean();
  const goalsCompleted = goals.filter(g => g.status === 'completed').length;
  const goalsInProgress = goals.filter(g => g.status === 'active').length;

  // Points earned in the period from UserRewards
  let pointsEarned = 0;
  try {
    const rewards = await UserRewards.findOne({ userId }).lean();
    if (rewards && rewards.pointsHistory) {
      pointsEarned = rewards.pointsHistory
        .filter(h => {
          const d = new Date(h.date);
          return d >= dateFrom && d <= dateTo;
        })
        .reduce((sum, h) => sum + (h.amount > 0 ? h.amount : 0), 0);
    }
  } catch (_) { /* UserRewards may not exist yet */ }

  // ── Build a normalised list of recent sessions (newest first) ─────────────
  const normalisedSessions = [];
  sessionLogs.forEach((s, i) => normalisedSessions.push({
    id: String(s._id),
    date: s.startedAt || s.createdAt,
    subject: s.presetName || 'General',
    minutes: sessionLogMins[i],
    source: 'manual'
  }));
  timerSessions.forEach((s, i) => normalisedSessions.push({
    id: String(s._id),
    date: s.startTime,
    subject: s.subject || 'General',
    minutes: timerSessionMins[i],
    source: 'timer'
  }));
  studySessions.forEach((s, i) => normalisedSessions.push({
    id: String(s._id),
    date: s.startTime,
    subject: s.subject || 'General',
    minutes: studySessionMins[i],
    source: 'session'
  }));
  normalisedSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentSessions = normalisedSessions.slice(0, 10);

  // ── Daily timeline (per-day minutes across the date range) ────────────────
  const dayKey = (d) => new Date(d).toISOString().split('T')[0];
  const timelineMap = {};
  for (
    let d = new Date(dateFrom);
    d <= dateTo;
    d.setDate(d.getDate() + 1)
  ) {
    timelineMap[dayKey(d)] = 0;
  }
  normalisedSessions.forEach(s => {
    const k = dayKey(s.date);
    if (k in timelineMap) timelineMap[k] += s.minutes;
  });
  const timeline = Object.entries(timelineMap).map(([date, minutes]) => ({ date, minutes }));

  // ── Streak (consecutive days ending today with at least one session) ──────
  let streakDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    const hadSession = normalisedSessions.some(s => dayKey(s.date) === k);
    if (hadSession) streakDays++;
    else break;
  }

  // ── Weekly study (last 7 days) ────────────────────────────────────────────
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyMinutes = normalisedSessions
    .filter(s => new Date(s.date) >= weekAgo)
    .reduce((a, s) => a + s.minutes, 0);

  // ── Weekly goal progress (% across active goals) ──────────────────────────
  const activeGoals = goals.filter(g => g.status === 'active');
  let weeklyGoalProgress = 0;
  if (activeGoals.length > 0) {
    const sum = activeGoals.reduce((acc, g) => {
      const target = g.targetValue || g.target || 0;
      const current = g.currentValue || g.progress || 0;
      if (!target) return acc;
      return acc + Math.min(100, Math.round((current / target) * 100));
    }, 0);
    weeklyGoalProgress = Math.round(sum / activeGoals.length);
  }

  // ── Productivity score (presence-weighted minus interruption penalty) ─────
  // Score 0–100. Heuristic: presence% × focus factor.
  const focusFactor = totalSessions > 0
    ? Math.max(0, 1 - (totalInterruptions / (totalSessions * 5)))
    : 0;
  const productivityScore = Math.round(
    (avgPresencePercent || (totalSessions > 0 ? 80 : 0)) * focusFactor
  );

  // ── Alerts: behind-on-goal + low presence + heavy interruptions ───────────
  const alerts = [];
  activeGoals.forEach(g => {
    const target = g.targetValue || g.target || 0;
    const current = g.currentValue || g.progress || 0;
    if (target && current / target < 0.3 && g.deadline && new Date(g.deadline) < new Date(Date.now() + 7 * 86400000)) {
      alerts.push({
        type: 'goal_behind',
        severity: 'warning',
        message: `Falling behind on "${g.title || g.name}" — ${Math.round(current / target * 100)}% with deadline approaching.`
      });
    }
  });
  if (totalSessions > 0 && avgPresencePercent && avgPresencePercent < 50) {
    alerts.push({
      type: 'low_presence',
      severity: 'warning',
      message: `Average presence is ${avgPresencePercent}% — frequently away during study sessions.`
    });
  }
  if (totalInterruptions > totalSessions * 5 && totalSessions > 0) {
    alerts.push({
      type: 'heavy_distractions',
      severity: 'warning',
      message: `High distraction count: ${totalInterruptions} interruptions across ${totalSessions} sessions.`
    });
  }
  if (totalSessions === 0) {
    alerts.push({
      type: 'no_activity',
      severity: 'info',
      message: 'No study sessions recorded for the selected period.'
    });
  }

  return {
    totalStudyMinutes,
    totalSessions,
    avgSessionMinutes,
    longestSessionMinutes,
    avgPresencePercent,
    totalAbsenceWarnings,
    totalInterruptions,
    subjectBreakdown,
    goalsCompleted,
    goalsInProgress,
    pointsEarned,
    recentSessions,
    timeline,
    streakDays,
    weeklyMinutes,
    weeklyGoalProgress,
    productivityScore,
    alerts
  };
};

// ─── Apply consent filter to insight data ────────────────────────────────────

const filterByConsent = (data, allowedFields) => {
  const filtered = {
    // Always-safe meta fields (non-PII aggregates)
    alerts: data.alerts || [],
    streakDays: data.streakDays || 0,
    productivityScore: data.productivityScore || 0
  };
  if (allowedFields.studyHours) {
    filtered.totalStudyMinutes = data.totalStudyMinutes;
    filtered.totalSessions = data.totalSessions;
    filtered.avgSessionMinutes = data.avgSessionMinutes;
    filtered.totalInterruptions = data.totalInterruptions;
    filtered.weeklyMinutes = data.weeklyMinutes;
    filtered.timeline = data.timeline;
  }
  if (allowedFields.sessionDetails) {
    filtered.longestSessionMinutes = data.longestSessionMinutes;
    filtered.recentSessions = data.recentSessions;
  }
  if (allowedFields.presenceData) {
    filtered.avgPresencePercent = data.avgPresencePercent;
    filtered.totalAbsenceWarnings = data.totalAbsenceWarnings;
  }
  if (allowedFields.subjectBreakdown) {
    filtered.subjectBreakdown = data.subjectBreakdown;
  }
  if (allowedFields.goalProgress) {
    filtered.goalsCompleted = data.goalsCompleted;
    filtered.goalsInProgress = data.goalsInProgress;
    filtered.weeklyGoalProgress = data.weeklyGoalProgress;
  }
  if (allowedFields.rewardsData) {
    filtered.pointsEarned = data.pointsEarned;
  }
  return filtered;
};

// ─── Student Insights ─────────────────────────────────────────────────────────

const getStudentInsights = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.params.userId || req.user._id;

    // Students can only see their own data; admins can see anyone's
    if (userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = await buildInsightData(userId, from, to);
    const user = await User.findById(userId).select('profile.displayName email role').lean();

    res.json({ success: true, insights: data, user });
  } catch (err) {
    console.error('getStudentInsights error:', err);
    res.status(500).json({ error: 'Failed to load insights' });
  }
};

// ─── Guardian Insights ────────────────────────────────────────────────────────

const getGuardianInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    // Find active guardian access record
    const access = await GuardianAccess.findOne({
      studentId: userId,
      guardianEmail: req.user.email,
      status: 'active'
    });

    if (!access) {
      return res.status(403).json({ error: 'No active guardian access for this student' });
    }

    const rawData = await buildInsightData(userId, from, to);
    const filtered = filterByConsent(rawData, access.allowedFields);
    const student = await User.findById(userId).select('profile.displayName').lean();

    res.json({ success: true, insights: filtered, student, allowedFields: access.allowedFields });
  } catch (err) {
    console.error('getGuardianInsights error:', err);
    res.status(500).json({ error: 'Failed to load guardian insights' });
  }
};

// ─── Teacher Insights ─────────────────────────────────────────────────────────

const getTeacherInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const { from, to } = req.query;

    const access = await GuardianAccess.findOne({
      studentId: userId,
      guardianEmail: req.user.email,
      accessType: 'teacher',
      status: 'active'
    });

    if (!access) {
      return res.status(403).json({ error: 'No active teacher access for this student' });
    }

    const rawData = await buildInsightData(userId, from, to);
    const filtered = filterByConsent(rawData, access.allowedFields);
    const student = await User.findById(userId).select('profile.displayName profile.studyLevel').lean();

    res.json({ success: true, insights: filtered, student, allowedFields: access.allowedFields });
  } catch (err) {
    console.error('getTeacherInsights error:', err);
    res.status(500).json({ error: 'Failed to load teacher insights' });
  }
};

// ─── Summary ──────────────────────────────────────────────────────────────────

const getSummary = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    if (userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const data = await buildInsightData(userId, null, null);
    res.json({ success: true, summary: data });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
};

// ─── Guardian Access Management ───────────────────────────────────────────────

const shareAccess = async (req, res) => {
  try {
    const { guardianEmail, guardianName, accessType, allowedFields } = req.body;

    if (!guardianEmail) {
      return res.status(400).json({ error: 'guardianEmail is required' });
    }

    const existing = await GuardianAccess.findOne({
      studentId: req.user._id,
      guardianEmail: guardianEmail.toLowerCase()
    });

    if (existing && existing.status === 'active') {
      // Update allowed fields if already active
      existing.allowedFields = { ...existing.allowedFields, ...(allowedFields || {}) };
      await existing.save();
      return res.json({ success: true, access: existing, message: 'Access updated' });
    }

    const access = await GuardianAccess.findOneAndUpdate(
      { studentId: req.user._id, guardianEmail: guardianEmail.toLowerCase() },
      {
        studentId: req.user._id,
        guardianEmail: guardianEmail.toLowerCase(),
        guardianName: guardianName || '',
        accessType: accessType || 'guardian',
        status: 'active',
        activatedAt: new Date(),
        allowedFields: allowedFields || {}
      },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: req.user._id,
      action: 'GUARDIAN_INVITED',
      details: { guardianEmail, accessType },
      metadata: { ipAddress: req.ip },
      privacyImpact: 'medium',
      dataCategories: ['access']
    });

    res.status(201).json({ success: true, access });
  } catch (err) {
    console.error('shareAccess error:', err);
    res.status(500).json({ error: 'Failed to share access' });
  }
};

const revokeAccess = async (req, res) => {
  try {
    const { guardianEmail } = req.body;

    const access = await GuardianAccess.findOneAndUpdate(
      { studentId: req.user._id, guardianEmail: guardianEmail?.toLowerCase() },
      { $set: { status: 'revoked', revokedAt: new Date() } },
      { new: true }
    );

    if (!access) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'GUARDIAN_REMOVED',
      details: { guardianEmail },
      metadata: { ipAddress: req.ip },
      privacyImpact: 'medium',
      dataCategories: ['access']
    });

    res.json({ success: true, message: 'Access revoked' });
  } catch (err) {
    console.error('revokeAccess error:', err);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
};

const listAccess = async (req, res) => {
  try {
    const accesses = await GuardianAccess.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, accesses });
  } catch (err) {
    console.error('listAccess error:', err);
    res.status(500).json({ error: 'Failed to list access records' });
  }
};

// ─── Guardian: list students this user has access to ─────────────────────────
const listGuardianStudents = async (req, res) => {
  try {
    const accesses = await GuardianAccess.find({
      guardianEmail: req.user.email.toLowerCase(),
      status: 'active'
    })
      .populate('studentId', 'profile.displayName profile.avatar email')
      .sort({ createdAt: -1 })
      .lean();

    const students = accesses
      .filter(a => a.studentId)
      .map(a => ({
        accessId: a._id,
        studentId: a.studentId._id,
        displayName: a.studentId.profile?.displayName || a.studentId.email,
        email: a.studentId.email,
        avatar: a.studentId.profile?.avatar || null,
        accessType: a.accessType,
        allowedFields: a.allowedFields,
        canSendReminders: a.canSendReminders,
        activatedAt: a.activatedAt
      }));

    res.json({ success: true, students });
  } catch (err) {
    console.error('listGuardianStudents error:', err);
    res.status(500).json({ error: 'Failed to load guardian students' });
  }
};

// ─── Reminder Workflow ────────────────────────────────────────────────────────

const requestReminder = async (req, res) => {
  try {
    const { studentId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Reminder message is required' });
    }

    const access = await GuardianAccess.findOne({
      studentId,
      guardianEmail: req.user.email.toLowerCase(),
      status: 'active'
    });

    if (!access) {
      return res.status(403).json({ error: 'No active access for this student' });
    }

    access.pendingReminderRequests.push({ message: message.trim(), requestedAt: new Date() });
    await access.save();

    res.json({ success: true, message: 'Reminder request submitted for student approval' });
  } catch (err) {
    console.error('requestReminder error:', err);
    res.status(500).json({ error: 'Failed to request reminder' });
  }
};

const approveReminder = async (req, res) => {
  try {
    const { accessId, requestIndex } = req.body;

    const access = await GuardianAccess.findOne({
      _id: accessId,
      studentId: req.user._id
    });

    if (!access) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    if (access.pendingReminderRequests[requestIndex]) {
      access.pendingReminderRequests[requestIndex].approved = true;
      access.pendingReminderRequests[requestIndex].approvedAt = new Date();
      await access.save();
    }

    res.json({ success: true, message: 'Reminder approved' });
  } catch (err) {
    console.error('approveReminder error:', err);
    res.status(500).json({ error: 'Failed to approve reminder' });
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────

// Resolve who can read this userId's data and what fields they can see.
// Returns { allowed: true, allowedFields, role: 'self'|'admin'|'guardian'|'teacher' }
// or { allowed: false }.
const resolveAccess = async (req, userId) => {
  if (userId.toString() === req.user._id.toString()) {
    return { allowed: true, allowedFields: null, role: 'self' };
  }
  if (req.user.role === 'admin') {
    return { allowed: true, allowedFields: null, role: 'admin' };
  }
  const access = await GuardianAccess.findOne({
    studentId: userId,
    guardianEmail: req.user.email.toLowerCase(),
    status: 'active'
  }).lean();
  if (!access) return { allowed: false };
  return { allowed: true, allowedFields: access.allowedFields, role: access.accessType };
};

const exportCSV = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const access = await resolveAccess(req, userId);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { from, to } = req.query;
    const data = await buildInsightData(userId, from, to);
    const sessions = (access.role === 'self' || access.role === 'admin' || access.allowedFields?.sessionDetails)
      ? await StudySession.find({ userId }).sort({ createdAt: -1 }).limit(500).lean()
      : [];

    let csv = 'Date,Subject,Duration(min),Type\n';
    sessions.forEach(s => {
      csv += `${new Date(s.createdAt).toISOString().split('T')[0]},${s.subject || 'General'},${s.duration || 0},${s.type || 'study'}\n`;
    });
    csv += `\nSummary,,\nTotal Minutes,${data.totalStudyMinutes},\nTotal Sessions,${data.totalSessions},\nAvg Session,${data.avgSessionMinutes},\nProductivity Score,${data.productivityScore},\n`;

    await AuditLog.create({
      userId: req.user._id,
      action: 'DATA_EXPORTED',
      details: { format: 'csv', subjectUserId: String(userId), via: access.role },
      metadata: { ipAddress: req.ip },
      privacyImpact: 'medium'
    });

    res.setHeader('Content-Disposition', `attachment; filename="insights-${userId}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } catch (err) {
    console.error('exportCSV error:', err);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const access = await resolveAccess(req, userId);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const raw = await buildInsightData(userId, req.query.from, req.query.to);
    const data = access.allowedFields ? filterByConsent(raw, access.allowedFields) : raw;
    const user = await User.findById(userId).select('profile.displayName email').lean();

    await AuditLog.create({
      userId: req.user._id,
      action: 'DATA_EXPORTED',
      details: { format: 'pdf', subjectUserId: String(userId), via: access.role },
      metadata: { ipAddress: req.ip },
      privacyImpact: 'medium'
    });

    res.json({ success: true, pdfData: data, user });
  } catch (err) {
    console.error('exportPDF error:', err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
};

module.exports = {
  getStudentInsights, getGuardianInsights, getTeacherInsights,
  getSummary, shareAccess, revokeAccess, listAccess, listGuardianStudents,
  requestReminder, approveReminder, exportCSV, exportPDF
};
