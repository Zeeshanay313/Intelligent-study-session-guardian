const { body } = require('express-validator');

const validateTimerPreset = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('workDuration')
    .isInt({ min: 60, max: 7200 })
    .withMessage('Work duration must be between 1 minute and 2 hours'),
  body('breakDuration')
    .isInt({ min: 60, max: 1800 })
    .withMessage('Break duration must be between 1 minute and 30 minutes'),
  body('longBreakDuration')
    .isInt({ min: 60, max: 3600 })
    .withMessage('Long break duration must be between 1 minute and 1 hour'),
  body('cyclesBeforeLongBreak')
    .isInt({ min: 2, max: 10 })
    .withMessage('Cycles before long break must be between 2 and 10')
];

const validateStartSession = [
  body('presetId')
    .optional()
    .isMongoId()
    .withMessage('Invalid preset ID'),
  body('customDurations')
    .optional()
    .isObject()
    .withMessage('Custom durations must be an object')
];

module.exports = {
  validateTimerPreset,
  validateStartSession
};