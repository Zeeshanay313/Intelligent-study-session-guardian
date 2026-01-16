/**
 * Profile Routes - Merged Profile & Settings Management
 *
 * Unified API endpoints for user profile, privacy settings, and preferences
 * Replaces separate /users and /settings routes with /profile
 *
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { authenticate } = require('../middleware/auth');
const {
  validateProfileUpdate,
  validatePrivacyUpdate
} = require('../middleware/validation');
const { uploadLimiter, exportLimiter } = require('../middleware/rateLimiter');
const {
  getProfile,
  updateProfile,
  updatePrivacy,
  exportUserData,
  deleteAccount
} = require('../controllers/profileController');

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

// Apply authentication to all profile routes
router.use(authenticate);

/**
 * GET /api/profile/me
 * Get complete user profile including settings and privacy
 */
router.get('/me', getProfile);

/**
 * PATCH /api/profile/me
 * Update user profile information and settings
 */
router.patch('/me', validateProfileUpdate, updateProfile);

/**
 * PATCH /api/profile/privacy
 * Update privacy settings with enhanced consent tracking
 */
router.patch('/privacy', validatePrivacyUpdate, updatePrivacy);

/**
 * POST /api/profile/avatar
 * Upload user avatar image
 */
router.post('/avatar', uploadLimiter, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No avatar file provided'
      });
    }

    const User = require('../models/User');
    const AuditLog = require('../models/AuditLog');

    // Update user avatar path
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.avatar': avatarPath },
      { new: true }
    ).select('-password -refreshTokens');

    // Log avatar update
    await AuditLog.logPrivacyAction(
      req.user._id,
      'AVATAR_UPDATED',
      {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarPath,
        user: user.profile
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar'
    });
  }
});

/**
 * POST /api/profile/export
 * Export user data with job queuing for large exports
 */
router.post('/export', exportLimiter, exportUserData);

/**
 * DELETE /api/profile/me
 * Soft delete user account with confirmation
 */
router.delete('/me', deleteAccount);

/**
 * POST /api/profile/restore
 * Restore soft-deleted account
 */
router.post('/restore', async (req, res) => {
  try {
    const User = require('../models/User');
    const AuditLog = require('../models/AuditLog');

    const user = await User.findById(req.user._id);

    if (!user || !user.deleted) {
      return res.status(400).json({
        success: false,
        error: 'Account is not deleted or does not exist'
      });
    }

    // Check if within grace period (30 days)
    const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const deletedTime = user.deletedAt.getTime();
    const now = Date.now();

    if (now - deletedTime > gracePeriod) {
      return res.status(400).json({
        success: false,
        error: 'Account restoration period has expired'
      });
    }

    // Restore account
    await user.restore();

    await AuditLog.logPrivacyAction(
      req.user._id,
      'ACCOUNT_RESTORED',
      {
        restoredAfterDays: Math.floor((now - deletedTime) / (24 * 60 * 60 * 1000)),
        originalDeleteDate: user.deletedAt
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Account restored successfully'
    });
  } catch (error) {
    console.error('Account restoration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore account'
    });
  }
});

/**
 * GET /api/profile/audit-logs
 * Get user's audit logs with pagination
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const { page = 1, limit = 50, action } = req.query;

    const filter = { userId: req.user._id };
    if (action) {
      filter.action = action;
    }

    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit, 10),
      sort: { timestamp: -1 }
    };

    const logs = await AuditLog.find(filter, null, options).lean();
    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log._id,
          action: log.action,
          timestamp: log.timestamp,
          details: log.details,
          metadata: log.metadata
        })),
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit logs'
    });
  }
});

module.exports = router;
