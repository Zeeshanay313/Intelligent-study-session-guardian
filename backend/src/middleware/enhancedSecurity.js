// Enhanced Security Configuration
const rateLimit = require('express-rate-limit');

// Account lockout storage (in production, use Redis)
const accountLockouts = new Map();

// Enhanced rate limiting for authentication - ALWAYS ENABLED
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900,
    lockoutActive: true
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // Custom handler for repeated failures
  handler: (req, res, next) => {
    const key = `auth_${req.ip}`;
    const currentAttempts = accountLockouts.get(key) || 0;
    
    if (currentAttempts >= 5) {
      // Progressive lockout: 15min -> 1hr -> 24hr
      const lockoutDuration = currentAttempts >= 10 ? 24 * 60 * 60 * 1000 : 
                              currentAttempts >= 7 ? 60 * 60 * 1000 : 
                              15 * 60 * 1000;
      
      accountLockouts.set(key, currentAttempts + 1);
      setTimeout(() => accountLockouts.delete(key), lockoutDuration);
      
      return res.status(429).json({
        error: 'Account temporarily locked due to repeated failed attempts',
        retryAfter: Math.floor(lockoutDuration / 1000),
        lockoutLevel: currentAttempts >= 10 ? 'severe' : currentAttempts >= 7 ? 'moderate' : 'standard'
      });
    }
    
    accountLockouts.set(key, currentAttempts + 1);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 900,
      attemptsRemaining: Math.max(0, 5 - currentAttempts - 1)
    });
  }
});

// CSRF Protection Middleware
const csrfProtection = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }
  
  next();
};

// Secure Cookie Configuration
const secureCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes for access token
  domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : 'localhost'
};

// Content Security Policy
const cspPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", process.env.CLIENT_URL],
    frameAncestors: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
};

// Input Sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove inline event handlers
    .trim();
};

// Password Security Validation
const validatePasswordSecurity = (password) => {
  const issues = [];
  
  if (password.length < 12) {
    issues.push('Password should be at least 12 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    issues.push('Password must contain lowercase letters');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    issues.push('Password must contain uppercase letters');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    issues.push('Password must contain numbers');
  }
  
  if (!/(?=.*[@$!%*?&#^()\-_=+\[\]{}|;:'",.<>~`])/.test(password)) {
    issues.push('Password must contain special characters');
  }
  
  // Check against common passwords
  const commonPasswords = ['password123', '123456789', 'qwerty123', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    issues.push('Password is too common, please choose a more unique password');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    strength: issues.length === 0 ? 'strong' : issues.length <= 2 ? 'medium' : 'weak'
  };
};

module.exports = {
  authLimiter,
  csrfProtection,
  secureCookieOptions,
  cspPolicy,
  sanitizeInput,
  validatePasswordSecurity,
  accountLockouts // For testing/admin purposes
};