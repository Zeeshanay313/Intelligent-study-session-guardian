const express = require('express');
const { authenticate } = require('../../middleware/auth');
const {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  triggerReminder
} = require('./reminderController');
const { validateReminder } = require('./reminderValidation');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Reminder CRUD routes
router.get('/', getReminders);
router.post('/', validateReminder, createReminder);
router.put('/:id', validateReminder, updateReminder);
router.delete('/:id', deleteReminder);

// Manual trigger route (for testing)
router.post('/:id/trigger', triggerReminder);

module.exports = router;
