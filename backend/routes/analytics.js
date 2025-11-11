const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const Goal = require('../models/Goal');
const { auth } = require('../middleware/auth');

// Get sessions for a specific date
router.get('/sessions', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await StudySession.find({
      userId: req.user._id,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ startTime: -1 });

    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const completedSessions = sessions.filter(s => s.status === 'completed').length;

    res.json({
      sessions,
      stats: {
        totalSessions: sessions.length,
        completedSessions,
        totalDuration,
        averageDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get weekly progress
router.get('/weekly-progress', auth, async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const sessions = await StudySession.find({
      userId: req.user._id,
      startTime: { $gte: sevenDaysAgo }
    }).sort({ startTime: 1 });

    // Group by day
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { date: dateKey, duration: 0, sessions: 0 };
    }

    sessions.forEach(session => {
      const dateKey = new Date(session.startTime).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].duration += session.duration || 0;
        dailyData[dateKey].sessions += 1;
      }
    });

    const weeklyData = Object.values(dailyData);
    const totalDuration = weeklyData.reduce((sum, day) => sum + day.duration, 0);
    const totalSessions = weeklyData.reduce((sum, day) => sum + day.sessions, 0);

    res.json({
      weeklyData,
      summary: {
        totalDuration,
        totalSessions,
        averageDailyDuration: Math.round(totalDuration / 7),
        averageDailySessions: (totalSessions / 7).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Failed to fetch weekly progress' });
  }
});

// Get recent sessions
router.get('/recent-sessions', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const sessions = await StudySession.find({
      userId: req.user._id
    })
      .sort({ startTime: -1 })
      .limit(limit);

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    res.status(500).json({ error: 'Failed to fetch recent sessions' });
  }
});

// Get study statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await StudySession.find(query);
    const goals = await Goal.find({ userId: req.user._id });

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const activeGoals = goals.filter(g => g.status === 'active').length;

    res.json({
      totalSessions: sessions.length,
      totalDuration,
      averageSessionDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
      completedGoals,
      activeGoals,
      totalGoals: goals.length,
      goalCompletionRate: goals.length > 0 ? ((completedGoals / goals.length) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get productivity trends
router.get('/productivity', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await StudySession.find({
      userId: req.user._id,
      startTime: { $gte: thirtyDaysAgo }
    }).sort({ startTime: 1 });

    // Group by week
    const weeklyData = {};
    sessions.forEach(session => {
      const weekStart = new Date(session.startTime);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, duration: 0, sessions: 0 };
      }
      
      weeklyData[weekKey].duration += session.duration || 0;
      weeklyData[weekKey].sessions += 1;
    });

    res.json({
      trends: Object.values(weeklyData)
    });
  } catch (error) {
    console.error('Error fetching productivity trends:', error);
    res.status(500).json({ error: 'Failed to fetch productivity trends' });
  }
});

// Get goal analytics
router.get('/goals', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });

    const byStatus = goals.reduce((acc, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1;
      return acc;
    }, {});

    const byPriority = goals.reduce((acc, goal) => {
      acc[goal.priority || 'medium'] = (acc[goal.priority || 'medium'] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: goals.length,
      byStatus,
      byPriority,
      averageProgress: goals.length > 0 ? 
        goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length : 0
    });
  } catch (error) {
    console.error('Error fetching goal analytics:', error);
    res.status(500).json({ error: 'Failed to fetch goal analytics' });
  }
});

module.exports = router;
