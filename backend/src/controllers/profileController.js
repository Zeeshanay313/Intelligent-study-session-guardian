/**
 * Profile Controller - Merged Profile & Settings Management
 *
 * Combines user profile, privacy settings, and preferences into a unified API
 * Replaces separate /users and /settings endpoints with /profile
 *
 * @author Intelligent Study Session Guardian Team
 */

const User = require('../models/User');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

/**
 * Get complete user profile including settings and privacy
 * GET /api/profile/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshTokens -verificationToken -resetPasswordToken')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create user settings
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
      await settings.save();
    }

    // Combined profile response
    const profile = {
      user: {
        id: user._id,
        email: user.email,
        verified: user.verified,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      },
      profile: user.profile,
      privacy: user.privacy,
      settings: settings.getWithDefaults(),
      integrations: {
        googleCalendar: user.integrations?.googleCalendar?.connected || false,
        email: user.integrations?.email?.connected || false
      }
    };

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

/**
 * Update user profile information
 * PATCH /api/profile/me
 */
const updateProfile = async (req, res) => {
  try {
    const {
      displayName, timezone, preferences, phoneNumber,
      dateOfBirth, studyLevel, institution, bio, settings
    } = req.body;

    const userUpdates = {};
    const settingsUpdates = {};

    // Profile updates
    if (displayName !== undefined) {
      userUpdates['profile.displayName'] = displayName;
    }
    if (timezone !== undefined) {
      userUpdates['profile.timezone'] = timezone;
    }
    if (phoneNumber !== undefined) {
      userUpdates['profile.phoneNumber'] = phoneNumber;
    }
    if (dateOfBirth !== undefined) {
      userUpdates['profile.dateOfBirth'] = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (studyLevel !== undefined) {
      userUpdates['profile.studyLevel'] = studyLevel;
    }
    if (institution !== undefined) {
      userUpdates['profile.institution'] = institution;
    }
    if (bio !== undefined) {
      userUpdates['profile.bio'] = bio;
    }
    if (preferences !== undefined) {
      Object.keys(preferences).forEach(key => {
        if (preferences[key] !== undefined) {
          userUpdates[`profile.preferences.${key}`] = preferences[key];
        }
      });
    }

    // Settings updates
    if (settings) {
      Object.keys(settings).forEach(category => {
        if (settings[category] && typeof settings[category] === 'object') {
          Object.keys(settings[category]).forEach(key => {
            if (settings[category][key] !== undefined) {
              settingsUpdates[`${category}.${key}`] = settings[category][key];
            }
          });
        }
      });
    }

    // Update user if there are user-related changes
    let updatedUser = null;
    if (Object.keys(userUpdates).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: userUpdates },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');
    }

    // Update settings if there are settings-related changes
    let updatedSettings = null;
    if (Object.keys(settingsUpdates).length > 0) {
      updatedSettings = await Settings.findOneAndUpdate(
        { userId: req.user._id },
        { $set: settingsUpdates },
        { new: true, runValidators: true, upsert: true }
      );
    }

    // Log the update
    await AuditLog.logPrivacyAction(
      req.user._id,
      'PROFILE_UPDATED',
      {
        userFields: Object.keys(userUpdates),
        settingsFields: Object.keys(settingsUpdates)
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser || req.user,
        settings: updatedSettings?.getWithDefaults()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

/**
 * Update privacy settings with enhanced consent tracking
 * PATCH /api/profile/privacy
 */
const updatePrivacy = async (req, res) => {
  try {
    const {
      cameraConsent, guardianSharing, shareFields, notifications
    } = req.body;

    const updates = {};

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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No privacy settings provided for update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    // Enhanced logging for privacy changes
    const logDetails = {
      updatedFields: Object.keys(updates),
      cameraConsentChanged: cameraConsent !== undefined,
      guardianSharingChanged: guardianSharing !== undefined,
      previousValues: {}
    };

    // Capture previous values for audit trail
    if (cameraConsent !== undefined) {
      logDetails.previousValues.cameraConsent = req.user.privacy.cameraConsent;
    }
    if (guardianSharing !== undefined) {
      logDetails.previousValues.guardianSharing = req.user.privacy.guardianSharing;
    }

    await AuditLog.logPrivacyAction(
      req.user._id,
      'PRIVACY_UPDATED',
      logDetails,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        privacy: user.privacy
      }
    });
  } catch (error) {
    console.error('Privacy update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings'
    });
  }
};

/**
 * Export user data with job queuing for large exports
 * POST /api/profile/export
 */
const exportUserData = async (req, res) => {
  try {
    const { format = 'json', categories = ['all'] } = req.body;

    // For MVP, we'll do immediate export. Later: job queue for large exports
    const userId = req.user._id;

    // Gather all user data based on requested categories
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: req.user.email,
        format,
        categories,
        dataVersion: '1.0'
      }
    };

    if (categories.includes('all') || categories.includes('profile')) {
      const user = await User.findById(userId).select('-password -refreshTokens').lean();
      exportData.profile = user.profile;
      exportData.account = {
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      };
    }

    if (categories.includes('all') || categories.includes('privacy')) {
      const user = await User.findById(userId).select('privacy').lean();
      exportData.privacy = user.privacy;
    }

    if (categories.includes('all') || categories.includes('settings')) {
      const settings = await Settings.findOne({ userId });
      exportData.settings = settings?.getWithDefaults() || {};
    }

    if (categories.includes('all') || categories.includes('audit')) {
      const auditLogs = await AuditLog.find({ userId }).lean();
      exportData.auditLogs = auditLogs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        details: log.details
      }));
    }

    // Create file based on format
    const timestamp = new Date().toISOString().split('T')[0];
    let fileContent;
    let filename;
    let mimeType;

    if (format === 'json') {
      fileContent = JSON.stringify(exportData, null, 2);
      filename = `study-guardian-data-${timestamp}.json`;
      mimeType = 'application/json';
    } else if (format === 'csv') {
      // Simple CSV export for profile data
      const profileData = exportData.profile || {};
      const csvRows = [
        'Field,Value',
        ...Object.entries(profileData).map(([key, value]) => `"${key}","${String(value).replace(/"/g, '""')}"`)
      ];
      fileContent = csvRows.join('\n');
      filename = `study-guardian-profile-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    // Log the export
    await AuditLog.logPrivacyAction(
      userId,
      'DATA_EXPORTED',
      {
        format,
        categories,
        filename,
        dataPoints: Object.keys(exportData).length
      },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Return file directly for MVP (later: download link from job queue)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(fileContent);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
};

/**
 * Soft delete user account with confirmation
 * DELETE /api/profile/me
 */
const deleteAccount = async (req, res) => {
  try {
    const { confirmDelete, hardDelete = false } = req.body;

    if (!confirmDelete || confirmDelete !== 'DELETE') {
      return res.status(400).json({
        success: false,
        error: 'Please type "DELETE" to confirm account deletion'
      });
    }

    const user = await User.findById(req.user._id);

    if (hardDelete) {
      // Immediate hard delete (admin only or after grace period)
      await User.findByIdAndDelete(req.user._id);
      await Settings.findOneAndDelete({ userId: req.user._id });
      
      await AuditLog.logPrivacyAction(
        req.user._id,
        'ACCOUNT_DELETED',
        { deleteType: 'hard', requestedBy: req.user.email },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.json({
        success: true,
        message: 'Account permanently deleted'
      });
    } else {
      // Soft delete with grace period
      await user.softDelete();

      await AuditLog.logPrivacyAction(
        req.user._id,
        'ACCOUNT_DELETED',
        {
          deleteType: 'soft',
          gracePeriodDays: 30,
          canRestoreUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      res.json({
        success: true,
        message: 'Account scheduled for deletion. You have 30 days to restore it by logging in.'
      });
    }
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePrivacy,
  exportUserData,
  deleteAccount
};

