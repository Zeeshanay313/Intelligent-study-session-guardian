const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Settings = require('../models/Settings');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get user settings with defaults
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({ userId: req.user._id });
      await settings.save();
    }

    res.json({
      success: true,
      settings: settings.getWithDefaults()
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// @route   POST /api/settings
// @desc    Save all user settings
// @access  Private
router.post('/', [
  authenticate,
  body('timerDefaults.focusTime').optional().isInt({ min: 1, max: 120 }),
  body('timerDefaults.shortBreak').optional().isInt({ min: 1, max: 30 }),
  body('timerDefaults.longBreak').optional().isInt({ min: 1, max: 60 }),
  body('timerDefaults.longBreakInterval').optional().isInt({ min: 2, max: 10 }),
  body('timerDefaults.autoStart').optional().isBoolean(),
  body('timerDefaults.soundEnabled').optional().isBoolean(),
  body('reminderDefaults.enabled').optional().isBoolean(),
  body('reminderDefaults.breakReminders').optional().isBoolean(),
  body('reminderDefaults.studyReminders').optional().isBoolean(),
  body('goalDefaults.weeklyTarget').optional().isInt({ min: 1, max: 100 }),
  body('goalDefaults.dailyTarget').optional().isInt({ min: 1, max: 24 }),
  body('goalDefaults.visibility').optional().isIn(['private', 'friends', 'public']),
  body('privacy.shareTimerStats').optional().isBoolean(),
  body('privacy.shareGoalProgress').optional().isBoolean(),
  body('privacy.allowGuardianAccess').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { timerDefaults, reminderDefaults, goalDefaults, privacy } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    // Update settings fields if provided
    if (timerDefaults) {
      settings.timerDefaults = {
        ...settings.timerDefaults,
        ...timerDefaults
      };
    }

    if (reminderDefaults) {
      settings.reminderDefaults = {
        ...settings.reminderDefaults,
        ...reminderDefaults,
        channels: {
          ...settings.reminderDefaults.channels,
          ...reminderDefaults.channels
        }
      };
    }

    if (goalDefaults) {
      settings.goalDefaults = {
        ...settings.goalDefaults,
        ...goalDefaults
      };
    }

    if (privacy) {
      settings.privacy = {
        ...settings.privacy,
        ...privacy
      };
    }

    await settings.save();

    // Emit socket event for real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('settings:updated', settings.getWithDefaults());
    }

    res.json({
      success: true,
      message: 'Settings saved successfully',
      settings: settings.getWithDefaults()
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings/:key
// @desc    Update individual setting
// @access  Private
router.put('/:key', authenticate, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    let settings = await Settings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = new Settings({ userId: req.user._id });
    }

    // Parse nested keys (e.g., "timerDefaults.focusTime")
    const keys = key.split('.');
    let target = settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;

    await settings.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('settings:updated', settings.getWithDefaults());
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      settings: settings.getWithDefaults()
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
});

// @route   DELETE /api/settings
// @desc    Reset settings to defaults
// @access  Private
router.delete('/', authenticate, async (req, res) => {
  try {
    await Settings.findOneAndDelete({ userId: req.user._id });

    const newSettings = new Settings({ userId: req.user._id });
    await newSettings.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user._id}`).emit('settings:updated', newSettings.getWithDefaults());
    }

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      settings: newSettings.getWithDefaults()
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
});

module.exports = router;
