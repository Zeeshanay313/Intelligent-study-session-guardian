const { google } = require('googleapis');
const User = require('../../models/User');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5004/api/calendar/callback'
    );
  }

  // Generate OAuth2 URL for user authorization
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId to identify user on callback
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  // Exchange authorization code for tokens
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to get Google Calendar tokens');
    }
  }

  // Store user's Google Calendar tokens
  async storeUserTokens(userId, tokens) {
    try {
      await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar': {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: tokens.expiry_date,
          connected: true,
          lastSync: new Date()
        }
      });
    } catch (error) {
      console.error('Error storing Google Calendar tokens:', error);
      throw error;
    }
  }

  // Get authenticated client for user
  async getAuthenticatedClient(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.integrations?.googleCalendar?.connected) {
        throw new Error('Google Calendar not connected');
      }

      const { accessToken, refreshToken, expiryDate } = user.integrations.googleCalendar;
      
      this.oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate
      });

      // Check if token needs refresh
      if (Date.now() >= expiryDate) {
        await this.refreshUserTokens(userId);
      }

      return this.oauth2Client;
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      throw error;
    }
  }

  // Refresh user's access token
  async refreshUserTokens(userId) {
    try {
      const user = await User.findById(userId);
      this.oauth2Client.setCredentials({
        refresh_token: user.integrations.googleCalendar.refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await User.findByIdAndUpdate(userId, {
        'integrations.googleCalendar.accessToken': credentials.access_token,
        'integrations.googleCalendar.expiryDate': credentials.expiry_date,
        'integrations.googleCalendar.lastSync': new Date()
      });

      return credentials;
    } catch (error) {
      console.error('Error refreshing Google Calendar tokens:', error);
      throw error;
    }
  }

  // Create calendar event for study session
  async createStudySessionEvent(userId, sessionData) {
    try {
      const authClient = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      const event = {
        summary: `Study Session: ${sessionData.subject || 'Focus Time'}`,
        description: `Pomodoro session - ${sessionData.workDuration}min work, ${sessionData.breakDuration}min break`,
        start: {
          dateTime: sessionData.startTime,
          timeZone: sessionData.timezone || 'UTC'
        },
        end: {
          dateTime: sessionData.endTime,
          timeZone: sessionData.timezone || 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 5 },
            { method: 'email', minutes: 10 }
          ]
        },
        colorId: '2' // Green color for study sessions
      };

      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return result.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  // Sync reminders to Google Calendar
  async syncReminderToCalendar(userId, reminder) {
    try {
      const authClient = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      const event = {
        summary: reminder.title,
        description: reminder.message,
        start: {
          dateTime: reminder.datetime,
          timeZone: reminder.timezone || 'UTC'
        },
        end: {
          dateTime: new Date(new Date(reminder.datetime).getTime() + 30 * 60000), // 30 minutes duration
          timeZone: reminder.timezone || 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 0 },
            { method: 'email', minutes: 5 }
          ]
        },
        colorId: '1' // Blue color for reminders
      };

      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return result.data.id;
    } catch (error) {
      console.error('Error syncing reminder to calendar:', error);
      throw error;
    }
  }

  // Disconnect Google Calendar
  async disconnectCalendar(userId) {
    try {
      await User.findByIdAndUpdate(userId, {
        $unset: { 'integrations.googleCalendar': '' }
      });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();