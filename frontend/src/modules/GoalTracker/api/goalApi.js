import api from '../../../services/api';

const GOALS_ENDPOINT = '/goals';

export const goalApi = {
  // Get all goals with optional filtering
  getGoals: async (params = {}) => {
    const response = await api.get(GOALS_ENDPOINT, { params });
    return response.data;
  },

  // Get specific goal by ID
  getGoalById: async (id) => {
    const response = await api.get(`${GOALS_ENDPOINT}/${id}`);
    return response.data;
  },

  // Create new goal
  createGoal: async (goalData) => {
    const response = await api.post(GOALS_ENDPOINT, goalData);
    return response.data;
  },

  // Update existing goal
  updateGoal: async (id, updates) => {
    const response = await api.put(`${GOALS_ENDPOINT}/${id}`, updates);
    return response.data;
  },

  // Delete goal (soft delete)
  deleteGoal: async (id) => {
    const response = await api.delete(`${GOALS_ENDPOINT}/${id}`);
    return response.data;
  },

  // Update goal progress
  updateProgress: async (id, amount) => {
    const response = await api.post(`${GOALS_ENDPOINT}/${id}/progress`, { amount });
    return response.data;
  },

  // Toggle milestone completion
  toggleMilestone: async (goalId, milestoneId) => {
    const response = await api.post(`${GOALS_ENDPOINT}/${goalId}/milestones/${milestoneId}/toggle`);
    return response.data;
  },

  // Get user's privacy settings for goal sharing
  getUserPrivacy: async () => {
    const response = await api.get('/users/me');
    return response.data.user?.privacy?.guardianSharing || false;
  }
};