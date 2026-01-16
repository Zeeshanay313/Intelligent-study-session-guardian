const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const passport = require('passport');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Import routes
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const timerRoutes = require('./modules/timer/timerRoutes');
const reminderRoutes = require('./modules/reminder/reminderRoutes');
const goalTrackerRoutes = require('./routes/goalTracker');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/timers', timerRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/goals', goalTrackerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: 'test' });
});

module.exports = app;
