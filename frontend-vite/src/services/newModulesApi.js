import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5004'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Security API ─────────────────────────────────────────────────────────────
export const securityApi = {
  getSettings: () => api.get('/api/security/settings'),
  updateSettings: (data) => api.put('/api/security/settings', data),

  getConsents: () => api.get('/api/security/consent'),
  updateConsent: (consentType, granted, notes) =>
    api.post('/api/security/consent', { consentType, granted, notes }),

  getAuditLog: (params) => api.get('/api/security/audit-log', { params }),
  createAuditEntry: (data) => api.post('/api/security/audit-log', data),

  exportData: () => api.post('/api/security/export', {}, { responseType: 'blob' }),
  permanentDelete: (confirmEmail) => api.delete('/api/security/permanent-delete', { data: { confirmEmail } }),

  getRetention: () => api.get('/api/security/retention'),
  updateRetention: (data) => api.put('/api/security/retention', data)
}

// ─── Presence API ─────────────────────────────────────────────────────────────
export const presenceApi = {
  start: (data) => api.post('/api/presence/start', data),
  recordEvent: (data) => api.post('/api/presence/event', data),
  manualCheckin: (presenceSessionId) => api.post('/api/presence/manual-checkin', { presenceSessionId }),
  end: (presenceSessionId) => api.post('/api/presence/end', { presenceSessionId }),
  getActive: () => api.get('/api/presence/active'),
  getSession: (sessionId) => api.get(`/api/presence/session/${sessionId}`),
  getHistory: (params) => api.get('/api/presence/history', { params }),
  getCameraAudit: () => api.get('/api/presence/camera-audit')
}

// ─── Insights API ─────────────────────────────────────────────────────────────
export const insightsApi = {
  getStudentInsights: (userId, params) => api.get(`/api/insights/student/${userId}`, { params }),
  getGuardianInsights: (userId, params) => api.get(`/api/insights/guardian/${userId}`, { params }),
  getTeacherInsights: (userId, params) => api.get(`/api/insights/teacher/${userId}`, { params }),
  getSummary: (userId) => api.get(`/api/insights/summary/${userId}`),

  listAccess: () => api.get('/api/insights/access'),
  shareAccess: (data) => api.post('/api/insights/share', data),
  revokeAccess: (guardianEmail) => api.delete('/api/insights/share', { data: { guardianEmail } }),

  requestReminder: (data) => api.post('/api/insights/reminder-request', data),
  approveReminder: (data) => api.post('/api/insights/reminder-approve', data),

  exportCSV: (userId, params) =>
    api.get(`/api/insights/export/csv/${userId}`, { params, responseType: 'blob' }),
  exportPDF: (userId, params) =>
    api.get(`/api/insights/export/pdf/${userId}`, { params })
}

export default api
