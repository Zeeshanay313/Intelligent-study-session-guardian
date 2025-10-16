const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  updateProgress,
  toggleMilestone
} = require('../controllers/goalTrackerController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/goals - Get all goals for authenticated user (with optional filtering)
// Query params: ?userId, targetType, completed, startDate, endDate, limit, skip
router.get('/', getGoals);

// GET /api/goals/:id - Get specific goal by ID
router.get('/:id', getGoalById);

// POST /api/goals - Create new goal
router.post('/', createGoal);

// PUT /api/goals/:id - Update existing goal
router.put('/:id', updateGoal);

// DELETE /api/goals/:id - Delete goal (soft delete)
router.delete('/:id', deleteGoal);

// POST /api/goals/:id/progress - Update goal progress atomically
// Body: { amount: number }
router.post('/:id/progress', updateProgress);

// POST /api/goals/:id/milestones/:milestoneId/toggle - Toggle milestone completion
router.post('/:id/milestones/:milestoneId/toggle', toggleMilestone);

module.exports = router;