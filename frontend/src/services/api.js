import axios from 'axios';

// Configuration
let BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';

// Fix if environment variable includes /api
if (BASE_URL.endsWith('/api')) {
  BASE_URL = BASE_URL.slice(0, -4); // Remove /api from the end
}

console.log('🔧 API Configuration:');
console.log('BASE_URL:', BASE_URL);
console.log('API_BASE (baseURL for axios):', `${BASE_URL}/api`);
console.log('🚀 Real API mode - connecting to backend server');

// Backend health check
const checkBackendHealth = async () => {
  try {
    console.log('🔍 Checking backend health...');
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
    
    if (response.status === 200) {
      console.log('✅ Backend is available:', response.data);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ Backend health check failed:', error.message);
    return false;
  }
};

// Create axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Correct baseURL construction
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth and errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Network/connection errors
    if (!error.response) {
      console.error('🌐 Network error - backend unreachable:', error.message);
      return Promise.reject(new Error('Backend server is not running. Please start the backend server on port 5004.'));
    }
    
    const { status } = error.response;
    console.log(`❌ ${status} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
    
    // Handle 401 Unauthorized
    if (status === 401) {
      // Don't retry auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        console.log('🔐 Auth endpoint failed');
        return Promise.reject(error);
      }
      
      // Don't retry if already attempted
      if (originalRequest._retry) {
        console.log('🔄 Refresh already attempted, clearing tokens');
        clearTokensAndRedirect();
        return Promise.reject(error);
      }
      
      // Attempt token refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        originalRequest._retry = true;
        
        try {
          console.log('🔄 Attempting token refresh...');
          const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, {
            headers: { 'Authorization': `Bearer ${refreshToken}` },
            withCredentials: true
          });
          
          if (refreshResponse.data.accessToken) {
            localStorage.setItem('token', refreshResponse.data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            console.log('✅ Token refreshed, retrying request');
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.message);
        }
      }
      
      // Clear tokens and redirect
      clearTokensAndRedirect();
      return Promise.reject(error);
    }
    
    // Handle other errors
    if (status >= 500) {
      console.error('🔥 Server error:', error.response.data?.message || error.message);
    } else if (status === 404) {
      console.warn('🔍 Endpoint not found:', originalRequest.url);
    }
    
    return Promise.reject(error);
  }
);

// Clear tokens and redirect to login
const clearTokensAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Only redirect if not already on login page
  if (window.location.pathname !== '/login') {
    console.log('🔐 Redirecting to login');
    window.location.href = '/login';
  }
};

// Authentication API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.patch('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  // Social authentication
  googleLogin: (tokenId) => api.post('/auth/google', { tokenId }),
  githubLogin: (code) => api.post('/auth/github', { code }),
  facebookLogin: (accessToken) => api.post('/auth/facebook', { accessToken }),
  twitterLogin: (oauthToken, oauthVerifier) => api.post('/auth/twitter', { oauthToken, oauthVerifier }),
  
  // OAuth URLs
  getGoogleAuthUrl: () => api.get('/auth/google/url'),
  getGithubAuthUrl: () => api.get('/auth/github/url'),
  getFacebookAuthUrl: () => api.get('/auth/facebook/url'),
  getTwitterAuthUrl: () => api.get('/auth/twitter/url')
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (profileData) => api.patch('/users/me/profile', profileData),
  updatePrivacy: (privacyData) => api.patch('/users/me/privacy', privacyData),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  exportData: () => api.post('/users/me/export'),
  deleteAccount: () => api.delete('/users/me')
};

// Goal Tracker API
export const goalAPI = {
  getGoals: (params = {}) => api.get('/goals', { params }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.patch(`/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  updateProgress: (id, progressData) => api.patch(`/goals/${id}/progress`, progressData)
};

// Timer API
export const timerAPI = {
  getPresets: () => api.get('/timers'),
  createPreset: (presetData) => api.post('/timers', presetData),
  updatePreset: (id, presetData) => api.patch(`/timers/${id}`, presetData),
  deletePreset: (id) => api.delete(`/timers/${id}`),
  
  // Timer session control
  startTimer: (sessionData) => api.post('/timers/start', sessionData),
  pauseTimer: (sessionId) => api.post(`/timers/${sessionId}/pause`),
  resumeTimer: (sessionId) => api.post(`/timers/${sessionId}/resume`),
  stopTimer: (sessionId) => api.post(`/timers/${sessionId}/stop`),
  
  // Session management
  getActiveSession: () => api.get('/timers/active'),
  getSessionHistory: (params = {}) => api.get('/timers/sessions', { params }),
  getTimerStats: () => api.get('/timers/stats')
};

// Reminder API
export const reminderAPI = {
  getReminders: (params = {}) => api.get('/reminders', { params }),
  getReminder: (id) => api.get(`/reminders/${id}`),
  createReminder: (reminderData) => api.post('/reminders', reminderData),
  updateReminder: (id, reminderData) => api.patch(`/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
  
  // Reminder controls
  triggerReminder: (id) => api.post(`/reminders/${id}/trigger`),
  snoozeReminder: (id, duration) => api.post(`/reminders/${id}/snooze`, { duration }),
  dismissReminder: (id) => api.post(`/reminders/${id}/dismiss`),
  
  // Stats
  getReminderStats: () => api.get('/reminders/stats')
};

// Study Session API
export const studySessionAPI = {
  // Session management
  startSession: (sessionData) => api.post('/study-sessions/start', sessionData),
  endSession: (sessionId, sessionData) => api.patch(`/study-sessions/${sessionId}/end`, sessionData),
  pauseSession: (sessionId) => api.patch(`/study-sessions/${sessionId}/pause`),
  resumeSession: (sessionId) => api.patch(`/study-sessions/${sessionId}/resume`),
  
  // Session data
  getCurrentSession: () => api.get('/study-sessions/current'),
  getSessionHistory: (params = {}) => api.get('/study-sessions', { params }),
  getSession: (id) => api.get(`/study-sessions/${id}`),
  
  // Comprehensive data collection
  saveComprehensiveData: (sessionData) => api.post('/study-sessions/comprehensive', sessionData),
  
  // Analytics
  getSessionStats: () => api.get('/study-sessions/stats'),
  getDashboardData: () => api.get('/study-sessions/dashboard')
};

// Analytics API
export const analyticsAPI = {
  // Dashboard data
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getUserStats: () => api.get('/analytics/user-stats'),
  getWeeklyProgress: () => api.get('/analytics/weekly-progress'),
  getRecentSessions: () => api.get('/analytics/recent-sessions'),
  
  // Detailed analytics
  getStudyPatterns: (params = {}) => api.get('/analytics/study-patterns', { params }),
  getProductivityTrends: (params = {}) => api.get('/analytics/productivity-trends', { params }),
  getGoalProgress: (params = {}) => api.get('/analytics/goal-progress', { params }),
  
  // Reports
  generateReport: (reportType, params = {}) => api.post(`/analytics/reports/${reportType}`, params),
  getReportStatus: (reportId) => api.get(`/analytics/reports/${reportId}/status`),
  downloadReport: (reportId) => api.get(`/analytics/reports/${reportId}/download`, { responseType: 'blob' })
};

// Device Management API
export const deviceAPI = {
  register: (deviceData) => api.post('/devices/register', deviceData),
  getMyDevices: (activeOnly = false) => api.get('/devices/my-devices', { params: { activeOnly } }),
  updateAccess: (deviceId, accessData) => api.patch(`/devices/${deviceId}/access`, accessData),
  revokeAccess: (deviceId, reason) => api.post(`/devices/${deviceId}/revoke`, { reason }),
  removeDevice: (deviceId) => api.delete(`/devices/${deviceId}`),
  getDevice: (deviceId) => api.get(`/devices/${deviceId}`),
  flagSuspicious: (deviceId, reason) => api.post(`/devices/${deviceId}/flag-suspicious`, { reason })
};

// Notification API
export const notificationAPI = {
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings) => api.patch('/notifications/settings', settings),
  getHistory: (params = {}) => api.get('/notifications/history', { params }),
  markAsRead: (notificationIds) => api.patch('/notifications/mark-read', { ids: notificationIds }),
  clearHistory: () => api.delete('/notifications/history')
};

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  saveSettings: (settings) => api.post('/settings', settings),
  updateSetting: (key, value) => api.put(`/settings/${key}`, { value }),
  resetSettings: () => api.delete('/settings')
};

// Utility functions
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('deviceId');
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure';
};

export const handleApiError = (error) => {
  if (error.response?.data?.details) {
    // Validation errors
    return error.response.data.details.map(detail => detail.message).join(', ');
  } else if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const getDeviceFingerprint = () => ({
  screen: `${screen.width}x${screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  language: navigator.language,
  platform: navigator.platform,
  userAgent: navigator.userAgent
});

export const generateDeviceId = () => {
  const stored = localStorage.getItem('deviceId');
  if (stored) return stored;
  
  const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
};

// Export health check function
export { checkBackendHealth };

// Export the main api instance
export default api;
