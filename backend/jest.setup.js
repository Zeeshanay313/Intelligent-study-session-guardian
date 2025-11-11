// Setup file for Jest tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-testing-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-unit-testing-minimum-32-chars';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

// Mock cron to prevent actual scheduling in tests
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
  validate: jest.fn((expression) => {
    // Simple cron validation - must be string with 5 or 6 parts separated by spaces
    if (typeof expression !== 'string') return false;
    const parts = expression.trim().split(/\s+/);
    return parts.length >= 5 && parts.length <= 6;
  })
}));

// Suppress console output during tests unless there's an error
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

// Set test timeout
jest.setTimeout(30000);
