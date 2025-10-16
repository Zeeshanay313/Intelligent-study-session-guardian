const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const Goal = require('../models/Goal');
const User = require('../models/User');
const goalTrackerRoutes = require('../routes/goalTracker');
const { authenticate } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/goals', goalTrackerRoutes);

// Test database setup
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/study-guardian-test';

describe('Goal Tracker API', () => {
  let testUser;
  let authToken;
  let testUser2;
  let authToken2;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
    
    // Create test users
    testUser = await User.create({
      email: 'testuser1@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDBcQkqJESCjKQ2',
      profile: {
        displayName: 'Test User 1',
        timezone: 'UTC'
      },
      privacy: {
        guardianSharing: true,
        shareFields: ['profile', 'studyTime', 'progress']
      }
    });

    testUser2 = await User.create({
      email: 'testuser2@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDBcQkqJESCjKQ2',
      profile: {
        displayName: 'Test User 2',
        timezone: 'UTC'
      },
      privacy: {
        guardianSharing: false, // Sharing disabled
        shareFields: []
      }
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );

    authToken2 = jwt.sign(
      { userId: testUser2._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '24h' }
    );
  });

  beforeEach(async () => {
    // Clear goals before each test
    await Goal.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Goal.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/goals', () => {
    const validGoalData = {
      title: 'Test Goal',
      description: 'A test goal for unit testing',
      targetType: 'hours',
      targetValue: 50,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      visibility: 'private'
    };

    it('should create a goal successfully', async () => {
      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validGoalData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Goal created successfully');
      expect(response.body.goal.title).toBe(validGoalData.title);
      expect(response.body.goal.userId.toString()).toBe(testUser._id.toString());
      expect(response.body.goal.progressValue).toBe(0);
    });

    it('should create a goal with milestones', async () => {
      const goalWithMilestones = {
        ...validGoalData,
        milestones: [
          {
            title: 'First milestone',
            dueDate: '2024-02-15'
          },
          {
            title: 'Second milestone',
            dueDate: '2024-04-15'
          }
        ]
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalWithMilestones);

      expect(response.status).toBe(201);
      expect(response.body.goal.milestones).toHaveLength(2);
      expect(response.body.goal.milestones[0].title).toBe('First milestone');
      expect(response.body.goal.milestones[0].done).toBe(false);
    });

    it('should enforce privacy settings for visibility', async () => {
      const sharedGoal = {
        ...validGoalData,
        visibility: 'shared'
      };

      // User with sharing disabled should get private visibility
      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken2}`)
        .send(sharedGoal);

      expect(response.status).toBe(201);
      expect(response.body.goal.visibility).toBe('private');
      expect(response.body.privacyNote).toContain('privacy settings');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidGoal = {
        title: 'Test Goal'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGoal);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid target type', async () => {
      const invalidGoal = {
        ...validGoalData,
        targetType: 'invalid'
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGoal);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid targetType');
    });

    it('should return 400 for invalid date range', async () => {
      const invalidGoal = {
        ...validGoalData,
        startDate: '2024-06-30',
        endDate: '2024-01-01' // End before start
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidGoal);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('End date must be after start date');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/goals')
        .send(validGoalData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/goals', () => {
    let testGoal1, testGoal2;

    beforeEach(async () => {
      testGoal1 = await Goal.create({
        userId: testUser._id,
        title: 'Goal 1',
        description: 'First test goal',
        targetType: 'hours',
        targetValue: 100,
        progressValue: 25,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'shared'
      });

      testGoal2 = await Goal.create({
        userId: testUser._id,
        title: 'Goal 2',
        description: 'Second test goal',
        targetType: 'sessions',
        targetValue: 50,
        progressValue: 50,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private',
        completedAt: new Date()
      });
    });

    it('should get user goals successfully', async () => {
      const response = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(2);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.totalGoals).toBe(2);
      expect(response.body.summary.completedGoals).toBe(1);
    });

    it('should filter goals by target type', async () => {
      const response = await request(app)
        .get('/api/goals?targetType=hours')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(1);
      expect(response.body.goals[0].targetType).toBe('hours');
    });

    it('should filter goals by completion status', async () => {
      const response = await request(app)
        .get('/api/goals?completed=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(1);
      expect(response.body.goals[0].completedAt).toBeTruthy();
    });

    it('should deny access to other user goals when sharing disabled', async () => {
      const response = await request(app)
        .get(`/api/goals?userId=${testUser2._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('guardian sharing');
    });

    it('should allow access to other user goals when sharing enabled', async () => {
      const response = await request(app)
        .get(`/api/goals?userId=${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(2);
    });
  });

  describe('GET /api/goals/:id', () => {
    let testGoal;

    beforeEach(async () => {
      testGoal = await Goal.create({
        userId: testUser._id,
        title: 'Single Goal',
        description: 'Test goal for individual retrieval',
        targetType: 'tasks',
        targetValue: 10,
        progressValue: 3,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'shared'
      });
    });

    it('should get goal by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.goal._id).toBe(testGoal._id.toString());
      expect(response.body.goal.title).toBe('Single Goal');
    });

    it('should return 404 for non-existent goal', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/goals/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Goal not found');
    });

    it('should return 400 for invalid goal ID', async () => {
      const response = await request(app)
        .get('/api/goals/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid goal ID format');
    });
  });

  describe('PUT /api/goals/:id', () => {
    let testGoal;

    beforeEach(async () => {
      testGoal = await Goal.create({
        userId: testUser._id,
        title: 'Original Title',
        description: 'Original description',
        targetType: 'hours',
        targetValue: 100,
        progressValue: 25,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private'
      });
    });

    it('should update goal successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        targetValue: 150
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.goal.title).toBe('Updated Title');
      expect(response.body.goal.targetValue).toBe(150);
    });

    it('should enforce privacy settings on visibility update', async () => {
      const updateData = {
        visibility: 'shared'
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData);

      expect(response.status).toBe(403); // User2 doesn't own this goal
    });

    it('should return 403 for unauthorized user', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('POST /api/goals/:id/progress', () => {
    let testGoal;

    beforeEach(async () => {
      testGoal = await Goal.create({
        userId: testUser._id,
        title: 'Progress Goal',
        description: 'Goal for testing progress updates',
        targetType: 'hours',
        targetValue: 100,
        progressValue: 25,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private'
      });
    });

    it('should update progress successfully', async () => {
      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 5 });

      expect(response.status).toBe(200);
      expect(response.body.goal.progressValue).toBe(30);
      expect(response.body.message).toContain('Progress updated successfully');
    });

    it('should detect goal completion', async () => {
      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 75 }); // Should complete the goal

      expect(response.status).toBe(200);
      expect(response.body.goal.progressValue).toBe(100);
      expect(response.body.message).toContain('Goal completed');
      expect(response.body.justCompleted).toBe(true);
    });

    it('should handle negative progress updates', async () => {
      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: -10 });

      expect(response.status).toBe(200);
      expect(response.body.goal.progressValue).toBe(15);
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Valid amount is required');
    });

    it('should return 403 for unauthorized user', async () => {
      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/progress`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ amount: 5 });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });
  });

  describe('DELETE /api/goals/:id', () => {
    let testGoal;

    beforeEach(async () => {
      testGoal = await Goal.create({
        userId: testUser._id,
        title: 'Goal to Delete',
        description: 'This goal will be deleted',
        targetType: 'sessions',
        targetValue: 50,
        progressValue: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private'
      });
    });

    it('should soft delete goal successfully', async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Goal deleted successfully');

      // Verify soft delete
      const deletedGoal = await Goal.findById(testGoal._id);
      expect(deletedGoal.isActive).toBe(false);
    });

    it('should return 403 for unauthorized user', async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Not authorized');
    });

    it('should return 404 for already deleted goal', async () => {
      // Delete the goal first
      await Goal.findByIdAndUpdate(testGoal._id, { isActive: false });

      const response = await request(app)
        .delete(`/api/goals/${testGoal._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Goal not found');
    });
  });

  describe('Milestone Management', () => {
    let testGoal;

    beforeEach(async () => {
      testGoal = await Goal.create({
        userId: testUser._id,
        title: 'Goal with Milestones',
        description: 'Testing milestone functionality',
        targetType: 'tasks',
        targetValue: 20,
        progressValue: 5,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private',
        milestones: [
          {
            title: 'First milestone',
            dueDate: new Date('2024-02-15'),
            done: false
          },
          {
            title: 'Second milestone',
            dueDate: new Date('2024-04-15'),
            done: true
          }
        ]
      });
    });

    it('should toggle milestone completion', async () => {
      const milestoneId = testGoal.milestones[0]._id;

      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/milestones/${milestoneId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Milestone completed');
      expect(response.body.milestone.done).toBe(true);
    });

    it('should return 404 for non-existent milestone', async () => {
      const nonExistentMilestoneId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/goals/${testGoal._id}/milestones/${nonExistentMilestoneId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Milestone not found');
    });
  });

  describe('Privacy Enforcement', () => {
    let sharedGoal;

    beforeEach(async () => {
      sharedGoal = await Goal.create({
        userId: testUser._id, // User with sharing enabled
        title: 'Shared Goal',
        description: 'Goal that can be shared',
        targetType: 'hours',
        targetValue: 80,
        progressValue: 20,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'shared'
      });
    });

    it('should allow access to shared goals when user has sharing enabled', async () => {
      const response = await request(app)
        .get(`/api/goals?userId=${testUser._id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toHaveLength(1);
      expect(response.body.goals[0].title).toBe('Shared Goal');
    });

    it('should deny access when guardian sharing is disabled', async () => {
      // Create a goal for user2 (sharing disabled)
      const privateGoal = await Goal.create({
        userId: testUser2._id,
        title: 'Private Goal',
        description: 'Goal that cannot be shared',
        targetType: 'sessions',
        targetValue: 30,
        progressValue: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        visibility: 'private'
      });

      const response = await request(app)
        .get(`/api/goals?userId=${testUser2._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('guardian sharing');
    });
  });
});