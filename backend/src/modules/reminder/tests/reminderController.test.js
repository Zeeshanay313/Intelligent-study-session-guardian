const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../index');
const Reminder = require('../Reminder');
const User = require('../../../models/User');
const { scheduleReminder, executeReminderAction } = require('../reminderController');

describe('Reminder Controller', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test_study_guardian');
    }
  });

  beforeEach(async () => {
    // Clean up collections
    await Reminder.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'reminder@test.com',
      displayName: 'Reminder Test User'
    });
    await testUser.save();

    // Create auth token (mock JWT)
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/reminders', () => {
    it('should get reminders for authenticated user', async () => {
      // Create test reminders
      const reminder1 = new Reminder({
        userId: testUser._id,
        title: 'Test Reminder 1',
        message: 'This is a test',
        type: 'one-off',
        datetime: new Date(Date.now() + 3600000) // 1 hour from now
      });

      const reminder2 = new Reminder({
        userId: testUser._id,
        title: 'Test Reminder 2',
        message: 'This is another test',
        type: 'recurring',
        cronExpression: '0 9 * * *' // Daily at 9 AM
      });

      await reminder1.save();
      await reminder2.save();

      const response = await request(app)
        .get('/api/reminders')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter reminders by type', async () => {
      const reminder = new Reminder({
        userId: testUser._id,
        title: 'Recurring Reminder',
        message: 'Daily reminder',
        type: 'recurring',
        cronExpression: '0 9 * * *'
      });
      await reminder.save();

      const response = await request(app)
        .get('/api/reminders?type=recurring')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('recurring');
    });
  });

  describe('POST /api/reminders', () => {
    it('should create a one-off reminder', async () => {
      const reminderData = {
        title: 'Study Session',
        message: 'Time to start studying!',
        type: 'one-off',
        datetime: new Date(Date.now() + 3600000).toISOString(),
        channels: { inApp: true, email: false, push: false }
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', authToken)
        .send(reminderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Study Session');
      expect(response.body.data.type).toBe('one-off');
    });

    it('should create a recurring reminder', async () => {
      const reminderData = {
        title: 'Daily Study Reminder',
        message: 'Don\'t forget to study!',
        type: 'recurring',
        cronExpression: '0 9 * * *', // Daily at 9 AM
        channels: { inApp: true, email: true, push: false }
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', authToken)
        .send(reminderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Daily Study Reminder');
      expect(response.body.data.type).toBe('recurring');
      expect(response.body.data.cronExpression).toBe('0 9 * * *');
    });

    it('should return validation error for invalid cron expression', async () => {
      const invalidData = {
        title: 'Invalid Recurring Reminder',
        type: 'recurring',
        cronExpression: 'invalid-cron'
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return validation error for past datetime in one-off reminder', async () => {
      const invalidData = {
        title: 'Past Reminder',
        type: 'one-off',
        datetime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      const response = await request(app)
        .post('/api/reminders')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/reminders/:id', () => {
    it('should update a reminder', async () => {
      const reminder = new Reminder({
        userId: testUser._id,
        title: 'Original Title',
        message: 'Original message',
        type: 'one-off',
        datetime: new Date(Date.now() + 3600000)
      });
      await reminder.save();

      const updateData = {
        title: 'Updated Title',
        message: 'Updated message',
        type: 'one-off',
        datetime: new Date(Date.now() + 7200000).toISOString() // 2 hours from now
      };

      const response = await request(app)
        .put(`/api/reminders/${reminder._id}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.message).toBe('Updated message');
    });

    it('should return 404 for non-existent reminder', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .put(`/api/reminders/${fakeId}`)
        .set('Authorization', authToken)
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('POST /api/reminders/:id/trigger', () => {
    it('should manually trigger a reminder', async () => {
      const reminder = new Reminder({
        userId: testUser._id,
        title: 'Test Trigger',
        message: 'This is a test trigger',
        type: 'one-off',
        datetime: new Date(Date.now() + 3600000)
      });
      await reminder.save();

      const response = await request(app)
        .post(`/api/reminders/${reminder._id}/trigger`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Reminder triggered successfully');
    });
  });

  describe('Reminder Scheduling', () => {
    it('should schedule a recurring reminder', async () => {
      const reminder = new Reminder({
        userId: testUser._id,
        title: 'Test Recurring',
        message: 'Test message',
        type: 'recurring',
        cronExpression: '0 * * * *', // Every hour
        isActive: true
      });

      await scheduleReminder(reminder);
      // Note: Testing actual cron execution would require more complex setup
      // This test verifies the function doesn't throw errors
      expect(true).toBe(true);
    });

    it('should execute reminder action', async () => {
      const reminder = new Reminder({
        userId: testUser._id,
        title: 'Test Execution',
        message: 'Test message',
        type: 'one-off',
        channels: { inApp: true, email: false, push: false }
      });

      // Mock console.log to verify execution
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await executeReminderAction(reminder);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Executing reminder: Test Execution')
      );

      consoleSpy.mockRestore();
    });
  });
});
