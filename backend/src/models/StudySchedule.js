/**
 * Study Schedule Model
 *
 * Manages user study schedules, recurring sessions, and time blocks
 *
 * @author Intelligent Study Session Guardian Team
 */

const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Time settings
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6, // 0 = Sunday, 6 = Saturday
    required: true
  },
  startTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM" (24-hour)
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: true
  },
  recurrencePattern: {
    type: String,
    enum: ['weekly', 'biweekly', 'custom'],
    default: 'weekly'
  },
  // Related data
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Preset',
    default: null
  },
  // Reminders
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  reminderMinutesBefore: {
    type: Number,
    default: 15,
    min: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: '📚'
  }
}, { _id: true });

const studyScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Schedule entries
  entries: [scheduleEntrySchema],
  // Settings
  timezone: {
    type: String,
    default: 'UTC'
  },
  weekStartsOn: {
    type: Number,
    min: 0,
    max: 6,
    default: 0 // Sunday
  },
  // Statistics
  totalScheduledHours: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
studyScheduleSchema.index({ userId: 1, 'entries.isActive': 1 });

// Method to calculate total scheduled hours
studyScheduleSchema.methods.calculateTotalHours = function() {
  let totalMinutes = 0;
  this.entries.forEach(entry => {
    if (entry.isActive) {
      totalMinutes += entry.duration;
    }
  });
  this.totalScheduledHours = totalMinutes / 60;
  return this.totalScheduledHours;
};

// Method to get schedule for a specific day
studyScheduleSchema.methods.getScheduleForDay = function(dayOfWeek) {
  return this.entries
    .filter(entry => entry.isActive && entry.dayOfWeek === dayOfWeek)
    .sort((a, b) => {
      const timeA = a.startTime.split(':').map(Number);
      const timeB = b.startTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
};

// Method to check for conflicts
studyScheduleSchema.methods.hasConflict = function(dayOfWeek, startTime, endTime, excludeEntryId = null) {
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const newStart = parseTime(startTime);
  const newEnd = parseTime(endTime);
  
  for (const entry of this.entries) {
    if (!entry.isActive || entry.dayOfWeek !== dayOfWeek) continue;
    if (excludeEntryId && entry._id.toString() === excludeEntryId.toString()) continue;
    
    const entryStart = parseTime(entry.startTime);
    const entryEnd = parseTime(entry.endTime);
    
    // Check for overlap
    if ((newStart >= entryStart && newStart < entryEnd) ||
        (newEnd > entryStart && newEnd <= entryEnd) ||
        (newStart <= entryStart && newEnd >= entryEnd)) {
      return true;
    }
  }
  
  return false;
};

// Static method to create or get schedule for user
studyScheduleSchema.statics.getOrCreate = async function(userId) {
  let schedule = await this.findOne({ userId });
  
  if (!schedule) {
    schedule = new this({ userId, entries: [] });
    await schedule.save();
  }
  
  return schedule;
};

const StudySchedule = mongoose.model('StudySchedule', studyScheduleSchema);

module.exports = StudySchedule;
