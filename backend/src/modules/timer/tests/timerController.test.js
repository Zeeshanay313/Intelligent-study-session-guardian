const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../../testApp');
const TimerPreset = require('../TimerPreset');
const Session = require('../Session');
const User = require('../../../models/User');

describe('Timer Controller', () => {
  let authToken;
  let testUser;
  let testPreset;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_study_guardian');
    }
  });

  beforeEach(async () => {
    // Clean up collections
    await TimerPreset.deleteMany({});
    await Session.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'timer@test.com',
      password: '$2a$10$testhashedpassword',
      profile: {
        displayName: 'Timer Test User'
      },
      verified: true
    });
    await testUser.save();

    // Create auth token (real JWT)
    authToken = jwt.sign(
      { userId: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/timers', () => {
    it('should get timer presets for authenticated user', async () => {
      // Create test preset
      testPreset = new TimerPreset({
        userId: testUser._id,
        name: 'Test Pomodoro',
        workDuration: 1500,
        breakDuration: 300,
        longBreakDuration: 900,
        cyclesBeforeLongBreak: 4
      });
      await testPreset.save();

      const response = await request(app)
        .get('/api/timers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Pomodoro');
    });
  });

  describe('POST /api/timers', () => {
    it('should create a new timer preset', async () => {
      const presetData = {
        name: 'New Preset',
        workDuration: 1800,
        breakDuration: 600,
        longBreakDuration: 1200,
        cyclesBeforeLongBreak: 3
      };

      const response = await request(app)
        .post('/api/timers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(presetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Preset');
      expect(response.body.data.workDuration).toBe(1800);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        name: '',
        workDuration: 30, // Too short
        breakDuration: 600,
        longBreakDuration: 1200,
        cyclesBeforeLongBreak: 3
      };

      const response = await request(app)
        .post('/api/timers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/timers/start', () => {
    it('should start a timer session with preset', async () => {
      testPreset = new TimerPreset({
        userId: testUser._id,
        name: 'Test Preset',
        workDuration: 1500,
        breakDuration: 300,
        longBreakDuration: 900,
        cyclesBeforeLongBreak: 4
      });
      await testPreset.save();

      const response = await request(app)
        .post('/api/timers/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ presetId: testPreset._id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();

      // Verify session was created
      const session = await Session.findById(response.body.data.sessionId);
      expect(session).toBeTruthy();
      expect(session.userId.toString()).toBe(testUser._id.toString());
      expect(session.presetId.toString()).toBe(testPreset._id.toString());
    });
  });

  describe('POST /api/timers/:sessionId/stop', () => {
    it('should stop and finalize a timer session', async () => {
      // Create test session
      const session = new Session({
        userId: testUser._id,
        startTime: new Date(Date.now() - 60000) // Started 1 minute ago
      });
      await session.save();

      const response = await request(app)
        .post(`/api/timers/${session._id}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.endTime).toBeDefined();
      expect(response.body.data.totalDurationSec).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .post(`/api/timers/${fakeId}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/timers/sessions', () => {
    it('should get session history for authenticated user', async () => {
      // Create test sessions
      const session1 = new Session({
        userId: testUser._id,
        startTime: new Date(Date.now() - 120000),
        endTime: new Date(Date.now() - 60000),
        totalDurationSec: 60
      });
      
      const session2 = new Session({
        userId: testUser._id,
        startTime: new Date(Date.now() - 180000),
        endTime: new Date(Date.now() - 120000),
        totalDurationSec: 60
      });

      await session1.save();
      await session2.save();

      const response = await request(app)
        .get('/api/timers/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });
  });
});
