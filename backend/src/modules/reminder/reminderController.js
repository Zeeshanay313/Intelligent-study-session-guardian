const Reminder = require('./Reminder');
const { validationResult } = require('express-validator');
const cron = require('node-cron');

// Store active cron jobs
const activeCronJobs = new Map();

// Get all reminders for the authenticated user
const getReminders = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const filter = { userId: req.user._id };
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const reminders = await Reminder.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reminders' });
  }
};

// Create a new reminder
const createReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, message, type, cronExpression, datetime, channels, calendarLinked } = req.body;
    
    const reminder = new Reminder({
      userId: req.user._id,
      title,
      message,
      type,
      cronExpression: type === 'recurring' ? cronExpression : null,
      datetime: type === 'one-off' ? datetime : null,
      channels: channels || { inApp: true, email: false, push: false },
      calendarLinked: calendarLinked || false
    });

    await reminder.save();

    // Schedule the reminder
    await scheduleReminder(reminder);

    // TODO: If calendarLinked is true, create calendar event
    if (reminder.calendarLinked) {
      // await createCalendarEvent(reminder);
    }

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to create reminder' });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    const { title, message, type, cronExpression, datetime, channels, isActive, calendarLinked } = req.body;
    
    // Cancel existing cron job if it exists
    if (activeCronJobs.has(reminder._id.toString())) {
      activeCronJobs.get(reminder._id.toString()).destroy();
      activeCronJobs.delete(reminder._id.toString());
    }

    // Update reminder fields
    reminder.title = title;
    reminder.message = message;
    reminder.type = type;
    reminder.cronExpression = type === 'recurring' ? cronExpression : null;
    reminder.datetime = type === 'one-off' ? datetime : null;
    reminder.channels = channels;
    reminder.isActive = isActive !== undefined ? isActive : reminder.isActive;
    reminder.calendarLinked = calendarLinked !== undefined ? calendarLinked : reminder.calendarLinked;

    await reminder.save();

    // Reschedule if active
    if (reminder.isActive) {
      await scheduleReminder(reminder);
    }

    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to update reminder' });
  }
};

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    // Cancel cron job if it exists
    if (activeCronJobs.has(reminder._id.toString())) {
      activeCronJobs.get(reminder._id.toString()).destroy();
      activeCronJobs.delete(reminder._id.toString());
    }

    await reminder.deleteOne();
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to delete reminder' });
  }
};

// Trigger a reminder (for testing or manual trigger)
const triggerReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!reminder) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    await executeReminderAction(reminder, req.io);
    res.json({ success: true, message: 'Reminder triggered successfully' });
  } catch (error) {
    console.error('Error triggering reminder:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger reminder' });
  }
};

// Helper function to schedule a reminder
const scheduleReminder = async (reminder) => {
  try {
    if (!reminder.isActive) return;

    const reminderId = reminder._id.toString();

    if (reminder.type === 'recurring' && reminder.cronExpression) {
      // Validate cron expression
      if (!cron.validate(reminder.cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      const task = cron.schedule(reminder.cronExpression, async () => {
        await executeReminderAction(reminder);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      activeCronJobs.set(reminderId, task);
    } else if (reminder.type === 'one-off' && reminder.datetime) {
      const now = new Date();
      const reminderTime = new Date(reminder.datetime);
      
      if (reminderTime > now) {
        const delay = reminderTime.getTime() - now.getTime();
        
        const timeout = setTimeout(async () => {
          await executeReminderAction(reminder);
          activeCronJobs.delete(reminderId);
        }, delay);

        activeCronJobs.set(reminderId, { destroy: () => clearTimeout(timeout) });
      }
    }
  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
};

// Helper function to execute reminder action
const executeReminderAction = async (reminder, io = null) => {
  try {
    console.log(`Executing reminder: ${reminder.title} for user ${reminder.userId}`);

    // In-app notification via socket.io
    if (reminder.channels.inApp && io) {
      io.to(`user_${reminder.userId}`).emit('reminder:due', {
        id: reminder._id,
        title: reminder.title,
        message: reminder.message,
        timestamp: new Date()
      });
    }

    // Email notification (placeholder)
    if (reminder.channels.email) {
      // TODO: Implement email sending
      // await sendEmail(reminder.userId, reminder.title, reminder.message);
      console.log(`TODO: Send email notification for reminder ${reminder._id}`);
    }

    // Push notification (placeholder)
    if (reminder.channels.push) {
      // TODO: Implement push notification
      // await sendPushNotification(reminder.userId, reminder.title, reminder.message);
      console.log(`TODO: Send push notification for reminder ${reminder._id}`);
    }

    // Store reminder execution history
    // TODO: Create ReminderHistory model if needed for audit trail
    console.log(`Reminder ${reminder._id} executed at ${new Date()}`);

  } catch (error) {
    console.error('Error executing reminder action:', error);
  }
};

// Initialize all active reminders on server start
const initializeReminders = async (io) => {
  try {
    console.log('Initializing reminder scheduler...');
    
    const activeReminders = await Reminder.find({ isActive: true });
    
    for (const reminder of activeReminders) {
      await scheduleReminder(reminder);
    }
    
    console.log(`Initialized ${activeReminders.length} active reminders`);

    // Store io instance for use in reminder execution
    if (io) {
      executeReminderAction.io = io;
    }
  } catch (error) {
    console.error('Error initializing reminders:', error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  triggerReminder,
  initializeReminders,
  scheduleReminder,
  executeReminderAction
};