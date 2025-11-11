const admin = require('firebase-admin');
const User = require('../models/User');

class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  // Initialize Firebase Admin SDK
  initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Initialize with service account (production) or default credentials (development)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

            // Validate that it has the required fields
            if (!serviceAccount.private_key || !serviceAccount.client_email) {
              throw new Error('Invalid Firebase service account configuration');
            }

            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: process.env.FIREBASE_PROJECT_ID
            });
            this.initialized = true;
            console.log('✅ Firebase Push Notification Service initialized');
          } catch (parseError) {
            console.log('⚠️ Invalid Firebase service account - push notifications disabled');
            console.log('   Error:', parseError.message);
          }
        } else if (process.env.FIREBASE_PROJECT_ID) {
          // Development mode with default credentials
          try {
            admin.initializeApp({
              projectId: process.env.FIREBASE_PROJECT_ID
            });
            this.initialized = true;
            console.log('✅ Firebase Push Notification Service initialized (dev mode)');
          } catch (initError) {
            console.log('⚠️ Firebase dev mode failed - push notifications disabled');
          }
        } else {
          console.log('⚠️ Firebase not configured - push notifications will be simulated');
        }
      } else {
        this.initialized = true;
        console.log('✅ Firebase already initialized');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error.message);
      console.log('📱 Push notifications will fall back to in-app only');
      this.initialized = false;
    }
  }

  // Register user's FCM token
  async registerUserToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.pushNotifications.fcmToken': fcmToken,
        'integrations.pushNotifications.enabled': true,
        'integrations.pushNotifications.lastUpdated': new Date()
      });

      return { success: true, message: 'FCM token registered' };
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  // Send study session reminder push notification
  async sendStudySessionNotification(userId, sessionData) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.pushNotifications?.enabled || !user.integrations.pushNotifications.fcmToken) {
        return { sent: false, reason: 'Push notifications not enabled or no FCM token' };
      }

      if (!this.initialized) {
        return { sent: false, reason: 'Firebase not configured' };
      }

      const message = {
        token: user.integrations.pushNotifications.fcmToken,
        notification: {
          title: '🎯 Study Session Starting!',
          body: `Time for your ${sessionData.subject || 'focus session'} - ${sessionData.workDuration} minutes`
        },
        data: {
          type: 'study_session',
          sessionId: sessionData.sessionId || '',
          action: 'start_timer',
          url: '/timer'
        },
        webpush: {
          fcm_options: {
            link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/timer`
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'study-session',
            requireInteraction: true,
            actions: [
              {
                action: 'start',
                title: 'Start Now',
                icon: '/icons/play.png'
              },
              {
                action: 'snooze',
                title: 'Snooze 5min',
                icon: '/icons/snooze.png'
              }
            ]
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { sent: true, messageId: response, to: user.email };
    } catch (error) {
      console.error('Error sending study session push notification:', error);

      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered'
          || error.code === 'messaging/invalid-registration-token') {
        await this.removeUserToken(userId);
        return { sent: false, reason: 'Invalid FCM token - removed from user' };
      }

      return { sent: false, reason: error.message };
    }
  }

  // Send goal achievement push notification
  async sendGoalAchievementNotification(userId, goalData) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.pushNotifications?.enabled || !user.integrations.pushNotifications.fcmToken) {
        return { sent: false, reason: 'Push notifications not enabled' };
      }

      if (!this.initialized) {
        return { sent: false, reason: 'Firebase not configured' };
      }

      const message = {
        token: user.integrations.pushNotifications.fcmToken,
        notification: {
          title: '🎉 Goal Achieved!',
          body: `Congratulations! You completed "${goalData.title}"`
        },
        data: {
          type: 'goal_achievement',
          goalId: goalData._id.toString(),
          action: 'view_goals',
          url: '/goals'
        },
        webpush: {
          fcm_options: {
            link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/goals/${goalData._id}`
          },
          notification: {
            icon: '/icons/achievement-icon.png',
            badge: '/icons/badge-72x72.png',
            tag: 'goal-achievement',
            requireInteraction: true
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { sent: true, messageId: response };
    } catch (error) {
      console.error('Error sending goal achievement push notification:', error);

      if (error.code === 'messaging/registration-token-not-registered'
          || error.code === 'messaging/invalid-registration-token') {
        await this.removeUserToken(userId);
      }

      return { sent: false, reason: error.message };
    }
  }

  // Send custom reminder push notification
  async sendReminderNotification(userId, reminderData) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.pushNotifications?.enabled || !user.integrations.pushNotifications.fcmToken) {
        return { sent: false, reason: 'Push notifications not enabled' };
      }

      if (!this.initialized) {
        return { sent: false, reason: 'Firebase not configured' };
      }

      const message = {
        token: user.integrations.pushNotifications.fcmToken,
        notification: {
          title: `⏰ ${reminderData.title}`,
          body: reminderData.message || 'You have a scheduled reminder'
        },
        data: {
          type: 'reminder',
          reminderId: reminderData._id.toString(),
          action: 'view_reminders',
          url: '/reminders'
        },
        webpush: {
          fcm_options: {
            link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reminders`
          },
          notification: {
            icon: '/icons/reminder-icon.png',
            badge: '/icons/badge-72x72.png',
            tag: 'reminder'
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { sent: true, messageId: response };
    } catch (error) {
      console.error('Error sending reminder push notification:', error);

      if (error.code === 'messaging/registration-token-not-registered'
          || error.code === 'messaging/invalid-registration-token') {
        await this.removeUserToken(userId);
      }

      return { sent: false, reason: error.message };
    }
  }

  // Send break reminder during active study session
  async sendBreakReminderNotification(userId, sessionData) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.pushNotifications?.enabled
          || !user.privacy?.notifications?.breakReminders) {
        return { sent: false, reason: 'Break reminders not enabled' };
      }

      if (!this.initialized) {
        return { sent: false, reason: 'Firebase not configured' };
      }

      const message = {
        token: user.integrations.pushNotifications.fcmToken,
        notification: {
          title: '☕ Break Time!',
          body: `Great work! Take a ${sessionData.breakDuration} minute break.`
        },
        data: {
          type: 'break_reminder',
          sessionId: sessionData.sessionId || '',
          action: 'start_break',
          url: '/timer'
        },
        webpush: {
          fcm_options: {
            link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/timer`
          },
          notification: {
            icon: '/icons/break-icon.png',
            badge: '/icons/badge-72x72.png',
            tag: 'break-reminder',
            actions: [
              {
                action: 'start_break',
                title: 'Start Break',
                icon: '/icons/coffee.png'
              },
              {
                action: 'continue_work',
                title: 'Keep Working',
                icon: '/icons/work.png'
              }
            ]
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { sent: true, messageId: response };
    } catch (error) {
      console.error('Error sending break reminder:', error);
      return { sent: false, reason: error.message };
    }
  }

  // Remove user's FCM token (when token becomes invalid)
  async removeUserToken(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: {
          'integrations.pushNotifications.fcmToken': '',
          'integrations.pushNotifications.enabled': ''
        }
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  // Test push notification
  async testPushNotification(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.pushNotifications?.fcmToken) {
        return { success: false, error: 'No FCM token registered' };
      }

      if (!this.initialized) {
        return { success: false, error: 'Firebase not configured' };
      }

      const message = {
        token: user.integrations.pushNotifications.fcmToken,
        notification: {
          title: '✅ Push Notification Test',
          body: 'Your push notifications are working correctly!'
        },
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        },
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'test-notification'
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Push notification test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users (for group features)
  async sendMulticastNotification(userIds, notificationData) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        'integrations.pushNotifications.enabled': true,
        'integrations.pushNotifications.fcmToken': { $exists: true }
      });

      if (users.length === 0) {
        return { sent: false, reason: 'No users with push notifications enabled' };
      }

      const tokens = users.map(user => user.integrations.pushNotifications.fcmToken);

      const message = {
        notification: notificationData.notification,
        data: notificationData.data || {},
        tokens
      };

      const response = await admin.messaging().sendMulticast(message);
      return {
        sent: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      console.error('Error sending multicast notification:', error);
      return { sent: false, reason: error.message };
    }
  }
}

module.exports = new PushNotificationService();
