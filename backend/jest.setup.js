// Setup file for Jest tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-testing-minimum-32-chars';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Suppress console output during tests unless there's an error
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};
