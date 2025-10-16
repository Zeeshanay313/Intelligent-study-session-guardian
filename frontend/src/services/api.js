import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5003/api',
  timeout: 10000,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth header if token exists in localStorage (fallback)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry refresh endpoint or if already retried
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/me')) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    if (error.response?.data?.error) {
      const errorMessage = error.response.data.error;
      // Skip toast for forgot-password endpoint - handled by component
      const isForgotPassword = originalRequest.url?.includes('/auth/forgot-password');
      
      if (error.response.status >= 500 && !isForgotPassword) {
        toast.error('Server error. Please try again.');
      } else if (error.response.status !== 401 && !isForgotPassword) {
        toast.error(errorMessage);
      }
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  getMe: () => api.get('/auth/me'),
  changePassword: (passwordData) => api.patch('/auth/change-password', passwordData),
  // Password reset endpoints
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyResetToken: (token) => api.get(`/auth/verify-reset-token/${token}`),
};

// User API methods
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (profileData) => api.patch('/users/me/profile', profileData),
  updatePrivacy: (privacyData) => api.patch('/users/me/privacy', privacyData),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportData: () => api.post('/users/me/export', {}, {
    responseType: 'blob',
  }),
  deleteAccount: (confirmData) => api.delete('/users/me', { data: confirmData }),
  restoreAccount: (restoreData) => api.post('/users/me/restore', restoreData),
  inviteGuardian: (guardianData) => api.post('/users/me/guardian-invite', guardianData),
  getAuditLogs: (params = {}) => api.get(`/users/${params.userId || 'me'}/audit-logs`, { params }),
};

// Device API methods
export const deviceAPI = {
  register: (deviceData) => api.post('/devices/register', deviceData),
  getMyDevices: (activeOnly = false) => api.get('/devices/my-devices', { 
    params: { activeOnly } 
  }),
  updateAccess: (deviceId, accessData) => api.patch(`/devices/${deviceId}/access`, accessData),
  revokeAccess: (deviceId, reason) => api.post(`/devices/${deviceId}/revoke`, { reason }),
  removeDevice: (deviceId) => api.delete(`/devices/${deviceId}`),
  getDevice: (deviceId) => api.get(`/devices/${deviceId}`),
  flagSuspicious: (deviceId, reason) => api.post(`/devices/${deviceId}/flag-suspicious`, { reason }),
};

// Utility functions for API calls
export const clearAuthData = () => {
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

// Device fingerprinting utility
export const getDeviceFingerprint = () => {
  return {
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
  };
};

// Generate unique device ID
export const generateDeviceId = () => {
  const stored = localStorage.getItem('deviceId');
  if (stored) return stored;
  
  const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('deviceId', deviceId);
  return deviceId;
};

export default api;