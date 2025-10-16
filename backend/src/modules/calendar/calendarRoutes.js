const express = require('express');
const GoogleCalendarService = require('./GoogleCalendarService');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// Get Google Calendar auth URL
router.get('/auth', authenticate, async (req, res) => {
  try {
    const authUrl = GoogleCalendarService.getAuthUrl(req.user._id);
    res.json({ 
      success: true, 
      authUrl,
      message: 'Redirect user to this URL to authorize Google Calendar access'
    });
  } catch (error) {
    console.error('Calendar auth URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate auth URL' });
  }
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=${error}`);
    }

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing authorization code or user ID' });
    }

    // Exchange code for tokens
    const tokens = await GoogleCalendarService.getTokensFromCode(code);
    
    // Store tokens for user
    await GoogleCalendarService.storeUserTokens(userId, tokens);

    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings?calendar_connected=true`);
    
  } catch (error) {
    console.error('Calendar OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?calendar_error=connection_failed`);
  }
});

// Check calendar connection status
router.get('/status', authenticate, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user._id);
    
    const connected = user?.integrations?.googleCalendar?.connected || false;
    const lastSync = user?.integrations?.googleCalendar?.lastSync;

    res.json({
      success: true,
      connected,
      lastSync
    });
  } catch (error) {
    console.error('Calendar status error:', error);
    res.status(500).json({ success: false, error: 'Failed to check calendar status' });
  }
});

// Disconnect Google Calendar
router.delete('/disconnect', authenticate, async (req, res) => {
  try {
    await GoogleCalendarService.disconnectCalendar(req.user._id);
    res.json({ success: true, message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect calendar' });
  }
});

// Manual sync test endpoint
router.post('/sync-test', authenticate, async (req, res) => {
  try {
    const { title, startTime, duration = 25 } = req.body;
    
    const sessionData = {
      subject: title || 'Test Study Session',
      startTime: startTime || new Date().toISOString(),
      endTime: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
      workDuration: duration,
      breakDuration: 5,
      timezone: 'UTC'
    };

    const event = await GoogleCalendarService.createStudySessionEvent(req.user._id, sessionData);
    
    res.json({ 
      success: true, 
      event,
      message: 'Test study session created in Google Calendar'
    });
  } catch (error) {
    console.error('Calendar sync test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;