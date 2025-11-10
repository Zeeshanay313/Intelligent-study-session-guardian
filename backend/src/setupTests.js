const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Close any existing connections first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}, 30000); // Increase timeout for MongoDB setup

// Cleanup after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map(collection => collection.deleteMany({})));
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};
