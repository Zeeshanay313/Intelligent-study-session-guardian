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
  getStats
} = require('../controllers/goalTrackerController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/goals/stats - Get goal statistics for dashboard
// Must be before /:id route to avoid conflict
router.get('/stats', getStats);

// GET /api/goals - Get all goals for authenticated user
// Query params: ?userId, type, category, status, priority, period, limit, skip, sort
router.get('/', getGoals);

// GET /api/goals/:id - Get specific goal by ID with full details
router.get('/:id', getGoalById);

// POST /api/goals - Create new goal
// Body: { title, description, type, target, period, category, priority, progressUnit, ... }
router.post('/', createGoal);

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


