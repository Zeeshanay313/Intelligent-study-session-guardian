const nodemailer = require('nodemailer');
const User = require('../models/User');

class EmailService {
  constructor() {
    this.defaultTransporter = null;
    this.initializeDefaultTransporter();
  }

  // Initialize default Gmail SMTP transporter
  initializeDefaultTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.defaultTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Default SMTP transporter initialized');
    } else {
      console.log('⚠️ SMTP environment variables not configured, email features will be limited');
    }
  }

  // Get transporter for specific user (uses their custom SMTP if configured)
  async getTransporter(userId) {
    try {
      const user = await User.findById(userId);
      
      // Check if user has custom email configuration
      if (user?.integrations?.email?.enabled && user.integrations.email.smtpHost) {
        return nodemailer.createTransporter({
          host: user.integrations.email.smtpHost,
          port: user.integrations.email.smtpPort || 587,
          secure: false,
          auth: {
            user: user.integrations.email.smtpUser,
            pass: user.integrations.email.smtpPass
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }

      // Fall back to default transporter
      return this.defaultTransporter;
    } catch (error) {
      console.error('Error getting transporter:', error);
      return this.defaultTransporter;
    }
  }

  // Send study session reminder email
  async sendStudySessionReminder(userId, sessionData) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.privacy.notifications.email) {
        return { sent: false, reason: 'Email notifications disabled' };
      }

      const transporter = await this.getTransporter(userId);
      if (!transporter) {
        return { sent: false, reason: 'No email transporter configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: '🎯 Study Session Reminder - Time to Focus!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Study Session Guardian</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">Time for Your Study Session! 📚</h2>
              <p>Hi ${user.profile.displayName},</p>
              <p>Your scheduled study session is about to begin:</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #667eea;">Session Details</h3>
                <p><strong>Subject:</strong> ${sessionData.subject || 'Focus Session'}</p>
                <p><strong>Duration:</strong> ${sessionData.workDuration} minutes work, ${sessionData.breakDuration} minutes break</p>
                <p><strong>Start Time:</strong> ${new Date(sessionData.startTime).toLocaleString()}</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/timer" 
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Start Session Now
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                You're receiving this because you have email notifications enabled. 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings">Change preferences</a>
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { sent: true, to: user.email };
    } catch (error) {
      console.error('Error sending study session email:', error);
      return { sent: false, reason: error.message };
    }
  }

  // Send goal achievement email
  async sendGoalAchievementEmail(userId, goalData) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.privacy.notifications.email || !user.privacy.notifications.goalUpdates) {
        return { sent: false, reason: 'Email notifications disabled for goals' };
      }

      const transporter = await this.getTransporter(userId);
      if (!transporter) {
        return { sent: false, reason: 'No email transporter configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: '🎉 Goal Achievement - Congratulations!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Goal Achieved!</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">Congratulations ${user.profile.displayName}!</h2>
              <p>You've successfully completed your goal:</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #38ef7d;">
                <h3 style="margin-top: 0; color: #11998e;">${goalData.title}</h3>
                <p>${goalData.description}</p>
                <p><strong>Target:</strong> ${goalData.targetValue} ${goalData.targetType}</p>
                <p><strong>Completed:</strong> ${new Date(goalData.completedAt).toLocaleDateString()}</p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/goals" 
                   style="background: #11998e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View All Goals
                </a>
              </div>

              <p>Keep up the great work! Set your next goal to continue your learning journey.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { sent: true, to: user.email };
    } catch (error) {
      console.error('Error sending goal achievement email:', error);
      return { sent: false, reason: error.message };
    }
  }

  // Send custom reminder email
  async sendCustomReminderEmail(userId, reminderData) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.privacy.notifications.email) {
        return { sent: false, reason: 'Email notifications disabled' };
      }

      const transporter = await this.getTransporter(userId);
      if (!transporter) {
        return { sent: false, reason: 'No email transporter configured' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: `⏰ Reminder: ${reminderData.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⏰ Reminder</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <h2 style="color: #333;">${reminderData.title}</h2>
              <p>Hi ${user.profile.displayName},</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 16px; line-height: 1.5;">${reminderData.message}</p>
                <p><small><strong>Scheduled for:</strong> ${new Date(reminderData.datetime).toLocaleString()}</small></p>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reminders" 
                   style="background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Manage Reminders
                </a>
              </div>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { sent: true, to: user.email };
    } catch (error) {
      console.error('Error sending reminder email:', error);
      return { sent: false, reason: error.message };
    }
  }

  // Test email configuration
  async testEmailConfiguration(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const transporter = await this.getTransporter(userId);
      if (!transporter) {
        throw new Error('No email transporter configured');
      }

      // Verify SMTP connection
      await transporter.verify();

      // Send test email
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: '✅ Study Guardian Email Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Email Test Successful!</h1>
            </div>
            <div style="padding: 20px; background: #f8f9fa;">
              <p>Hi ${user.profile.displayName},</p>
              <p>This is a test email to confirm your email notifications are working correctly.</p>
              <p>You'll receive notifications for:</p>
              <ul>
                <li>Study session reminders</li>
                <li>Goal achievements</li>
                <li>Custom reminders</li>
              </ul>
              <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('Email test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Configure user's custom SMTP settings
  async configureUserSMTP(userId, smtpConfig) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.email': {
          provider: smtpConfig.provider || 'custom',
          smtpHost: smtpConfig.host,
          smtpPort: smtpConfig.port || 587,
          smtpUser: smtpConfig.user,
          smtpPass: smtpConfig.pass,
          enabled: true
        }
      });

      return { success: true, message: 'SMTP configuration saved' };
    } catch (error) {
      console.error('Error configuring SMTP:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();