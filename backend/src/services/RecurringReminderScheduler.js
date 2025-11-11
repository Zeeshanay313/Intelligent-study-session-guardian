const Reminder = require('../modules/reminder/Reminder');
const cron = require('node-cron');

class RecurringReminderScheduler {
  constructor(io) {
    this.io = io;
    this.scheduledJobs = new Map();
    this.checkInterval = null;
  }

  async initialize() {
    console.log('🔄 Initializing Recurring Reminder Scheduler...');
    
    // Check for due reminders every 30 seconds (faster for testing)
    this.checkInterval = setInterval(() => {
      this.checkDueReminders();
    }, 30000); // Every 30 seconds instead of 60
    
    // Initial check
    await this.checkDueReminders();
    
    console.log('✅ Recurring Reminder Scheduler initialized - checking every 30 seconds');
  }

  async checkDueReminders() {
    try {
      const now = new Date();
      console.log(`\n⏰ ========== CHECKING REMINDERS at ${now.toLocaleString()} ==========`);
      
      // First, show ALL active reminders for debugging
      const allActiveReminders = await Reminder.find({
        type: 'one-off',
        status: { $in: ['pending', 'active'] },
        isActive: true
      });
      
      console.log(`📊 Total active one-off reminders in DB: ${allActiveReminders.length}`);
      allActiveReminders.forEach(r => {
        const timeUntil = new Date(r.datetime) - now;
        const minutesUntil = Math.round(timeUntil / 60000);
        console.log(`   - "${r.title}" scheduled for ${new Date(r.datetime).toLocaleString()} (${minutesUntil} minutes ${minutesUntil > 0 ? 'from now' : 'AGO'})`);
      });
      
      // Check one-off reminders that are DUE
      const dueOneOffReminders = await Reminder.find({
        type: 'one-off',
        status: { $in: ['pending', 'active'] },
        datetime: { $lte: now },
        isActive: true
      });

      console.log(`\n🔔 Found ${dueOneOffReminders.length} DUE one-off reminders`);

      for (const reminder of dueOneOffReminders) {
        console.log(`🚨 TRIGGERING one-off reminder: "${reminder.title}" (ID: ${reminder._id})`);
        await this.triggerReminder(reminder);
      }

      // Check recurring reminders
      const dueRecurringReminders = await Reminder.find({
        type: 'recurring',
        'recurring.enabled': true,
        'recurring.nextTrigger': { $lte: now },
        status: { $in: ['pending', 'active'] },
        isActive: true
      });

      console.log(`🔁 Found ${dueRecurringReminders.length} due recurring reminders`);

      for (const reminder of dueRecurringReminders) {
        console.log(`🚨 TRIGGERING recurring reminder: "${reminder.title}" (ID: ${reminder._id})`);

        await this.triggerRecurringReminder(reminder);
      }

      // Check snoozed reminders
      const unsnoozedReminders = await Reminder.find({
        status: 'snoozed',
        'snooze.snoozedUntil': { $lte: now },
        isActive: true
      });

      console.log(`😴 Found ${unsnoozedReminders.length} snoozed reminders that are now due`);

      for (const reminder of unsnoozedReminders) {
        reminder.status = 'active';
        await reminder.save();
        await this.triggerReminder(reminder);
      }

      console.log(`========== REMINDER CHECK COMPLETE ==========\n`);

    } catch (error) {
      console.error('❌ Error checking due reminders:', error);
    }
  }

  async triggerReminder(reminder) {
    try {
      console.log(`🔔 Triggering reminder: ${reminder.title}`);

      // Mark as delivered
      reminder.interactions.push({
        action: 'delivered',
        channel: 'inApp',
        timestamp: new Date()
      });

      // Send through enabled channels
      if (reminder.channels.inApp) {
        await this.sendInAppNotification(reminder);
      }

      if (reminder.channels.email) {
        await this.sendEmailNotification(reminder);
      }

      if (reminder.channels.push) {
        await this.sendPushNotification(reminder);
      }

      // Update status for one-off reminders to prevent re-triggering
      if (reminder.type === 'one-off') {
        reminder.status = 'active';
        reminder.isActive = false; // Prevent retriggering after delivery
      }

      await reminder.save();

    } catch (error) {
      console.error(`Error triggering reminder ${reminder._id}:`, error);
    }
  }

  async triggerRecurringReminder(reminder) {
    try {
      console.log(`🔁 Triggering recurring reminder: ${reminder.title}`);

      // Trigger the reminder
      await this.triggerReminder(reminder);

      // Calculate next occurrence
      reminder.recurring.lastTriggered = new Date();
      reminder.calculateNextTrigger();

      // Check if it should expire
      if (reminder.recurring.endDate && 
          reminder.recurring.nextTrigger > reminder.recurring.endDate) {
        reminder.status = 'expired';
        reminder.isActive = false;
      }

      await reminder.save();

    } catch (error) {
      console.error(`Error triggering recurring reminder ${reminder._id}:`, error);
    }
  }

  async sendInAppNotification(reminder) {
    try {
      if (!this.io) {
        console.warn('Socket.IO not available for in-app notifications');
        return;
      }

      const notificationData = {
        reminder: {
          _id: reminder._id,
          title: reminder.title,
          customMessage: reminder.customMessage,
          message: reminder.message,
          category: reminder.category,
          priority: reminder.priority,
          sound: reminder.sound,
          type: reminder.type,
          datetime: reminder.datetime,
          recurring: reminder.recurring,
          channels: reminder.channels
        },
        timestamp: new Date()
      };

      // Emit to user's room (format: user:userId)
      const userRoom = `user:${reminder.userId.toString()}`;
      this.io.to(userRoom).emit('reminder:notification', notificationData);

      console.log(`📱 In-app notification sent to ${userRoom} for reminder: ${reminder.title}`);

      reminder.interactions.push({
        action: 'delivered',
        channel: 'inApp',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending in-app notification:', error);
    }
  }

  async sendEmailNotification(reminder) {
    try {
      const EmailService = require('../services/EmailService');
      
      const emailData = {
        to: reminder.userId.email, // You'll need to populate user
        subject: `Reminder: ${reminder.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">${reminder.title}</h2>
            <p>${reminder.customMessage || reminder.message}</p>
            <p style="color: #666;">
              <strong>Category:</strong> ${reminder.category}<br>
              <strong>Priority:</strong> ${reminder.priority}<br>
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </p>
            <div style="margin-top: 20px;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/reminders" 
                 style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Reminder
              </a>
            </div>
          </div>
        `
      };

      await EmailService.sendEmail(emailData);

      console.log(`📧 Email notification sent for reminder: ${reminder.title}`);

      reminder.interactions.push({
        action: 'delivered',
        channel: 'email',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  async sendPushNotification(reminder) {
    try {
      const PushService = require('../services/PushNotificationService');
      
      const pushData = {
        userId: reminder.userId,
        title: reminder.title,
        body: reminder.customMessage || reminder.message,
        data: {
          reminderId: reminder._id.toString(),
          category: reminder.category,
          priority: reminder.priority
        }
      };

      await PushService.sendNotification(pushData);

      console.log(`📲 Push notification sent for reminder: ${reminder.title}`);

      reminder.interactions.push({
        action: 'delivered',
        channel: 'push',
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async checkIdleNudges() {
    try {
      const now = new Date();
      
      // Find reminders with idle nudge enabled
      const remindersWithNudge = await Reminder.find({
        'idleNudge.enabled': true,
        status: 'active',
        isActive: true
      });

      for (const reminder of remindersWithNudge) {
        const { idleThreshold, nudgeInterval, lastNudgeSent } = reminder.idleNudge;
        
        // Check if enough time has passed since last nudge
        if (!lastNudgeSent || 
            (now - lastNudgeSent) > (nudgeInterval * 60000)) {
          
          // Send gentle nudge
          await this.sendNudge(reminder);
          
          reminder.idleNudge.lastNudgeSent = now;
          await reminder.save();
        }
      }

    } catch (error) {
      console.error('Error checking idle nudges:', error);
    }
  }

  async sendNudge(reminder) {
    try {
      if (!this.io) return;

      const nudgeData = {
        reminderId: reminder._id,
        title: '💭 Gentle Reminder',
        message: `Still working on: ${reminder.title}?`,
        type: 'nudge',
        priority: 'low',
        timestamp: new Date()
      };

      this.io.to(reminder.userId.toString()).emit('reminder:nudge', nudgeData);

      console.log(`👋 Nudge sent for reminder: ${reminder.title}`);

    } catch (error) {
      console.error('Error sending nudge:', error);
    }
  }

  shutdown() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    console.log('🛑 Recurring Reminder Scheduler stopped');
  }
}

module.exports = RecurringReminderScheduler;
