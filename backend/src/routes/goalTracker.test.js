/**
 * Enhanced Goal Tracker Tests
 * 
 * Tests for the enhanced goal tracker functionality including:
 * - Weekly/monthly goals with progress bars
 * - Milestones and sub-tasks
 * - Real-time notifications
 * - Catch-up suggestions
 * - Guardian sharing with consent
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../testApp');
const Goal = require('../models/Goal');
const User = require('../models/User');
const Guardian = require('../models/Guardian');
const { generateTestUser, generateAuthToken } = require('../setupTests');

describe('Enhanced Goal Tracker', () => {
  let testUser, authToken, testGoal;

  beforeEach(async () => {
    // Clear test data
    await Goal.deleteMany({});
    await User.deleteMany({});
    await Guardian.deleteMany({});

    // Create test user
    testUser = await generateTestUser();
    authToken = generateAuthToken(testUser);

    // Create test goal
    testGoal = new Goal({
      userId: testUser._id,
      title: 'Study Mathematics Weekly',
      description: 'Complete 10 hours of math study per week',
      type: 'hours',
      target: 10,
      period: 'weekly',
      progressUnit: 'hours',
      category: 'academic',
      priority: 'high',
      milestones: [
        {
          title: 'Quarter Progress',
          description: 'Complete 25% of weekly target',
          target: 2.5,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
        },
        {
          title: 'Half Progress',
          description: 'Complete 50% of weekly target',
          target: 5,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
        }
      ],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    });

    await testGoal.save();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Weekly/Monthly Goal Tracking', () => {
    test('should calculate weekly targets correctly', async () => {
      testGoal.calculatePeriodTargets();
      
      expect(testGoal.weeklyTarget).toBe(10); // Weekly goal
      expect(testGoal.dailyTarget).toBe(10 / 7); // Daily target
    });

    test('should calculate monthly targets correctly', async () => {
      testGoal.period = 'monthly';
      testGoal.target = 40; // 40 hours per month
      testGoal.calculatePeriodTargets();
      
      expect(testGoal.weeklyTarget).toBe(40 / 4.33); // ~9.24 hours per week
      expect(testGoal.dailyTarget).toBe(40 / 30); // ~1.33 hours per day
    });

    test('should get weekly progress summary', async () => {
      // Add some progress
      testGoal.addProgress(2, 'manual', null, 'Monday study');
      testGoal.addProgress(1.5, 'manual', null, 'Tuesday study');
      
      const summary = testGoal.getWeeklyProgressSummary();
      
      expect(summary.period).toBe('weekly');
      expect(summary.target).toBe(10);
      expect(summary.actual).toBe(3.5);
      expect(summary.percentage).toBe(35);
    });

    test('should get monthly progress summary', async () => {
      testGoal.period = 'monthly';
      testGoal.target = 40;
      testGoal.addProgress(10, 'manual', null, 'Week 1 progress');
      
      const summary = testGoal.getMonthlyProgressSummary();
      
      expect(summary.period).toBe('monthly');
      expect(summary.target).toBe(40);
      expect(summary.actual).toBe(10);
      expect(summary.percentage).toBe(25);
    });

    test('should fetch weekly progress via API', async () => {
      const response = await request(app)
        .get(`/api/goalTracker/${testGoal._id}/weekly-progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.weeklyProgress).toHaveProperty('period', 'weekly');
      expect(response.body.goal).toHaveProperty('title', 'Study Mathematics Weekly');
    });

    test('should fetch monthly progress via API', async () => {
      const response = await request(app)
        .get(`/api/goalTracker/${testGoal._id}/monthly-progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.monthlyProgress).toHaveProperty('period', 'monthly');
    });
  });

  describe('Milestones and Sub-tasks', () => {
    test('should check milestone completion automatically', async () => {
      // Add progress to complete first milestone
      testGoal.addProgress(3, 'manual', null, 'Good progress today');
      
      const completedMilestones = testGoal.checkMilestoneCompletion();
      
      expect(completedMilestones).toBeTruthy();
      expect(completedMilestones.length).toBe(1);
      expect(completedMilestones[0].title).toBe('Quarter Progress');
      expect(testGoal.milestones[0].completed).toBe(true);
    });

    test('should generate milestone notifications', async () => {
      testGoal.addProgress(3, 'manual'); // This triggers milestone completion
      
      const milestoneNotifications = testGoal.notifications.filter(n => n.type === 'milestone_completed');
      
      expect(milestoneNotifications.length).toBeGreaterThan(0);
      expect(milestoneNotifications[0].title).toBe('Milestone Achieved! 🎉');
      expect(milestoneNotifications[0].message).toContain('Quarter Progress');
    });

    test('should add milestone via API', async () => {
      const newMilestone = {
        title: 'Three Quarter Progress',
        description: 'Complete 75% of weekly target',
        target: 7.5,
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post(`/api/goalTracker/${testGoal._id}/milestones`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newMilestone)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.milestone.title).toBe('Three Quarter Progress');
    });

    test('should fetch milestones via API', async () => {
      const response = await request(app)
        .get(`/api/goalTracker/${testGoal._id}/milestones`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.milestones).toHaveLength(2);
      expect(response.body.totalMilestones).toBe(2);
      expect(response.body.completedMilestones).toBe(0);
    });
  });

  describe('Real-time Notifications', () => {
    test('should generate goal completion notification', async () => {
      // Complete the goal
      testGoal.addProgress(10, 'manual', null, 'Final push!');
      
      const goalNotifications = testGoal.notifications.filter(n => n.type === 'goal_completed');
      
      expect(goalNotifications.length).toBe(1);
      expect(goalNotifications[0].title).toBe('Goal Completed! 🏆');
      expect(goalNotifications[0].message).toContain('Study Mathematics Weekly');
    });

    test('should fetch notifications via API', async () => {
      testGoal.addProgress(3, 'manual'); // Generate milestone notification
      await testGoal.save();

      const response = await request(app)
        .get('/api/goalTracker/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.notifications.length).toBeGreaterThan(0);
      expect(response.body.notifications[0]).toHaveProperty('goalTitle', 'Study Mathematics Weekly');
    });

    test('should mark notifications as read', async () => {
      testGoal.addProgress(3, 'manual'); // Generate notification
      await testGoal.save();

      const notificationIds = testGoal.notifications.map(n => n._id);

      const response = await request(app)
        .put('/api/goalTracker/notifications/mark-read')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notificationIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('notifications as read');
    });
  });

  describe('Catch-up Suggestions', () => {
    test('should detect when goal is behind schedule', () => {
      // Set goal start date to a week ago, making it appear behind
      testGoal.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      testGoal.currentProgress = 2; // Only 2 hours out of 10 (20%)
      
      testGoal.checkScheduleAndGenerateSuggestions();
      
      expect(testGoal.isOverdue).toBe(true);
      expect(testGoal.catchUpSuggestions.length).toBeGreaterThan(0);
    });

    test('should generate appropriate catch-up suggestions', () => {
      testGoal.startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      testGoal.currentProgress = 1; // Significantly behind
      
      testGoal.generateCatchUpSuggestions(0.5); // 50% deficit
      
      expect(testGoal.catchUpSuggestions.length).toBeGreaterThan(0);
      
      const suggestions = testGoal.catchUpSuggestions;
      const types = suggestions.map(s => s.type);
      
      expect(types).toContain('increase_daily');
      expect(types).toContain('extend_deadline');
    });

    test('should fetch catch-up suggestions via API', async () => {
      testGoal.isOverdue = true;
      testGoal.catchUpSuggestions.push({
        type: 'increase_daily',
        suggestion: 'Study 2 extra hours daily',
        impact: 'Will help you catch up',
        difficulty: 'medium'
      });
      await testGoal.save();

      const response = await request(app)
        .get('/api/goalTracker/catch-up-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.suggestions.length).toBeGreaterThan(0);
      expect(response.body.totalGoalsBehind).toBe(1);
    });
  });

  describe('Guardian Sharing with Consent', () => {
    let guardian, guardianUser;

    beforeEach(async () => {
      // Create guardian user
      guardianUser = await generateTestUser({
        email: 'guardian@test.com',
        role: 'guardian'
      });

      // Create guardian relationship
      guardian = new Guardian({
        userId: testUser._id,
        guardianEmail: guardianUser.email,
        guardianId: guardianUser._id,
        relationship: 'parent',
        consentStatus: 'accepted',
        inviteToken: 'test-token',
        shareFields: ['progress']
      });
      
      await guardian.save();
    });

    test('should share goal with guardian when consent is given', async () => {
      const shareData = {
        guardianId: guardianUser._id.toString(),
        accessLevel: 'progress',
        userConsent: true
      };

      const response = await request(app)
        .post(`/api/goalTracker/${testGoal._id}/share-with-guardian`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Goal shared with guardian');
      expect(response.body.sharedWith).toHaveProperty('accessLevel', 'progress');
    });

    test('should reject sharing without consent', async () => {
      const shareData = {
        guardianId: guardianUser._id.toString(),
        accessLevel: 'view',
        userConsent: false
      };

      const response = await request(app)
        .post(`/api/goalTracker/${testGoal._id}/share-with-guardian`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(400);

      expect(response.body.error).toContain('consent required');
    });

    test('should verify guardian relationship exists', async () => {
      const fakeGuardianId = new mongoose.Types.ObjectId();
      
      const shareData = {
        guardianId: fakeGuardianId.toString(),
        accessLevel: 'view',
        userConsent: true
      };

      const response = await request(app)
        .post(`/api/goalTracker/${testGoal._id}/share-with-guardian`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(404);

      expect(response.body.error).toContain('Guardian relationship not found');
    });
  });

  describe('Real-time Progress Summary', () => {
    test('should generate comprehensive progress summary', async () => {
      // Add some progress and milestones
      testGoal.addProgress(4, 'manual', null, 'Good progress');
      testGoal.isOverdue = false;
      await testGoal.save();

      const response = await request(app)
        .get('/api/goalTracker/progress-summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.summary).toHaveProperty('totalGoals', 1);
      expect(response.body.summary).toHaveProperty('weeklyProgress');
      expect(response.body.summary).toHaveProperty('upcomingMilestones');
      expect(response.body.summary).toHaveProperty('overallCompletion');
    });

    test('should track real-time progress updates', async () => {
      const beforeProgress = testGoal.currentProgress;
      
      // Simulate real-time progress update
      testGoal.addProgress(1.5, 'session', 'session123', 'Study session completed');
      
      expect(testGoal.currentProgress).toBe(beforeProgress + 1.5);
      expect(testGoal.lastCheckedAt).toBeDefined();
      expect(testGoal.progressHistory.length).toBeGreaterThan(0);
      
      const latestEntry = testGoal.progressHistory[testGoal.progressHistory.length - 1];
      expect(latestEntry.source).toBe('session');
      expect(latestEntry.value).toBe(1.5);
      expect(latestEntry.timestamp).toBeDefined();
    });
  });
});