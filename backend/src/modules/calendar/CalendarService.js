// Google Calendar integration service
// This module provides OAuth2 flow integration and calendar sync functionality

const { google } = require('googleapis');

// TODO: Set up Google OAuth2 credentials in environment variables
// GOOGLE_CLIENT_ID=your_client_id_here
// GOOGLE_CLIENT_SECRET=your_client_secret_here  
// GOOGLE_REDIRECT_URL=http://localhost:5004/api/calendar/callback

class CalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5004/api/calendar/callback'
    );
    
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // Generate OAuth2 authorization URL
  generateAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  // Set user credentials
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Create a calendar event for a reminder
  async createEvent(reminder, userTimezone = 'UTC') {
    try {
      const event = {
        summary: reminder.title,
        description: reminder.message,
        start: {
          dateTime: reminder.datetime || new Date().toISOString(),
          timeZone: userTimezone
        },
        end: {
          dateTime: reminder.datetime || new Date(Date.now() + 3600000).toISOString(), // 1 hour later
          timeZone: userTimezone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 }
          ]
        }
      };

      if (reminder.type === 'recurring' && reminder.cronExpression) {
        // Convert cron to Google Calendar recurrence rule
        event.recurrence = this.cronToRRule(reminder.cronExpression);
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }

  // Update a calendar event
  async updateEvent(eventId, reminder, userTimezone = 'UTC') {
    try {
      const event = {
        summary: reminder.title,
        description: reminder.message,
        start: {
          dateTime: reminder.datetime || new Date().toISOString(),
          timeZone: userTimezone
        },
        end: {
          dateTime: reminder.datetime || new Date(Date.now() + 3600000).toISOString(),
          timeZone: userTimezone
        }
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update calendar event: ${error.message}`);
    }
  }

  // Delete a calendar event
  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to delete calendar event: ${error.message}`);
    }
  }

  // Convert cron expression to Google Calendar recurrence rule (basic implementation)
  cronToRRule(cronExpression) {
    // TODO: Implement proper cron to RRULE conversion
    // This is a basic placeholder - full implementation would need more sophisticated parsing
    const parts = cronExpression.split(' ');
    
    // Simple daily recurrence example
    if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
      return ['RRULE:FREQ=DAILY'];
    }
    
    // Simple weekly recurrence example
    if (parts[4] !== '*') {
      return ['RRULE:FREQ=WEEKLY'];
    }
    
    // Default to no recurrence for complex patterns
    return [];
  }

  // Export calendar events to ICS format (fallback option)
  generateICS(reminders) {
    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Study Guardian//Study Reminders//EN\r\n';
    
    reminders.forEach(reminder => {
      ics += 'BEGIN:VEVENT\r\n';
      ics += `UID:${reminder._id}@studyguardian.app\r\n`;
      ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
      
      if (reminder.datetime) {
        const startTime = new Date(reminder.datetime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics += `DTSTART:${startTime}\r\n`;
        
        const endTime = new Date(new Date(reminder.datetime).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics += `DTEND:${endTime}\r\n`;
      }
      
      ics += `SUMMARY:${reminder.title}\r\n`;
      if (reminder.message) {
        ics += `DESCRIPTION:${reminder.message}\r\n`;
      }
      ics += 'END:VEVENT\r\n';
    });
    
    ics += 'END:VCALENDAR\r\n';
    return ics;
  }
}

module.exports = CalendarService;

/*
SETUP INSTRUCTIONS FOR GOOGLE CALENDAR INTEGRATION:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing project
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - http://localhost:5004/api/calendar/callback (for development)
     - https://yourdomain.com/api/calendar/callback (for production)

5. Set environment variables in your .env file:
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URL=http://localhost:5004/api/calendar/callback

6. The OAuth2 flow:
   - User clicks "Connect Google Calendar" in frontend
   - Frontend redirects to /api/calendar/auth
   - User authorizes in Google
   - Google redirects back to /api/calendar/callback
   - Backend exchanges code for tokens and stores them
   - User can now sync reminders to calendar

TODO: Implement user token storage in database
TODO: Add refresh token handling for long-term access
TODO: Implement proper error handling and user notifications
*/