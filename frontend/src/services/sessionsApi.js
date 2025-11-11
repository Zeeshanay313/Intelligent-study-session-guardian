import api from './api';

// Storage adapter for offline support
const storageKey = 'focus_timer_sessions';

const getFromStorage = () => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading sessions from storage:', error);
    return [];
  }
};

const saveToStorage = (sessions) => {
  try {
    // Keep only last 100 sessions in storage
    const limited = sessions.slice(-100);
    localStorage.setItem(storageKey, JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving sessions to storage:', error);
  }
};

/**
 * Complete a session and log it
 */
export const completeSession = async (sessionData) => {
  try {
    const response = await api.post('/sessions/complete', sessionData);
    
    if (response.data.success) {
      // Update cache
      const cached = getFromStorage();
      cached.push(response.data.data);
      saveToStorage(cached);
      
      return response.data;
    }
    
    throw new Error('Failed to complete session');
  } catch (error) {
    console.error('Error completing session:', error);
    
    // Offline mode: save locally
    if (!navigator.onLine) {
      const tempSession = {
        ...sessionData,
        _id: `temp_${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedSuccessfully: true
      };
      
      const cached = getFromStorage();
      cached.push(tempSession);
      saveToStorage(cached);
      
      return {
        success: true,
        data: tempSession,
        todayCount: cached.filter((s) => {
          const sessionDate = new Date(s.startedAt);
          const today = new Date();
          return sessionDate.toDateString() === today.toDateString();
        }).length
      };
    }
    
    throw error;
  }
};

/**
 * Get session logs with pagination
 */
export const getSessions = async (params = {}) => {
  try {
    const { limit = 20, page = 1, date } = params;
    
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });
    
    if (date) {
      queryParams.append('date', date);
    }
    
    const response = await api.get(`/sessions?${queryParams.toString()}`);
    
    if (response.data.success) {
      // Update cache with new sessions
      const cached = getFromStorage();
      const newSessions = response.data.data.filter(
        (newSession) => !cached.some((s) => s._id === newSession._id)
      );
      saveToStorage([...cached, ...newSessions]);
      
      return response.data;
    }
    
    throw new Error('Failed to fetch sessions');
  } catch (error) {
    console.error('Error fetching sessions, using cached data:', error);
    
    // Fallback to localStorage
    const cached = getFromStorage();
    const { limit = 20, page = 1, date } = params;
    
    let filtered = cached;
    
    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      filtered = cached.filter((session) => {
        const sessionDate = new Date(session.startedAt);
        return sessionDate.toDateString() === targetDate.toDateString();
      });
    }
    
    // Sort by startedAt descending
    filtered.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    
    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);
    
    return {
      success: true,
      data: paginated,
      pagination: {
        total: filtered.length,
        page,
        limit,
        pages: Math.ceil(filtered.length / limit)
      }
    };
  }
};

/**
 * Get intelligent break suggestion
 */
export const getSuggestion = async (params = {}) => {
  try {
    const { limit = 5 } = params;
    
    const response = await api.get(`/sessions/suggestion?limit=${limit}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error('Failed to get suggestion');
  } catch (error) {
    console.error('Error getting suggestion, using default:', error);
    
    // Fallback to local calculation
    const cached = getFromStorage();
    
    if (cached.length === 0) {
      return {
        suggestedBreakMinutes: 5,
        confidence: 'low',
        reason: 'No session history available (offline). Using default 5-minute break.',
        streak: 0
      };
    }
    
    // Simple local calculation
    const recent = cached
      .filter((s) => s.completedSuccessfully)
      .slice(-5);
    
    const avgDuration = recent.reduce((sum, s) => sum + (s.durationSeconds / 60), 0) / recent.length;
    const suggestion = Math.max(5, Math.min(20, Math.round(avgDuration / 6)));
    
    return {
      suggestedBreakMinutes: suggestion,
      confidence: recent.length >= 3 ? 'medium' : 'low',
      reason: `Based on ${recent.length} recent session(s) (offline mode).`,
      streak: 0
    };
  }
};

export default {
  completeSession,
  getSessions,
  getSuggestion
};
