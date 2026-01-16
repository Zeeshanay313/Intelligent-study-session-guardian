/**
 * Goal Tracker Routes - Enhanced Version
 *
 * RESTful API endpoints for goal management with progress tracking,
 * milestone management, and statistics
 *
 * @author Intelligent Study Session Guardian Team
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgress,
  completeSubTask,
  getStats,
  getProgressSummary,
  getWeeklyProgress,
  getMonthlyProgress,
  getMilestones,
  addMilestone,
  getCatchUpSuggestions,
  shareWithGuardian,
  getNotifications,
  markNotificationsRead
} = require('../controllers/goalTrackerController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/goals/stats - Get goal statistics for dashboard
// Must be before /:id route to avoid conflict
router.get('/stats', getStats);

// GET /api/goals/progress-summary - Get real-time progress summary
router.get('/progress-summary', getProgressSummary);

// GET /api/goals/catch-up-suggestions - Get suggestions for goals behind schedule
router.get('/catch-up-suggestions', getCatchUpSuggestions);

// GET /api/goals/notifications - Get notifications for user goals
router.get('/notifications', getNotifications);

// PUT /api/goals/notifications/mark-read - Mark notifications as read
router.put('/notifications/mark-read', markNotificationsRead);

// GET /api/goals - Get all goals for authenticated user
// Query params: ?userId, type, category, status, priority, period, limit, skip, sort
router.get('/', getGoals);

// GET /api/goals/:id - Get specific goal by ID with full details
router.get('/:id', getGoalById);

// GET /api/goals/:id/weekly-progress - Get weekly progress for specific goal
router.get('/:id/weekly-progress', getWeeklyProgress);

// GET /api/goals/:id/monthly-progress - Get monthly progress for specific goal
router.get('/:id/monthly-progress', getMonthlyProgress);

// GET /api/goals/:id/milestones - Get milestones for a goal
router.get('/:id/milestones', getMilestones);

// POST /api/goals - Create new goal
// Body: { title, description, type, target, period, category, priority, progressUnit, ... }
router.post('/', createGoal);

// POST /api/goals/:id/milestones - Add milestone to goal
router.post('/:id/milestones', addMilestone);

// POST /api/goals/:id/share-with-guardian - Share goal with guardian (with consent)
router.post('/:id/share-with-guardian', shareWithGuardian);

// PUT /api/goals/:id - Update existing goal
// Body: { title, description, target, milestones, subTasks, ... }
router.put('/:id', updateGoal);

// DELETE /api/goals/:id - Delete goal (soft delete by default)
// Query params: ?permanent=true for hard delete
router.delete('/:id', deleteGoal);

// POST /api/goals/:id/progress - Add progress to goal manually
// Body: { value: number, notes: string }
router.post('/:id/progress', addProgress);

// POST /api/goals/:id/subtasks/:subtaskId/complete - Complete a sub-task
router.post('/:id/subtasks/:subtaskId/complete', completeSubTask);

module.exports = router;


