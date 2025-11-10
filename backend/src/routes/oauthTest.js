/**
 * OAuth Routes Test
 * Test the Google OAuth implementation
 */

const express = require('express');
const router = express.Router();

// Test route to check OAuth configuration
router.get('/test/oauth-config', (req, res) => {
  const config = {
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
    sessionSecret: process.env.SESSION_SECRET ? 'Set' : 'Not Set',
    frontendUrl: process.env.FRONTEND_URL || 'Not Set',
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  res.json({
    message: 'OAuth Configuration Check',
    config,
    googleAuthUrl: '/api/auth/google',
    callbackUrl: '/api/auth/google/callback',
    testInstructions: {
      step1: 'Set up Google OAuth credentials in Google Cloud Console',
      step2: 'Add environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SESSION_SECRET',
      step3: 'Visit /api/auth/google to test OAuth flow',
      step4: 'Should redirect to dashboard on success'
    }
  });
});

// Test route for manual session check
router.get('/test/session', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      displayName: req.user.profile?.displayName,
      oauth: req.user.oauth ? Object.keys(req.user.oauth).filter(key => req.user.oauth[key]?.id) : []
    } : null,
    session: req.session ? {
      hasPassport: !!req.session.passport,
      userId: req.session.passport?.user
    } : null
  });
});

module.exports = router;