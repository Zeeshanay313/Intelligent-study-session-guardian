const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const sessionsRoutes = require('./sessions');
const SessionLog = require('../models/SessionLog');
const Preset = require('../models/Preset');
const User = require('../models/User');
const { getSuggestion } = require('../services/suggestionService');

let mongoServer;
let app;
let authToken;
let testUser;
let testPreset;

beforeAll(async () => {
  // Disconnect if already connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Express app for testing
  app = express();
  app.use(express.json());
  app.use('/api/sessions', sessionsRoutes);

  // Create test user
  testUser = new User({
    username: 'sessionuser',
    email: 'session@example.com',
    password: 'hashedpassword',
    profile: { displayName: 'Session User' }
  });
  await testUser.save();

  // Create test preset
  testPreset = new Preset({
    userId: testUser._id,
    name: 'Test Pomodoro',
    workDuration: 25,
    breakDuration: 5
  });
  await testPreset.save();

  // Generate auth token
  authToken = jwt.sign(
    { userId: testUser._id },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await SessionLog.deleteMany({});
});

describe('Sessions API', () => {
  describe('POST /api/sessions/complete', () => {
    it('should log a completed session with preset', async () => {
      const sessionData = {
        presetId: testPreset._id.toString(),
        durationSeconds: 1500, // 25 minutes
        startedAt: new Date('2024-01-15T10:00:00Z'),
        endedAt: new Date('2024-01-15T10:25:00Z')
      };

      const response = await request(app)
        .post('/api/sessions/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.presetName).toBe('Test Pomodoro');
      expect(response.body.data.durationSeconds).toBe(1500);
      expect(response.body).toHaveProperty('todayCount');
    });

    it('should log a session without preset', async () => {
      const sessionData = {
        durationSeconds: 900,
        startedAt: new Date(),
        endedAt: new Date()
      };

      const response = await request(app)
        .post('/api/sessions/complete')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.presetName).toBe('Quick Session');
    });
  });

  describe('GET /api/sessions', () => {
    beforeEach(async () => {
      const baseDate = new Date('2024-01-15T10:00:00Z');

      const sessions = [];
      for (let i = 0; i < 15; i += 1) {
        sessions.push({
          userId: testUser._id,
          presetId: testPreset._id,
          presetName: 'Test Pomodoro',
          durationSeconds: 1500,
          startedAt: new Date(baseDate.getTime() + i * 3600000),
          endedAt: new Date(baseDate.getTime() + i * 3600000 + 1500000),
          completedSuccessfully: true
        });
      }

      await SessionLog.create(sessions);
    });

    it('should get paginated sessions', async () => {
      const response = await request(app)
        .get('/api/sessions?limit=10&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should filter sessions by date', async () => {
      const response = await request(app)
        .get('/api/sessions?date=2024-01-15')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/sessions/suggestion', () => {
    it('should return default suggestion when no history', async () => {
      const response = await request(app)
        .get('/api/sessions/suggestion')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestedBreakMinutes).toBe(5);
      expect(response.body.data.confidence).toBe('low');
    });

    it('should calculate suggestion based on recent sessions', async () => {
      // Create 5 sessions with varying durations
      const sessions = [
        { durationSeconds: 1500, endedAt: new Date() }, // 25 min
        { durationSeconds: 1800, endedAt: new Date(Date.now() - 3600000) }, // 30 min
        { durationSeconds: 1200, endedAt: new Date(Date.now() - 7200000) }, // 20 min
        { durationSeconds: 2400, endedAt: new Date(Date.now() - 10800000) }, // 40 min
        { durationSeconds: 1500, endedAt: new Date(Date.now() - 14400000) } // 25 min
      ];

      for (const session of sessions) {
        await SessionLog.create({
          userId: testUser._id,
          presetName: 'Test',
          durationSeconds: session.durationSeconds,
          startedAt: new Date(session.endedAt.getTime() - session.durationSeconds * 1000),
          endedAt: session.endedAt,
          completedSuccessfully: true
        });
      }

      const response = await request(app)
        .get('/api/sessions/suggestion')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestedBreakMinutes).toBeGreaterThanOrEqual(5);
      expect(response.body.data.suggestedBreakMinutes).toBeLessThanOrEqual(20);
      expect(response.body.data.confidence).toBe('high');
      expect(response.body.data.samplesUsed).toBe(5);
    });
  });
});

describe('Suggestion Service', () => {
  beforeEach(async () => {
    await SessionLog.deleteMany({});
  });

  it('should return default when no sessions exist', async () => {
    const suggestion = await getSuggestion(testUser._id, 5);

    expect(suggestion.suggestedBreakMinutes).toBe(5);
    expect(suggestion.confidence).toBe('low');
    expect(suggestion.streak).toBe(0);
  });

  it('should apply linear weights correctly', async () => {
    // Create sessions: 60, 60, 60 minutes (should suggest 10 min break)
    const now = new Date();
    for (let i = 0; i < 3; i += 1) {
      await SessionLog.create({
        userId: testUser._id,
        presetName: 'Test',
        durationSeconds: 3600,
        startedAt: new Date(now.getTime() - (i + 1) * 7200000),
        endedAt: new Date(now.getTime() - i * 7200000),
        completedSuccessfully: true
      });
    }

    const suggestion = await getSuggestion(testUser._id, 5);

    expect(suggestion.suggestedBreakMinutes).toBe(10);
    expect(suggestion.confidence).toBe('medium');
  });

  it('should clamp suggestion between 5 and 20 minutes', async () => {
    // Very short session (3 minutes) should clamp to 5
    await SessionLog.create({
      userId: testUser._id,
      presetName: 'Short',
      durationSeconds: 180,
      startedAt: new Date(Date.now() - 300000),
      endedAt: new Date(),
      completedSuccessfully: true
    });

    let suggestion = await getSuggestion(testUser._id, 5);
    expect(suggestion.suggestedBreakMinutes).toBe(5);

    await SessionLog.deleteMany({});

    // Very long session (240 minutes) should clamp to 20
    await SessionLog.create({
      userId: testUser._id,
      presetName: 'Long',
      durationSeconds: 14400,
      startedAt: new Date(Date.now() - 14400000),
      endedAt: new Date(),
      completedSuccessfully: true
    });

    suggestion = await getSuggestion(testUser._id, 5);
    expect(suggestion.suggestedBreakMinutes).toBe(20);
  });

  it('should detect streak correctly', async () => {
    const now = new Date();

    // Create 3 sessions in last 24 hours
    for (let i = 0; i < 3; i += 1) {
      await SessionLog.create({
        userId: testUser._id,
        presetName: 'Streak',
        durationSeconds: 1500,
        startedAt: new Date(now.getTime() - (i + 1) * 3600000),
        endedAt: new Date(now.getTime() - i * 3600000),
        completedSuccessfully: true
      });
    }

    const suggestion = await getSuggestion(testUser._id, 5);
    expect(suggestion.streak).toBe(3);
  });

  it('should handle errors gracefully', async () => {
    // Pass invalid userId to trigger error
    const suggestion = await getSuggestion(null, 5);

    expect(suggestion.suggestedBreakMinutes).toBe(5);
    expect(suggestion.confidence).toBe('low');
    expect(suggestion).toHaveProperty('error');
  });
});
