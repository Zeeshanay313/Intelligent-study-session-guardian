const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Guardian = require('../models/Guardian');
const DeviceAccess = require('../models/DeviceAccess');
const { authenticate, requireSelfOrAdmin } = require('../middleware/auth');
const {
  validateProfileUpdate,
  validatePrivacyUpdate,
  validateGuardianInvite,
  validateObjectId,
  validatePagination,
  validateDateRange
} = require('../middleware/validation');
const { sensitiveLimiter, uploadLimiter, exportLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${req.user._id}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens -verificationToken -resetPasswordToken')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.patch('/me/profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    console.log('Profile update request body:', JSON.stringify(req.body, null, 2));
    const updates = {};
    const {
      displayName, timezone, preferences, notifications, phoneNumber, dateOfBirth, studyLevel, institution, bio
    } = req.body;

    if (displayName !== undefined) {
      updates['profile.displayName'] = displayName;
    }

    if (timezone !== undefined) {
      updates['profile.timezone'] = timezone;
    }

    if (phoneNumber !== undefined) {
      updates['profile.phoneNumber'] = phoneNumber;
    }

    if (dateOfBirth !== undefined) {
      updates['profile.dateOfBirth'] = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (studyLevel !== undefined) {
      updates['profile.studyLevel'] = studyLevel;
    }

    if (institution !== undefined) {
      updates['profile.institution'] = institution;
    }

    if (bio !== undefined) {
      updates['profile.bio'] = bio;
    }

    if (preferences) {
      if (preferences.theme !== undefined) {
        updates['profile.preferences.theme'] = preferences.theme;
      }
      if (preferences.fontSize !== undefined) {
        updates['profile.preferences.fontSize'] = preferences.fontSize;
      }
      if (preferences.language !== undefined) {
        updates['profile.preferences.language'] = preferences.language;
      }
    }

    if (notifications) {
      if (notifications.study_reminders !== undefined) {
        updates['privacy.notifications.studyReminders'] = notifications.study_reminders;
      }
      if (notifications.goal_updates !== undefined) {
        updates['privacy.notifications.goalUpdates'] = notifications.goal_updates;
      }
      if (notifications.achievement_alerts !== undefined) {
        updates['privacy.notifications.achievementAlerts'] = notifications.achievement_alerts;
      }
      if (notifications.break_reminders !== undefined) {
        updates['privacy.notifications.breakReminders'] = notifications.break_reminders;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    // Log profile update
    await AuditLog.logPrivacyAction(
      req.user._id,
      'PROFILE_UPDATED',
      { updatedFields: Object.keys(updates) },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    console.error('Error stack:', error.stack);
    console.error('Updates object:', updates);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// Update privacy settings
router.patch('/me/privacy', authenticate, validatePrivacyUpdate, async (req, res) => {
  try {
    const updates = {};
    const {
      cameraConsent, guardianSharing, shareFields, notifications
    } = req.body;

    if (cameraConsent !== undefined) {
      updates['privacy.cameraConsent'] = cameraConsent;
    }

    if (guardianSharing !== undefined) {
      updates['privacy.guardianSharing'] = guardianSharing;
    }

    if (shareFields !== undefined) {
      updates['privacy.shareFields'] = shareFields;
    }

    if (notifications) {
      Object.keys(notifications).forEach(key => {
        if (notifications[key] !== undefined) {
          updates[`privacy.notifications.${key}`] = notifications[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    // Log privacy changes with high impact
    await AuditLog.logPrivacyAction(
      req.user._id,
      'PRIVACY_UPDATED',
      {
        updatedFields: Object.keys(updates),
        cameraConsentChanged: cameraConsent !== undefined,
        guardianSharingChanged: guardianSharing !== undefined
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Special logging for camera consent changes
    if (cameraConsent !== undefined) {
      await AuditLog.logPrivacyAction(
        req.user._id,
        'CAMERA_CONSENT_CHANGED',
        {
          newValue: cameraConsent,
          previousValue: req.user.privacy.cameraConsent
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    // Special logging for guardian sharing changes
    if (guardianSharing !== undefined) {
      await AuditLog.logPrivacyAction(
        req.user._id,
        'GUARDIAN_SHARING_CHANGED',
        {
          newValue: guardianSharing,
          previousValue: req.user.privacy.guardianSharing
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    res.json({
      message: 'Privacy settings updated successfully',
      privacy: user.privacy
    });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Upload avatar
router.post('/me/avatar', authenticate, uploadLimiter, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Delete old avatar if exists
    if (req.user.profile.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(req.user.profile.avatar));
      await fs.remove(oldAvatarPath).catch(() => {}); // Ignore deletion errors
    }

    // Update user with new avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.avatar': avatarUrl },
      { new: true }
    ).select('-password -refreshTokens');

    // Log avatar update
    await AuditLog.logPrivacyAction(
      req.user._id,
      'AVATAR_UPDATED',
      { filename: req.file.filename },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    // Clean up uploaded file on error
    if (req.file) {
      await fs.remove(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Update privacy settings
router.patch('/me/privacy', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const privacyUpdates = req.body;

    // Validate privacy settings structure
    const allowedFields = [
      'cameraConsent',
      'guardianSharing',
      'shareFields',
      'notifications'
    ];

    const updateData = {};
    Object.keys(privacyUpdates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[`privacy.${key}`] = privacyUpdates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid privacy fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log privacy changes
    await AuditLog.logPrivacyAction(
      userId,
      'PRIVACY_SETTINGS_UPDATED',
      {
        updatedFields: Object.keys(privacyUpdates),
        changes: privacyUpdates
      }
    );

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Export user data
router.post('/me/export', authenticate, exportLimiter, async (req, res) => {
  try {
    const userId = req.user._id;

    // Gather all user data
    const user = await User.findById(userId).select('-password -refreshTokens').lean();
    const auditLogs = await AuditLog.find({ userId }).lean();
    const devices = await DeviceAccess.find({ userId }).lean();
    const guardians = await Guardian.find({ userId }).lean();

    // Create export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        dataVersion: '1.0'
      },
      profile: user.profile,
      privacy: user.privacy,
      account: {
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      },
      auditLogs: auditLogs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
        privacyImpact: log.privacyImpact
      })),
      devices: devices.map(device => ({
        deviceId: device.deviceId,
        deviceInfo: device.deviceInfo,
        lastSeen: device.lastSeen,
        accessEnabled: device.accessEnabled,
        permissions: device.permissions
      })),
      guardians: guardians.map(guardian => ({
        guardianEmail: guardian.guardianEmail,
        relationship: guardian.relationship,
        consentStatus: guardian.consentStatus,
        shareFields: guardian.shareFields,
        invitedAt: guardian.invitedAt
      }))
    };

    // Create temporary file
    const filename = `user-data-export-${userId}-${Date.now()}.json`;
    const tempDir = path.join(__dirname, '../../temp');
    await fs.ensureDir(tempDir);
    const filePath = path.join(tempDir, filename);

    await fs.writeJson(filePath, exportData, { spaces: 2 });

    // Log data export
    await AuditLog.logPrivacyAction(
      userId,
      'DATA_EXPORTED',
      { filename, dataCategories: ['profile', 'privacy', 'audit', 'devices', 'guardians'] },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Send file and clean up
    res.download(filePath, filename, err => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up temp file
      fs.remove(filePath).catch(console.error);
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Soft delete user account
router.delete('/me', authenticate, sensitiveLimiter, async (req, res) => {
  try {
    const { confirmDelete, immediateDelete } = req.body;

    if (!confirmDelete || confirmDelete !== 'DELETE') {
      return res.status(400).json({
        error: 'Please type "DELETE" to confirm account deletion'
      });
    }

    const { user } = req;

    if (immediateDelete && process.env.ALLOW_IMMEDIATE_DELETE === 'true') {
      // Hard delete immediately (only if allowed)
      await User.findByIdAndDelete(user._id);
      await AuditLog.deleteMany({ userId: user._id });
      await DeviceAccess.deleteMany({ userId: user._id });
      await Guardian.deleteMany({ userId: user._id });

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        message: 'Account permanently deleted',
        deletionType: 'immediate'
      });
    } else {
      // Soft delete with retention period
      await user.softDelete();

      // Log account deletion
      await AuditLog.logPrivacyAction(
        user._id,
        'ACCOUNT_DELETED',
        {
          deletionType: 'soft',
          retentionDays: process.env.USER_RETENTION_DAYS || 30
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({
        message: `Account scheduled for deletion. You have ${process.env.USER_RETENTION_DAYS || 30} days to restore it.`,
        deletionType: 'soft',
        retentionDays: parseInt(process.env.USER_RETENTION_DAYS) || 30,
        canRestore: true
      });
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Restore soft-deleted account
router.post('/me/restore', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and restoration token required' });
    }

    // Find soft-deleted user
    const user = await User.findOne({
      email,
      deleted: true,
      deletedAt: { $exists: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'No deleted account found' });
    }

    // Check if restoration period has expired
    const retentionDays = parseInt(process.env.USER_RETENTION_DAYS) || 30;
    const expirationDate = new Date(user.deletedAt);
    expirationDate.setDate(expirationDate.getDate() + retentionDays);

    if (new Date() > expirationDate) {
      return res.status(410).json({ error: 'Restoration period has expired' });
    }

    // Restore account
    await user.restore();

    // Log account restoration
    await AuditLog.logPrivacyAction(
      user._id,
      'ACCOUNT_RESTORED',
      { restoredAt: new Date() },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Account restored successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName
      }
    });
  } catch (error) {
    console.error('Account restoration error:', error);
    res.status(500).json({ error: 'Failed to restore account' });
  }
});

// Invite guardian
router.post('/me/guardian-invite', authenticate, sensitiveLimiter, validateGuardianInvite, async (req, res) => {
  try {
    const {
      guardianEmail, relationship, shareFields, accessLevel = 'view'
    } = req.body;

    // Check if user has guardian sharing enabled
    if (!req.user.privacy.guardianSharing) {
      return res.status(400).json({
        error: 'Guardian sharing must be enabled in privacy settings first'
      });
    }

    // Check if guardian already invited
    const existingGuardian = await Guardian.findOne({
      userId: req.user._id,
      guardianEmail
    });

    if (existingGuardian) {
      return res.status(400).json({ error: 'Guardian already invited' });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Create guardian record
    const guardian = new Guardian({
      userId: req.user._id,
      guardianEmail,
      relationship,
      shareFields,
      accessLevel,
      inviteToken,
      invitedBy: req.user._id
    });

    await guardian.save();

    // Log guardian invitation
    await AuditLog.logPrivacyAction(
      req.user._id,
      'GUARDIAN_INVITED',
      {
        guardianEmail,
        relationship,
        shareFields,
        accessLevel
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // TODO: Send invitation email
    // const inviteUrl = `${process.env.CLIENT_URL}/guardian/accept/${inviteToken}`;

    res.json({
      message: 'Guardian invitation sent successfully',
      guardian: {
        id: guardian._id,
        guardianEmail: guardian.guardianEmail,
        relationship: guardian.relationship,
        consentStatus: guardian.consentStatus,
        invitedAt: guardian.invitedAt
      }
    });
  } catch (error) {
    console.error('Guardian invite error:', error);
    res.status(500).json({ error: 'Failed to send guardian invitation' });
  }
});

// Get user audit logs
router.get('/:id/audit-logs', authenticate, requireSelfOrAdmin, validateObjectId('id'), validatePagination, validateDateRange, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 50,
      action,
      privacyOnly = false,
      startDate,
      endDate
    } = req.query;

    const auditLogs = await AuditLog.getUserAuditTrail(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      privacyOnly: privacyOnly === 'true',
      startDate,
      endDate
    });

    const total = await AuditLog.countDocuments({
      userId: id,
      ...(action && { action }),
      ...(privacyOnly && { privacyImpact: { $in: ['medium', 'high'] } }),
      ...(startDate || endDate ? {
        timestamp: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    });

    res.json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

module.exports = router;
