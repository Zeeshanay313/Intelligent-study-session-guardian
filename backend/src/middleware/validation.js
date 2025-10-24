const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation failed for request:', {
      body: req.body,
      url: req.url,
      method: req.method,
      errors: errors.array()
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+\[\]{}|;:'",.<>~`])[A-Za-z\d@$!%*?&#^()\-_=+\[\]{}|;:'",.<>~`]+$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('displayName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Display name can only contain letters, spaces, hyphens, and apostrophes'),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
    .withMessage('Display name can only contain letters, numbers, spaces, hyphens, apostrophes, and periods'),
  body('timezone')
    .optional()
    .isString()
    .matches(/^[A-Za-z_\/]+$/)
    .withMessage('Invalid timezone format'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  body('preferences.fontSize')
    .optional()
    .isIn(['small', 'medium', 'large'])
    .withMessage('Font size must be small, medium, or large'),
  body('preferences.language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Language must be a valid locale code'),
  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('studyLevel')
    .optional()
    .isIn(['high-school', 'undergraduate', 'graduate', 'postgraduate', 'other', ''])
    .withMessage('Study level must be a valid option'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Institution name must be less than 200 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('notifications.study_reminders')
    .optional()
    .isBoolean()
    .withMessage('Study reminders must be a boolean'),
  body('notifications.goal_updates')
    .optional()
    .isBoolean()
    .withMessage('Goal updates must be a boolean'),
  body('notifications.achievement_alerts')
    .optional()
    .isBoolean()
    .withMessage('Achievement alerts must be a boolean'),
  body('notifications.break_reminders')
    .optional()
    .isBoolean()
    .withMessage('Break reminders must be a boolean'),
  handleValidationErrors
];

// Privacy settings validation
const validatePrivacyUpdate = [
  body('cameraConsent')
    .optional()
    .isBoolean()
    .withMessage('Camera consent must be a boolean'),
  body('guardianSharing')
    .optional()
    .isBoolean()
    .withMessage('Guardian sharing must be a boolean'),
  body('shareFields')
    .optional()
    .isArray()
    .withMessage('Share fields must be an array'),
  body('shareFields.*')
    .isIn(['profile', 'studyTime', 'progress', 'schedule'])
    .withMessage('Invalid share field'),
  body('notifications.inApp')
    .optional()
    .isBoolean()
    .withMessage('In-app notifications setting must be a boolean'),
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications setting must be a boolean'),
  body('notifications.studyReminders')
    .optional()
    .isBoolean()
    .withMessage('Study reminders setting must be a boolean'),
  body('notifications.guardianUpdates')
    .optional()
    .isBoolean()
    .withMessage('Guardian updates setting must be a boolean'),
  handleValidationErrors
];

// Guardian invitation validation
const validateGuardianInvite = [
  body('guardianEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid guardian email is required'),
  body('relationship')
    .isIn(['parent', 'teacher', 'tutor', 'mentor', 'other'])
    .withMessage('Invalid relationship type'),
  body('shareFields')
    .isArray({ min: 1 })
    .withMessage('At least one share field must be selected'),
  body('shareFields.*')
    .isIn(['profile', 'studyTime', 'progress', 'schedule', 'attendance'])
    .withMessage('Invalid share field'),
  body('accessLevel')
    .optional()
    .isIn(['view', 'limited', 'full'])
    .withMessage('Invalid access level'),
  handleValidationErrors
];

// Device registration validation
const validateDeviceRegistration = [
  body('deviceId')
    .notEmpty()
    .isLength({ min: 10, max: 200 })
    .withMessage('Device ID must be between 10 and 200 characters'),
  body('deviceInfo.name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device name must not exceed 100 characters'),
  body('deviceInfo.type')
    .optional()
    .isIn(['desktop', 'mobile', 'tablet', 'unknown'])
    .withMessage('Invalid device type'),
  body('deviceInfo.os')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('OS name must not exceed 50 characters'),
  body('deviceInfo.browser')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Browser name must not exceed 50 characters'),
  handleValidationErrors
];

// Device access update validation
const validateDeviceAccess = [
  body('accessEnabled')
    .optional()
    .isBoolean()
    .withMessage('Access enabled must be a boolean'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('permissions.camera')
    .optional()
    .isBoolean()
    .withMessage('Camera permission must be a boolean'),
  body('permissions.microphone')
    .optional()
    .isBoolean()
    .withMessage('Microphone permission must be a boolean'),
  body('permissions.notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications permission must be a boolean'),
  body('permissions.location')
    .optional()
    .isBoolean()
    .withMessage('Location permission must be a boolean'),
  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (field = 'id') => [
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`),
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePrivacyUpdate,
  validateGuardianInvite,
  validateDeviceRegistration,
  validateDeviceAccess,
  validatePasswordReset,
  validatePasswordChange,
  validatePagination,
  validateObjectId,
  validateDateRange
};