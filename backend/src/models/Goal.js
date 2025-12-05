/**
 * Goal Model - Enhanced Goal Tracking System
 *
 * Comprehensive goal management with milestones, progress tracking,
 * and integration with Focus Timer sessions for automatic progress updates
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  target: {
    type: Number,
    required: true,
    min: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    required: true
  },
  reward: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, { _id: true });

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  }
}, { _id: true });

const progressEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['session', 'manual', 'system'],
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, { _id: false });

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['hours', 'sessions', 'tasks', 'streak', 'custom'],
    required: true
  },
  target: {
    type: Number,
    required: true,
    min: 1
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'lifetime'],
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'personal', 'professional', 'health', 'skill', 'other'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  // Progress tracking
  currentProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  progressUnit: {
    type: String,
    enum: ['hours', 'minutes', 'sessions', 'tasks', 'points', 'days'],
    required: true
  },
  progressHistory: [progressEntrySchema],
  // Milestones for larger goals
  milestones: [milestoneSchema],
  // Sub-tasks for task-based goals
  subTasks: [subTaskSchema],
  // Deadline and scheduling
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  // Reminders and notifications
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly'],
    default: 'weekly'
  },
  // Integration settings
  autoProgressFromSessions: {
    type: Boolean,
    default: true
  },
  linkedSubjects: [{
    type: String,
    trim: true
  }],
  // Privacy and sharing
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  shareWithGuardians: {
    type: Boolean,
    default: true
  },
  // Completion tracking
  completedAt: {
    type: Date,
    default: null
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ userId: 1, type: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ dueDate: 1 }, { sparse: true });
goalSchema.index({ 'progressHistory.date': 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function () {
  if (this.target === 0) return 0;
  return Math.min(100, Math.round((this.currentProgress / this.target) * 100));
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function () {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completed milestones count
goalSchema.virtual('completedMilestonesCount').get(function () {
  return this.milestones.filter(m => m.completed).length;
});

// Virtual for completed sub-tasks count
goalSchema.virtual('completedSubTasksCount').get(function () {
  return this.subTasks.filter(t => t.completed).length;
});

// Method to add progress entry
goalSchema.methods.addProgress = function (value, source = 'manual', sessionId = null, notes = '') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if progress already exists for today from the same source
  const existingIndex = this.progressHistory.findIndex(entry => {
    const sameDate = entry.date.toDateString() === today.toDateString();
    const sameSource = entry.source === source;
    const sameSession = !sessionId || entry.sessionId?.toString() === sessionId?.toString();
    return sameDate && sameSource && sameSession;
  });

  if (existingIndex >= 0) {
    // Update existing entry
    this.progressHistory[existingIndex].value += value;
    this.progressHistory[existingIndex].notes = notes;
  } else {
    // Add new entry
    this.progressHistory.push({
      date: today,
      value,
      source,
      sessionId,
      notes
    });
  }

  // Update current progress
  this.currentProgress += value;

  // Check for milestone completion
  this.checkMilestoneCompletion();

  // Update completion rate
  this.updateCompletionRate();

  return this;
};

// Method to check and mark milestone completion
goalSchema.methods.checkMilestoneCompletion = function () {
  let milestonesCompleted = false;

  this.milestones.forEach(milestone => {
    if (!milestone.completed && this.currentProgress >= milestone.target) {
      milestone.completed = true;
      milestone.completedAt = new Date();
      milestonesCompleted = true;
    }
  });

  return milestonesCompleted;
};

// Method to complete a sub-task
goalSchema.methods.completeSubTask = function (subTaskId) {
  const subTask = this.subTasks.id(subTaskId);
  if (subTask && !subTask.completed) {
    subTask.completed = true;
    subTask.completedAt = new Date();
    this.updateCompletionRate();
    return true;
  }
  return false;
};

// Method to update completion rate
goalSchema.methods.updateCompletionRate = function () {
  if (this.type === 'tasks') {
    // For task-based goals, base completion on sub-tasks
    if (this.subTasks.length > 0) {
      const completedTasks = this.subTasks.filter(t => t.completed).length;
      this.completionRate = Math.round((completedTasks / this.subTasks.length) * 100);
    } else {
      this.completionRate = this.progressPercentage;
    }
  } else {
    // For time/session-based goals, use progress percentage
    this.completionRate = this.progressPercentage;
  }

  // Check if goal is completed
  if (this.completionRate >= 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
};

// Method to get progress for a specific period
goalSchema.methods.getProgressForPeriod = function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return this.progressHistory
    .filter(entry => entry.date >= startDate)
    .sort((a, b) => a.date - b.date);
};

// Static method to get goals due soon
goalSchema.statics.getDueSoon = function (userId, days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  return this.find({
    userId,
    status: 'active',
    dueDate: { $exists: true, $lte: cutoffDate }
  }).sort({ dueDate: 1 });
};

module.exports = mongoose.model('Goal', goalSchema);


