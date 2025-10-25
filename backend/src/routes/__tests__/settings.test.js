const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../testApp');
const Settings = require('../../../models/Settings');
const User = require('../../../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  testUser = await User.create({
    email: 'test@example.com',
    password: '$2a$10$test',
    profile: { displayName: 'Test User' },
    verified: true
  });

  authToken = jwt.sign(
    { userId: testUser._id, email: testUser.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Settings.deleteMany({});
});

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('should return default settings for new user', async () => {
      const response = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings).toHaveProperty('timerDefaults');
      expect(response.body.settings).toHaveProperty('reminderDefaults');
      expect(response.body.settings).toHaveProperty('goalDefaults');
      expect(response.body.settings.timerDefaults.focusTime).toBe(25);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app).get('/api/settings');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/settings', () => {
    it('should save user settings', async () => {
      const newSettings = {
        timerDefaults: { focusTime: 30, shortBreak: 10 },
        reminderDefaults: { enabled: false }
      };

      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSettings);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.timerDefaults.focusTime).toBe(30);
      expect(response.body.settings.timerDefaults.shortBreak).toBe(10);
      expect(response.body.settings.reminderDefaults.enabled).toBe(false);
    });

    it('should validate settings values', async () => {
      const invalidSettings = {
        timerDefaults: { focusTime: 200 } // exceeds max
      };

      const response = await request(app)
        .post('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('should update individual setting', async () => {
      const response = await request(app)
        .put('/api/settings/timerDefaults.focusTime')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 35 });

      expect(response.status).toBe(200);
      expect(response.body.settings.timerDefaults.focusTime).toBe(35);
    });
  });

  describe('DELETE /api/settings', () => {
    it('should reset settings to defaults', async () => {
      await Settings.create({
        userId: testUser._id,
        timerDefaults: { focusTime: 50 }
      });

      const response = await request(app)
        .delete('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.settings.timerDefaults.focusTime).toBe(25);
    });
  });
});
