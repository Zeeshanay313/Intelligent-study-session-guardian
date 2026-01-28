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
    maxlength: 500,
    default: ''
  },
  target: {
    type: Number,
    required: false,
    min: 0,
    default: 0
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
    required: false,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week from now
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
  },
  // For real-time tracking
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Notification schema for milestone achievements
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['milestone_completed', 'goal_completed', 'behind_schedule', 'weekly_summary', 'monthly_summary'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date
  },
  triggeredBy: {
    type: String,
    enum: ['milestone', 'goal_completion', 'schedule_check', 'weekly_review', 'monthly_review']
  }
}, { _id: true, timestamps: true });

// Catch-up suggestion schema
const catchUpSuggestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['increase_daily', 'extend_deadline', 'break_down_further', 'focus_sessions'],
    required: true
  },
  suggestion: {
    type: String,
    required: true
  },
  impact: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

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
  guardianConsentGiven: {
    type: Boolean,
    default: false
  },
  sharedGuardians: [{
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guardian'
    },
    accessLevel: {
      type: String,
      enum: ['view', 'progress', 'notifications'],
      default: 'view'
    },
    consentDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Real-time notifications
  notifications: [notificationSchema],
  // Catch-up suggestions when behind schedule
  catchUpSuggestions: [catchUpSuggestionSchema],
  // Enhanced scheduling and tracking
  weeklyTarget: {
    type: Number,
    default: null // For weekly goals, auto-calculated from monthly
  },
  dailyTarget: {
    type: Number,
    default: null // For daily goals, auto-calculated from weekly/monthly
  },
  lastCheckedAt: {
    type: Date,
    default: Date.now
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  scheduleAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'weekly'
    },
    lastSent: {
      type: Date,
      default: null
    }
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

// Method to add progress entry with real-time tracking
goalSchema.methods.addProgress = function (value, source = 'manual', sessionId = null, notes = '') {
  const now = new Date();
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
    this.progressHistory[existingIndex].timestamp = now;
  } else {
    // Add new entry
    this.progressHistory.push({
      date: today,
      value,
      source,
      sessionId,
      notes,
      timestamp: now
    });
  }

  // Update current progress (capped at target to prevent over-completion)
  this.currentProgress += value;
  if (this.currentProgress > this.target) {
    this.currentProgress = this.target;
  }

  // Check for milestone completion and generate notifications
  const milestonesCompleted = this.checkMilestoneCompletion();

  // Update completion rate
  this.updateCompletionRate();

  // Generate notifications for milestones
  if (milestonesCompleted) {
    this.generateMilestoneNotifications();
  }

  // Update last checked time for real-time tracking
  this.lastCheckedAt = now;

  return this;
};

// Method to check and mark milestone completion
goalSchema.methods.checkMilestoneCompletion = function () {
  let milestonesCompleted = [];

  this.milestones.forEach(milestone => {
    if (!milestone.completed && this.currentProgress >= milestone.target) {
      milestone.completed = true;
      milestone.completedAt = new Date();
      milestonesCompleted.push(milestone);
    }
  });

  return milestonesCompleted.length > 0 ? milestonesCompleted : false;
};

// Method to generate milestone notifications
goalSchema.methods.generateMilestoneNotifications = function () {
  const recentMilestones = this.milestones.filter(m => 
    m.completed && 
    m.completedAt &&
    (new Date() - m.completedAt) < 60000 // Within last minute
  );

  recentMilestones.forEach(milestone => {
    this.notifications.push({
      type: 'milestone_completed',
      title: 'Milestone Achieved! 🎉',
      message: `Congratulations! You've completed the milestone: ${milestone.title}`,
      triggeredBy: 'milestone',
      sent: false
    });
  });

  // Check if goal is completed
  if (this.completionRate >= 100 && this.status !== 'completed') {
    this.notifications.push({
      type: 'goal_completed',
      title: 'Goal Completed! 🏆',
      message: `Amazing work! You've successfully completed your goal: ${this.title}`,
      triggeredBy: 'goal_completion',
      sent: false
    });
  }
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

// Method to calculate weekly/monthly targets
goalSchema.methods.calculatePeriodTargets = function () {
  if (this.period === 'monthly') {
    this.weeklyTarget = this.target / 4.33; // Average weeks in a month
    this.dailyTarget = this.target / 30; // Average days in a month
  } else if (this.period === 'weekly') {
    this.weeklyTarget = this.target;
    this.dailyTarget = this.target / 7;
  } else if (this.period === 'daily') {
    this.dailyTarget = this.target;
  }
};

// Method to check if goal is behind schedule and generate catch-up suggestions
goalSchema.methods.checkScheduleAndGenerateSuggestions = function () {
  const now = new Date();
  const timeElapsed = now - this.startDate;
  const totalTime = this.dueDate ? this.dueDate - this.startDate : null;
  
  if (!totalTime) return; // No deadline set
  
  const timeProgress = timeElapsed / totalTime;
  const goalProgress = this.currentProgress / this.target;
  
  // If we're significantly behind schedule
  if (timeProgress > goalProgress + 0.1) { // 10% threshold
    this.isOverdue = true;
    this.generateCatchUpSuggestions(timeProgress - goalProgress);
    
    // Add schedule alert notification
    this.notifications.push({
      type: 'behind_schedule',
      title: 'Schedule Alert ⚠️',
      message: `You're behind schedule on "${this.title}". Check your catch-up suggestions!`,
      triggeredBy: 'schedule_check',
      sent: false
    });
  } else {
    this.isOverdue = false;
  }
};

// Method to generate catch-up suggestions
goalSchema.methods.generateCatchUpSuggestions = function (deficitPercentage) {
  // Clear old suggestions
  this.catchUpSuggestions = [];
  
  const remaining = this.target - this.currentProgress;
  const daysLeft = this.dueDate ? Math.ceil((this.dueDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  
  if (!daysLeft || daysLeft <= 0) return;
  
  const requiredDailyIncrease = remaining / daysLeft;
  const currentDailyAverage = this.getCurrentDailyAverage();
  
  // Suggestion 1: Increase daily effort
  if (requiredDailyIncrease > currentDailyAverage) {
    this.catchUpSuggestions.push({
      type: 'increase_daily',
      suggestion: `Increase daily effort to ${requiredDailyIncrease.toFixed(1)} ${this.progressUnit}/day`,
      impact: `This will help you catch up and complete your goal on time`,
      difficulty: requiredDailyIncrease > currentDailyAverage * 1.5 ? 'hard' : 'medium'
    });
  }
  
  // Suggestion 2: Extend deadline (if reasonable)
  const reasonableExtension = Math.ceil(daysLeft * 0.3); // 30% extension
  this.catchUpSuggestions.push({
    type: 'extend_deadline',
    suggestion: `Consider extending deadline by ${reasonableExtension} days`,
    impact: `This would reduce daily requirement to ${(remaining / (daysLeft + reasonableExtension)).toFixed(1)} ${this.progressUnit}/day`,
    difficulty: 'easy'
  });
  
  // Suggestion 3: Break down further
  if (this.type === 'tasks' && this.subTasks.length < remaining) {
    this.catchUpSuggestions.push({
      type: 'break_down_further',
      suggestion: `Break remaining work into ${Math.ceil(remaining)} smaller sub-tasks`,
      impact: `Smaller tasks are easier to complete and track progress`,
      difficulty: 'medium'
    });
  }
  
  // Suggestion 4: Focus sessions
  if (this.type === 'hours') {
    const focusSessionsNeeded = Math.ceil(remaining / 1.5); // 1.5 hour focus sessions
    this.catchUpSuggestions.push({
      type: 'focus_sessions',
      suggestion: `Schedule ${focusSessionsNeeded} focused 90-minute study sessions`,
      impact: `Dedicated focus time can help you catch up efficiently`,
      difficulty: 'medium'
    });
  }
};

// Method to get current daily average
goalSchema.methods.getCurrentDailyAverage = function () {
  const recentProgress = this.getProgressForPeriod(14); // Last 2 weeks
  const totalRecent = recentProgress.reduce((sum, entry) => sum + entry.value, 0);
  return totalRecent / 14;
};

// Method to share goal with guardian (with consent)
goalSchema.methods.shareWithGuardian = async function (guardianId, accessLevel = 'view', userConsent = false) {
  if (!userConsent) {
    throw new Error('User consent required to share goal with guardian');
  }
  
  // Check if already shared with this guardian
  const existingShare = this.sharedGuardians.find(sg => sg.guardianId.toString() === guardianId.toString());
  
  if (existingShare) {
    existingShare.accessLevel = accessLevel;
    existingShare.consentDate = new Date();
  } else {
    this.sharedGuardians.push({
      guardianId,
      accessLevel,
      consentDate: new Date()
    });
  }
  
  this.guardianConsentGiven = true;
  return this;
};

// Method to get weekly progress summary
goalSchema.methods.getWeeklyProgressSummary = function () {
  const weekProgress = this.getProgressForPeriod(7);
  const weekTotal = weekProgress.reduce((sum, entry) => sum + entry.value, 0);
  
  return {
    period: 'weekly',
    target: this.weeklyTarget || this.target,
    actual: weekTotal,
    percentage: this.weeklyTarget ? (weekTotal / this.weeklyTarget) * 100 : 0,
    trend: this.calculateTrend(weekProgress),
    daysActive: weekProgress.length,
    avgPerDay: weekTotal / 7
  };
};

// Method to get monthly progress summary
goalSchema.methods.getMonthlyProgressSummary = function () {
  const monthProgress = this.getProgressForPeriod(30);
  const monthTotal = monthProgress.reduce((sum, entry) => sum + entry.value, 0);
  
  return {
    period: 'monthly',
    target: this.period === 'monthly' ? this.target : this.target * 4.33, // Convert weekly to monthly
    actual: monthTotal,
    percentage: this.period === 'monthly' ? (monthTotal / this.target) * 100 : (monthTotal / (this.target * 4.33)) * 100,
    trend: this.calculateTrend(monthProgress),
    daysActive: monthProgress.length,
    avgPerDay: monthTotal / 30
  };
};

// Method to calculate progress trend
goalSchema.methods.calculateTrend = function (progressData) {
  if (progressData.length < 2) return 'neutral';
  
  const firstHalf = progressData.slice(0, Math.floor(progressData.length / 2));
  const secondHalf = progressData.slice(Math.floor(progressData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.value, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg * 1.1) return 'improving';
  if (secondAvg < firstAvg * 0.9) return 'declining';
  return 'stable';
};

module.exports = mongoose.model('Goal', goalSchema);


