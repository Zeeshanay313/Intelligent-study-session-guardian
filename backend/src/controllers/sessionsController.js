const SessionLog = require('../models/SessionLog');
const Preset = require('../models/Preset');
const { getSuggestion } = require('../services/suggestionService');
const { updateGoalsFromSession } = require('../services/GoalProgressService');
const { awardSessionPoints } = require('../services/RewardsService');

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
      rewards: rewardsResult
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session'
    });
  }
};

// Get session logs with pagination
const getSessions = async (req, res) => {
  try {
    const {
      limit = 20,
      page = 1,
      date
    } = req.query;

    const limitNum = parseInt(limit, 10);
    const pageNum = parseInt(page, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter = { userId: req.user._id };

    // Filter by specific date if provided
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filter.startedAt = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    const [sessions, total] = await Promise.all([
      SessionLog.find(filter)
        .sort({ startedAt: -1 })
        .limit(limitNum)
        .skip(skip)
        .populate('presetId', 'name workDuration breakDuration'),
      SessionLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
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
  getBreakSuggestion
};
