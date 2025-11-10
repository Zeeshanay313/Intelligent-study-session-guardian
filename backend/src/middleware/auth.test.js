const jwt = require('jsonwebtoken');
const { authenticate, optionalAuth } = require('./auth');
const User = require('../models/User');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
      cookies: {},
      url: '/test',
      method: 'GET'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should authenticate with valid token in cookie', async () => {
      const testUser = await User.create({
        email: 'middleware@test.com',
        password: 'hashedpassword',
        displayName: 'Middleware User'
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should authenticate with valid token in Authorization header', async () => {
      const testUser = await User.create({
        email: 'header@test.com',
        password: 'hashedpassword',
        displayName: 'Header User'
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    it('should reject request without token', async () => {
      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      mockReq.cookies.accessToken = 'invalid-token';

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const testUser = await User.create({
        email: 'expired@test.com',
        password: 'hashedpassword',
        displayName: 'Expired User'
      });

      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      );

      mockReq.cookies.accessToken = expiredToken;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token for deleted user', async () => {
      const testUser = await User.create({
        email: 'deleted@test.com',
        password: 'hashedpassword',
        displayName: 'Deleted User',
        deleted: true
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found or account deleted' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const fakeUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
      const token = jwt.sign(
        { userId: fakeUserId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should attach user if valid token provided', async () => {
      const testUser = await User.create({
        email: 'optional@test.com',
        password: 'hashedpassword',
        displayName: 'Optional User'
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await optionalAuth(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should continue without user if no token provided', async () => {
      await optionalAuth(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue without user if invalid token provided', async () => {
      mockReq.cookies.accessToken = 'invalid-token';

      await optionalAuth(mockReq, mockRes, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('Security', () => {
    it('should not expose password in user object', async () => {
      const testUser = await User.create({
        email: 'security@test.com',
        password: 'hashedpassword',
        displayName: 'Security User'
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockReq.user.password).toBeUndefined();
    });

    it('should not expose refresh tokens in user object', async () => {
      const testUser = await User.create({
        email: 'refresh@test.com',
        password: 'hashedpassword',
        displayName: 'Refresh User',
        refreshTokens: ['token1', 'token2']
      });

      const token = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.cookies.accessToken = token;

      await authenticate(mockReq, mockRes, nextFunction);

      expect(mockReq.user.refreshTokens).toBeUndefined();
    });
  });
});
