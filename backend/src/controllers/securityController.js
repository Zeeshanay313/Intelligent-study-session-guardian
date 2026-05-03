const SecuritySettings = require('../models/SecuritySettings');
const ConsentRecord = require('../models/ConsentRecord');
const RetentionPolicy = require('../models/RetentionPolicy');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const StudySession = require('../models/StudySession');
const Goal = require('../models/Goal');

// ─── Security Settings ───────────────────────────────────────────────────────

const getSettings = async (req, res) => {
  try {
    let settings = await SecuritySettings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await SecuritySettings.create({ userId: req.user._id });
    }
    res.json({ success: true, settings });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Failed to load security settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const allowed = [
      'sessionTimeout', 'loginHistoryDays', 'trustedDevicesEnabled',
      'allowGuardianAccess', 'allowTeacherAccess', 'guardianEmail', 'teacherEmail',
      'sharedFields', 'alertOnNewDevice', 'alertOnDataExport', 'alertOnAccessChange'
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const settings = await SecuritySettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: req.user._id,
      action: 'PRIVACY_UPDATED',
      details: { changedFields: Object.keys(updates) },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      privacyImpact: 'medium'
    });

    res.json({ success: true, settings });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
};

// ─── Consent Management ───────────────────────────────────────────────────────

const grantConsent = async (req, res) => {
  try {
    const { consentType, granted, notes } = req.body;

    if (!consentType) {
      return res.status(400).json({ error: 'consentType is required' });
    }

    const update = {
      userId: req.user._id,
      consentType,
      granted: granted !== false,
      grantedAt: granted !== false ? new Date() : null,
      revokedAt: granted === false ? new Date() : null,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || '',
      notes: notes || ''
    };

    const record = await ConsentRecord.findOneAndUpdate(
      { userId: req.user._id, consentType },
      update,
      { new: true, upsert: true }
    );

    await AuditLog.create({
      userId: req.user._id,
      action: 'CAMERA_CONSENT_CHANGED',
      details: { consentType, granted: update.granted },
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      privacyImpact: 'high',
      dataCategories: ['consent']
    });

    res.json({ success: true, record });
  } catch (err) {
    console.error('grantConsent error:', err);
    res.status(500).json({ error: 'Failed to update consent' });
  }
};

const getConsents = async (req, res) => {
  try {
    const consents = await ConsentRecord.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, consents });
  } catch (err) {
    console.error('getConsents error:', err);
    res.status(500).json({ error: 'Failed to load consent records' });
  }
};

// ─── Audit Log ────────────────────────────────────────────────────────────────

const getAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, from, to } = req.query;
    const filter = { userId: req.user._id };
    if (action) filter.action = action;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('getAuditLog error:', err);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
};

const createAuditEntry = async (req, res) => {
  try {
    const { action, details, privacyImpact } = req.body;
    const entry = await AuditLog.create({
      userId: req.user._id,
      action: action || 'ADMIN_ACTION',
      details: details || {},
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      privacyImpact: privacyImpact || 'low'
    });
    res.json({ success: true, entry });
  } catch (err) {
    console.error('createAuditEntry error:', err);
    res.status(500).json({ error: 'Failed to create audit entry' });
  }
};

// ─── Data Export ──────────────────────────────────────────────────────────────

const exportUserData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password -refreshTokens');
    const goals = await Goal.find({ userId });
    const sessions = await StudySession.find({ userId }).limit(500);
    const consents = await ConsentRecord.find({ userId });
    const auditLogs = await AuditLog.find({ userId }).limit(1000);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user.toObject(),
      goals,
      sessions,
      consents,
      auditLogs: auditLogs.map(l => l.toObject())
    };

    await AuditLog.create({
      userId,
      action: 'DATA_EXPORTED',
      details: { format: 'json', recordCounts: { goals: goals.length, sessions: sessions.length } },
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      privacyImpact: 'medium',
      dataCategories: ['profile', 'preferences', 'consent']
    });

    res.setHeader('Content-Disposition', `attachment; filename="study-guardian-data-${userId}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err) {
    console.error('exportUserData error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
};

// ─── Permanent Delete ─────────────────────────────────────────────────────────

const permanentDelete = async (req, res) => {
  try {
    const { confirmEmail } = req.body;
    const user = await User.findById(req.user._id);

    if (!user || user.email !== confirmEmail) {
      return res.status(400).json({ error: 'Email confirmation does not match' });
    }

    // Log before deleting
    await AuditLog.create({
      userId: req.user._id,
      action: 'ACCOUNT_DELETED',
      details: { permanent: true, initiatedBy: 'user' },
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      privacyImpact: 'high',
      dataCategories: ['profile', 'preferences', 'consent', 'access']
    });

    // Delete all user data
    await Promise.all([
      Goal.deleteMany({ userId: req.user._id }),
      StudySession.deleteMany({ userId: req.user._id }),
      ConsentRecord.deleteMany({ userId: req.user._id }),
      SecuritySettings.deleteMany({ userId: req.user._id }),
      RetentionPolicy.deleteMany({ userId: req.user._id }),
      User.findByIdAndDelete(req.user._id)
    ]);

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (err) {
    console.error('permanentDelete error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// ─── Retention Policy ─────────────────────────────────────────────────────────

const getRetention = async (req, res) => {
  try {
    let policy = await RetentionPolicy.findOne({ userId: req.user._id });
    if (!policy) {
      policy = await RetentionPolicy.create({ userId: req.user._id });
    }
    res.json({ success: true, policy });
  } catch (err) {
    console.error('getRetention error:', err);
    res.status(500).json({ error: 'Failed to load retention policy' });
  }
};

const updateRetention = async (req, res) => {
  try {
    const allowed = [
      'sessionDataDays', 'activityLogDays', 'auditLogDays',
      'presenceDataDays', 'insightsDays', 'autoDeleteEnabled'
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.lastReviewedAt = new Date();

    const policy = await RetentionPolicy.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({ success: true, policy });
  } catch (err) {
    console.error('updateRetention error:', err);
    res.status(500).json({ error: 'Failed to update retention policy' });
  }
};

module.exports = {
  getSettings, updateSettings,
  grantConsent, getConsents,
  getAuditLog, createAuditEntry,
  exportUserData, permanentDelete,
  getRetention, updateRetention
};
