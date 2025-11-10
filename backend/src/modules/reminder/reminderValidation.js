const { body } = require('express-validator');
const cron = require('node-cron');

const validateReminder = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('message')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters'),
  body('type')
    .isIn(['one-off', 'recurring'])
    .withMessage('Type must be either "one-off" or "recurring"'),
  body('cronExpression')
    .if(body('type').equals('recurring'))
    .notEmpty()
    .withMessage('Cron expression is required for recurring reminders')
    .custom((value) => {
      if (!cron.validate(value)) {
        throw new Error('Invalid cron expression');
      }
      return true;
    }),
  body('datetime')
    .if(body('type').equals('one-off'))
    .notEmpty()
    .withMessage('Datetime is required for one-off reminders')
    .isISO8601()
    .withMessage('Invalid datetime format')
    .custom((value) => {
      const reminderTime = new Date(value);
      const now = new Date();
      if (reminderTime <= now) {
        throw new Error('Reminder time must be in the future');
      }
      return true;
    }),
  body('channels')
    .optional()
    .isObject()
    .withMessage('Channels must be an object'),
  body('channels.inApp')
    .optional()
    .isBoolean()
    .withMessage('inApp channel must be boolean'),
  body('channels.email')
    .optional()
    .isBoolean()
    .withMessage('email channel must be boolean'),
  body('channels.push')
    .optional()
    .isBoolean()
    .withMessage('push channel must be boolean'),
  body('calendarLinked')
    .optional()
    .isBoolean()
    .withMessage('calendarLinked must be boolean')
];

module.exports = {
  validateReminder
};