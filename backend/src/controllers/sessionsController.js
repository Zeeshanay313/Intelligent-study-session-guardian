const SessionLog = require('../models/SessionLog');
const TimerSession = require('../modules/timer/Session');
const Preset = require('../models/Preset');
const { getSuggestion } = require('../services/suggestionService');
const { updateGoalsFromSession } = require('../services/GoalProgressService');
const { awardSessionPoints, updateChallengesFromSession } = require('../services/RewardsService');

// Normalise a session from either collection into a unified shape
const normaliseSession = (doc, source) => {
  const isTimer = source === 'timer';
  const startTime = isTimer ? doc.startTime : doc.startedAt;
  const endTime = isTimer ? doc.endTime : doc.endedAt;
  const durationSeconds = isTimer
    ? (doc.totalDurationSec || (endTime && startTime ? Math.round((new Date(endTime) - new Date(startTime)) / 1000) : 0))
    : (doc.durationSeconds || 0);
  return {
    _id: doc._id,
    userId: doc.userId,
    subject: doc.subject || doc.presetName || 'Focus Session',
    presetName: doc.presetName || doc.subject || 'Focus Session',
    goalId: doc.goalId || null,
    startTime: startTime || null,
    startedAt: startTime || null,
    endTime: endTime || null,
    endedAt: endTime || null,
    durationSeconds,
    totalDurationSec: durationSeconds,
    status: isTimer ? (doc.status || 'completed') : (doc.completedSuccessfully !== false ? 'completed' : 'stopped'),
    completedSuccessfully: isTimer ? (doc.status === 'completed') : (doc.completedSuccessfully !== false),
    productiveSeconds: doc.productiveSeconds || Math.round(durationSeconds * 0.8),
    presencePercent: doc.presencePercent || 0,
    source,
    createdAt: doc.createdAt,
  };
};

// Complete a session and log it
const completeSession = async (req, res) => {
  try {
    const {
      presetId,
      durationSeconds,
      startedAt,
      endedAt
    } = req.body;

    let presetName = 'Quick Session';

    // If preset provided, verify it exists and belongs to user
    if (presetId) {
      const preset = await Preset.findOne({
        _id: presetId,
        userId: req.user._id
      });

      if (preset) {
        presetName = preset.name;
      }
    }

    const sessionLog = new SessionLog({
      userId: req.user._id,
      presetId: presetId || null,
      presetName,
      durationSeconds,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      completedSuccessfully: true
    });

    await sessionLog.save();

    // Update goal progress automatically from this session
    try {
      const updatedGoals = await updateGoalsFromSession({
        userId: req.user._id,
        duration: durationSeconds,
        subject: presetName,
        _id: sessionLog._id
      });

      if (updatedGoals.length > 0) {
        console.log(`✅ Updated ${updatedGoals.length} goals from session completion`);
      }
    } catch (goalError) {
      // Don't fail the session completion if goal update fails
      console.error('Error updating goals from session:', goalError);
    }

    // Award points and check for rewards
    let rewardsResult = null;
    try {
      rewardsResult = await awardSessionPoints(req.user._id, {
        duration: durationSeconds,
        _id: sessionLog._id
      });

      console.log(`🏆 Awarded ${rewardsResult.pointsAwarded} points for session completion`);
    } catch (rewardError) {
      console.error('Error awarding points:', rewardError);
    }

    // Update active challenge progress
    let challengeResults = null;
    try {
      challengeResults = await updateChallengesFromSession(req.user._id, {
        duration: durationSeconds,
        _id: sessionLog._id
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

    // Get count of sessions completed today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayCount = await SessionLog.countDocuments({
      userId: req.user._id,
      startedAt: { $gte: startOfDay }
    });

    res.status(201).json({
      success: true,
      data: sessionLog,
      todayCount,
      rewards: rewardsResult,
      challenges: challengeResults
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session'
    });
  }
};

// Get session logs with pagination — aggregates both SessionLog and TimerSession
const getSessions = async (req, res) => {
  try {
    const { limit = 20, page = 1, date } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const userId = req.user._id;
    const dateFilter = {};
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter.$gte = targetDate;
      dateFilter.$lt = nextDay;
    }

    // Query both collections in parallel
    const [sessionLogs, timerSessions] = await Promise.all([
      SessionLog.find({
        userId,
        ...(date ? { startedAt: dateFilter } : {})
      }).sort({ startedAt: -1 }).lean(),
      TimerSession.find({
        userId,
        status: { $in: ['completed', 'stopped'] },
        endTime: { $ne: null },
        ...(date ? { startTime: dateFilter } : {})
      }).sort({ startTime: -1 }).lean()
    ]);

    // Normalise and merge, deduplicate by _id string
    const seen = new Set();
    const allSessions = [
      ...sessionLogs.map(s => normaliseSession(s, 'manual')),
      ...timerSessions.map(s => normaliseSession(s, 'timer'))
    ]
      .filter(s => {
        const key = String(s._id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

    const total = allSessions.length;
    const paginated = allSessions.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
};

// Get a single session by ID — searches both collections
const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Try TimerSession first (most sessions come from here)
    let doc = await TimerSession.findOne({ _id: id, userId }).lean();
    if (doc) return res.json({ success: true, data: normaliseSession(doc, 'timer') });

    // Fallback to SessionLog
    doc = await SessionLog.findOne({ _id: id, userId }).lean();
    if (doc) return res.json({ success: true, data: normaliseSession(doc, 'manual') });

    return res.status(404).json({ success: false, error: 'Session not found' });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
};

// Get intelligent break suggestion
const getBreakSuggestion = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const limitNum = parseInt(limit, 10);

    const suggestion = await getSuggestion(req.user._id, limitNum);

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    console.error('Error getting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestion'
    });
  }
};

module.exports = {
  completeSession,
  getSessions,
  getSessionById,
  getBreakSuggestion
};
