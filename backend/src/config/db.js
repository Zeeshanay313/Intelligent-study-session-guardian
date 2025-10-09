const mongoose = require('mongoose');

const connectDB = async (retryCount = 0) => {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  try {
    // First try with SSL validation disabled to fix TLS error
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      // SSL/TLS configuration to fix the OPENSSL error
      ssl: true,
      tlsAllowInvalidCertificates: true, // Updated from deprecated sslValidate
      tlsAllowInvalidHostnames: true
      // Removed tlsInsecure as it conflicts with tlsAllowInvalidCertificates
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => {
        connectDB(0); // Retry connection
      }, retryDelay);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`❌ Database connection failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);
    
    // Special handling for SSL/TLS errors
    if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('OPENSSL')) {
      console.log('🔄 SSL/TLS error detected. Trying fallback connection without SSL...');
      try {
        const fallbackConn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
          heartbeatFrequencyMS: 10000,
          retryWrites: true,
          ssl: false // Disable SSL completely as fallback
        });
        console.log(`✅ MongoDB Connected (SSL fallback): ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error('❌ SSL fallback also failed:', fallbackError.message);
      }
    }
    
    if (retryCount < maxRetries) {
      console.log(`⏳ Retrying connection in ${retryDelay/1000} seconds...`);
      setTimeout(() => {
        connectDB(retryCount + 1);
      }, retryDelay);
    } else {
      console.error('❌ Maximum retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = { connectDB };