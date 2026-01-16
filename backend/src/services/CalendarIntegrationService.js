const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

class CalendarIntegrationService {
  constructor() {
    this.googleOAuth2Client = null;
    this.outlookClient = null;
  }

  // ============================================
  // GOOGLE CALENDAR INTEGRATION
  // ============================================

  initializeGoogleCalendar(tokens) {
    try {
      this.googleOAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5004/api/calendar/google/callback'
      );

      this.googleOAuth2Client.setCredentials(tokens);

      return google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
    } catch (error) {
      console.error('Error initializing Google Calendar:', error);
      throw error;
    }
  }

  async createGoogleCalendarEvent(tokens, reminder) {
    try {
      const calendar = this.initializeGoogleCalendar(tokens);

      const event = {
        summary: reminder.title,
        description: reminder.customMessage || reminder.message,
        start: {
          dateTime: reminder.datetime || reminder.recurring?.nextTrigger,
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date((reminder.datetime || reminder.recurring?.nextTrigger).getTime() + 3600000), // +1 hour
          timeZone: 'UTC'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 10 },
            { method: 'email', minutes: 30 }
          ]
        },
        colorId: this.getPriorityColor(reminder.priority)
      };

      if (reminder.type === 'recurring' && reminder.recurring?.frequency) {
        event.recurrence = [this.generateGoogleRecurrenceRule(reminder.recurring)];
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      console.log(`✅ Google Calendar event created: ${response.data.id}`);

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };

    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  async updateGoogleCalendarEvent(tokens, eventId, reminder) {
    try {
      const calendar = this.initializeGoogleCalendar(tokens);

      const event = {
        summary: reminder.title,
        description: reminder.customMessage || reminder.message,
        start: {
          dateTime: reminder.datetime || reminder.recurring?.nextTrigger,
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date((reminder.datetime || reminder.recurring?.nextTrigger).getTime() + 3600000),
          timeZone: 'UTC'
        }
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event
      });

      console.log(`✅ Google Calendar event updated: ${eventId}`);

    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  async deleteGoogleCalendarEvent(tokens, eventId) {
    try {
      const calendar = this.initializeGoogleCalendar(tokens);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      console.log(`✅ Google Calendar event deleted: ${eventId}`);

    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }

  generateGoogleRecurrenceRule(recurring) {
    let rule = 'RRULE:';

    switch (recurring.frequency) {
      case 'daily':
        rule += `FREQ=DAILY;INTERVAL=${recurring.interval}`;
        break;
      case 'weekly':
        rule += `FREQ=WEEKLY;INTERVAL=${recurring.interval}`;
        if (recurring.daysOfWeek && recurring.daysOfWeek.length > 0) {
          const days = recurring.daysOfWeek.map(d => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][d]).join(',');
          rule += `;BYDAY=${days}`;
        }
        break;
      case 'monthly':
        rule += `FREQ=MONTHLY;INTERVAL=${recurring.interval}`;
        break;
    }

    if (recurring.endDate) {
      const endDate = new Date(recurring.endDate);
      rule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    }

    return rule;
  }

  // ============================================
  // OUTLOOK CALENDAR INTEGRATION
  // ============================================

  initializeOutlookCalendar(accessToken) {
    this.outlookClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });

    return this.outlookClient;
  }

  async createOutlookCalendarEvent(accessToken, reminder) {
    try {
      const client = this.initializeOutlookCalendar(accessToken);

      const event = {
        subject: reminder.title,
        body: {
          contentType: 'HTML',
          content: reminder.customMessage || reminder.message
        },
        start: {
          dateTime: (reminder.datetime || reminder.recurring?.nextTrigger).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date((reminder.datetime || reminder.recurring?.nextTrigger).getTime() + 3600000).toISOString(),
          timeZone: 'UTC'
        },
        importance: this.getOutlookImportance(reminder.priority),
        isReminderOn: true,
        reminderMinutesBeforeStart: 15
      };

      if (reminder.type === 'recurring' && reminder.recurring?.frequency) {
        event.recurrence = this.generateOutlookRecurrencePattern(reminder.recurring);
      }

      const response = await client.api('/me/events').post(event);

      console.log(`✅ Outlook Calendar event created: ${response.id}`);

      return {
        eventId: response.id,
        webLink: response.webLink
      };

    } catch (error) {
      console.error('Error creating Outlook Calendar event:', error);
      throw error;
    }
  }

  async updateOutlookCalendarEvent(accessToken, eventId, reminder) {
    try {
      const client = this.initializeOutlookCalendar(accessToken);

      const event = {
        subject: reminder.title,
        body: {
          contentType: 'HTML',
          content: reminder.customMessage || reminder.message
        },
        start: {
          dateTime: (reminder.datetime || reminder.recurring?.nextTrigger).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date((reminder.datetime || reminder.recurring?.nextTrigger).getTime() + 3600000).toISOString(),
          timeZone: 'UTC'
        }
      };

      await client.api(`/me/events/${eventId}`).update(event);

      console.log(`✅ Outlook Calendar event updated: ${eventId}`);

    } catch (error) {
      console.error('Error updating Outlook Calendar event:', error);
      throw error;
    }
  }

  async deleteOutlookCalendarEvent(accessToken, eventId) {
    try {
      const client = this.initializeOutlookCalendar(accessToken);

      await client.api(`/me/events/${eventId}`).delete();

      console.log(`✅ Outlook Calendar event deleted: ${eventId}`);

    } catch (error) {
      console.error('Error deleting Outlook Calendar event:', error);
      throw error;
    }
  }

  generateOutlookRecurrencePattern(recurring) {
    const pattern = {
      pattern: {},
      range: {
        type: recurring.endDate ? 'endDate' : 'noEnd',
        startDate: new Date(recurring.startDate).toISOString().split('T')[0]
      }
    };

    if (recurring.endDate) {
      pattern.range.endDate = new Date(recurring.endDate).toISOString().split('T')[0];
    }

    switch (recurring.frequency) {
      case 'daily':
        pattern.pattern = {
          type: 'daily',
          interval: recurring.interval
        };
        break;
      case 'weekly':
        pattern.pattern = {
          type: 'weekly',
          interval: recurring.interval,
          daysOfWeek: recurring.daysOfWeek?.map(d => 
            ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][d]
          ) || []
        };
        break;
      case 'monthly':
        pattern.pattern = {
          type: 'absoluteMonthly',
          interval: recurring.interval,
          dayOfMonth: new Date(recurring.startDate).getDate()
        };
        break;
    }

    return pattern;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getPriorityColor(priority) {
    const colors = {
      low: '2',      // Green
      medium: '9',   // Blue
      high: '11',    // Red
      urgent: '11'   // Red
    };
    return colors[priority] || '9';
  }

  getOutlookImportance(priority) {
    const importance = {
      low: 'low',
      medium: 'normal',
      high: 'high',
      urgent: 'high'
    };
    return importance[priority] || 'normal';
  }
}

module.exports = new CalendarIntegrationService();
