const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../index');
const User = require('../models/User');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        displayName: 'New User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@test.com',
        password: 'SecurePass123!',
        displayName: 'Existing User'
      };

      await User.create({
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        displayName: userData.displayName
      });

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' })
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          displayName: 'Test User'
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'login@test.com',
        password: await bcrypt.hash('Password123!', 10),
        displayName: 'Login User'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should not login with wrong password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPassword123!'
        })
        .expect(401);
    });

    it('should not login with non-existent email', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password123!'
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      await User.create({
        email: 'refresh@test.com',
        password: await bcrypt.hash('Password123!', 10),
        displayName: 'Refresh User'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@test.com',
          password: 'Password123!'
        });

      const { refreshToken } = loginResponse.body;

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);
    });
  });
});
