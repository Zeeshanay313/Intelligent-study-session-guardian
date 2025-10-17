import axios from 'axios';

// Configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004';
const API_BASE = `${BASE_URL}/api`;
const DEV_BYPASS = process.env.REACT_APP_DEV_BYPASS === 'true' || true; // Force dev bypass for now

console.log('🔧 API Configuration:');
console.log('BASE_URL:', BASE_URL);
console.log('API_BASE:', API_BASE);
console.log('DEV_BYPASS:', DEV_BYPASS);

// Mock data for dev bypass
const MOCK_DATA = {
  goals: [
    { _id: 'mock-1', title: 'Complete React Project', progressPercentage: 75, isActive: true },
    { _id: 'mock-2', title: 'Learn Node.js', progressPercentage: 50, isActive: true }
  ],
  'study-session/current': { activeSession: null },
  timers: [
    { _id: 'preset-1', name: 'Pomodoro', workDuration: 1500, breakDuration: 300, longBreakDuration: 900, cyclesBeforeLongBreak: 4 },
    { _id: 'preset-2', name: 'Short Focus', workDuration: 900, breakDuration: 180, longBreakDuration: 600, cyclesBeforeLongBreak: 3 }
  ],
  reminders: [
    { _id: 'reminder-1', title: 'Study Break', message: 'Take a 5-minute break', type: 'recurring', isActive: true },
    { _id: 'reminder-2', title: 'Water Break', message: 'Drink some water', type: 'once', isActive: true }
  ]
};

// Backend availability check
let backendAvailable = null;

const checkBackendHealth = async () => {
  try {
    console.log('🔍 Checking backend health...');
    console.log('🔍 Health URL:', `${BASE_URL}/health`);
    
    // Use raw axios instead of the configured instance to avoid base URL issues
    const response = await axios.get(`${BASE_URL}/health`, { 
      timeout: 3000,
      headers: { 'x-dev-bypass': 'true' }
    });
    
    if (response.status === 200) {
      backendAvailable = true;
      console.log('✅ Backend is available:', response.data);
      return true;
    }
  } catch (error) {
    backendAvailable = false;
    console.warn('⚠️ Backend health check failed:', error.message);
    
    if (DEV_BYPASS) {
      console.log('🔧 Dev bypass enabled - will use mock data for failed requests');
    }
    return false;
  }
};

// Check backend on module load
checkBackendHealth();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-dev-bypass': 'true' // Always include dev bypass header
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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
      
      if (DEV_BYPASS && backendAvailable !== true) {
        return handleMockResponse(originalRequest);
      }
      
      return Promise.reject(new Error('Backend unavailable'));
    }
    
    const { status } = error.response;
    console.log(`❌ ${status} ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`);
    
    // Handle 401 Unauthorized
    if (status === 401) {
      // Don't retry auth endpoints
      if (originalRequest.url?.includes('/auth/')) {
        console.log('🔐 Auth endpoint failed');
        
        // In dev mode, provide mock success for login
        if (DEV_BYPASS && originalRequest.url?.includes('/auth/login')) {
          console.log('🎭 Mock login success');
          return Promise.resolve({
            data: { 
              user: { id: 'mock-user', name: 'Dev User', email: 'dev@test.com' },
              token: 'mock-token',
              refreshToken: 'mock-refresh-token'
            },
            status: 200,
            statusText: 'OK (Mock)',
            config: originalRequest,
            headers: {}
          });
        }
        
        return Promise.reject(error);
      }
      
      // For non-auth endpoints with 401, use mock data in dev mode
      if (DEV_BYPASS) {
        console.log('🔧 Dev bypass: Providing mock response for 401');
        return handleMockResponse(originalRequest);
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
          const refreshResponse = await axios.post(`${API_BASE}/auth/refresh`, {}, {
            headers: { 
              'Authorization': `Bearer ${refreshToken}`,
              'x-dev-bypass': 'true'
            },
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
      
      // In dev mode, provide mock data for 404s
      if (DEV_BYPASS) {
        console.log('🎭 Mock response for 404');
        return handleMockResponse(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Handle mock responses for dev bypass
const handleMockResponse = (originalRequest) => {
  const url = originalRequest.url;
  let mockKey = url;
  
  // Extract endpoint from URL
  if (url?.includes('?')) {
    mockKey = url.split('?')[0];
  }
  
  // Remove leading slash
  if (mockKey?.startsWith('/')) {
    mockKey = mockKey.substring(1);
  }
  
  console.log(`🎭 Mock response for: ${mockKey}`);
  
  // Special handling for auth endpoints
  if (mockKey.includes('auth/login')) {
    console.log('🎭 Providing mock login response');
    return Promise.resolve({
      data: { 
        user: { 
          id: 'mock-user-123', 
          name: 'Dev User', 
          email: 'dev@test.com',
          emailVerified: true
        },
        token: 'mock-jwt-token-123',
        accessToken: 'mock-jwt-token-123',
        refreshToken: 'mock-refresh-token-123',
        message: 'Login successful'
      },
      status: 200,
      statusText: 'OK (Mock)',
      config: originalRequest,
      headers: {}
    });
  }
  
  // Special handling for timer operations
  if (mockKey.includes('timers')) {
    const method = originalRequest.method?.toLowerCase();
    
    if (method === 'post' && mockKey.includes('/start')) {
      console.log('🎭 Mock timer start response');
      return Promise.resolve({
        data: { sessionId: 'mock-session-' + Date.now(), success: true },
        status: 200,
        statusText: 'OK (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
    
    if (method === 'post' && (mockKey.includes('/pause') || mockKey.includes('/stop'))) {
      console.log('🎭 Mock timer control response');
      return Promise.resolve({
        data: { success: true, totalDurationSec: 1500 },
        status: 200,
        statusText: 'OK (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
    
    if (method === 'post' && !mockKey.includes('/start') && !mockKey.includes('/pause') && !mockKey.includes('/stop')) {
      console.log('🎭 Mock preset create response');
      const presetData = JSON.parse(originalRequest.data || '{}');
      const newPreset = {
        _id: 'preset-' + Date.now(),
        name: presetData.name || 'New Preset',
        workDuration: parseInt(presetData.workDuration) || 1500,
        breakDuration: parseInt(presetData.breakDuration) || 300,
        longBreakDuration: parseInt(presetData.longBreakDuration) || 900,
        cyclesBeforeLongBreak: parseInt(presetData.cyclesBeforeLongBreak) || 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      MOCK_DATA.timers.push(newPreset);
      console.log('✅ Created new preset:', newPreset);
      return Promise.resolve({
        data: newPreset,
        status: 201,
        statusText: 'Created (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
    
    if (method === 'put') {
      console.log('🎭 Mock preset update response');
      const presetId = mockKey.split('/').pop();
      const updateData = JSON.parse(originalRequest.data || '{}');
      
      // Find and update the preset in mock data
      const presetIndex = MOCK_DATA.timers.findIndex(t => t._id === presetId);
      if (presetIndex !== -1) {
        MOCK_DATA.timers[presetIndex] = {
          ...MOCK_DATA.timers[presetIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        console.log('✅ Updated preset:', MOCK_DATA.timers[presetIndex]);
        
        return Promise.resolve({
          data: MOCK_DATA.timers[presetIndex],
          status: 200,
          statusText: 'OK (Mock)',
          config: originalRequest,
          headers: {}
        });
      } else {
        console.log('❌ Preset not found for update:', presetId);
        return Promise.reject({
          response: { status: 404, statusText: 'Preset not found' }
        });
      }
    }
    
    if (method === 'delete') {
      console.log('🎭 Mock preset delete response');
      const presetId = mockKey.split('/').pop();
      const initialLength = MOCK_DATA.timers.length;
      MOCK_DATA.timers = MOCK_DATA.timers.filter(t => t._id !== presetId);
      
      if (MOCK_DATA.timers.length < initialLength) {
        console.log('✅ Deleted preset:', presetId);
        return Promise.resolve({
          data: { success: true, message: 'Preset deleted successfully' },
          status: 200,
          statusText: 'OK (Mock)',
          config: originalRequest,
          headers: {}
        });
      } else {
        console.log('❌ Preset not found for deletion:', presetId);
        return Promise.reject({
          response: { status: 404, statusText: 'Preset not found' }
        });
      }
    }
  }
  
  // Special handling for reminder operations
  if (mockKey.includes('reminders')) {
    const method = originalRequest.method?.toLowerCase();
    
    if (method === 'post' && mockKey.includes('/trigger')) {
      console.log('🎭 Mock reminder trigger response');
      
      // Request notification permission if not granted
      if (window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            showReminderNotification();
          } else {
            console.log('Notification permission denied');
            alert('Test Reminder: This is a test notification from the reminder system!');
          }
        });
      } else if (window.Notification && window.Notification.permission === 'granted') {
        showReminderNotification();
      } else {
        // Fallback to alert if notifications not supported or denied
        alert('Test Reminder: This is a test notification from the reminder system!');
      }
      
      function showReminderNotification() {
        const notification = new window.Notification('🔔 Test Reminder', {
          body: 'This is a test notification from the reminder system! The notification system is working correctly.',
          icon: '/favicon.ico',
          tag: 'test-reminder',
          requireInteraction: true
        });
        
        // Auto-close after 5 seconds if user doesn't interact
        setTimeout(() => {
          notification.close();
        }, 5000);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      return Promise.resolve({
        data: { success: true, message: 'Reminder triggered successfully' },
        status: 200,
        statusText: 'OK (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
    
    if (method === 'post' && !mockKey.includes('/trigger')) {
      console.log('🎭 Mock reminder create response');
      const reminderData = JSON.parse(originalRequest.data || '{}');
      const newReminder = {
        _id: 'new-reminder-' + Date.now(),
        ...reminderData,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      // If it's a test reminder with datetime in the near future, set up auto-trigger
      if (reminderData.datetime && new Date(reminderData.datetime) <= new Date(Date.now() + 30000)) {
        const triggerTime = new Date(reminderData.datetime).getTime() - Date.now();
        if (triggerTime > 0) {
          setTimeout(() => {
            console.log('🔔 Auto-triggering test reminder');
            if (window.Notification && window.Notification.permission === 'granted') {
              const notification = new window.Notification('🔔 ' + reminderData.title, {
                body: reminderData.message,
                icon: '/favicon.ico',
                tag: 'auto-reminder-' + newReminder._id
              });
              
              setTimeout(() => notification.close(), 5000);
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            } else {
              alert(`🔔 ${reminderData.title}: ${reminderData.message}`);
            }
          }, triggerTime);
        }
      }
      
      MOCK_DATA.reminders.push(newReminder);
      return Promise.resolve({
        data: newReminder,
        status: 201,
        statusText: 'Created (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
    
    if (method === 'put') {
      console.log('🎭 Mock reminder update response');
      const reminderId = mockKey.split('/').pop();
      const updateData = JSON.parse(originalRequest.data || '{}');
      
      // Find and update the reminder in mock data
      const reminderIndex = MOCK_DATA.reminders.findIndex(r => r._id === reminderId);
      if (reminderIndex !== -1) {
        MOCK_DATA.reminders[reminderIndex] = {
          ...MOCK_DATA.reminders[reminderIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        return Promise.resolve({
          data: MOCK_DATA.reminders[reminderIndex],
          status: 200,
          statusText: 'OK (Mock)',
          config: originalRequest,
          headers: {}
        });
      }
    }
    
    if (method === 'delete') {
      console.log('🎭 Mock reminder delete response');
      const reminderId = mockKey.split('/').pop();
      MOCK_DATA.reminders = MOCK_DATA.reminders.filter(r => r._id !== reminderId);
      
      return Promise.resolve({
        data: { success: true, message: 'Reminder deleted successfully' },
        status: 200,
        statusText: 'OK (Mock)',
        config: originalRequest,
        headers: {}
      });
    }
  }
  
  // Return mock data for other endpoints
  const mockResponse = {
    data: MOCK_DATA[mockKey] || [],
    status: 200,
    statusText: 'OK (Mock)',
    config: originalRequest,
    headers: {}
  };
  
  return Promise.resolve(mockResponse);
};

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

// API methods
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.patch('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`)
};

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

export const goalAPI = {
  getGoals: (params = {}) => api.get('/goals', { params }),
  getGoal: (id) => api.get(`/goals/${id}`),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.patch(`/goals/${id}`, goalData),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  updateProgress: (id, progressData) => api.patch(`/goals/${id}/progress`, progressData)
};

export const timerAPI = {
  getPresets: () => api.get('/timers'),
  createPreset: (presetData) => api.post('/timers', presetData),
  updatePreset: (id, presetData) => api.put(`/timers/${id}`, presetData),
  deletePreset: (id) => api.delete(`/timers/${id}`)
};

export const reminderAPI = {
  getReminders: () => api.get('/reminders'),
  createReminder: (reminderData) => api.post('/reminders', reminderData),
  updateReminder: (id, reminderData) => api.put(`/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
  triggerReminder: (id) => api.post(`/reminders/${id}/trigger`)
};

export const sessionAPI = {
  getCurrent: () => api.get('/study-session/current'),
  start: (sessionData) => api.post('/study-session/start', sessionData),
  pause: () => api.post('/study-session/pause'),
  resume: () => api.post('/study-session/resume'),
  stop: () => api.post('/study-session/stop')
};

export const deviceAPI = {
  register: (deviceData) => api.post('/devices/register', deviceData),
  getMyDevices: (activeOnly = false) => api.get('/devices/my-devices', { 
    params: { activeOnly } 
  }),
  updateAccess: (deviceId, accessData) => api.patch(`/devices/${deviceId}/access`, accessData),
  revokeAccess: (deviceId, reason) => api.post(`/devices/${deviceId}/revoke`, { reason }),
  removeDevice: (deviceId) => api.delete(`/devices/${deviceId}`),
  getDevice: (deviceId) => api.get(`/devices/${deviceId}`),
  flagSuspicious: (deviceId, reason) => api.post(`/devices/${deviceId}/flag-suspicious`, { reason })
};

// Utility functions
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('accessToken');
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure';
  // Clear any other auth-related localStorage items
  localStorage.removeItem('user');
  localStorage.removeItem('deviceId');
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

// Export status checker
export { checkBackendHealth };

export default api;