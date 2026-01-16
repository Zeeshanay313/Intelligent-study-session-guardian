/**
 * Goal Progress Service - Enhanced with Real-time Tracking
 *
 * Automatically updates goal progress based on completed study sessions.
 * This service integrates the Focus Timer with the Goal Tracker to provide
 * seamless progress tracking with real-time notifications and catch-up suggestions.
 *
 * @author Intelligent Study Session Guardian Team
 */

const Goal = require('../models/Goal');
const Session = require('../models/SessionLog');
const User = require('../models/User');
const Guardian = require('../models/Guardian');

/**
 * Update goal progress from a completed session with real-time tracking
 * Called after a study session is completed
 *
 * @param {Object} session - The completed session object
 * @returns {Object} Result with updated goals and notifications
 */
async function updateGoalsFromSession(session) {
  try {
    const { userId, duration, subject } = session;
    const updatedGoals = [];
    const notifications = [];

    // Find all active goals for the user with auto-progress enabled
    const goals = await Goal.find({
      userId,
      status: 'active',
      autoProgressFromSessions: true
    });

    for (const goal of goals) {
      let progressAdded = false;
      let progressValue = 0;

      // Calculate period targets before processing
      goal.calculatePeriodTargets();

      // Check if goal is linked to this subject
      const isLinkedSubject = goal.linkedSubjects.length === 0
        || goal.linkedSubjects.includes(subject);

      if (isLinkedSubject) {
        // Calculate progress based on goal type
        switch (goal.type) {
          case 'hours':
            // Convert session duration from seconds to hours
            // Round to 2 decimal places to avoid floating point issues
            progressValue = Math.round((duration / 3600) * 100) / 100;
            progressAdded = true;
            break;

          case 'sessions':
            // Each completed session counts as 1
            progressValue = 1;
            progressAdded = true;
            break;

          case 'streak':
            // Streak is handled by daily check, but we record the session
            progressValue = 1;
            progressAdded = true;
            break;

          default:
            // Tasks and custom types require manual progress
            break;
        }
      }

      if (progressAdded && progressValue > 0) {
        // Add progress using the enhanced goal method
        goal.addProgress(
          progressValue,
          'session',
          session._id,
          `Auto-updated from session: ${subject}`
        );

        // Check schedule and generate catch-up suggestions if needed
        goal.checkScheduleAndGenerateSuggestions();

        await goal.save();
        updatedGoals.push({
          goal: goal,
          progressAdded: progressValue,
          newNotifications: goal.notifications.filter(n => !n.sent)
        });

        // Collect notifications for sending
        notifications.push(...goal.notifications.filter(n => !n.sent));
      }
    }

    // Send notifications if any
    if (notifications.length > 0) {
      await sendNotifications(userId, notifications);
    }

    return {
      updatedGoals: updatedGoals.map(ug => ug.goal),
      notifications,
      progressSummary: await generateRealtimeProgressSummary(userId)
    };
  } catch (error) {
    console.error('Error updating goals from session:', error);
    throw error;
  }
}

/**
 * Check and update streak goals daily
 * Should be called by a cron job once per day
 *
 * @param {String} userId - User ID to check streaks for
 * @returns {Array} Array of updated streak goals
 */
async function updateStreakGoals(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find all active streak goals
    const streakGoals = await Goal.find({
      userId,
      status: 'active',
      type: 'streak'
    });

    const updatedGoals = [];

    for (const goal of streakGoals) {
      // Check if user had any sessions yesterday
      const sessionsYesterday = await Session.countDocuments({
        userId,
        createdAt: {
          $gte: yesterday,
          $lt: today
        },
        status: 'completed'
      });

      if (sessionsYesterday > 0) {
        // Continue or start streak
        const lastProgress = goal.progressHistory[goal.progressHistory.length - 1];
        const lastProgressDate = lastProgress ? new Date(lastProgress.date) : null;

        // Only add if we haven't already counted yesterday
        if (!lastProgressDate || lastProgressDate < yesterday) {
          goal.addProgress(1, 'system', null, 'Daily streak maintained');
          await goal.save();
          updatedGoals.push(goal);
        }
      } else {
        // Check if streak was broken
        const lastProgress = goal.progressHistory[goal.progressHistory.length - 1];
        if (lastProgress) {
          const daysSinceLastProgress = Math.floor((today - lastProgress.date) / (1000 * 60 * 60 * 24));

          if (daysSinceLastProgress > 1) {
            // Streak broken - reset progress
            goal.currentProgress = 0;
            goal.progressHistory = [];
            goal.status = 'paused';
            await goal.save();
            updatedGoals.push(goal);
          }
        }
      }
    }

    return updatedGoals;
  } catch (error) {
    console.error('Error updating streak goals:', error);
    throw error;
  }
}

/**
 * Get progress summary for a goal over a period
 *
 * @param {String} goalId - Goal ID
 * @param {Number} days - Number of days to look back
 * @returns {Object} Progress summary
 */
async function getGoalProgressSummary(goalId, days = 30) {
  try {
    const goal = await Goal.findById(goalId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    const progressData = goal.getProgressForPeriod(days);

    // Calculate statistics
    const totalProgress = progressData.reduce((sum, entry) => sum + entry.value, 0);
    const sessionProgress = progressData.filter(e => e.source === 'session')
      .reduce((sum, entry) => sum + entry.value, 0);
    const manualProgress = progressData.filter(e => e.source === 'manual')
      .reduce((sum, entry) => sum + entry.value, 0);

    return {
      goal: {
        id: goal._id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        currentProgress: goal.currentProgress,
        completionRate: goal.completionRate
      },
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      progress: {
        total: totalProgress,
        fromSessions: sessionProgress,
        manual: manualProgress,
        avgPerDay: totalProgress / days
      },
      entries: progressData,
      milestones: {
        total: goal.milestones.length,
        completed: goal.completedMilestonesCount,
        upcoming: goal.milestones.filter(m => !m.completed && goal.currentProgress < m.target)
      }
    };
  } catch (error) {
    console.error('Error getting goal progress summary:', error);
    throw error;
  }
}

/**
 * Recommend goals based on user's session history
 *
 * @param {String} userId - User ID
 * @returns {Array} Array of goal recommendations
 */
async function recommendGoals(userId) {
  try {
    // Get user's session history for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSessions = await Session.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: thirtyDaysAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$subject',
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { totalSessions: -1 }
      },
      {
        $limit: 3
      }
    ]);

    const recommendations = [];

    for (const sessionStats of recentSessions) {
      const hoursPerWeek = (sessionStats.totalDuration / 3600) / 4.3; // Approx weeks in 30 days

      recommendations.push({
        type: 'hours',
        title: `Study ${sessionStats._id} for ${Math.ceil(hoursPerWeek)} hours weekly`,
        description: `Based on your recent activity (${sessionStats.totalSessions} sessions in 30 days)`,
        suggestedTarget: Math.ceil(hoursPerWeek * 1.2), // Suggest 20% increase
        suggestedPeriod: 'weekly',
        linkedSubjects: [sessionStats._id],
        category: 'academic',
        priority: 'medium'
      });

      recommendations.push({
        type: 'streak',
        title: `Maintain daily study streak for ${sessionStats._id}`,
        description: 'Build consistency with daily study sessions',
        suggestedTarget: 30,
        suggestedPeriod: 'monthly',
        linkedSubjects: [sessionStats._id],
        category: 'academic',
        priority: 'high'
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating goal recommendations:', error);
    throw error;
  }
}

/**
 * Generate real-time progress summary for user
 *
 * @param {String} userId - User ID
 * @returns {Object} Real-time progress summary
 */
async function generateRealtimeProgressSummary(userId) {
  try {
    const goals = await Goal.find({ userId, status: 'active' });
    
    const summary = {
      totalGoals: goals.length,
      weeklyProgress: [],
      monthlyProgress: [],
      overallCompletion: 0,
      upcomingMilestones: [],
      recentAchievements: [],
      catchUpNeeded: []
    };

    let totalCompletion = 0;

    for (const goal of goals) {
      goal.calculatePeriodTargets();
      
      // Weekly progress
      if (goal.period === 'weekly' || goal.weeklyTarget) {
        summary.weeklyProgress.push({
          goalId: goal._id,
          title: goal.title,
          progress: goal.getWeeklyProgressSummary()
        });
      }

      // Monthly progress
      if (goal.period === 'monthly' || goal.period === 'weekly') {
        summary.monthlyProgress.push({
          goalId: goal._id,
          title: goal.title,
          progress: goal.getMonthlyProgressSummary()
        });
      }

      totalCompletion += goal.completionRate;

      // Upcoming milestones
      const upcomingMilestones = goal.milestones
        .filter(m => !m.completed && goal.currentProgress < m.target)
        .sort((a, b) => a.target - b.target)
        .slice(0, 3);
      
      summary.upcomingMilestones.push(...upcomingMilestones.map(m => ({
        goalId: goal._id,
        goalTitle: goal.title,
        milestone: m
      })));

      // Recent achievements
      const recentAchievements = goal.milestones
        .filter(m => m.completed && m.completedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .map(m => ({
          goalId: goal._id,
          goalTitle: goal.title,
          milestone: m,
          achievedAt: m.completedAt
        }));
      
      summary.recentAchievements.push(...recentAchievements);

      // Goals needing catch-up
      if (goal.isOverdue || goal.catchUpSuggestions.length > 0) {
        summary.catchUpNeeded.push({
          goalId: goal._id,
          title: goal.title,
          isOverdue: goal.isOverdue,
          suggestions: goal.catchUpSuggestions
        });
      }
    }

    summary.overallCompletion = goals.length > 0 ? totalCompletion / goals.length : 0;

    return summary;
  } catch (error) {
    console.error('Error generating real-time progress summary:', error);
    throw error;
  }
}

/**
 * Send notifications to user and guardians
 *
 * @param {String} userId - User ID
 * @param {Array} notifications - Array of notifications to send
 */
async function sendNotifications(userId, notifications) {
  try {
    // Mark notifications as sent
    const notificationIds = notifications.map(n => n._id);
    await Goal.updateMany(
      { 'notifications._id': { $in: notificationIds } },
      { $set: { 'notifications.$.sent': true, 'notifications.$.sentAt': new Date() } }
    );

    // Send to guardians if sharing is enabled
    const user = await User.findById(userId);
    if (user && user.privacy?.guardianSharing) {
      const guardians = await Guardian.find({
        userId,
        consentStatus: 'accepted',
        shareFields: { $in: ['progress'] }
      }).populate('guardianId');

      for (const guardian of guardians) {
        if (guardian.guardianId) {
          // Send guardian notification (implement based on your notification system)
          console.log(`Sending notification to guardian ${guardian.guardianId.email}:`, notifications);
        }
      }
    }

    console.log(`Sent ${notifications.length} notifications for user ${userId}`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

/**
 * Check all users' goals for schedule alerts and generate notifications
 * Should be called by a cron job periodically
 */
async function checkAllGoalsSchedule() {
  try {
    const activeGoals = await Goal.find({ status: 'active' });
    const alertsGenerated = [];

    for (const goal of activeGoals) {
      const oldNotificationCount = goal.notifications.length;
      goal.checkScheduleAndGenerateSuggestions();
      
      if (goal.notifications.length > oldNotificationCount) {
        await goal.save();
        alertsGenerated.push({
          userId: goal.userId,
          goalId: goal._id,
          newNotifications: goal.notifications.slice(oldNotificationCount)
        });
      }
    }

    return alertsGenerated;
  } catch (error) {
    console.error('Error checking goals schedule:', error);
    throw error;
  }
}

/**
 * Generate weekly summary for all users
 */
async function generateWeeklySummaries() {
  try {
    const users = await User.find({ 'settings.weeklyReports': true }).select('_id email');
    const summaries = [];

    for (const user of users) {
      const summary = await generateRealtimeProgressSummary(user._id);
      
      // Add weekly summary notification to all active goals
      await Goal.updateMany(
        { userId: user._id, status: 'active' },
        {
          $push: {
            notifications: {
              type: 'weekly_summary',
              title: 'Weekly Progress Summary 📊',
              message: `This week: ${summary.overallCompletion.toFixed(1)}% average completion across your goals`,
              triggeredBy: 'weekly_review',
              sent: false
            }
          }
        }
      );

      summaries.push({ userId: user._id, summary });
    }

    return summaries;
  } catch (error) {
    console.error('Error generating weekly summaries:', error);
    throw error;
  }
}

module.exports = {
  updateGoalsFromSession,
  updateStreakGoals,
  getGoalProgressSummary,
  recommendGoals,
  generateRealtimeProgressSummary,
  sendNotifications,
  checkAllGoalsSchedule,
  generateWeeklySummaries
};


