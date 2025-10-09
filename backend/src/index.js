const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Handle preflight requests
app.options('*', cors());

// Security middleware with relaxed settings for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for development
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting - disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Serve static files for uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Intelligent Study Session Guardian API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = process.env.PORT || 5002;

// MongoDB connection with bulletproof error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      ssl: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Try fallback without SSL
    try {
      console.log('🔄 Trying fallback connection without SSL...');
      const fallbackConn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-guardian', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        ssl: false
      });
      console.log(`✅ MongoDB Connected (fallback): ${fallbackConn.connection.host}`);
      return fallbackConn;
    } catch (fallbackError) {
      console.error('❌ Fallback connection also failed:', fallbackError.message);
      throw fallbackError;
    }
  }
};

// BULLETPROOF server startup
const startServer = async () => {
  try {
    console.log('🚀 Starting Intelligent Study Session Guardian API...');
    
    // Connect to database FIRST before starting server
    try {
      await connectDB();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('📝 Note: Starting server anyway, but database features will not work');
    }
    
    // Now start server after database connection attempt
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ SERVER RUNNING SUCCESSFULLY!');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log('===============================================');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Trying alternative port...`);
        const alternativePort = PORT + 1;
        server.listen(alternativePort, '0.0.0.0', () => {
          console.log(`✅ Server started on alternative port: ${alternativePort}`);
        });
      } else {
        console.error('❌ Server error:', error);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
          }
        } catch (error) {
          console.error('❌ Error closing MongoDB connection:', error.message);
        }
        
        console.log('👋 Process terminated');
        process.exit(0);
      });
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit - just log the error
    });

    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;