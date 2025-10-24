const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Passport session setup
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -refreshTokens');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth2 Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    passReqToCallback: true  // Enable access to req object
  }, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log('=== GOOGLE OAUTH CALLBACK ===');
    console.log('Profile ID:', profile.id);
    console.log('Profile email:', profile.emails?.[0]?.value);
    console.log('Profile name:', profile.displayName);
    console.log('OAuth Intent:', req.session?.oauthIntent);

    const oauthIntent = req.session?.oauthIntent || 'signin';
    const userEmail = profile.emails[0].value.toLowerCase();

    // Check if user already exists with Google ID or email
    let existingUser = await User.findOne({ 
      $or: [
        { 'oauth.google.id': profile.id },
        { email: userEmail }
      ]
    });

    // Handle SIGN IN intent (existing users only)
    if (oauthIntent === 'signin') {
      if (!existingUser) {
        // User doesn't exist - redirect to sign up
        console.log('User not found for sign in, redirecting to sign up');
        return done(null, false, { 
          message: 'account_not_found',
          email: userEmail 
        });
      }
      // User exists - proceed with login
      console.log('Existing user signing in:', existingUser.email);
    }

    // Handle SIGN UP intent (new account creation)
    if (oauthIntent === 'signup') {
      if (existingUser) {
        // User already exists - redirect to sign in
        console.log('User already exists for sign up, redirecting to sign in');
        return done(null, false, { 
          message: 'account_exists',
          email: userEmail 
        });
      }
      // User doesn't exist - will create new account below
      console.log('Creating new user account via OAuth');
    }

    if (existingUser) {
      // Update existing user with Google OAuth info if not already set
      if (!existingUser.oauth.google.id) {
        existingUser.oauth.google.id = profile.id;
        existingUser.oauth.google.email = profile.emails[0].value;
        existingUser.oauth.google.name = profile.displayName;
        existingUser.oauth.google.accessToken = accessToken;
        if (refreshToken) {
          existingUser.oauth.google.refreshToken = refreshToken;
        }
        await existingUser.save();
      }

      // Log successful OAuth login
      try {
        await AuditLog.logPrivacyAction(
          existingUser._id,
          'OAUTH_LOGIN_SUCCESS',
          { 
            provider: 'google',
            email: profile.emails[0].value,
            name: profile.displayName
          },
          { 
            ipAddress: null, // Will be set in route handler
            userAgent: null  // Will be set in route handler
          }
        );
      } catch (auditError) {
        console.error('Error logging OAuth audit:', auditError);
      }

      return done(null, existingUser);
    }

    // Only create new user if this is a SIGNUP intent
    if (oauthIntent !== 'signup') {
      console.log('User not found and intent is not signup, failing authentication');
      return done(null, false, { 
        message: 'account_not_found',
        email: userEmail 
      });
    }

    // Create new user with Google OAuth (only for signup intent)
    const newUser = new User({
      email: profile.emails[0].value.toLowerCase(),
      profile: {
        displayName: profile.displayName,
        preferences: {
          theme: 'system',
          fontSize: 'medium',
          language: 'en'
        },
        phoneNumber: '',
        dateOfBirth: null,
        studyLevel: '',
        institution: '',
        bio: '',
        timezone: 'UTC'
      },
      oauth: {
        google: {
          id: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          accessToken: accessToken,
          refreshToken: refreshToken || undefined
        }
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
      verified: true, // Auto-verify OAuth users
      role: 'user',
      refreshTokens: [],
      loginCount: 1
    });

    const savedUser = await newUser.save();
    console.log('New Google OAuth user created:', savedUser._id);

    // Log account creation
    try {
      await AuditLog.logPrivacyAction(
        savedUser._id,
        'OAUTH_ACCOUNT_CREATED',
        { 
          provider: 'google',
          email: profile.emails[0].value,
          name: profile.displayName
        },
        { 
          ipAddress: null, // Will be set in route handler
          userAgent: null  // Will be set in route handler
        }
      );
    } catch (auditError) {
      console.error('Error logging OAuth audit:', auditError);
    }

    return done(null, savedUser);

  } catch (error) {
    console.error('Google OAuth Strategy Error:', error);
    return done(error, null);
  }
  }));
} else {
  console.warn('Google OAuth credentials not found. Google authentication will be disabled.');
  console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file to enable Google OAuth.');
}

module.exports = passport;