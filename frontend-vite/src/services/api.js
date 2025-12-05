/**
 * API Service
 * 
 * Main API client that handles both real backend and mock API
 * Automatically falls back to mock API if backend is unavailable
 */

import axios from 'axios'
import { mockApi } from './mockApi'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004'
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
const DEBUG = import.meta.env.VITE_DEBUG === 'true'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests (needed for OAuth)
})

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (DEBUG) {
      console.log('API Request:', config.method?.toUpperCase(), config.url, config.data)
    }
    
    return config
  },
  (error) => {
    if (DEBUG) console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log('API Response:', response.config.url, response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          })
          
          const { token } = response.data
          localStorage.setItem('authToken', token)
          
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    
    if (DEBUG) {
      console.error('API Error:', error.response?.status, error.response?.data || error.message)
    }
    
    return Promise.reject(error)
  }
)

// Helper to decide whether to use mock API
const shouldUseMockApi = () => {
  return USE_MOCK_API
}

// Helper to handle API call - NO MORE FALLBACK, REAL API ONLY
const apiCall = async (realApiCall, mockApiCall) => {
  if (shouldUseMockApi()) {
    try {
      return await mockApiCall()
    } catch (error) {
      if (DEBUG) console.error('Mock API Error:', error.message)
      throw error
    }
  }
  
  // Use real API only - no fallback to mock
  try {
    const response = await realApiCall()
    return response.data
  } catch (error) {
    // Log detailed error for debugging
    if (DEBUG) {
      console.error('=== API ERROR ===')
      console.error('Status:', error.response?.status)
      console.error('Message:', error.response?.data?.error || error.response?.data?.message)
      console.error('Full response:', error.response?.data)
      console.error('================')
    }
    throw error
  }
}

// ==================== API METHODS ====================

export const api = {
  // ==================== AUTH ====================
  auth: {
    login: async (email, password) => {
      return apiCall(
        () => axiosInstance.post('/api/auth/login', { email, password }),
        () => mockApi.auth.login(email, password)
      )
    },
    
    register: async (userData) => {
      // Map 'name' to 'displayName' for backend compatibility
      const backendData = {
        ...userData,
        displayName: userData.name || userData.displayName,
      }
      delete backendData.name
      
      return apiCall(
        () => axiosInstance.post('/api/auth/register', backendData),
        () => mockApi.auth.register(userData)
      )
    },
    
    logout: async () => {
      return apiCall(
        () => axiosInstance.post('/api/auth/logout'),
        () => mockApi.auth.logout()
      )
    },
    
    refreshToken: async (refreshToken) => {
      return apiCall(
        () => axiosInstance.post('/api/auth/refresh', { refreshToken }),
        () => mockApi.auth.refreshToken()
      )
    },
    
    forgotPassword: async (email) => {
      return apiCall(
        () => axiosInstance.post('/api/auth/forgot-password', { email }),
        () => mockApi.auth.forgotPassword(email)
      )
    },
    
    resetPassword: async (token, newPassword) => {
      return apiCall(
        () => axiosInstance.post('/api/auth/reset-password', { token, newPassword }),
        () => mockApi.auth.resetPassword(token, newPassword)
      )
    },
  },

  // ==================== PROFILE ====================
  profile: {
    get: async () => {
      return apiCall(
        () => axiosInstance.get('/api/profile/me'),
        () => mockApi.profile.get()
      )
    },
    
    update: async (updates) => {
      return apiCall(
        () => axiosInstance.patch('/api/profile/me', updates),
        () => mockApi.profile.update(updates)
      )
    },
    
    updatePreferences: async (preferences) => {
      return apiCall(
        () => axiosInstance.patch('/api/profile/me', { preferences }),
        () => mockApi.profile.updatePreferences(preferences)
      )
    },
    
    exportData: async () => {
      return apiCall(
        () => axiosInstance.post('/api/profile/export'),
        () => mockApi.profile.exportData()
      )
    },
    
    deleteAccount: async () => {
      return apiCall(
        () => axiosInstance.delete('/api/profile/me'),
        () => mockApi.profile.deleteAccount()
      )
    },
  },

  // ==================== SESSIONS ====================
  sessions: {
    list: async (filters = {}) => {
      return apiCall(
        () => axiosInstance.get('/api/sessions', { params: filters }),
        () => mockApi.sessions.list(filters)
      )
    },
    
    get: async (id) => {
      return apiCall(
        () => axiosInstance.get(`/api/sessions/${id}`),
        () => mockApi.sessions.get(id)
      )
    },
    
    start: async (sessionData) => {
      return apiCall(
        () => axiosInstance.post('/api/sessions/start', sessionData),
        () => mockApi.sessions.start(sessionData)
      )
    },
    
    end: async (id, sessionData) => {
      return apiCall(
        () => axiosInstance.post(`/api/sessions/${id}/end`, sessionData),
        () => mockApi.sessions.end(id, sessionData)
      )
    },
    
    delete: async (id) => {
      return apiCall(
        () => axiosInstance.delete(`/api/sessions/${id}`),
        () => mockApi.sessions.delete(id)
      )
    },
  },

  // ==================== GOALS ====================
  goals: {
    list: async () => {
      return apiCall(
        () => axiosInstance.get('/api/goals'),
        () => mockApi.goals.list()
      )
    },
    
    get: async (id) => {
      return apiCall(
        () => axiosInstance.get(`/api/goals/${id}`),
        () => mockApi.goals.get(id)
      )
    },
    
    create: async (goalData) => {
      return apiCall(
        () => axiosInstance.post('/api/goals', goalData),
        () => mockApi.goals.create(goalData)
      )
    },
    
    update: async (id, updates) => {
      return apiCall(
        () => axiosInstance.put(`/api/goals/${id}`, updates),
        () => mockApi.goals.update(id, updates)
      )
    },
    
    delete: async (id) => {
      return apiCall(
        () => axiosInstance.delete(`/api/goals/${id}`),
        () => mockApi.goals.delete(id)
      )
    },
    
    updateProgress: async (id, progress) => {
      return apiCall(
        () => axiosInstance.put(`/api/goals/${id}/progress`, { progress }),
        () => mockApi.goals.updateProgress(id, progress)
      )
    },
  },

  // ==================== REWARDS ====================
  rewards: {
    list: async () => {
      return apiCall(
        () => axiosInstance.get('/api/rewards'),
        () => mockApi.rewards.list()
      )
    },
    
    getUserRewards: async () => {
      return apiCall(
        () => axiosInstance.get('/api/rewards/user'),
        () => mockApi.rewards.getUserRewards()
      )
    },
    
    claim: async (rewardId) => {
      return apiCall(
        () => axiosInstance.post(`/api/rewards/${rewardId}/claim`),
        () => mockApi.rewards.claim(rewardId)
      )
    },
  },

  // ==================== RESOURCES ====================
  resources: {
    list: async (filters = {}) => {
      return apiCall(
        () => axiosInstance.get('/api/resources', { params: filters }),
        () => mockApi.resources.list(filters)
      )
    },
    
    get: async (id) => {
      return apiCall(
        () => axiosInstance.get(`/api/resources/${id}`),
        () => mockApi.resources.get(id)
      )
    },
    
    create: async (resourceData) => {
      return apiCall(
        () => axiosInstance.post('/api/resources', resourceData),
        () => mockApi.resources.create(resourceData)
      )
    },
    
    update: async (id, updates) => {
      return apiCall(
        () => axiosInstance.put(`/api/resources/${id}`, updates),
        () => mockApi.resources.update(id, updates)
      )
    },
    
    delete: async (id) => {
      return apiCall(
        () => axiosInstance.delete(`/api/resources/${id}`),
        () => mockApi.resources.delete(id)
      )
    },
    
    launch: async (id) => {
      return apiCall(
        () => axiosInstance.post(`/api/resources/${id}/launch`),
        () => mockApi.resources.launch(id)
      )
    },
  },

  // ==================== REPORTS ====================
  reports: {
    getSessionReport: async (filters = {}) => {
      return apiCall(
        () => axiosInstance.get('/api/reports/sessions', { params: filters }),
        () => mockApi.reports.getSessionReport(filters)
      )
    },
    
    getUserReport: async () => {
      return apiCall(
        () => axiosInstance.get('/api/reports/user'),
        () => mockApi.reports.getUserReport()
      )
    },
  },

  // ==================== BLOCKER ====================
  blocker: {
    list: async () => {
      return apiCall(
        () => axiosInstance.get('/api/blocker'),
        () => mockApi.blocker.list()
      )
    },
    
    add: async (appData) => {
      return apiCall(
        () => axiosInstance.post('/api/blocker', appData),
        () => mockApi.blocker.add(appData)
      )
    },
    
    update: async (id, updates) => {
      return apiCall(
        () => axiosInstance.put(`/api/blocker/${id}`, updates),
        () => mockApi.blocker.update(id, updates)
      )
    },
    
    delete: async (id) => {
      return apiCall(
        () => axiosInstance.delete(`/api/blocker/${id}`),
        () => mockApi.blocker.delete(id)
      )
    },
  },

  // ==================== ACTIVITY ====================
  activity: {
    ping: async (activityData) => {
      return apiCall(
        () => axiosInstance.post('/api/activity/ping', activityData),
        () => mockApi.activity.ping(activityData)
      )
    },
    
    getLogs: async (filters = {}) => {
      return apiCall(
        () => axiosInstance.get('/api/activity/logs', { params: filters }),
        () => mockApi.activity.getLogs(filters)
      )
    },
  },

  // ==================== PRESETS ====================
  presets: {
    list: async () => {
      return apiCall(
        () => axiosInstance.get('/api/presets'),
        () => mockApi.presets.list()
      )
    },
    
    get: async (id) => {
      return apiCall(
        () => axiosInstance.get(`/api/presets/${id}`),
        () => mockApi.presets.get(id)
      )
    },
    
    create: async (presetData) => {
      return apiCall(
        () => axiosInstance.post('/api/presets', presetData),
        () => mockApi.presets.create(presetData)
      )
    },
    
    update: async (id, updates) => {
      return apiCall(
        () => axiosInstance.put(`/api/presets/${id}`, updates),
        () => mockApi.presets.update(id, updates)
      )
    },
    
    delete: async (id) => {
      return apiCall(
        () => axiosInstance.delete(`/api/presets/${id}`),
        () => mockApi.presets.delete(id)
      )
    },
  },
}

export default api
