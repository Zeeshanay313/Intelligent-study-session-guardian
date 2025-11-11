const cron = require('node-cron');
const Session = require('../modules/timer/Session');
const Reminder = require('../modules/reminder/Reminder');
const Goal = require('../models/Goal');
const User = require('../models/User');
const GoogleCalendarService = require('../modules/calendar/GoogleCalendarService');
const EmailService = require('./EmailService');
const PushNotificationService = require('./PushNotificationService');

class StudySessionOrchestrator {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map(); // userId -> sessionData
    this.sessionTimers = new Map(); // sessionId -> timer info
    this.initializeCronJobs();
  }

  // Start integrated study session with all modules
  async startIntegratedSession(userId, sessionConfig) {
    try {
      console.log(`🚀 Starting integrated study session for user ${userId}`);

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 1. Create timer session
      const timerSession = await this.createTimerSession(userId, sessionConfig);

      // 2. Update goal progress if linked
      let goalUpdate = null;
      if (sessionConfig.linkedGoalId) {
        goalUpdate = await this.updateGoalProgress(userId, sessionConfig.linkedGoalId, sessionConfig);
      }

      // 3. Create calendar event if enabled
      let calendarEvent = null;
      if (user.integrations?.googleCalendar?.connected && sessionConfig.syncToCalendar) {
        calendarEvent = await this.createCalendarEvent(userId, sessionConfig, timerSession);
      }

      // 4. Schedule break reminders
      const breakReminders = await this.scheduleBreakReminders(userId, sessionConfig, timerSession);

      // 5. Send session start notifications
      await this.sendSessionStartNotifications(userId, sessionConfig, timerSession);

      // 6. Track active session
      const sessionData = {
        userId,
        sessionId: timerSession._id,
        config: sessionConfig,
        timerSession,
        goalUpdate,
        calendarEvent,
        breakReminders,
        startTime: new Date(),
        status: 'active'
      };

      this.activeSessions.set(userId, sessionData);

      // 7. Start real-time session tracking
      this.startSessionTracking(sessionData);

      return {
        success: true,
        sessionId: timerSession._id,
        message: 'Integrated study session started successfully',
        data: {
          timer: timerSession,
          goal: goalUpdate,
          calendar: calendarEvent ? 'Synced to Google Calendar' : 'No calendar sync',
          notifications: 'Enabled'
        }
      };
    } catch (error) {
      console.error('Error starting integrated session:', error);
      throw error;
    }
  }

  // Create timer session
  async createTimerSession(userId, config) {
    const session = new Session({
      userId,
      presetId: config.presetId,
      customDurations: config.customDurations,
      subject: config.subject || 'Focus Session',
      status: 'active',
      currentPhase: 'work',
      currentPhaseStartTime: new Date(),
      totalWorkTime: 0,
      totalBreakTime: 0,
      cyclesCompleted: 0
    });

    await session.save();
    return session;
  }

  // Update goal progress
  async updateGoalProgress(userId, goalId, config) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) {
        console.log('Linked goal not found');
        return null;
      }

      // Estimate session contribution based on work duration
      let progressIncrement = 0;
      if (goal.targetType === 'hours') {
        progressIncrement = (config.workDuration || 25) / 60; // Convert minutes to hours
      } else if (goal.targetType === 'sessions') {
        progressIncrement = 1;
      }

      // Update progress atomically
      const updatedGoal = await Goal.findByIdAndUpdate(
        goalId,
        {
          $inc: { progressValue: progressIncrement },
          $set: {
            lastProgressUpdate: new Date(),
            isActive: true
          }
        },
        { new: true }
      );

      // Check if goal is completed
      if (updatedGoal.progressValue >= updatedGoal.targetValue && !updatedGoal.completedAt) {
        await Goal.findByIdAndUpdate(goalId, {
          completedAt: new Date(),
          isActive: false
        });

        // Send achievement notifications
        this.sendGoalAchievementNotifications(userId, updatedGoal);
      }

      return updatedGoal;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return null;
    }
  }

  // Create Google Calendar event
  async createCalendarEvent(userId, config, _timerSession) {
    try {
      const sessionData = {
        subject: config.subject || 'Study Session',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + (config.workDuration || 25) * 60000).toISOString(),
        workDuration: config.workDuration || 25,
        breakDuration: config.breakDuration || 5,
        timezone: config.timezone || 'UTC'
      };

      const event = await GoogleCalendarService.createStudySessionEvent(userId, sessionData);
      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Schedule break reminders
  async scheduleBreakReminders(userId, config, timerSession) {
    try {
      const workDuration = config.workDuration || 25;
      const breakDuration = config.breakDuration || 5;

      const breakTime = new Date(Date.now() + workDuration * 60000);

      const breakReminder = new Reminder({
        userId,
        title: 'Break Time!',
        message: `Great work! Time for a ${breakDuration} minute break.`,
        type: 'one-off',
        datetime: breakTime,
        channels: {
          inApp: true,
          email: false,
          push: true
        },
        isActive: true,
        linkedSessionId: timerSession._id
      });

      await breakReminder.save();

      // Schedule the reminder job
      this.scheduleReminderJob(breakReminder);

      return [breakReminder];
    } catch (error) {
      console.error('Error scheduling break reminders:', error);
      return [];
    }
  }

  // Send session start notifications
  async sendSessionStartNotifications(userId, config, timerSession) {
    try {
      const notificationData = {
        subject: config.subject || 'Focus Session',
        workDuration: config.workDuration || 25,
        breakDuration: config.breakDuration || 5,
        sessionId: timerSession._id.toString(),
        startTime: new Date().toISOString()
      };

      // Send in-app notification via socket
      this.io.to(`user_${userId}`).emit('session_started', {
        sessionId: timerSession._id,
        message: 'Study session started successfully!',
        data: notificationData
      });

      // Send push notification if enabled
      await PushNotificationService.sendStudySessionNotification(userId, notificationData);
    } catch (error) {
      console.error('Error sending session start notifications:', error);
    }
  }

  // Start real-time session tracking
  startSessionTracking(sessionData) {
    const { userId, sessionId, config } = sessionData;
    const workDuration = (config.workDuration || 25) * 60; // Convert to seconds
    let timeRemaining = workDuration;

    const timer = setInterval(() => {
      timeRemaining--;

      // Send real-time updates
      this.io.to(`user_${userId}`).emit('timer_tick', {
        sessionId,
        timeRemaining,
        phase: 'work',
        totalDuration: workDuration
      });

      // Session completed
      if (timeRemaining <= 0) {
        clearInterval(timer);
        this.completeSession(userId, sessionId);
      }
    }, 1000);

    this.sessionTimers.set(sessionId.toString(), {
      timer,
      startTime: Date.now(),
      timeRemaining
    });
  }

  // Complete study session
  async completeSession(userId, sessionId) {
    try {
      const sessionData = this.activeSessions.get(userId);
      if (!sessionData) return;

      // Update session in database
      await Session.findByIdAndUpdate(sessionId, {
        status: 'completed',
        endTime: new Date(),
        totalWorkTime: sessionData.config.workDuration || 25
      });

      // Update final goal progress if needed
      if (sessionData.config.linkedGoalId) {
        const finalGoalUpdate = await this.finalizeGoalProgress(userId, sessionData.config.linkedGoalId);
        if (finalGoalUpdate?.isCompleted) {
          await this.sendGoalAchievementNotifications(userId, finalGoalUpdate);
        }
      }

      // Send completion notifications
      this.io.to(`user_${userId}`).emit('session_completed', {
        sessionId,
        message: 'Study session completed successfully!',
        totalTime: sessionData.config.workDuration || 25
      });

      // Clean up
      this.activeSessions.delete(userId);
      this.sessionTimers.delete(sessionId.toString());

      console.log(`✅ Study session completed for user ${userId}`);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  }

  // Finalize goal progress after session
  async finalizeGoalProgress(userId, goalId) {
    try {
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (!goal) return null;

      // Check if goal was completed during this session
      if (goal.progressValue >= goal.targetValue && !goal.completedAt) {
        const completedGoal = await Goal.findByIdAndUpdate(goalId, {
          completedAt: new Date(),
          isActive: false
        }, { new: true });

        return { ...completedGoal.toObject(), isCompleted: true };
      }

      return goal;
    } catch (error) {
      console.error('Error finalizing goal progress:', error);
      return null;
    }
  }

  // Send goal achievement notifications
  async sendGoalAchievementNotifications(userId, goal) {
    try {
      // In-app notification
      this.io.to(`user_${userId}`).emit('goal_achieved', {
        goalId: goal._id,
        title: goal.title,
        message: `Congratulations! You completed "${goal.title}"!`
      });

      // Email notification
      await EmailService.sendGoalAchievementEmail(userId, goal);

      // Push notification
      await PushNotificationService.sendGoalAchievementNotification(userId, goal);
    } catch (error) {
      console.error('Error sending goal achievement notifications:', error);
    }
  }

  // Pause active session
  async pauseSession(userId) {
    try {
      const sessionData = this.activeSessions.get(userId);
      if (!sessionData) {
        throw new Error('No active session found');
      }

      const timerInfo = this.sessionTimers.get(sessionData.sessionId.toString());
      if (timerInfo) {
        clearInterval(timerInfo.timer);
        sessionData.status = 'paused';
        sessionData.pausedAt = new Date();

        this.io.to(`user_${userId}`).emit('session_paused', {
          sessionId: sessionData.sessionId,
          timeRemaining: timerInfo.timeRemaining
        });
      }

      return { success: true, message: 'Session paused' };
    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  // Resume paused session
  async resumeSession(userId) {
    try {
      const sessionData = this.activeSessions.get(userId);
      if (!sessionData || sessionData.status !== 'paused') {
        throw new Error('No paused session found');
      }

      const oldTimerInfo = this.sessionTimers.get(sessionData.sessionId.toString());
      if (oldTimerInfo) {
        // Restart timer with remaining time
        this.startResumedSessionTracking(sessionData, oldTimerInfo.timeRemaining);
        sessionData.status = 'active';
        delete sessionData.pausedAt;

        this.io.to(`user_${userId}`).emit('session_resumed', {
          sessionId: sessionData.sessionId,
          timeRemaining: oldTimerInfo.timeRemaining
        });
      }

      return { success: true, message: 'Session resumed' };
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  // Start tracking for resumed session
  startResumedSessionTracking(sessionData, initialTimeRemaining) {
    const { userId, sessionId } = sessionData;
    let timeRemaining = initialTimeRemaining;

    const timer = setInterval(() => {
      timeRemaining--;

      this.io.to(`user_${userId}`).emit('timer_tick', {
        sessionId,
        timeRemaining,
        phase: 'work',
        totalDuration: sessionData.config.workDuration * 60
      });

      if (timeRemaining <= 0) {
        clearInterval(timer);
        this.completeSession(userId, sessionId);
      }
    }, 1000);

    this.sessionTimers.set(sessionId.toString(), {
      timer,
      startTime: Date.now(),
      timeRemaining
    });
  }

  // Schedule reminder job
  scheduleReminderJob(reminder) {
    const scheduleTime = new Date(reminder.datetime);
    const now = new Date();

    if (scheduleTime <= now) return;

    const delay = scheduleTime.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        // Send reminder notifications
        await this.sendReminderNotifications(reminder.userId, reminder);
      } catch (error) {
        console.error('Error executing scheduled reminder:', error);
      }
    }, delay);
  }

  // Send reminder notifications
  async sendReminderNotifications(userId, reminder) {
    try {
      // In-app notification
      this.io.to(`user_${userId}`).emit('reminder_notification', {
        reminderId: reminder._id,
        title: reminder.title,
        message: reminder.message,
        type: reminder.type
      });

      // Email notification if enabled
      if (reminder.channels.email) {
        await EmailService.sendCustomReminderEmail(userId, reminder);
      }

      // Push notification if enabled
      if (reminder.channels.push) {
        await PushNotificationService.sendReminderNotification(userId, reminder);
      }
    } catch (error) {
      console.error('Error sending reminder notifications:', error);
    }
  }

  // Initialize cron jobs for system maintenance
  initializeCronJobs() {
    // Clean up expired sessions every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupExpiredSessions();
    });

    // Daily goal progress summary (8 AM every day)
    cron.schedule('0 8 * * *', () => {
      this.sendDailyGoalSummaries();
    });
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const expiredThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Clean up database sessions
      await Session.updateMany(
        {
          status: 'active',
          createdAt: { $lt: expiredThreshold }
        },
        {
          status: 'expired',
          endTime: new Date()
        }
      );

      // Clean up memory sessions
      for (const [userId, sessionData] of this.activeSessions.entries()) {
        if (sessionData.startTime < expiredThreshold) {
          const timerInfo = this.sessionTimers.get(sessionData.sessionId.toString());
          if (timerInfo) {
            clearInterval(timerInfo.timer);
          }
          this.activeSessions.delete(userId);
          this.sessionTimers.delete(sessionData.sessionId.toString());
        }
      }

      console.log('🧹 Expired sessions cleaned up');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // Send daily goal summaries
  async sendDailyGoalSummaries() {
    try {
      const users = await User.find({
        'privacy.notifications.email': true,
        'privacy.notifications.goalUpdates': true
      });

      for (const user of users) {
        const goals = await Goal.find({
          userId: user._id,
          isActive: true,
          endDate: { $gte: new Date() }
        });

        if (goals.length > 0) {
          // Calculate daily summary and send email
          await this.sendGoalSummaryEmail(user._id, goals);
        }
      }

      console.log('📧 Daily goal summaries sent');
    } catch (error) {
      console.error('Error sending daily goal summaries:', error);
    }
  }

  // Send goal summary email
  async sendGoalSummaryEmail(userId, goals) {
    // Implementation for goal summary email would go here
    console.log(`Sending goal summary to user ${userId} for ${goals.length} goals`);
  }

  // Get active session for user
  getActiveSession(userId) {
    return this.activeSessions.get(userId) || null;
  }
}

module.exports = StudySessionOrchestrator;
