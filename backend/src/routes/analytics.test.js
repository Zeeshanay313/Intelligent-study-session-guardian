const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Session = require('../modules/timer/Session');
const Goal = require('../models/Goal');

describe('Analytics API', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      email: 'analytics@test.com',
      displayName: 'Analytics Test User',
      password: 'hashedpassword123'
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/analytics/sessions', () => {
    it('should return daily session statistics', async () => {
      // Create test sessions
      const today = new Date();
      await Session.create([
        {
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: today,
          endTime: new Date(today.getTime() + 25 * 60 * 1000)
        },
        {
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: today,
          endTime: new Date(today.getTime() + 25 * 60 * 1000)
        }
      ]);

      const response = await request(app)
        .get('/api/analytics/sessions')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalMinutes');
      expect(response.body).toHaveProperty('averageFocusScore');
      expect(response.body.totalSessions).toBeGreaterThanOrEqual(2);
    });

    it('should filter sessions by date', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await Session.create({
        userId: testUser._id,
        type: 'focus',
        duration: 25,
        status: 'completed',
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 25 * 60 * 1000)
      });

      const response = await request(app)
        .get(`/api/analytics/sessions?date=${yesterday.toISOString().split('T')[0]}`)
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body.totalSessions).toBeGreaterThanOrEqual(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/sessions')
        .expect(401);
    });
  });

  describe('GET /api/analytics/weekly-progress', () => {
    it('should return 7-day progress data', async () => {
      // Create sessions over past week
      for (let i = 0; i < 7; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        await Session.create({
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: date,
          endTime: new Date(date.getTime() + 25 * 60 * 1000)
        });
      }

      const response = await request(app)
        .get('/api/analytics/weekly-progress')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('weeklyProgress');
      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalMinutes');
      expect(Array.isArray(response.body.weeklyProgress)).toBe(true);
      expect(response.body.weeklyProgress.length).toBe(7);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/weekly-progress')
        .expect(401);
    });
  });

  describe('GET /api/analytics/recent-sessions', () => {
    it('should return recent sessions with default limit', async () => {
      // Create 10 test sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        sessions.push({
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: new Date(Date.now() - i * 60 * 60 * 1000),
          endTime: new Date(Date.now() - i * 60 * 60 * 1000 + 25 * 60 * 1000)
        });
      }
      await Session.create(sessions);

      const response = await request(app)
        .get('/api/analytics/recent-sessions')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.sessions)).toBe(true);
      expect(response.body.sessions.length).toBeLessThanOrEqual(5);
    });

    it('should respect custom limit parameter', async () => {
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        sessions.push({
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: new Date(Date.now() - i * 60 * 60 * 1000),
          endTime: new Date(Date.now() - i * 60 * 60 * 1000 + 25 * 60 * 1000)
        });
      }
      await Session.create(sessions);

      const response = await request(app)
        .get('/api/analytics/recent-sessions?limit=3')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body.sessions.length).toBeLessThanOrEqual(3);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/recent-sessions')
        .expect(401);
    });
  });

  describe('GET /api/analytics/user-stats', () => {
    it('should return comprehensive user statistics', async () => {
      // Create test data
      await Session.create([
        {
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: new Date(),
          endTime: new Date(Date.now() + 25 * 60 * 1000)
        },
        {
          userId: testUser._id,
          type: 'focus',
          duration: 50,
          status: 'completed',
          startTime: new Date(),
          endTime: new Date(Date.now() + 50 * 60 * 1000)
        }
      ]);

      await Goal.create({
        userId: testUser._id,
        title: 'Test Goal',
        isActive: true
      });

      const response = await request(app)
        .get('/api/analytics/user-stats')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSessions');
      expect(response.body).toHaveProperty('totalMinutes');
      expect(response.body).toHaveProperty('totalHours');
      expect(response.body).toHaveProperty('activeGoals');
      expect(response.body).toHaveProperty('currentStreak');
      expect(response.body).toHaveProperty('avgSessionDuration');
      expect(response.body.totalSessions).toBe(2);
      expect(response.body.activeGoals).toBe(1);
    });

    it('should calculate streak correctly for consecutive days', async () => {
      // Create sessions for consecutive days
      for (let i = 0; i < 3; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        await Session.create({
          userId: testUser._id,
          type: 'focus',
          duration: 25,
          status: 'completed',
          startTime: date,
          endTime: new Date(date.getTime() + 25 * 60 * 1000)
        });
      }

      const response = await request(app)
        .get('/api/analytics/user-stats')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body.currentStreak).toBeGreaterThanOrEqual(3);
    });

    it('should return zero stats for new user', async () => {
      const response = await request(app)
        .get('/api/analytics/user-stats')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body.totalSessions).toBe(0);
      expect(response.body.totalMinutes).toBe(0);
      expect(response.body.currentStreak).toBe(0);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/analytics/user-stats')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date format gracefully', async () => {
      const response = await request(app)
        .get('/api/analytics/sessions?date=invalid-date')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalSessions');
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/analytics/recent-sessions?limit=abc')
        .set('Cookie', `accessToken=${authToken}`)
        .expect(200);

      expect(response.body.sessions.length).toBeLessThanOrEqual(5);
    });
  });
});
