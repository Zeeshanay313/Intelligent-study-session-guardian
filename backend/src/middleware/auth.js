const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../config/auth');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // SECURITY: Dev bypass should only work in development environment
    if (process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass'] === 'true') {
      console.warn('⚠️  DEV BYPASS MODE - This should never happen in production!');
      
      // Create or find test user for development
      const User = require('../models/User');
      
      let testUser = await User.findOne({ email: 'dev@test.com' });
      if (!testUser) {
        testUser = new User({
          email: 'dev@test.com',
          name: 'Dev User',
          password: 'dev123',
          emailVerified: true
        });
        await testUser.save();
        console.log('✅ Created dev test user:', testUser._id);
      }
      
      req.user = testUser;
      return next();
    }
    
    let token = null;
    
    // Check for token in cookies first (preferred method)
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user || user.deleted) {
      return res.status(401).json({ error: 'User not found or account deleted' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (user && !user.deleted) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Self or admin authorization (for accessing user-specific resources)
const requireSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const targetUserId = req.params.id || req.params.userId;
  
  if (req.user.role === 'admin' || req.user._id.toString() === targetUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Account verification middleware
const requireVerified = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({ 
      error: 'Account verification required',
      code: 'ACCOUNT_NOT_VERIFIED'
    });
  }
  
  next();
};

// Active account middleware (not soft deleted)
const requireActive = (req, res, next) => {
  if (req.user.deleted) {
    return res.status(403).json({ 
      error: 'Account is deactivated',
      code: 'ACCOUNT_DEACTIVATED'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireSelfOrAdmin,
  requireVerified,
  requireActive
};