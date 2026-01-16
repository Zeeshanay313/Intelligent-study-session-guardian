/**
 * Motivational Tip Model
 *
 * Stores motivational tips, quotes, and performance-based messages
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const motivationalTipSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['quote', 'tip', 'encouragement', 'achievement', 'challenge', 'reminder'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['productivity', 'motivation', 'health', 'study-technique', 'mindset', 'break', 'focus'],
    default: 'motivation'
  },
  // Conditions for displaying the tip
  triggers: {
    performanceLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'any'],
      default: 'any'
    },
    streakMilestone: {
      type: Number,
      default: null // null = not based on streak
    },
    sessionCount: {
      type: Number,
      default: null // null = not based on session count
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'any'],
      default: 'any'
    },
    context: {
      type: String,
      enum: ['session-start', 'session-end', 'break', 'behind-goal', 'on-track', 'ahead-goal', 'any'],
      default: 'any'
    }
  },
  // Display settings
  icon: {
    type: String,
    default: '💡'
  },
  color: {
    type: String,
    default: '#10B981'
  },
  author: {
    type: String,
    default: ''
  },
  // Usage tracking
  displayCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, {
  timestamps: true
});

// Indexes
motivationalTipSchema.index({ type: 1, isActive: 1 });
motivationalTipSchema.index({ 'triggers.context': 1 });

// Static method to get random tip based on criteria
motivationalTipSchema.statics.getRandomTip = async function(criteria = {}) {
  const {
    type,
    performanceLevel = 'any',
    streakCount = 0,
    sessionCount = 0,
    timeOfDay = 'any',
    context = 'any'
  } = criteria;
  
  const query = { isActive: true };
  
  if (type) {
    query.type = type;
  }
  
  // Match triggers
  query.$or = [
    { 'triggers.performanceLevel': performanceLevel },
    { 'triggers.performanceLevel': 'any' }
  ];
  
  if (context !== 'any') {
    query.$and = [
      {
        $or: [
          { 'triggers.context': context },
          { 'triggers.context': 'any' }
        ]
      }
    ];
  }
  
  const tips = await this.find(query).sort({ priority: -1 });
  
  if (tips.length === 0) {
    return null;
  }
  
  // Weighted random selection based on priority
  const totalWeight = tips.reduce((sum, tip) => sum + tip.priority, 0);
  let random = Math.random() * totalWeight;
  
  for (const tip of tips) {
    random -= tip.priority;
    if (random <= 0) {
      tip.displayCount += 1;
      await tip.save();
      return tip;
    }
  }
  
  return tips[0];
};

const MotivationalTip = mongoose.model('MotivationalTip', motivationalTipSchema);

module.exports = MotivationalTip;
