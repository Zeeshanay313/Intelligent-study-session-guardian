const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is set and not the default local one
    const mongoUri = process.env.MONGODB_URI;
    
    // Try to connect to the provided URI first
    if (mongoUri && !mongoUri.includes('localhost:27017')) {
      try {
        console.log('🔌 Attempting to connect to MongoDB...');
        const conn = await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (error) {
        console.warn('⚠️ Could not connect to external MongoDB:', error.message);
        console.log('🔄 Falling back to in-memory MongoDB for development...');
      }
    }

    // Fall back to in-memory MongoDB for development
    console.log('🚀 Starting in-memory MongoDB for development...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ In-Memory MongoDB Started: ${conn.connection.host}`);
    console.log('📝 Note: Using in-memory database - data will be lost on restart');
    
    // Set up connection event listeners
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      if (mongoServer) {
        await mongoServer.stop();
      }
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
