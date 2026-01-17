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
const Guardian = require('../models/Guardian');
const AuditLog = require('../models/AuditLog');
const { generateRealtimeProgressSummary, sendNotifications } = require('../services/GoalProgressService');
const { 
  awardGoalCompletionPoints, 
  queueAchievementNotification,
  checkAndAwardRewards 
} = require('../services/RewardsService');

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
    if (status) {
      filter.status = status;
    } else {
      // By default, exclude cancelled/deleted goals unless specifically requested
      filter.status = { $ne: 'cancelled' };
    }
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
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          status: { $ne: 'cancelled' }  // Exclude cancelled goals from stats
        } 
      },
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

    res.json({ success: true, data: goal });
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
      // Process milestones to ensure proper structure
      milestones: (milestones || []).map(m => ({
        title: m.title || 'Untitled Milestone',
        description: m.description || '',
        target: Number(m.target) || 0,
        completed: m.completed || false,
        completedAt: m.completedAt || null,
        dueDate: m.dueDate ? new Date(m.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reward: m.reward || ''
      })),
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

    // Audit log (optional - skip if fails)
    try {
      // Note: AuditLog currently only supports account/privacy actions
      // Goal tracking audit could be added to a separate logging system
    } catch (auditError) {
      console.warn('Audit log failed (non-critical):', auditError.message);
    }

    res.status(201).json({ success: true, data: goal });
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }

    // First check if goal exists and user has access
    const existingGoal = await Goal.findById(id);

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (existingGoal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track if goal was already completed before update
    const wasCompleted = existingGoal.status === 'completed';

    // Build update object
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
      'shareWithGuardians',
      'progressUnit',
      'period',
      'type'
    ];

    const updateData = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        // Special handling for milestones - ensure proper structure
        if (field === 'milestones' && Array.isArray(req.body[field])) {
          updateData[field] = req.body[field].map(m => ({
            title: m.title || 'Untitled Milestone',
            description: m.description || '',
            target: Number(m.target) || 0,
            completed: m.completed || false,
            completedAt: m.completedAt || null,
            dueDate: m.dueDate ? new Date(m.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reward: m.reward || ''
          }));
        } else {
          updateData[field] = req.body[field];
        }
      }
    });

    // Use findByIdAndUpdate to avoid version conflicts
    const goal = await Goal.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Check if goal just got completed and award rewards
    let rewardResult = null;
    if (!wasCompleted && goal.status === 'completed') {
      rewardResult = await awardGoalCompletionPoints(req.user._id, goal);
      
      // Queue achievement notification
      queueAchievementNotification(req.user._id, {
        type: 'goal_completed',
        title: '🎯 Goal Completed!',
        message: `Congratulations! You completed "${goal.title}"`,
        pointsAwarded: rewardResult.pointsAwarded,
        goalId: goal._id
      });
    }

    // Note: Goal audit logging skipped - AuditLog model only supports account/privacy actions

    res.json({ success: true, data: goal, rewardResult });
  } catch (error) {
    console.error('Update goal error:', error.message);
    console.error('Stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({ error: 'Failed to update goal', details: error.message });
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }

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

    // Note: Goal audit logging skipped - AuditLog model only supports account/privacy actions
    // Could be added to a separate activity log in the future

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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }

    const goal = await Goal.findById(id);

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track if goal was already completed
    const wasCompleted = goal.status === 'completed';

    // Add progress using model method
    goal.addProgress(value, 'manual', null, notes || '');
    await goal.save();

    // Check if goal just got completed and award rewards
    let rewardResult = null;
    if (!wasCompleted && goal.status === 'completed') {
      rewardResult = await awardGoalCompletionPoints(req.user._id, goal);
      
      // Queue achievement notification
      queueAchievementNotification(req.user._id, {
        type: 'goal_completed',
        title: '🎯 Goal Completed!',
        message: `Congratulations! You completed "${goal.title}"`,
        pointsAwarded: rewardResult.pointsAwarded,
        goalId: goal._id
      });
    }

    res.json({
      success: true,
      goal,
      message: 'Progress added successfully',
      rewardResult
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

    // Track if goal was already completed
    const wasCompleted = goal.status === 'completed';

    const success = goal.completeSubTask(subtaskId);

    if (!success) {
      return res.status(404).json({ error: 'Sub-task not found or already completed' });
    }

    await goal.save();

    // Check if goal just got completed and award rewards
    let rewardResult = null;
    if (!wasCompleted && goal.status === 'completed') {
      rewardResult = await awardGoalCompletionPoints(req.user._id, goal);
      
      // Queue achievement notification
      queueAchievementNotification(req.user._id, {
        type: 'goal_completed',
        title: '🎯 Goal Completed!',
        message: `Congratulations! You completed "${goal.title}"`,
        pointsAwarded: rewardResult.pointsAwarded,
        goalId: goal._id
      });
    }

    res.json({
      success: true,
      goal,
      message: 'Sub-task completed',
      rewardResult
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

/**
 * Get real-time progress summary with weekly/monthly breakdowns
 * @route GET /api/goals/progress-summary
 */
const getProgressSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const summary = await generateRealtimeProgressSummary(userId);
    
    res.json({ 
      success: true, 
      summary 
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
};

/**
 * Get weekly progress for specific goal
 * @route GET /api/goals/:id/weekly-progress
 */
const getWeeklyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

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

    goal.calculatePeriodTargets();
    const weeklyProgress = goal.getWeeklyProgressSummary();

    res.json({
      success: true,
      weeklyProgress,
      goal: {
        id: goal._id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        currentProgress: goal.currentProgress
      }
    });
  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
};

/**
 * Get monthly progress for specific goal
 * @route GET /api/goals/:id/monthly-progress
 */
const getMonthlyProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

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

    goal.calculatePeriodTargets();
    const monthlyProgress = goal.getMonthlyProgressSummary();

    res.json({
      success: true,
      monthlyProgress,
      goal: {
        id: goal._id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        currentProgress: goal.currentProgress
      }
    });
  } catch (error) {
    console.error('Get monthly progress error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly progress' });
  }
};

/**
 * Get milestones for a goal
 * @route GET /api/goals/:id/milestones
 */
const getMilestones = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

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

    const milestones = goal.milestones.map(milestone => ({
      ...milestone.toObject(),
      progressToMilestone: Math.min(100, (goal.currentProgress / milestone.target) * 100)
    }));

    res.json({
      success: true,
      milestones,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.completed).length
    });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
};

/**
 * Add milestone to goal
 * @route POST /api/goals/:id/milestones
 */
const addMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, target, dueDate, reward } = req.body;

    if (!title || !target || !dueDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, target, dueDate' 
      });
    }

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Privacy check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    goal.milestones.push({
      title,
      description,
      target,
      dueDate: new Date(dueDate),
      reward
    });

    await goal.save();

    res.json({
      success: true,
      message: 'Milestone added',
      milestone: goal.milestones[goal.milestones.length - 1]
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ error: 'Failed to add milestone' });
  }
};

/**
 * Get catch-up suggestions for goals behind schedule
 * @route GET /api/goals/catch-up-suggestions
 */
const getCatchUpSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({ 
      userId, 
      status: 'active',
      $or: [
        { isOverdue: true },
        { 'catchUpSuggestions.0': { $exists: true } }
      ]
    });

    const suggestions = goals.map(goal => ({
      goalId: goal._id,
      goalTitle: goal.title,
      isOverdue: goal.isOverdue,
      completionRate: goal.completionRate,
      suggestions: goal.catchUpSuggestions,
      daysRemaining: goal.daysRemaining
    }));

    res.json({
      success: true,
      suggestions,
      totalGoalsBehind: suggestions.length
    });
  } catch (error) {
    console.error('Get catch-up suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch catch-up suggestions' });
  }
};

/**
 * Share goal with guardian (with consent)
 * @route POST /api/goals/:id/share-with-guardian
 */
const shareWithGuardian = async (req, res) => {
  try {
    const { id } = req.params;
    const { guardianId, accessLevel = 'view', userConsent } = req.body;

    if (!guardianId || !userConsent) {
      return res.status(400).json({ 
        error: 'Guardian ID and user consent required' 
      });
    }

    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Privacy check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify guardian relationship
    const guardian = await Guardian.findOne({
      userId: goal.userId,
      guardianId,
      consentStatus: 'accepted'
    });

    if (!guardian) {
      return res.status(404).json({ 
        error: 'Guardian relationship not found or not accepted' 
      });
    }

    await goal.shareWithGuardian(guardianId, accessLevel, userConsent);
    await goal.save();

    res.json({
      success: true,
      message: 'Goal shared with guardian',
      sharedWith: goal.sharedGuardians.find(sg => sg.guardianId.toString() === guardianId)
    });
  } catch (error) {
    console.error('Share with guardian error:', error);
    res.status(500).json({ error: 'Failed to share goal with guardian' });
  }
};

/**
 * Get notifications for user goals
 * @route GET /api/goals/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sent = false, limit = 50 } = req.query;

    const goals = await Goal.find({ 
      userId, 
      'notifications.sent': sent === 'true' 
    }).select('title notifications');

    const notifications = [];
    goals.forEach(goal => {
      goal.notifications
        .filter(n => n.sent === (sent === 'true'))
        .forEach(notification => {
          notifications.push({
            ...notification.toObject(),
            goalId: goal._id,
            goalTitle: goal.title
          });
        });
    });

    // Sort by creation date, newest first
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      notifications: notifications.slice(0, parseInt(limit)),
      total: notifications.length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

/**
 * Mark notifications as read
 * @route PUT /api/goals/notifications/mark-read
 */
const markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ 
        error: 'Notification IDs array required' 
      });
    }

    await Goal.updateMany(
      { 
        userId,
        'notifications._id': { $in: notificationIds }
      },
      { 
        $set: { 
          'notifications.$.sent': true,
          'notifications.$.sentAt': new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Marked ${notificationIds.length} notifications as read`
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
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
};
