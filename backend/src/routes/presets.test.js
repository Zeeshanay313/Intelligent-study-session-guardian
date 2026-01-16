const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const presetsRoutes = require('./presets');
const Preset = require('../models/Preset');
const User = require('../models/User');

let mongoServer;
let app;
let authToken;
let testUser;

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
  app.use('/api/presets', presetsRoutes);

  // Create test user
  testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    profile: { displayName: 'Test User' }
  });
  await testUser.save();

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
  await Preset.deleteMany({});
});

describe('Presets API', () => {
  describe('POST /api/presets', () => {
    it('should create a new preset', async () => {
      const newPreset = {
        name: 'Pomodoro',
        workDuration: 25,
        breakDuration: 5,
        isDefault: false
      };

      const response = await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newPreset)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe('Pomodoro');
      expect(response.body.data.workDuration).toBe(25);
    });

    it('should reject preset with invalid work duration', async () => {
      const invalidPreset = {
        name: 'Invalid',
        workDuration: 300, // exceeds max of 240
        breakDuration: 5
      };

      await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPreset)
        .expect(400);
    });

    it('should only allow one default preset per user', async () => {
      const preset1 = {
        name: 'Default 1',
        workDuration: 25,
        breakDuration: 5,
        isDefault: true
      };

      const preset2 = {
        name: 'Default 2',
        workDuration: 30,
        breakDuration: 10,
        isDefault: true
      };

      await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preset1)
        .expect(201);

      await request(app)
        .post('/api/presets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(preset2)
        .expect(201);

      // Check that only preset2 is default
      const presets = await Preset.find({ userId: testUser._id });
      const defaults = presets.filter(p => p.isDefault);
      expect(defaults.length).toBe(1);
      expect(defaults[0].name).toBe('Default 2');
    });
  });

  describe('GET /api/presets', () => {
    beforeEach(async () => {
      await Preset.create([
        {
          userId: testUser._id,
          name: 'Pomodoro',
          workDuration: 25,
          breakDuration: 5,
          isDefault: false
        },
        {
          userId: testUser._id,
          name: 'Deep Work',
          workDuration: 90,
          breakDuration: 20,
          isDefault: true
        }
      ]);
    });

    it('should get all presets for user', async () => {
      const response = await request(app)
        .get('/api/presets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Default should come first
      expect(response.body.data[0].isDefault).toBe(true);
    });
  });

  describe('PUT /api/presets/:id', () => {
    let presetId;

    beforeEach(async () => {
      const preset = await Preset.create({
        userId: testUser._id,
        name: 'Original',
        workDuration: 25,
        breakDuration: 5
      });
      presetId = preset._id;
    });

    it('should update a preset', async () => {
      const response = await request(app)
        .put(`/api/presets/${presetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated', workDuration: 30 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.workDuration).toBe(30);
    });

    it('should not allow updating another user\'s preset', async () => {
      const otherUser = new User({
        username: 'other',
        email: 'other@example.com',
        password: 'password',
        profile: { displayName: 'Other User' }
      });
      await otherUser.save();

      const otherPreset = await Preset.create({
        userId: otherUser._id,
        name: 'Other',
        workDuration: 25,
        breakDuration: 5
      });

      await request(app)
        .put(`/api/presets/${otherPreset._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /api/presets/:id', () => {
    let presetId;

    beforeEach(async () => {
      const preset = await Preset.create({
        userId: testUser._id,
        name: 'To Delete',
        workDuration: 25,
        breakDuration: 5
      });
      presetId = preset._id;
    });

    it('should delete a preset', async () => {
      const response = await request(app)
        .delete(`/api/presets/${presetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      const deleted = await Preset.findById(presetId);
      expect(deleted).toBeNull();
    });

    it('should not allow deleting another user\'s preset', async () => {
      const otherUser = new User({
        username: 'other2',
        email: 'other2@example.com',
        password: 'password',
        profile: { displayName: 'Other User 2' }
      });
      await otherUser.save();

      const otherPreset = await Preset.create({
        userId: otherUser._id,
        name: 'Protected',
        workDuration: 25,
        breakDuration: 5
      });

      await request(app)
        .delete(`/api/presets/${otherPreset._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
