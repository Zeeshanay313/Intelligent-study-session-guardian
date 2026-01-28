/**
 * Admin API Service
 * 
 * API client for admin operations - user management, dashboard stats, etc.
 */

import axios from 'axios'

// Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5004'

// Create axios instance for admin API
const adminAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor - add auth token
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Admin API methods
export const adminApi = {
  // ==================== DASHBOARD ====================
  getDashboardStats: async () => {
    const response = await adminAxios.get('/api/admin/dashboard')
    return response.data
  },

  // ==================== USERS ====================
  getAllUsers: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/users', { params })
    return response.data
  },

  getUserById: async (userId) => {
    const response = await adminAxios.get(`/api/admin/users/${userId}`)
    return response.data
  },

  createUser: async (userData) => {
    const response = await adminAxios.post('/api/admin/users', userData)
    return response.data
  },

  updateUser: async (userId, updates) => {
    const response = await adminAxios.put(`/api/admin/users/${userId}`, updates)
    return response.data
  },

  deleteUser: async (userId, permanent = false) => {
    const response = await adminAxios.delete(`/api/admin/users/${userId}`, {
      params: { permanent }
    })
    return response.data
  },

  restoreUser: async (userId) => {
    const response = await adminAxios.post(`/api/admin/users/${userId}/restore`)
    return response.data
  },

  // ==================== GOALS ====================
  getAllGoals: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/goals', { params })
    return response.data
  },

  // ==================== SESSIONS ====================
  getAllSessions: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/sessions', { params })
    return response.data
  },

  // ==================== REWARDS ====================
  getAllRewards: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/rewards', { params })
    return response.data
  },

  createReward: async (rewardData) => {
    const response = await adminAxios.post('/api/admin/rewards', rewardData)
    return response.data
  },

  updateReward: async (rewardId, updates) => {
    const response = await adminAxios.put(`/api/admin/rewards/${rewardId}`, updates)
    return response.data
  },

  deleteReward: async (rewardId) => {
    const response = await adminAxios.delete(`/api/admin/rewards/${rewardId}`)
    return response.data
  },

  // ==================== CHALLENGES ====================
  getAllChallenges: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/challenges', { params })
    return response.data
  },

  getChallengeById: async (challengeId) => {
    const response = await adminAxios.get(`/api/admin/challenges/${challengeId}`)
    return response.data
  },

  createChallenge: async (challengeData) => {
    const response = await adminAxios.post('/api/admin/challenges', challengeData)
    return response.data
  },

  updateChallenge: async (challengeId, updates) => {
    const response = await adminAxios.put(`/api/admin/challenges/${challengeId}`, updates)
    return response.data
  },

  deleteChallenge: async (challengeId) => {
    const response = await adminAxios.delete(`/api/admin/challenges/${challengeId}`)
    return response.data
  },

  // ==================== SYSTEM ====================
  getSystemHealth: async () => {
    const response = await adminAxios.get('/api/admin/system/health')
    return response.data
  },

  // ==================== AUDIT LOGS ====================
  getAuditLogs: async (params = {}) => {
    const response = await adminAxios.get('/api/admin/audit-logs', { params })
    return response.data
  },
}

export default adminApi
