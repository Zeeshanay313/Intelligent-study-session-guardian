const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const Session = require('../modules/timer/Session');
const Goal = require('../models/Goal');

// Get user stats (total stats across all time)
router.get('/user-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all sessions
    const allSessions = await Session.find({ userId });
    
    // Calculate total stats
    const totalSessions = allSessions.length;
    const totalMinutes = allSessions.reduce((sum, session) => {
      if (session.endTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60;
        return sum + duration;
      }
      return sum;
    }, 0);

    // Get active goals count
    const activeGoalsCount = await Goal.countDocuments({ 
      userId, 
      isActive: true 
    });

    // Calculate streak (consecutive days with sessions)
    const today = new Date();
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    for (let i = 0; i < 365; i++) {  // Check up to a year
      const startOfDay = new Date(checkDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(checkDate.setHours(23, 59, 59, 999));
      
      const hasSessions = await Session.exists({
        userId,
        startTime: { $gte: startOfDay, $lte: endOfDay }
      });

      if (hasSessions) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // If no session today, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    res.json({
      totalSessions,
      totalMinutes: Math.round(totalMinutes),
      totalHours: Math.round(totalMinutes / 60),
      activeGoals: activeGoalsCount,
      currentStreak,
      averageSessionDuration: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get dashboard stats for a specific date
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user._id;

    // Parse the date or use today
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get sessions for the day
    const sessions = await Session.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: -1 });

    // Calculate stats
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => {
      if (session.endTime) {
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60;
        return sum + duration;
      }
      return sum;
    }, 0);

    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const focusScore = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    res.json({
      totalSessions,
      totalMinutes: Math.round(totalMinutes),
      completedSessions,
      focusScore,
      sessions: sessions.slice(0, 5) // Last 5 sessions
    });
  } catch (error) {
    console.error('Error fetching session stats:', error);
    res.status(500).json({ error: 'Failed to fetch session statistics' });
  }
});

// Get weekly progress
router.get('/weekly-progress', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Get sessions from the last 7 days
    const sessions = await Session.find({
      userId,
      startTime: { $gte: sevenDaysAgo, $lte: today }
    }).sort({ startTime: 1 });

    // Group by day
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        sessions: 0,
        minutes: 0,
        completed: 0
      };
    }

    // Populate with actual data
    sessions.forEach(session => {
      const dateKey = new Date(session.startTime).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].sessions += 1;
        if (session.endTime) {
          const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60;
          dailyData[dateKey].minutes += Math.round(duration);
        }
        if (session.status === 'completed') {
          dailyData[dateKey].completed += 1;
        }
      }
    });

    const weeklyProgress = Object.values(dailyData);

    res.json({
      weeklyProgress,
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((sum, s) => {
        if (s.endTime) {
          return sum + Math.round((new Date(s.endTime) - new Date(s.startTime)) / 1000 / 60);
        }
        return sum;
      }, 0)
    });
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

// Get recent sessions
router.get('/recent-sessions', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const recentSessions = await Session.find({ userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .lean();

    // Format sessions
    const formattedSessions = recentSessions.map(session => ({
      _id: session._id,
      type: session.type || 'focus',
      duration: session.duration || 25,
      actualDuration: session.endTime 
        ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60)
        : 0,
      status: session.status,
      startTime: session.startTime,
      endTime: session.endTime,
      notes: session.notes
    }));

    res.json({
      sessions: formattedSessions,
      total: recentSessions.length
    });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    res.status(500).json({ error: 'Failed to fetch recent sessions' });
  }
});

// Get user statistics
router.get('/user-stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all completed sessions
    const allSessions = await Session.find({ 
      userId,
      status: 'completed'
    }).lean();

    // Get active goals count
    const activeGoals = await Goal.countDocuments({
      userId,
      isActive: true
    });

    // Calculate total minutes and hours
    const totalMinutes = allSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000 / 60);
      }
      return sum;
    }, 0);

    // Calculate average session duration
    const avgSessionDuration = allSessions.length > 0 
      ? Math.round(totalMinutes / allSessions.length)
      : 0;

    // Calculate current streak (consecutive days with completed sessions)
    let currentStreak = 0;
    if (allSessions.length > 0) {
      // Sort sessions by date
      const sortedSessions = allSessions
        .map(s => new Date(s.startTime).toISOString().split('T')[0])
        .sort((a, b) => new Date(b) - new Date(a));
      
      const uniqueDays = [...new Set(sortedSessions)];
      const today = new Date().toISOString().split('T')[0];
      
      // Check if there's a session today or yesterday
      const latestDay = uniqueDays[0];
      const daysDiff = Math.floor((new Date(today) - new Date(latestDay)) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prevDay = new Date(uniqueDays[i - 1]);
          const currDay = new Date(uniqueDays[i]);
          const diff = Math.floor((prevDay - currDay) / (1000 * 60 * 60 * 24));
          
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      totalSessions: allSessions.length,
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      activeGoals,
      currentStreak,
      avgSessionDuration
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;
