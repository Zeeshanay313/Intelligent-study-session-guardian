const express = require('express');
const router = express.Router();
const Reminder = require('../modules/reminder/Reminder');
const { authenticate } = require('../middleware/auth');

// ============================================
// REMINDER CRUD ENDPOINTS
// ============================================

// Get all reminders for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, type, category, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const reminders = await Reminder.find(query).sort({ createdAt: -1 });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Get single reminder
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(reminder);
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

// Create new reminder
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      message,
      customMessage,
      type,
      datetime,
      recurring,
      channels,
      sound,
      priority,
      tags,
      category,
      idleNudge,
      calendarSync
    } = req.body;
    
    const reminderData = {
      userId: req.user._id,
      title,
      message: message || '',
      customMessage: customMessage || '',
      type,
      channels: channels || { inApp: true, email: false, push: false },
      sound: sound || { enabled: true, type: 'default' },
      priority: priority || 'medium',
      tags: tags || [],
      category: category || 'general',
      status: 'active'
    };
    
    if (type === 'one-off') {
      if (!datetime) {
        return res.status(400).json({ error: 'Datetime required for one-off reminders' });
      }
      reminderData.datetime = new Date(datetime);
    } else if (type === 'recurring') {
      if (!recurring) {
        return res.status(400).json({ error: 'Recurring settings required' });
      }
      reminderData.recurring = {
        enabled: true,
        frequency: recurring.frequency || 'daily',
        interval: recurring.interval || 1,
        daysOfWeek: recurring.daysOfWeek || [],
        timeOfDay: recurring.timeOfDay || '09:00',
        startDate: recurring.startDate ? new Date(recurring.startDate) : new Date(),
        endDate: recurring.endDate ? new Date(recurring.endDate) : null
      };
    }
    
    if (idleNudge) {
      reminderData.idleNudge = idleNudge;
    }
    
    if (calendarSync) {
      reminderData.calendarSync = calendarSync;
      reminderData.calendarLinked = calendarSync.syncEnabled || false;
    }
    
    const reminder = new Reminder(reminderData);
    
    // Calculate first trigger for recurring reminders
    if (type === 'recurring') {
      reminder.calculateNextTrigger();
    }
    
    await reminder.save();
    
    // Add delivery interaction
    reminder.interactions.push({
      action: 'delivered',
      channel: 'inApp',
      timestamp: new Date(),
      metadata: { created: true }
    });
    await reminder.save();
    
    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Update reminder
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const allowedUpdates = [
      'title', 'message', 'customMessage', 'datetime', 'recurring',
      'channels', 'sound', 'priority', 'tags', 'category',
      'idleNudge', 'calendarSync', 'isActive'
    ];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'recurring' && req.body[key]) {
          reminder.recurring = { ...reminder.recurring.toObject(), ...req.body[key] };
        } else if (key === 'channels' && req.body[key]) {
          reminder.channels = { ...reminder.channels.toObject(), ...req.body[key] };
        } else if (key === 'sound' && req.body[key]) {
          reminder.sound = { ...reminder.sound.toObject(), ...req.body[key] };
        } else {
          reminder[key] = req.body[key];
        }
      }
    });
    
    // Recalculate trigger if recurring settings changed
    if (req.body.recurring && reminder.type === 'recurring') {
      reminder.calculateNextTrigger();
    }
    
    await reminder.save();
    
    res.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete reminder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// ============================================
// REMINDER ACTIONS
// ============================================

// Snooze reminder
router.post('/:id/snooze', authenticate, async (req, res) => {
  try {
    const { duration, reason } = req.body; // duration in minutes
    
    if (!duration || duration < 1) {
      return res.status(400).json({ error: 'Valid snooze duration required' });
    }
    
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await reminder.snoozeReminder(duration, reason || '');
    
    res.json({ 
      message: `Reminder snoozed for ${duration} minutes`,
      reminder,
      snoozedUntil: reminder.snooze.snoozedUntil
    });
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ error: 'Failed to snooze reminder' });
  }
});

// Dismiss reminder
router.post('/:id/dismiss', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await reminder.dismiss();
    
    res.json({ 
      message: 'Reminder dismissed successfully',
      reminder
    });
  } catch (error) {
    console.error('Error dismissing reminder:', error);
    res.status(500).json({ error: 'Failed to dismiss reminder' });
  }
});

// Complete reminder
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await reminder.complete();
    
    res.json({ 
      message: 'Reminder completed successfully',
      reminder
    });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

// ============================================
// REMINDER HISTORY
// ============================================

router.get('/history/all', authenticate, async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    
    const query = { userId: req.user._id };
    
    // Only show completed, dismissed, or expired reminders in history
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['dismissed', 'completed', 'expired'] };
    }
    
    const reminders = await Reminder.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));
    
    const stats = {
      total: reminders.length,
      dismissed: reminders.filter(r => r.status === 'dismissed').length,
      completed: reminders.filter(r => r.status === 'completed').length,
      expired: reminders.filter(r => r.status === 'expired').length,
      avgSnoozeCount: reminders.reduce((sum, r) => sum + r.snooze.count, 0) / reminders.length || 0
    };
    
    res.json({ reminders, stats });
  } catch (error) {
    console.error('Error fetching reminder history:', error);
    res.status(500).json({ error: 'Failed to fetch reminder history' });
  }
});

// ============================================
// CALENDAR SYNC
// ============================================

router.post('/:id/calendar-sync', authenticate, async (req, res) => {
  try {
    const { provider, eventId, syncEnabled } = req.body;
    
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    reminder.calendarSync = {
      provider: provider || null,
      eventId: eventId || null,
      lastSynced: new Date(),
      syncEnabled: syncEnabled !== undefined ? syncEnabled : true
    };
    reminder.calendarLinked = syncEnabled !== undefined ? syncEnabled : true;
    
    await reminder.save();
    
    res.json({ 
      message: 'Calendar sync updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Error updating calendar sync:', error);
    res.status(500).json({ error: 'Failed to update calendar sync' });
  }
});

// Get active (pending/snoozed) reminders
router.get('/active/list', authenticate, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      userId: req.user._id,
      status: { $in: ['pending', 'active', 'snoozed'] },
      isActive: true
    }).sort({ datetime: 1, 'recurring.nextTrigger': 1 });
    
    res.json(reminders);
  } catch (error) {
    console.error('Error fetching active reminders:', error);
    res.status(500).json({ error: 'Failed to fetch active reminders' });
  }
});

// Idle nudge endpoint
router.post('/:id/nudge', authenticate, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    reminder.idleNudge.lastNudgeSent = new Date();
    reminder.interactions.push({
      action: 'nudged',
      channel: 'inApp',
      timestamp: new Date()
    });
    
    await reminder.save();
    
    res.json({ 
      message: 'Nudge sent successfully',
      reminder
    });
  } catch (error) {
    console.error('Error sending nudge:', error);
    res.status(500).json({ error: 'Failed to send nudge' });
  }
});

// Manual trigger to check reminders NOW (for testing)
router.post('/test/check-now', authenticate, async (req, res) => {
  try {
    console.log('🧪 Manual reminder check triggered by user:', req.user._id);
    
    if (global.recurringReminderScheduler) {
      await global.recurringReminderScheduler.checkDueReminders();
      res.json({ 
        message: 'Reminder check completed',
        timestamp: new Date()
      });
    } else {
      res.status(500).json({ error: 'Reminder scheduler not initialized' });
    }
  } catch (error) {
    console.error('Error in manual reminder check:', error);
    res.status(500).json({ error: 'Failed to check reminders' });
  }
});

module.exports = router;
