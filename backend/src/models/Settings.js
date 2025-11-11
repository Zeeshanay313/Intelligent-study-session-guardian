const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  timerDefaults: {
    focusTime: {
      type: Number,
      default: 25,
      min: 1,
      max: 120
    },
    shortBreak: {
      type: Number,
      default: 5,
      min: 1,
      max: 30
    },
    longBreak: {
      type: Number,
      default: 15,
      min: 1,
      max: 60
    },
    longBreakInterval: {
      type: Number,
      default: 4,
      min: 2,
      max: 10
    },
    autoStart: {
      type: Boolean,
      default: false
    },
    soundEnabled: {
      type: Boolean,
      default: true
    }
  },
  reminderDefaults: {
    enabled: {
      type: Boolean,
      default: true
    },
    breakReminders: {
      type: Boolean,
      default: true
    },
    studyReminders: {
      type: Boolean,
      default: true
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: false
      }
    }
  },
  goalDefaults: {
    weeklyTarget: {
      type: Number,
      default: 20,
      min: 1,
      max: 100
    },
    dailyTarget: {
      type: Number,
      default: 4,
      min: 1,
      max: 24
    },
    visibility: {
      type: String,
      enum: ['private', 'friends', 'public'],
      default: 'private'
    }
  },
  privacy: {
    shareTimerStats: {
      type: Boolean,
      default: false
    },
    shareGoalProgress: {
      type: Boolean,
      default: false
    },
    allowGuardianAccess: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Method to get settings with defaults merged
settingsSchema.methods.getWithDefaults = function() {
  return {
    timerDefaults: {
      focusTime: this.timerDefaults?.focusTime ?? 25,
      shortBreak: this.timerDefaults?.shortBreak ?? 5,
      longBreak: this.timerDefaults?.longBreak ?? 15,
      longBreakInterval: this.timerDefaults?.longBreakInterval ?? 4,
      autoStart: this.timerDefaults?.autoStart ?? false,
      soundEnabled: this.timerDefaults?.soundEnabled ?? true
    },
    reminderDefaults: {
      enabled: this.reminderDefaults?.enabled ?? true,
      breakReminders: this.reminderDefaults?.breakReminders ?? true,
      studyReminders: this.reminderDefaults?.studyReminders ?? true,
      channels: {
        inApp: this.reminderDefaults?.channels?.inApp ?? true,
        email: this.reminderDefaults?.channels?.email ?? false,
        push: this.reminderDefaults?.channels?.push ?? false
      }
    },
    goalDefaults: {
      weeklyTarget: this.goalDefaults?.weeklyTarget ?? 20,
      dailyTarget: this.goalDefaults?.dailyTarget ?? 4,
      visibility: this.goalDefaults?.visibility ?? 'private'
    },
    privacy: {
      shareTimerStats: this.privacy?.shareTimerStats ?? false,
      shareGoalProgress: this.privacy?.shareGoalProgress ?? false,
      allowGuardianAccess: this.privacy?.allowGuardianAccess ?? true
    }
  };
};

module.exports = mongoose.model('Settings', settingsSchema);
