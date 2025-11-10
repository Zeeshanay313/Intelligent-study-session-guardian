const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const User = require('../models/User');

// Get all goals for a user with optional filtering
const getGoals = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    const {
      targetType,
      completed,
      startDate,
      endDate,
      limit = 50,
      skip = 0
    } = req.query;

    // Privacy check - only allow access to own goals unless sharing is enabled
    if (userId.toString() !== req.user._id.toString()) {
      const targetUser = await User.findById(userId).select('privacy.guardianSharing');
      if (!targetUser || !targetUser.privacy.guardianSharing) {
        return res.status(403).json({
          error: 'Goal access denied - user has not enabled guardian sharing'
        });
      }
    }

    const filters = {};
    if (targetType && ['hours', 'sessions', 'tasks'].includes(targetType)) {
      filters.targetType = targetType;
    }
    if (completed !== undefined) {
      filters.completed = completed === 'true';
    }
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const goals = await Goal.findUserGoals(userId, filters)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Calculate summary statistics
    const stats = await Goal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: null,
          totalGoals: { $sum: 1 },
          completedGoals: {
            $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] }
          },
          totalProgress: { $sum: '$progressValue' },
          totalTarget: { $sum: '$targetValue' }
        }
      }
    ]);

    const summary = stats.length > 0 ? stats[0] : {
      totalGoals: 0,
      completedGoals: 0,
      totalProgress: 0,
      totalTarget: 0
    };

    res.json({
      goals,
      summary,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        total: goals.length
      }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

// Get a specific goal by ID
const getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);

    if (!goal || !goal.isActive) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Privacy check
    if (goal.userId.toString() !== req.user._id.toString()) {
      const targetUser = await User.findById(goal.userId).select('privacy.guardianSharing');
      if (!targetUser || !targetUser.privacy.guardianSharing) {
        return res.status(403).json({
          error: 'Goal access denied - user has not enabled guardian sharing'
        });
      }
    }

    res.json({ goal });
  } catch (error) {
    console.error('Get goal by ID error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
};

// Create a new goal
const createGoal = async (req, res) => {
  try {
    const {
      title,
      description,
      targetType,
      targetValue,
      milestones,
      startDate,
      endDate,
      visibility
    } = req.body;

    // Input validation
    if (!title || !targetType || !targetValue || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required fields: title, targetType, targetValue, startDate, endDate'
      });
    }

    if (!['hours', 'sessions', 'tasks'].includes(targetType)) {
      return res.status(400).json({
        error: 'Invalid targetType. Must be one of: hours, sessions, tasks'
      });
    }

    if (targetValue <= 0 || targetValue > 10000) {
      return res.status(400).json({
        error: 'Target value must be between 1 and 10000'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        error: 'End date must be after start date'
      });
    }

    // Privacy enforcement - check user's sharing preferences
    const user = await User.findById(req.user._id).select('privacy.guardianSharing');
    let finalVisibility = visibility || 'private';

    if (!user.privacy.guardianSharing && (finalVisibility === 'shared' || finalVisibility === 'public')) {
      finalVisibility = 'private'; // Force private if sharing is disabled
    }

    const goalData = {
      userId: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : '',
      targetType,
      targetValue: parseInt(targetValue),
      startDate: start,
      endDate: end,
      visibility: finalVisibility
    };

    // Process milestones if provided
    if (milestones && Array.isArray(milestones)) {
      goalData.milestones = milestones
        .filter(m => m.title && m.dueDate)
        .map(milestone => ({
          title: milestone.title.trim(),
          dueDate: new Date(milestone.dueDate),
          done: false
        }))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    const goal = new Goal(goalData);
    await goal.save();

    res.status(201).json({
      message: 'Goal created successfully',
      goal,
      privacyNote: !user.privacy.guardianSharing && visibility !== 'private'
        ? 'Visibility was set to private due to privacy settings'
        : null
    });
  } catch (error) {
    console.error('Create goal error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
};

// Update an existing goal
const updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const goal = await Goal.findById(id);
    if (!goal || !goal.isActive) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Authorization check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this goal' });
    }

    // Privacy enforcement for visibility updates
    if (updates.visibility) {
      const user = await User.findById(req.user._id).select('privacy.guardianSharing');
      if (!user.privacy.guardianSharing && (updates.visibility === 'shared' || updates.visibility === 'public')) {
        updates.visibility = 'private';
      }
    }

    // Validate date updates
    if (updates.startDate || updates.endDate) {
      const startDate = new Date(updates.startDate || goal.startDate);
      const endDate = new Date(updates.endDate || goal.endDate);
      if (startDate >= endDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    // Process milestone updates
    if (updates.milestones && Array.isArray(updates.milestones)) {
      updates.milestones = updates.milestones
        .filter(m => m.title && m.dueDate)
        .map(milestone => ({
          _id: milestone._id || new mongoose.Types.ObjectId(),
          title: milestone.title.trim(),
          dueDate: new Date(milestone.dueDate),
          done: Boolean(milestone.done)
        }))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    const updatedGoal = await Goal.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Goal updated successfully',
      goal: updatedGoal
    });
  } catch (error) {
    console.error('Update goal error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

// Delete a goal (soft delete)
const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findById(id);
    if (!goal || !goal.isActive) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Authorization check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this goal' });
    }

    // Soft delete
    goal.isActive = false;
    await goal.save();

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};

// Update goal progress atomically
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const goal = await Goal.findById(id);
    if (!goal || !goal.isActive) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Authorization check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this goal' });
    }

    // Atomic update to prevent race conditions
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, isActive: true },
      {
        $inc: { progressValue: amount },
        $set: { updatedAt: new Date() }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedGoal) {
      return res.status(404).json({ error: 'Goal not found or update failed' });
    }

    // Check for goal completion
    const wasJustCompleted = !goal.completedAt && updatedGoal.progressValue >= updatedGoal.targetValue;

    res.json({
      message: wasJustCompleted ? 'Goal completed! Congratulations!' : 'Progress updated successfully',
      goal: updatedGoal,
      justCompleted: wasJustCompleted
    });
  } catch (error) {
    console.error('Update progress error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

// Toggle milestone completion
const toggleMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;

    const goal = await Goal.findById(id);
    if (!goal || !goal.isActive) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Authorization check
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this goal' });
    }

    const milestone = goal.milestones.id(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    milestone.done = !milestone.done;
    await goal.save();

    res.json({
      message: `Milestone ${milestone.done ? 'completed' : 'reopened'}`,
      goal,
      milestone
    });
  } catch (error) {
    console.error('Toggle milestone error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    res.status(500).json({ error: 'Failed to toggle milestone' });
  }
};

module.exports = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  updateProgress,
  toggleMilestone
};
