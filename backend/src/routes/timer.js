const express = require('express');
const router = express.Router();
const TimerSession = require('../models/TimerSession');
const TimerPreset = require('../modules/timer/TimerPreset');
const { authenticate } = require('../middleware/auth');
const { awardSessionPoints, updateChallengesFromSession } = require('../services/RewardsService');
const { updateGoalsFromSession } = require('../services/GoalProgressService');

// ============================================
// TIMER PRESETS ENDPOINTS
// ============================================

// Get all presets for user
router.get('/presets', authenticate, async (req, res) => {
  try {
    const presets = await TimerPreset.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Get presets by subject
router.get('/presets/subject/:subject', authenticate, async (req, res) => {
  try {
    const presets = await TimerPreset.find({ 
      userId: req.user._id, 
      subject: req.params.subject 
    });
    res.json(presets);
  } catch (error) {
    console.error('Error fetching presets by subject:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Create new preset
router.post('/presets', authenticate, async (req, res) => {
  try {
    const { name, subject, workDuration, breakDuration, longBreakDuration, cyclesBeforeLongBreak, color, icon } = req.body;

    const preset = new TimerPreset({
      userId: req.user._id,
      name,
      subject,
      workDuration: workDuration || 1500,
      breakDuration: breakDuration || 300,
      longBreakDuration: longBreakDuration || 900,
      cyclesBeforeLongBreak: cyclesBeforeLongBreak || 4,
      color: color || '#3B82F6',
      icon: icon || '📚'
    });

    await preset.save();
    res.status(201).json(preset);
  } catch (error) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Failed to create preset' });
  }
});

// Update preset
router.patch('/presets/:id', authenticate, async (req, res) => {
  try {
    const preset = await TimerPreset.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json(preset);
  } catch (error) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update preset' });
  }
});

// Delete preset
router.delete('/presets/:id', authenticate, async (req, res) => {
  try {
    const preset = await TimerPreset.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json({ message: 'Preset deleted successfully' });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

// ============================================
// TIMER SESSIONS ENDPOINTS
// ============================================

// Log completed session
router.post('/sessions', authenticate, async (req, res) => {
  try {
    const { subject, sessionType, duration, actualDuration, startTime, endTime, completed, cycle, presetId, notes } = req.body;

    const session = new TimerSession({
      userId: req.user._id,
      subject,
      sessionType,
      duration,
      actualDuration: actualDuration || duration,
      startTime: startTime || new Date(),
      endTime: endTime || new Date(),
      completed: completed !== undefined ? completed : true,
      cycle: cycle || 1,
      presetId,
      notes: notes || ''
    });

    await session.save();
    
    // Only award points for completed work sessions
    let rewardsResult = null;
    let challengeResults = null;
    
    if (completed && sessionType === 'work') {
      const sessionDuration = actualDuration || duration;
      
      // Award points and check for rewards
      try {
        rewardsResult = await awardSessionPoints(req.user._id, {
          duration: sessionDuration,
          _id: session._id
        });
        console.log(`🏆 Awarded ${rewardsResult.pointsAwarded} points for timer session`);
      } catch (rewardError) {
        console.error('Error awarding points:', rewardError);
      }
      
      // Update goal progress
      try {
        await updateGoalsFromSession({
          userId: req.user._id,
          duration: sessionDuration,
          subject: subject,
          _id: session._id
        });
      } catch (goalError) {
        console.error('Error updating goals:', goalError);
      }
      
      // Update challenge progress
      try {
        challengeResults = await updateChallengesFromSession(req.user._id, {
          duration: sessionDuration,
          _id: session._id
        });
        
        if (challengeResults && challengeResults.length > 0) {
          const completedChallenges = challengeResults.filter(c => c.completed);
          if (completedChallenges.length > 0) {
            console.log(`🏆 Completed ${completedChallenges.length} challenge(s)!`);
          }
        }
      } catch (challengeError) {
        console.error('Error updating challenges:', challengeError);
      }
    }
    
    res.status(201).json({
      success: true,
      data: session,
      rewards: rewardsResult,
      challenges: challengeResults
    });
  } catch (error) {
    console.error('Error logging session:', error);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

// Get session history
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { subject, sessionType, startDate, endDate, limit = 50 } = req.query;

    const query = { userId: req.user._id };

    if (subject) query.subject = subject;
    if (sessionType) query.sessionType = sessionType;
    
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const sessions = await TimerSession.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .populate('presetId', 'name subject');

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get session statistics
router.get('/sessions/stats', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const sessions = await TimerSession.find({
      userId: req.user._id,
      startTime: { $gte: startDate }
    });

    const stats = {
      totalSessions: sessions.length,
      totalWorkTime: sessions
        .filter(s => s.sessionType === 'work')
        .reduce((sum, s) => sum + s.actualDuration, 0),
      totalBreakTime: sessions
        .filter(s => s.sessionType !== 'work')
        .reduce((sum, s) => sum + s.actualDuration, 0),
      bySubject: {},
      byDay: {},
      averageSessionDuration: 0,
      completionRate: 0
    };

    // Calculate by subject
    sessions.forEach(session => {
      if (!stats.bySubject[session.subject]) {
        stats.bySubject[session.subject] = {
          count: 0,
          totalTime: 0
        };
      }
      stats.bySubject[session.subject].count++;
      stats.bySubject[session.subject].totalTime += session.actualDuration;
    });

    // Calculate by day
    sessions.forEach(session => {
      const day = session.startTime.toISOString().split('T')[0];
      if (!stats.byDay[day]) {
        stats.byDay[day] = {
          count: 0,
          totalTime: 0
        };
      }
      stats.byDay[day].count++;
      stats.byDay[day].totalTime += session.actualDuration;
    });

    // Calculate averages
    if (sessions.length > 0) {
      const workSessions = sessions.filter(s => s.sessionType === 'work');
      if (workSessions.length > 0) {
        stats.averageSessionDuration = Math.round(
          workSessions.reduce((sum, s) => sum + s.actualDuration, 0) / workSessions.length
        );
      }
      const completedSessions = sessions.filter(s => s.completed);
      stats.completionRate = Math.round((completedSessions.length / sessions.length) * 100);
    }

    res.json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

// ============================================
// INTELLIGENT BREAK SUGGESTIONS
// ============================================

router.get('/suggestions/breaks', authenticate, async (req, res) => {
  try {
    const recentSessions = await TimerSession.find({
      userId: req.user._id,
      sessionType: 'work'
    })
      .sort({ startTime: -1 })
      .limit(20);

    if (recentSessions.length < 3) {
      return res.json({
        suggestion: {
          breakDuration: 300, // 5 minutes default
          reason: 'Not enough data yet. Starting with standard 5-minute break.',
          confidence: 'low'
        }
      });
    }

    // Calculate average session duration
    const avgDuration = recentSessions.reduce((sum, s) => sum + s.actualDuration, 0) / recentSessions.length;

    // Calculate completion rate
    const completedCount = recentSessions.filter(s => s.completed).length;
    const completionRate = completedCount / recentSessions.length;

    // Analyze time of day patterns
    const now = new Date();
    const currentHour = now.getHours();
    const sessionsAtSimilarTime = recentSessions.filter(s => {
      const sessionHour = new Date(s.startTime).getHours();
      return Math.abs(sessionHour - currentHour) <= 2;
    });

    let suggestedBreak = 300; // 5 minutes default
    let reason = '';
    let confidence = 'medium';

    // Longer sessions = longer breaks
    if (avgDuration > 2400) { // > 40 minutes
      suggestedBreak = 600; // 10 minutes
      reason = 'Your recent sessions are longer than average. Consider a 10-minute break.';
      confidence = 'high';
    } else if (avgDuration > 1800) { // > 30 minutes
      suggestedBreak = 450; // 7.5 minutes
      reason = 'Based on your 30+ minute sessions, a 7-8 minute break is recommended.';
      confidence = 'high';
    }

    // Low completion rate = shorter breaks to maintain momentum
    if (completionRate < 0.7) {
      suggestedBreak = Math.min(suggestedBreak, 300);
      reason = 'Shorter breaks recommended to maintain focus momentum.';
      confidence = 'medium';
    }

    // Time of day adjustments
    if (currentHour >= 14 && currentHour <= 16) {
      // Afternoon slump
      suggestedBreak = Math.max(suggestedBreak, 600);
      reason = 'Afternoon time detected. Longer break recommended for better energy.';
      confidence = 'high';
    }

    // Recent break pattern analysis
    const recentBreaks = await TimerSession.find({
      userId: req.user._id,
      sessionType: { $in: ['break', 'longBreak'] }
    })
      .sort({ startTime: -1 })
      .limit(10);

    if (recentBreaks.length > 0) {
      const avgBreakDuration = recentBreaks.reduce((sum, b) => sum + b.actualDuration, 0) / recentBreaks.length;
      // Stick close to user's preferred break duration
      suggestedBreak = Math.round((suggestedBreak + avgBreakDuration) / 2);
    }

    res.json({
      suggestion: {
        breakDuration: suggestedBreak,
        reason: reason || 'Based on your recent study patterns.',
        confidence,
        analytics: {
          avgSessionDuration: Math.round(avgDuration),
          completionRate: Math.round(completionRate * 100),
          recentSessionsAnalyzed: recentSessions.length,
          timeOfDay: currentHour,
          userPreferredBreak: recentBreaks.length > 0 ? Math.round(recentBreaks.reduce((sum, b) => sum + b.actualDuration, 0) / recentBreaks.length) : null
        }
      }
    });
  } catch (error) {
    console.error('Error generating break suggestion:', error);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

module.exports = router;
