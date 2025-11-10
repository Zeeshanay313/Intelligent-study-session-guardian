const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const passport = require('passport');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const {
  generateTokens, setTokenCookies, clearTokenCookies, verifyToken
} = require('../config/auth');
const {
  validateRegistration, validateLogin, validatePasswordReset, validatePasswordChange
} = require('../middleware/validation');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register new user - BULLETPROOF VERSION
router.post('/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    console.log('=== REGISTRATION ATTEMPT ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { email, password, displayName } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      console.log('Missing required fields:', { email: !!email, password: !!password, displayName: !!displayName });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Email, password, and display name are required'
      });
    }

    // Check if user already exists
    console.log('Checking if user exists:', email);
    let existingUser;
    try {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError);
      return res.status(500).json({ error: 'Database connection error' });
    }

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user with all required fields
    console.log('Creating new user...');
    const userData = {
      email: email.toLowerCase(),
      password,
      profile: {
        displayName: displayName.trim(),
        preferences: {
          theme: 'system',
          fontSize: 'medium',
          language: 'en'
        },
        phoneNumber: '',
        dateOfBirth: null,
        studyLevel: '', // This must be empty string, not null
        institution: '',
        bio: '',
        timezone: 'UTC'
      },
      privacy: {
        cameraConsent: false,
        notifications: {
          studyReminders: true,
          goalUpdates: true,
          achievementAlerts: true,
          breakReminders: true
        }
      },
      verified: false,
      role: 'user',
      refreshTokens: [],
      loginCount: 0
    };

    const user = new User(userData);

    try {
      await user.save();
      console.log('User saved successfully:', user._id);
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      if (saveError.code === 11000) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      return res.status(500).json({
        error: 'Failed to create user account',
        details: process.env.NODE_ENV === 'development' ? saveError.message : undefined
      });
    }

    // Generate verification token
    try {
      user.verificationToken = crypto.randomBytes(32).toString('hex');
      await user.save();
      console.log('Verification token generated');
    } catch (tokenError) {
      console.error('Error generating verification token:', tokenError);
      // Continue - this is not critical
    }

    // Log account creation (non-blocking)
    try {
      await AuditLog.logPrivacyAction(
        user._id,
        'ACCOUNT_CREATED',
        { email, displayName },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      console.log('Audit log created');
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Continue - this is not critical
    }

    // REGISTRATION COMPLETE - NO AUTO-LOGIN
    // User account created successfully, now they need to login manually
    console.log('=== REGISTRATION SUCCESSFUL - REDIRECTING TO LOGIN ===');
    res.status(201).json({
      message: 'Account created successfully! Please login with your credentials.',
      success: true,
      redirectToLogin: true, // Signal frontend to redirect to login page
      user: {
        email: user.email, // Only return email for login form pre-fill
        displayName: user.profile.displayName
      }
    });
  } catch (error) {
    console.error('=== REGISTRATION FAILED ===');
    console.error('Unexpected error:', error);
    console.error('Stack trace:', error.stack);

    res.status(500).json({
      error: 'Registration failed due to server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login user
router.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    // Find user - must exist and not be deleted
    const user = await User.findOne({ email: email.toLowerCase(), deleted: false });
    if (!user) {
      // Don't log audit entry for non-existent users to avoid userId validation error
      console.log(`Login attempt for non-existent user: ${email} from IP: ${req.ip}`);
      return res.status(400).json({
        error: 'Invalid credentials',
        message: 'No account found with this email. Please create an account first.',
        suggestion: 'register'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await AuditLog.logPrivacyAction(
        user._id,
        'LOGIN_FAILED',
        { reason: 'Invalid password' },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          deviceId
        }
      );

      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update login statistics
    console.log(`Updating login stats for user: ${user.email}`);
    user.lastLogin = new Date();
    user.loginCount += 1;

    try {
      await user.save();
      console.log(`Login stats saved for user: ${user.email}`);
    } catch (saveError) {
      console.error('Error saving login stats:', saveError);
      throw saveError;
    }

    // Generate tokens
    console.log(`Generating tokens for user: ${user.email}`);
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Add refresh token to user
    console.log(`Adding refresh token for user: ${user.email}`);
    try {
      await user.addRefreshToken(refreshToken);
      console.log(`Refresh token added for user: ${user.email}`);
    } catch (tokenError) {
      console.error('Error adding refresh token:', tokenError);
      throw tokenError;
    }

    // Set HTTP-only cookies
    console.log(`Setting cookies for user: ${user.email}`);
    setTokenCookies(res, accessToken, refreshToken);

    // Log successful login
    console.log(`Logging successful login for user: ${user.email}`);
    try {
      await AuditLog.logPrivacyAction(
        user._id,
        'LOGIN_SUCCESS',
        { deviceId },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          deviceId
        }
      );
      console.log(`Audit log created for user: ${user.email}`);
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't throw - audit log failure shouldn't break login
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        verified: user.verified,
        role: user.role,
        profile: user.profile,
        privacy: user.privacy
      }
    });
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
      timestamp: new Date().toISOString()
    });

    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: error.message });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ error: 'Database error occurred' });
    }

    res.status(500).json({
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken && req.user) {
      try {
        // Remove refresh token from user
        await req.user.removeRefreshToken(refreshToken);
      } catch (tokenError) {
        console.error('Error removing refresh token:', tokenError);
        // Continue with logout even if token removal fails
      }
    }

    // Clear cookies
    clearTokenCookies(res);

    // Log logout
    await AuditLog.logPrivacyAction(
      req.user._id,
      'LOGOUT',
      {},
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || user.deleted) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old refresh token with new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    // Set new cookies
    setTokenCookies(res, accessToken, newRefreshToken);

    // Log token refresh
    await AuditLog.logPrivacyAction(
      user._id,
      'TOKEN_REFRESHED',
      {},
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Token refreshed successfully',
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        verified: user.verified,
        role: user.role,
        profile: user.profile,
        privacy: user.privacy
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Change password (authenticated)
router.patch('/change-password', authenticate, sensitiveLimiter, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    // Clear all refresh tokens (force re-login on all devices)
    req.user.refreshTokens = [];
    await req.user.save();

    // Clear current session cookies
    clearTokenCookies(res);

    // Log password change
    await AuditLog.logPrivacyAction(
      req.user._id,
      'PASSWORD_CHANGED',
      {},
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      message: 'Password changed successfully. Please log in again.',
      requireLogin: true
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Get current user info
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.profile.displayName,
        verified: req.user.verified,
        role: req.user.role,
        profile: req.user.profile,
        privacy: req.user.privacy,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Forgot password - Request password reset
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    console.log('Password reset requested for:', email);

    // Check if MongoDB is available
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ MongoDB not connected - using development mode');

      // Development mode fallback - simulate user check
      const knownEmails = ['testuser@example.com', 'admin@example.com', 'user@test.com'];
      const isKnownUser = knownEmails.includes(email.toLowerCase());

      if (!isKnownUser) {
        console.log('Password reset attempted for unregistered email:', email);
        return res.status(404).json({
          success: false,
          error: 'This email is not registered. Please create an account first.',
          needsRegistration: true
        });
      }

      // Generate development reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      console.log('=== DEVELOPMENT PASSWORD RESET LINK ===');
      console.log('Email:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Token:', resetToken);
      console.log('========================================');

      return res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email address.',
        resetUrl,
        token: resetToken
      });
    }

    // Find user by email (when MongoDB is connected)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if user exists and provide helpful message for unregistered emails
    if (!user) {
      console.log('Password reset attempted for unregistered email:', email);
      return res.status(404).json({
        success: false,
        error: 'This email is not registered. Please create an account first.',
        needsRegistration: true
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save reset token to user
    user.passwordReset = {
      token: resetToken,
      expiresAt: resetTokenExpiry
    };

    try {
      await user.save();
      console.log('✅ Reset token saved to user');
    } catch (saveError) {
      console.error('❌ Error saving reset token:', saveError);
      throw new Error('Failed to save reset token');
    }

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // For development, log the reset link (in production, send email)
    console.log('=== PASSWORD RESET LINK ===');
    console.log('Email:', email);
    console.log('Reset URL:', resetUrl);
    console.log('Token:', resetToken);
    console.log('Expires:', resetTokenExpiry);
    console.log('==========================');

    // Log the password reset request (non-blocking)
    try {
      await AuditLog.logPrivacyAction(
        user._id,
        'PASSWORD_RESET_REQUESTED',
        { email },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      console.log('✅ Audit log created');
    } catch (auditError) {
      console.error('⚠️ Error creating audit log:', auditError);
      // Don't throw - audit log failure shouldn't break password reset
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email address.',
      // In development, include the reset link for testing
      ...(process.env.NODE_ENV === 'development' && { resetUrl, token: resetToken })
    });
  } catch (error) {
    console.error('❌ Forgot password error:', {
      message: error.message,
      stack: error.stack,
      email: req.body.email
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process password reset request',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Reset password with token
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Reset token and new password are required'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    console.log('Password reset attempt with token:', token);

    // Find user with valid reset token
    const user = await User.findOne({
      'passwordReset.token': token,
      'passwordReset.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      // Log this security event
      await AuditLog.logPrivacyAction(
        user._id,
        'PASSWORD_RESET_SAME_PASSWORD',
        {
          email: user.email,
          reason: 'User attempted to reset password with same password'
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      return res.status(400).json({
        success: false,
        error: 'New password must be different from your current password'
      });
    }

    // Update user password and clear reset token
    // Note: User model pre-save middleware will automatically hash the password
    user.password = password;
    user.passwordReset = undefined;
    user.lastPasswordChange = new Date();
    await user.save();

    console.log('Password reset successful for user:', user.email);

    // Log the password reset activity
    await AuditLog.logPrivacyAction(
      user._id,
      'PASSWORD_RESET_COMPLETED',
      { email: user.email },
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

// Verify reset token validity
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      'passwordReset.token': token,
      'passwordReset.expiresAt': { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Valid reset token',
      email: user.email // Return email for display
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify reset token'
    });
  }
});

// Google OAuth Routes
// Check if Google OAuth is configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth for SIGN IN (existing users only)
  router.get(
    '/google/signin',
    (req, res, next) => {
      // Store the intent in session
      req.session.oauthIntent = 'signin';
      next();
    },
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  // Initiate Google OAuth for SIGN UP (new account creation)
  router.get(
    '/google/signup',
    (req, res, next) => {
      // Store the intent in session
      req.session.oauthIntent = 'signup';
      next();
    },
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  // Legacy route for backward compatibility (defaults to signin behavior)
  router.get(
    '/google',
    (req, res, next) => {
      // Default to signin behavior for legacy route
      req.session.oauthIntent = 'signin';
      next();
    },
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  );

  // Google OAuth callback route
  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: false // Handle failures manually
    }),
    async (req, res) => {
      try {
      // Check for authentication failures
        if (!req.user) {
          const errorInfo = req.authInfo || {};
          console.log('OAuth authentication failed:', errorInfo);

          if (errorInfo.message === 'account_not_found') {
          // User tried to sign in but account doesn't exist
            return res.redirect(
              `${process.env.FRONTEND_URL || 'http://localhost:3000'
              }/register?error=account_not_found&email=${encodeURIComponent(errorInfo.email || '')}&message=${encodeURIComponent('Please create an account first')}`
            );
          } if (errorInfo.message === 'account_exists') {
          // User tried to sign up but account already exists
            return res.redirect(
              `${process.env.FRONTEND_URL || 'http://localhost:3000'
              }/login?error=account_exists&email=${encodeURIComponent(errorInfo.email || '')}&message=${encodeURIComponent('Account already exists. Please sign in instead.')}`
            );
          }
          // Generic OAuth failure
          return res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:3000'
            }/login?error=oauth_failed&message=${encodeURIComponent('Google authentication failed. Please try again.')}`
          );
        }

        console.log('=== GOOGLE OAUTH CALLBACK SUCCESS ===');
        console.log('Authenticated user ID:', req.user._id);
        console.log('User email:', req.user.email);
        console.log('User display name:', req.user.profile?.displayName);
        console.log('OAuth Intent:', req.session?.oauthIntent);

        // Update audit log with request info
        try {
          await AuditLog.updateOne(
            {
              userId: req.user._id,
              action: { $in: ['OAUTH_LOGIN_SUCCESS', 'OAUTH_ACCOUNT_CREATED'] }
            },
            {
              $set: {
                'metadata.ipAddress': req.ip,
                'metadata.userAgent': req.get('User-Agent')
              }
            },
            { sort: { createdAt: -1 } }
          );
        } catch (auditError) {
          console.error('Error updating OAuth audit log:', auditError);
        }

        // Generate JWT tokens for the authenticated user
        const tokens = generateTokens(req.user._id);

        // Set HTTP-only cookies
        setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

        // Update user's refresh tokens and login count
        req.user.refreshTokens.push({
          token: tokens.refreshToken,
          createdAt: new Date(),
          lastUsed: new Date()
        });

        // Keep only last 5 refresh tokens
        if (req.user.refreshTokens.length > 5) {
          req.user.refreshTokens = req.user.refreshTokens.slice(-5);
        }

        req.user.loginCount += 1;
        req.user.lastLogin = new Date();
        await req.user.save();

        const oauthIntent = req.session?.oauthIntent || 'signin';
        console.log('OAuth login successful, redirecting to dashboard');

        // Clear session intent
        delete req.session.oauthIntent;

        // Redirect based on intent
        if (oauthIntent === 'signup') {
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?oauth=signup_success`);
        } else {
          res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?oauth=signin_success`);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        console.error('Error stack:', error.stack);
        console.error('User object:', req.user);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_callback_failed`);
      }
    }
  );
} else {
  // Google OAuth not configured - provide helpful error messages
  router.get('/google', (req, res) => {
    console.warn('Google OAuth attempted but not configured');
    res.status(503).json({
      error: 'Google OAuth is not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
    });
  });

  router.get('/google/callback', (req, res) => {
    console.warn('Google OAuth callback attempted but OAuth not configured');
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
  });
}

module.exports = router;
