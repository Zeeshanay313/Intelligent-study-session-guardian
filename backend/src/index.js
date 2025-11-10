const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Initialize Passport configuration
require('./config/passport');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const goalTrackerRoutes = require('./routes/goalTracker');
const timerRoutes = require('./modules/timer/timerRoutes');
const reminderRoutes = require('./modules/reminder/reminderRoutes');
const calendarRoutes = require('./modules/calendar/calendarRoutes');
const oauthTestRoutes = require('./routes/oauthTest');
const analyticsRoutes = require('./routes/analytics');
const { router: studySessionRoutes, setSocketIO } = require('./routes/studySession');

const app = express();

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-dev-bypass']
}));

// Handle preflight requests
app.options('*', cors());

// Security middleware with relaxed settings for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Disable for development
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'study-guardian-oauth-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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

// Make socket.io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('🏥 Health check called');
  console.log('🏥 Headers:', JSON.stringify(req.headers, null, 2));
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    devBypass: req.headers['x-dev-bypass'] || 'not set'
  });
});

// Test endpoint for dev bypass
app.get('/api/test-dev-bypass', (req, res) => {
  console.log('🧪 Test dev bypass called');
  console.log('🧪 x-dev-bypass header:', req.headers['x-dev-bypass']);
  if (req.headers['x-dev-bypass'] === 'true') {
    res.json({ message: 'Dev bypass is working!', timestamp: new Date().toISOString() });
  } else {
    res.status(401).json({ error: 'Dev bypass not detected' });
  }
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Debug middleware for API routes
app.use('/api', (req, res, next) => {
  console.log(`🔍 API Request: ${req.method} ${req.url}`);
  console.log('🔍 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 x-dev-bypass:', req.headers['x-dev-bypass']);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/goals', goalTrackerRoutes);
app.use('/api/timers', timerRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/study-session', studySessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', oauthTestRoutes);

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
app.use((error, req, res, _next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

const PORT = process.env.PORT || 5004;

// Initialize study session orchestrator with socket.io
setSocketIO(io);

// Socket.IO connection handling
io.on('connection', socket => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join', userId => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined socket room`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

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
    const httpServer = server.listen(PORT, '0.0.0.0', async () => {
      console.log('✅ SERVER RUNNING SUCCESSFULLY!');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log('🔌 Socket.IO enabled for real-time updates');

      // Initialize reminder scheduler after server is running
      try {
        const { initializeReminders } = require('./modules/reminder/reminderController');
        await initializeReminders(io);
        console.log('✅ Reminder scheduler initialized');
      } catch (error) {
        console.error('❌ Failed to initialize reminder scheduler:', error.message);
      }
      console.log('===============================================');
    });

    // Handle server errors
    httpServer.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Trying alternative port...`);
        const alternativePort = PORT + 1;
        httpServer.listen(alternativePort, '0.0.0.0', () => {
          console.log(`✅ Server started on alternative port: ${alternativePort}`);
        });
      } else {
        console.error('❌ Server error:', error);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = signal => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
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
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit - just log the error
    });

    return httpServer;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
