/**
 * Goal Tracker Controller - Enhanced Version
 *
 * Handles CRUD operations for goals with automatic progress tracking,
 * milestone management, and integration with session data
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Get all goals for a user with optional filtering
 * @route GET /api/goals
 */
const getGoals = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    const {
      type,
      category,
      status,
      priority,
      period,
      limit = 50,
      skip = 0,
      sort = '-createdAt'
    } = req.query;

    // Privacy check - only allow access to own goals unless sharing is enabled
    if (userId.toString() !== req.user._id.toString()) {
      const targetUser = await User.findById(userId).select('privacy.guardianSharing');
      if (!targetUser || !targetUser.privacy?.guardianSharing) {
        return res.status(403).json({
          error: 'Goal access denied - user has not enabled guardian sharing'
        });
      }
    }

    // Build filter query
    const filter = { userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (period) filter.period = period;

    // Fetch goals
    const goals = await Goal.find(filter)
      .limit(parseInt(limit, 10))
      .skip(parseInt(skip, 10))
      .sort(sort)
      .lean();

    // Calculate summary statistics
    const stats = await Goal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgProgress: { $avg: '$completionRate' }
        }
      }
    ]);

    const summary = {
      total: goals.length,
      active: stats.find(s => s._id === 'active')?.count || 0,
      completed: stats.find(s => s._id === 'completed')?.count || 0,
      paused: stats.find(s => s._id === 'paused')?.count || 0,
      avgProgress: stats.reduce((sum, s) => sum + (s.avgProgress || 0), 0) / (stats.length || 1)
    };

    res.json({
      success: true,
      goals,
      summary,
      pagination: {
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
        total: goals.length
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

/**
 * Get a specific goal by ID with full details
 * @route GET /api/goals/:id
 */
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id).lean();

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Privacy check
    if (goal.userId.toString() !== req.user._id.toString()) {
      const targetUser = await User.findById(goal.userId).select('privacy.guardianSharing');
      if (!targetUser || !targetUser.privacy?.guardianSharing) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ success: true, goal });
  } catch (error) {
    console.error('Get goal error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

/**
 * Create a new goal
 * @route POST /api/goals
 */
const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      target,
      period,
      category,
      priority,
      progressUnit,
      milestones,
      subTasks,
      dueDate,
      reminderEnabled,
      reminderFrequency,
      autoProgressFromSessions,
      linkedSubjects,
      visibility,
      shareWithGuardians
    } = req.body;

    // Validation
    console.log('📝 Received goal data:', { title, type, target, period, progressUnit, category });
    
    if (!title || !type || !target || !period || !progressUnit) {
      console.log('❌ Missing fields:', { title: !!title, type: !!type, target: !!target, period: !!period, progressUnit: !!progressUnit });
      return res.status(400).json({
        error: 'Missing required fields: title, type, target, period, progressUnit'
      });
    }

    // Create goal
    const goalData = {
      userId: req.user._id,
      title,
      description,
      type,
      target,
      period,
      category: category || 'personal',
      priority: priority || 'medium',
      progressUnit,
      milestones: milestones || [],
      subTasks: subTasks || [],
      dueDate,
      reminderEnabled: reminderEnabled !== false,
      reminderFrequency: reminderFrequency || 'weekly',
      autoProgressFromSessions: autoProgressFromSessions !== false,
      linkedSubjects: linkedSubjects || [],
      visibility: visibility || 'private',
      shareWithGuardians: shareWithGuardians !== false
    };
    
    console.log('🎯 Creating goal with data:', goalData);
    const goal = new Goal(goalData);

    await goal.save();
    console.log('✅ Goal saved successfully:', goal._id);

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'goal.created',
      resource: 'Goal',
      resourceId: goal._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({ success: true, goal });
  } catch (error) {
    console.error('❌ Create goal error:', error);
    console.error('Error details:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({ error: 'Failed to create goal', message: error.message });
  }
};

/**
 * Update an existing goal
 * @route PUT /api/goals/:id
 */
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title',
      'description',
      'target',
      'category',
      'priority',
      'status',
      'milestones',
      'subTasks',
      'dueDate',
      'reminderEnabled',
      'reminderFrequency',
      'linkedSubjects',
      'visibility',
      'shareWithGuardians'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        goal[field] = req.body[field];
      }
    });

    await goal.save();

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: 'goal.updated',
      resource: 'Goal',
      resourceId: goal._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

/**
 * Delete a goal (soft delete by marking as cancelled)
 * @route DELETE /api/goals/:id
 */
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (permanent === 'true') {
      // Hard delete
      await goal.deleteOne();
    } else {
      // Soft delete
      goal.status = 'cancelled';
      await goal.save();
    }

    // Audit log
    await AuditLog.create({
      userId: req.user._id,
      action: permanent === 'true' ? 'goal.deleted' : 'goal.cancelled',
      resource: 'Goal',
      resourceId: goal._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

/**
 * Add progress to a goal manually
 * @route POST /api/goals/:id/progress
 */
const addProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, notes } = req.body;

    if (!value || value <= 0) {
      return res.status(400).json({ error: 'Valid progress value required' });
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add progress using model method
    goal.addProgress(value, 'manual', null, notes || '');
    await goal.save();

    res.json({
      success: true,
      goal,
      message: 'Progress added successfully'
    });
  } catch (error) {
    console.error('Add progress error:', error);
    res.status(500).json({ error: 'Failed to add progress' });
  }
};

/**
 * Complete a sub-task
 * @route POST /api/goals/:id/subtasks/:subtaskId/complete
 */
const completeSubTask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;
    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = goal.completeSubTask(subtaskId);

    if (!success) {
      return res.status(404).json({ error: 'Sub-task not found or already completed' });
    }

    await goal.save();

    res.json({
      success: true,
      goal,
      message: 'Sub-task completed'
    });
  } catch (error) {
    console.error('Complete sub-task error:', error);
    res.status(500).json({ error: 'Failed to complete sub-task' });
  }
};

/**
 * Get goal statistics for dashboard
 * @route GET /api/goals/stats
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'week' } = req.query;

    // Get active goals
    const activeGoals = await Goal.find({ userId, status: 'active' });

    // Calculate period-specific stats
    let daysToLookBack = 7;
    if (period === 'month') daysToLookBack = 30;
    if (period === 'year') daysToLookBack = 365;

    const stats = {
      totalGoals: activeGoals.length,
      completedGoals: await Goal.countDocuments({ userId, status: 'completed' }),
      totalProgress: activeGoals.reduce((sum, g) => sum + g.currentProgress, 0),
      avgCompletionRate: activeGoals.reduce((sum, g) => sum + g.completionRate, 0) / (activeGoals.length || 1),
      dueSoon: await Goal.getDueSoon(userId, 7),
      recentProgress: []
    };

    // Get recent progress across all goals
    activeGoals.forEach(goal => {
      const recentProgress = goal.getProgressForPeriod(daysToLookBack);
      stats.recentProgress.push(...recentProgress);
    });

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

module.exports = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  addProgress,
  completeSubTask,
  getStats
};
