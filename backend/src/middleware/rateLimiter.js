const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for authentication endpoints - disabled in development
const authLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.AUTH_RATE_LIMIT_MAX || 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
}) : (req, res, next) => next(); // No-op middleware for development

// Rate limiting for sensitive operations
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many sensitive operations attempted, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for data export (privacy-sensitive)
const exportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: {
    error: 'Too many data export requests, please try again tomorrow.',
    retryAfter: 86400
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Dynamic rate limiting based on user role
const createDynamicLimiter = (options = {}) => (req, res, next) => {
  const isAdmin = req.user && req.user.role === 'admin';
  const isPremium = req.user && req.user.plan === 'premium';

  let maxRequests = options.default || 100;

  if (isAdmin) {
    maxRequests = options.admin || maxRequests * 5;
  } else if (isPremium) {
    maxRequests = options.premium || maxRequests * 2;
  }

  const limiter = rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: maxRequests,
    message: {
      error: 'Rate limit exceeded for your user tier.',
      retryAfter: Math.floor(options.windowMs / 1000) || 900
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  limiter(req, res, next);
};

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  uploadLimiter,
  exportLimiter,
  createDynamicLimiter
};
