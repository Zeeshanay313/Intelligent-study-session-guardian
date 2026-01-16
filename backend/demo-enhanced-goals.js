/**
 * Enhanced Goal Tracker Demo
 * 
 * Demonstrates all the new features implemented:
 * - Weekly/monthly goals with progress bars
 * - Milestones and sub-tasks  
 * - Real-time notifications
 * - Catch-up suggestions when behind schedule
 * - Guardian sharing with consent
 */

const mongoose = require('mongoose');
const Goal = require('./src/models/Goal');
const User = require('./src/models/User');
const Guardian = require('./src/models/Guardian');
const { generateRealtimeProgressSummary } = require('./src/services/GoalProgressService');

// Demo user IDs (you'll need to create actual users for real testing)
const DEMO_USER_ID = new mongoose.Types.ObjectId();
const GUARDIAN_USER_ID = new mongoose.Types.ObjectId();

async function demonstrateGoalTracker() {
  try {
    console.log('🎯 Enhanced Goal Tracker Demo Starting...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-goals');
    console.log('📦 Connected to MongoDB\n');

    // Clean up existing test data
    await Goal.deleteMany({ userId: DEMO_USER_ID });
    await User.deleteMany({ _id: DEMO_USER_ID });
    await Guardian.deleteMany({ userId: DEMO_USER_ID });

    console.log('=== 1. CREATING WEEKLY AND MONTHLY GOALS ===\n');

    // Create a weekly goal
    const weeklyGoal = new Goal({
      userId: DEMO_USER_ID,
      title: 'Study Mathematics - Weekly Goal',
      description: 'Complete 15 hours of math study per week',
      type: 'hours',
      target: 15,
      period: 'weekly',
      progressUnit: 'hours',
      category: 'academic',
      priority: 'high',
      milestones: [
        {
          title: 'Quarter Progress',
          description: 'Complete 25% of weekly target',
          target: 3.75,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        },
        {
          title: 'Half Progress',
          description: 'Complete 50% of weekly target',  
          target: 7.5,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
        },
        {
          title: 'Three Quarter Progress',
          description: 'Complete 75% of weekly target',
          target: 11.25,
          dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
        }
      ],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Calculate weekly/daily targets
    weeklyGoal.calculatePeriodTargets();
    await weeklyGoal.save();
    
    console.log(`✅ Weekly Goal Created: "${weeklyGoal.title}"`);
    console.log(`   Target: ${weeklyGoal.target} ${weeklyGoal.progressUnit}`);
    console.log(`   Weekly Target: ${weeklyGoal.weeklyTarget} hours`);
    console.log(`   Daily Target: ${weeklyGoal.dailyTarget.toFixed(2)} hours`);
    console.log(`   Milestones: ${weeklyGoal.milestones.length}\n`);

    // Create a monthly goal
    const monthlyGoal = new Goal({
      userId: DEMO_USER_ID,
      title: 'Programming Practice - Monthly Goal',
      description: 'Complete 60 hours of coding practice per month',
      type: 'hours',
      target: 60,
      period: 'monthly', 
      progressUnit: 'hours',
      category: 'professional',
      priority: 'medium',
      milestones: [
        {
          title: 'Week 1 Target',
          description: 'Complete first week target',
          target: 15,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          title: 'Halfway Point',
          description: 'Complete half of monthly target',
          target: 30,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    monthlyGoal.calculatePeriodTargets();
    await monthlyGoal.save();

    console.log(`✅ Monthly Goal Created: "${monthlyGoal.title}"`);
    console.log(`   Target: ${monthlyGoal.target} ${monthlyGoal.progressUnit}`);
    console.log(`   Weekly Target: ${monthlyGoal.weeklyTarget.toFixed(2)} hours`);
    console.log(`   Daily Target: ${monthlyGoal.dailyTarget.toFixed(2)} hours`);
    console.log(`   Milestones: ${monthlyGoal.milestones.length}\n`);

    console.log('=== 2. PROGRESS TRACKING WITH REAL-TIME UPDATES ===\n');

    // Add progress to weekly goal (should trigger milestone completions)
    console.log('📈 Adding 4.5 hours of progress to weekly goal...');
    weeklyGoal.addProgress(4.5, 'session', 'session123', 'Monday study session');
    
    console.log(`   Progress: ${weeklyGoal.currentProgress}/${weeklyGoal.target} hours (${weeklyGoal.progressPercentage}%)`);
    console.log(`   Milestones completed: ${weeklyGoal.completedMilestonesCount}/${weeklyGoal.milestones.length}`);
    console.log(`   Notifications generated: ${weeklyGoal.notifications.length}\n`);

    // Add more progress to trigger additional milestones
    console.log('📈 Adding 4 more hours of progress...');
    weeklyGoal.addProgress(4, 'session', 'session456', 'Tuesday intensive session');
    
    console.log(`   Progress: ${weeklyGoal.currentProgress}/${weeklyGoal.target} hours (${weeklyGoal.progressPercentage}%)`);
    console.log(`   Milestones completed: ${weeklyGoal.completedMilestonesCount}/${weeklyGoal.milestones.length}`);
    console.log(`   Recent notifications:`);
    
    weeklyGoal.notifications.slice(-2).forEach(notification => {
      console.log(`     - ${notification.type}: ${notification.title}`);
      console.log(`       ${notification.message}\n`);
    });

    console.log('=== 3. MILESTONE AND SUB-TASK FUNCTIONALITY ===\n');

    const milestonesCompleted = weeklyGoal.checkMilestoneCompletion();
    if (milestonesCompleted) {
      console.log('🎉 Milestone Achievement Details:');
      weeklyGoal.milestones.forEach((milestone, index) => {
        if (milestone.completed) {
          console.log(`   ✅ ${milestone.title} - Completed at: ${milestone.completedAt}`);
        } else {
          const progress = (weeklyGoal.currentProgress / milestone.target) * 100;
          console.log(`   ⏳ ${milestone.title} - Progress: ${progress.toFixed(1)}%`);
        }
      });
    }

    console.log('\n=== 4. WEEKLY AND MONTHLY PROGRESS SUMMARIES ===\n');

    const weeklyProgress = weeklyGoal.getWeeklyProgressSummary();
    console.log('📊 Weekly Progress Summary:');
    console.log(`   Target: ${weeklyProgress.target} hours`);
    console.log(`   Actual: ${weeklyProgress.actual} hours`);
    console.log(`   Completion: ${weeklyProgress.percentage.toFixed(1)}%`);
    console.log(`   Trend: ${weeklyProgress.trend}`);
    console.log(`   Average per day: ${weeklyProgress.avgPerDay.toFixed(2)} hours\n`);

    const monthlyProgress = monthlyGoal.getMonthlyProgressSummary();
    console.log('📊 Monthly Progress Summary:');
    console.log(`   Target: ${monthlyProgress.target} hours`);
    console.log(`   Actual: ${monthlyProgress.actual} hours`);
    console.log(`   Completion: ${monthlyProgress.percentage.toFixed(1)}%`);
    console.log(`   Trend: ${monthlyProgress.trend}`);
    console.log(`   Average per day: ${monthlyProgress.avgPerDay.toFixed(2)} hours\n`);

    console.log('=== 5. CATCH-UP SUGGESTIONS FOR BEHIND SCHEDULE ===\n');

    // Simulate a goal that's behind schedule
    const behindGoal = new Goal({
      userId: DEMO_USER_ID,
      title: 'Reading Challenge - Behind Schedule',
      description: 'Read 20 hours per week',
      type: 'hours',
      target: 20,
      period: 'weekly',
      progressUnit: 'hours',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Started 5 days ago
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
      currentProgress: 5 // Only 5 hours completed
    });

    behindGoal.checkScheduleAndGenerateSuggestions();
    await behindGoal.save();

    console.log(`📉 Goal Behind Schedule: "${behindGoal.title}"`);
    console.log(`   Progress: ${behindGoal.currentProgress}/${behindGoal.target} hours`);
    console.log(`   Is Overdue: ${behindGoal.isOverdue}`);
    console.log(`   Days Remaining: ${behindGoal.daysRemaining}`);
    console.log('\n💡 Catch-up Suggestions:');
    
    behindGoal.catchUpSuggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.suggestion}`);
      console.log(`      Impact: ${suggestion.impact}`);
      console.log(`      Difficulty: ${suggestion.difficulty}\n`);
    });

    console.log('=== 6. GUARDIAN SHARING WITH CONSENT ===\n');

    // Simulate guardian sharing
    try {
      await weeklyGoal.shareWithGuardian(GUARDIAN_USER_ID, 'progress', true);
      console.log(`🔒 Goal shared with guardian successfully!`);
      console.log(`   Shared goals: ${weeklyGoal.sharedGuardians.length}`);
      console.log(`   Access level: ${weeklyGoal.sharedGuardians[0]?.accessLevel}`);
      console.log(`   Consent given: ${weeklyGoal.guardianConsentGiven}\n`);
    } catch (error) {
      console.log(`⚠️  Guardian sharing note: ${error.message}`);
      console.log(`   (This is expected in demo mode without actual users)\n`);
    }

    console.log('=== 7. REAL-TIME PROGRESS SUMMARY ===\n');

    try {
      const summary = await generateRealtimeProgressSummary(DEMO_USER_ID);
      
      console.log('📊 Real-time Progress Summary:');
      console.log(`   Total Active Goals: ${summary.totalGoals}`);
      console.log(`   Overall Completion: ${summary.overallCompletion.toFixed(1)}%`);
      console.log(`   Upcoming Milestones: ${summary.upcomingMilestones.length}`);
      console.log(`   Recent Achievements: ${summary.recentAchievements.length}`);
      console.log(`   Goals Needing Catch-up: ${summary.catchUpNeeded.length}\n`);

      if (summary.weeklyProgress.length > 0) {
        console.log('📈 Weekly Progress Breakdown:');
        summary.weeklyProgress.forEach(wp => {
          console.log(`   - ${wp.title}: ${wp.progress.percentage.toFixed(1)}% complete`);
        });
        console.log();
      }

      if (summary.upcomingMilestones.length > 0) {
        console.log('🎯 Upcoming Milestones:');
        summary.upcomingMilestones.slice(0, 3).forEach(m => {
          console.log(`   - ${m.milestone.title} (${m.goalTitle})`);
        });
        console.log();
      }

    } catch (error) {
      console.log(`ℹ️  Progress summary: ${error.message}\n`);
    }

    console.log('=== 8. NOTIFICATIONS SYSTEM ===\n');

    console.log('🔔 Recent Notifications:');
    const allNotifications = [...weeklyGoal.notifications, ...behindGoal.notifications];
    
    allNotifications.slice(-5).forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title}`);
      console.log(`      Message: ${notification.message}`);
      console.log(`      Type: ${notification.type}`);
      console.log(`      Sent: ${notification.sent ? 'Yes' : 'No'}\n`);
    });

    console.log('✅ DEMO COMPLETED SUCCESSFULLY!\n');
    console.log('🎉 Enhanced Goal Tracker Features Demonstrated:');
    console.log('   ✅ Weekly and monthly goals with progress bars');
    console.log('   ✅ Milestones broken into sub-tasks');
    console.log('   ✅ Real-time progress tracking and notifications');
    console.log('   ✅ Catch-up suggestions for goals behind schedule');
    console.log('   ✅ Guardian sharing with consent functionality');
    console.log('   ✅ Comprehensive progress summaries and trends\n');

  } catch (error) {
    console.error('❌ Demo Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run the demo
demonstrateGoalTracker().catch(console.error);