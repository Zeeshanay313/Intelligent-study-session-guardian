const SessionLog = require('../models/SessionLog');

/**
 * Calculate intelligent break suggestion using weighted average
 * Algorithm:
 * - Fetch last N completed sessions
 * - Apply linear weights (more recent = higher weight)
 * - Calculate weighted average of break durations
 * - Convert to minutes and clamp between 5-20 minutes
 * - Detect streak for motivation
 */
const getSuggestion = async (userId, limit = 5) => {
  try {
    const recentSessions = await SessionLog.find({
      userId,
      completedSuccessfully: true
    })
      .sort({ endedAt: -1 })
      .limit(limit)
      .select('durationSeconds endedAt');

    // No data case - use default
    if (!recentSessions || recentSessions.length === 0) {
      return {
        suggestedBreakMinutes: 5,
        confidence: 'low',
        reason: 'No session history available. Using default 5-minute break.',
        streak: 0
      };
    }

    // Calculate streak (consecutive sessions in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const streak = recentSessions.filter(
      session => new Date(session.endedAt) >= oneDayAgo
    ).length;

    // Extract durations in minutes
    const durations = recentSessions.map(
      session => session.durationSeconds / 60
    );

    // Apply linear weights: most recent gets highest weight
    const weights = [];
    for (let i = 0; i < durations.length; i += 1) {
      weights.push(durations.length - i);
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Calculate weighted average
    let weightedSum = 0;
    for (let i = 0; i < durations.length; i += 1) {
      weightedSum += durations[i] * weights[i];
    }

    const weightedAvg = weightedSum / totalWeight;

    // Convert to break suggestion: 1 minute break per 6 minutes work
    const rawBreakMinutes = weightedAvg / 6;

    // Clamp between 5 and 20 minutes
    const suggestedBreakMinutes = Math.max(5, Math.min(20, Math.round(rawBreakMinutes)));

    // Determine confidence based on number of sessions
    let confidence = 'low';
    if (recentSessions.length >= 5) {
      confidence = 'high';
    } else if (recentSessions.length >= 3) {
      confidence = 'medium';
    }

    return {
      suggestedBreakMinutes,
      confidence,
      reason: `Based on your last ${recentSessions.length} session(s), averaging ${Math.round(weightedAvg)} minutes each.`,
      streak,
      samplesUsed: recentSessions.length
    };
  } catch (error) {
    console.error('Error calculating suggestion:', error);
    // Fallback to safe default
    return {
      suggestedBreakMinutes: 5,
      confidence: 'low',
      reason: 'Error calculating suggestion. Using default 5-minute break.',
      streak: 0,
      error: error.message
    };
  }
};

module.exports = {
  getSuggestion
};
