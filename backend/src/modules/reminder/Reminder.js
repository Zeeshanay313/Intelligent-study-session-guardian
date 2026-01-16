const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, trim: true, maxlength: 1000, default: '' },
  customMessage: { type: String, trim: true, maxlength: 500, default: '' },
  
  // Type: one-off or recurring
  type: { type: String, enum: ['one-off', 'recurring'], required: true },
  
  // One-off reminder settings
  datetime: { type: Date, default: null },
  
  // Recurring reminder settings
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'custom'], 
      default: 'daily' 
    },
    interval: { type: Number, default: 1 }, // Every X days/weeks/months
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
    timeOfDay: { type: String, default: '09:00' }, // HH:mm format
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    lastTriggered: { type: Date, default: null },
    nextTrigger: { type: Date, default: null }
  },
  
  cronExpression: { type: String, default: null },
  
  // Delivery channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  
  // Sound settings
  sound: {
    enabled: { type: Boolean, default: true },
    type: { 
      type: String, 
      enum: ['default', 'chime', 'bell', 'soft', 'urgent'], 
      default: 'default' 
    }
  },
  
  // Snooze tracking
  snooze: {
    count: { type: Number, default: 0 },
    lastSnoozed: { type: Date, default: null },
    snoozedUntil: { type: Date, default: null },
    snoozeHistory: [{
      snoozedAt: { type: Date },
      duration: { type: Number }, // minutes
      reason: { type: String }
    }]
  },
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['pending', 'active', 'snoozed', 'dismissed', 'completed', 'expired'], 
    default: 'pending',
    index: true
  },
  dismissedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  
  // Calendar integration
  calendarLinked: { type: Boolean, default: false },
  calendarSync: {
    provider: { type: String, enum: ['google', 'outlook', null], default: null },
    eventId: { type: String, default: null },
    lastSynced: { type: Date, default: null },
    syncEnabled: { type: Boolean, default: false }
  },
  
  // Idle nudge settings
  idleNudge: {
    enabled: { type: Boolean, default: false },
    idleThreshold: { type: Number, default: 5 }, // minutes of inactivity
    nudgeInterval: { type: Number, default: 10 }, // send nudge every X minutes
    lastNudgeSent: { type: Date, default: null }
  },
  
  // Activity tracking
  interactions: [{
    action: { 
      type: String, 
      enum: ['delivered', 'viewed', 'snoozed', 'dismissed', 'completed', 'nudged'] 
    },
    channel: { type: String, enum: ['inApp', 'email', 'push'] },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed }
  }],
  
  // Priority
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  
  // Tags for categorization
  tags: [{ type: String, trim: true }],
  category: { 
    type: String, 
    enum: ['study', 'break', 'assignment', 'exam', 'general'], 
    default: 'general' 
  },
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for efficient queries
reminderSchema.index({ userId: 1, status: 1 });
reminderSchema.index({ userId: 1, type: 1 });
reminderSchema.index({ 'recurring.nextTrigger': 1 });
reminderSchema.index({ datetime: 1 });
reminderSchema.index({ category: 1 });

// Methods
reminderSchema.methods.snoozeReminder = function(durationMinutes, reason = '') {
  this.snooze.count += 1;
  this.snooze.lastSnoozed = new Date();
  this.snooze.snoozedUntil = new Date(Date.now() + durationMinutes * 60000);
  this.snooze.snoozeHistory.push({
    snoozedAt: new Date(),
    duration: durationMinutes,
    reason
  });
  this.status = 'snoozed';
  
  this.interactions.push({
    action: 'snoozed',
    channel: 'inApp',
    timestamp: new Date(),
    metadata: { duration: durationMinutes, reason }
  });
  
  return this.save();
};

reminderSchema.methods.dismiss = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  
  this.interactions.push({
    action: 'dismissed',
    channel: 'inApp',
    timestamp: new Date()
  });
  
  return this.save();
};

reminderSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  this.interactions.push({
    action: 'completed',
    channel: 'inApp',
    timestamp: new Date()
  });
  
  return this.save();
};

reminderSchema.methods.calculateNextTrigger = function() {
  if (this.type !== 'recurring' || !this.recurring.enabled) return null;
  
  const now = new Date();
  const { frequency, interval, daysOfWeek, timeOfDay, startDate, endDate } = this.recurring;
  
  let nextTrigger = new Date(this.recurring.lastTriggered || startDate || now);
  
  switch (frequency) {
    case 'daily':
      nextTrigger.setDate(nextTrigger.getDate() + interval);
      break;
    case 'weekly':
      nextTrigger.setDate(nextTrigger.getDate() + (7 * interval));
      break;
    case 'monthly':
      nextTrigger.setMonth(nextTrigger.getMonth() + interval);
      break;
  }
  
  // Set time of day
  if (timeOfDay) {
    const [hours, minutes] = timeOfDay.split(':');
    nextTrigger.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  }
  
  // Check if within valid range
  if (endDate && nextTrigger > endDate) {
    this.status = 'expired';
    return null;
  }
  
  this.recurring.nextTrigger = nextTrigger;
  return nextTrigger;
};

module.exports = mongoose.model('Reminder', reminderSchema);
