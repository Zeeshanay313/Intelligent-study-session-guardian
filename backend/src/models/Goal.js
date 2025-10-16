const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  done: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date,
    required: true
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
    maxlength: 1000,
    default: ''
  },
  targetType: {
    type: String,
    enum: ['hours', 'sessions', 'tasks'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true,
    min: 1,
    max: 10000
  },
  progressValue: {
    type: Number,
    default: 0,
    min: 0
  },
  milestones: [milestoneSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (!this.targetValue || this.targetValue === 0) return 0;
  return Math.min(Math.round((this.progressValue / this.targetValue) * 100), 100);
});

// Virtual for completion status
goalSchema.virtual('isCompleted').get(function() {
  return this.progressValue >= this.targetValue;
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const timeDiff = this.endDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Virtual for milestone completion percentage
goalSchema.virtual('milestoneProgress').get(function() {
  if (!this.milestones || this.milestones.length === 0) return 100;
  const completedMilestones = this.milestones.filter(m => m.done).length;
  return Math.round((completedMilestones / this.milestones.length) * 100);
});

// Pre-save middleware to handle completion
goalSchema.pre('save', function(next) {
  if (this.progressValue >= this.targetValue && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.progressValue < this.targetValue) {
    this.completedAt = null;
  }
  next();
});

// Static method to find user goals with filtering
goalSchema.statics.findUserGoals = function(userId, filters = {}) {
  const query = { userId, isActive: true };
  
  if (filters.targetType) {
    query.targetType = filters.targetType;
  }
  
  if (filters.completed !== undefined) {
    if (filters.completed) {
      query.completedAt = { $ne: null };
    } else {
      query.completedAt = null;
    }
  }
  
  if (filters.startDate && filters.endDate) {
    query.$and = [
      { startDate: { $lte: new Date(filters.endDate) } },
      { endDate: { $gte: new Date(filters.startDate) } }
    ];
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to update progress atomically
goalSchema.methods.updateProgress = function(amount) {
  return this.constructor.findOneAndUpdate(
    { _id: this._id },
    { $inc: { progressValue: amount } },
    { new: true, runValidators: true }
  );
};

// Instance method to toggle milestone
goalSchema.methods.toggleMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone) {
    milestone.done = !milestone.done;
    return this.save();
  }
  throw new Error('Milestone not found');
};

// Indexes
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ userId: 1, targetType: 1 });
goalSchema.index({ userId: 1, completedAt: -1 });
goalSchema.index({ endDate: 1 });
goalSchema.index({ visibility: 1 });

module.exports = mongoose.model('Goal', goalSchema);