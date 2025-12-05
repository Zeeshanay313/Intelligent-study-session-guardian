/**
 * Mock API Service
 * 
 * Provides mock data and endpoints for development without backend
 * Simulates real API responses with realistic delays
 */

// Simulate network delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// Mock database
let mockDb = {
  users: [
    {
      id: 1,
      email: 'demo@example.com',
      username: 'demo_user',
      name: 'Demo User',
      avatar: null,
      createdAt: '2024-01-01T00:00:00Z',
      preferences: {
        theme: 'light',
        notifications: true,
        emailNotifications: true,
        guardianMode: false,
      }
    }
  ],
  presets: [
    {
      id: 1,
      userId: 1,
      name: 'Deep Study',
      subject: 'Mathematics',
      workDuration: 50 * 60,
      breakDuration: 10 * 60,
      longBreakDuration: 30 * 60,
      cyclesBeforeLongBreak: 4,
      color: '#3B82F6',
      icon: '📚',
      createdAt: '2024-11-01T00:00:00Z'
    },
    {
      id: 2,
      userId: 1,
      name: 'Quick Review',
      subject: 'Programming',
      workDuration: 25 * 60,
      breakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      cyclesBeforeLongBreak: 3,
      color: '#10B981',
      icon: '💻',
      createdAt: '2024-11-15T00:00:00Z'
    }
  ],
  sessions: [
    {
      id: 1,
      userId: 1,
      type: 'focus',
      duration: 1500, // 25 minutes in seconds
      actualDuration: 1500,
      startTime: '2024-12-04T10:00:00Z',
      endTime: '2024-12-04T10:25:00Z',
      completed: true,
      notes: 'Completed math homework',
      tags: ['math', 'homework']
    },
    {
      id: 2,
      userId: 1,
      type: 'short-break',
      duration: 300, // 5 minutes
      actualDuration: 300,
      startTime: '2024-12-04T10:25:00Z',
      endTime: '2024-12-04T10:30:00Z',
      completed: true,
      notes: null,
      tags: []
    },
    {
      id: 3,
      userId: 1,
      type: 'focus',
      duration: 1500,
      actualDuration: 1200,
      startTime: '2024-12-05T09:00:00Z',
      endTime: '2024-12-05T09:20:00Z',
      completed: false,
      notes: 'Interrupted',
      tags: ['reading']
    }
  ],
  goals: [
    {
      id: 1,
      userId: 1,
      title: 'Complete React Course',
      description: 'Finish the advanced React course on Udemy',
      targetDate: '2024-12-31',
      targetValue: 40,
      currentValue: 15,
      unit: 'hours',
      category: 'learning',
      status: 'active',
      milestones: [
        { id: 1, title: 'Hooks Module', completed: true, date: '2024-12-01' },
        { id: 2, title: 'Context API', completed: false, date: null },
        { id: 3, title: 'Redux', completed: false, date: null }
      ],
      createdAt: '2024-11-01T00:00:00Z',
      updatedAt: '2024-12-05T00:00:00Z'
    },
    {
      id: 2,
      userId: 1,
      title: 'Study 100 Hours',
      description: 'Total study time for December',
      targetDate: '2024-12-31',
      targetValue: 100,
      currentValue: 45,
      unit: 'hours',
      category: 'study',
      status: 'active',
      milestones: [],
      createdAt: '2024-12-01T00:00:00Z',
      updatedAt: '2024-12-05T00:00:00Z'
    }
  ],
  rewards: [
    {
      id: 1,
      userId: 1,
      type: 'badge',
      name: 'First Session',
      description: 'Completed your first focus session',
      icon: '🎯',
      earnedAt: '2024-12-04T10:25:00Z',
      points: 10
    },
    {
      id: 2,
      userId: 1,
      type: 'badge',
      name: 'Week Warrior',
      description: 'Completed 7 consecutive days of study',
      icon: '🔥',
      earnedAt: '2024-12-05T00:00:00Z',
      points: 50
    },
    {
      id: 3,
      userId: 1,
      type: 'milestone',
      name: '10 Hours Milestone',
      description: 'Reached 10 hours of total study time',
      icon: '⏰',
      earnedAt: '2024-12-03T00:00:00Z',
      points: 25
    }
  ],
  userRewards: {
    userId: 1,
    totalPoints: 285,
    level: 3,
    streak: 7,
    badges: [1, 2, 3]
  },
  resources: [
    {
      id: 1,
      userId: 1,
      title: 'React Documentation',
      url: 'https://react.dev',
      type: 'article',
      category: 'programming',
      tags: ['react', 'javascript', 'web-development'],
      notes: 'Official React docs - great reference',
      addedAt: '2024-11-15T00:00:00Z',
      lastAccessedAt: '2024-12-05T08:30:00Z',
      favorite: true
    },
    {
      id: 2,
      userId: 1,
      title: 'JavaScript Algorithms Course',
      url: 'https://example.com/js-algorithms',
      type: 'video',
      category: 'programming',
      tags: ['javascript', 'algorithms', 'data-structures'],
      notes: 'Great explanations of common algorithms',
      addedAt: '2024-11-20T00:00:00Z',
      lastAccessedAt: null,
      favorite: false
    },
    {
      id: 3,
      userId: 1,
      title: 'Study Timer App',
      url: 'https://pomofocus.io',
      type: 'tool',
      category: 'productivity',
      tags: ['pomodoro', 'timer', 'productivity'],
      notes: 'Alternative timer for cross-checking',
      addedAt: '2024-12-01T00:00:00Z',
      lastAccessedAt: '2024-12-04T14:00:00Z',
      favorite: true
    },
    {
      id: 4,
      userId: 1,
      title: 'Calculus Notes PDF',
      url: 'file:///downloads/calculus-notes.pdf',
      type: 'document',
      category: 'mathematics',
      tags: ['calculus', 'math', 'notes'],
      notes: 'Prof. Smith\'s lecture notes',
      addedAt: '2024-11-10T00:00:00Z',
      lastAccessedAt: '2024-12-04T11:00:00Z',
      favorite: true
    }
  ],
  blockedApps: [
    {
      id: 1,
      userId: 1,
      appName: 'Facebook',
      processName: 'facebook.exe',
      isActive: true,
      blockedDuring: 'focus',
      createdAt: '2024-11-01T00:00:00Z'
    },
    {
      id: 2,
      userId: 1,
      appName: 'Twitter',
      processName: 'twitter.exe',
      isActive: true,
      blockedDuring: 'focus',
      createdAt: '2024-11-01T00:00:00Z'
    },
    {
      id: 3,
      userId: 1,
      appName: 'YouTube',
      processName: 'chrome.exe --app=https://youtube.com',
      isActive: false,
      blockedDuring: 'always',
      createdAt: '2024-11-15T00:00:00Z'
    }
  ],
  activityLogs: [
    {
      id: 1,
      userId: 1,
      timestamp: '2024-12-05T09:00:00Z',
      activity: 'session_started',
      details: { sessionType: 'focus', duration: 1500 }
    },
    {
      id: 2,
      userId: 1,
      timestamp: '2024-12-05T09:20:00Z',
      activity: 'session_interrupted',
      details: { sessionId: 3, reason: 'user_stopped' }
    }
  ]
}

// Auth token storage
let currentToken = 'mock-jwt-token-123456'
let isAuthenticated = false

// Mock API Endpoints
export const mockApi = {
  // ==================== AUTH ====================
  auth: {
    async login(email, password) {
      await delay()
      
      if (email === 'demo@example.com' && password === 'password') {
        isAuthenticated = true
        const user = mockDb.users[0]
        return {
          success: true,
          data: {
            user,
            token: currentToken,
            expiresIn: 86400 // 24 hours
          }
        }
      }
      
      throw new Error('Invalid credentials')
    },
    
    async register(userData) {
      await delay()
      
      // Check if user already exists
      const existingUser = mockDb.users.find(u => u.email === userData.email)
      if (existingUser) {
        throw new Error('User already exists')
      }
      
      const newUser = {
        id: mockDb.users.length + 1,
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        name: userData.name || 'New User',
        avatar: null,
        createdAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          notifications: true,
          emailNotifications: true,
          guardianMode: false,
        }
      }
      
      mockDb.users.push(newUser)
      isAuthenticated = true
      
      return {
        success: true,
        data: {
          user: newUser,
          token: currentToken,
          expiresIn: 86400
        }
      }
    },
    
    async logout() {
      await delay(100)
      isAuthenticated = false
      return { success: true }
    },
    
    async refreshToken() {
      await delay()
      return {
        success: true,
        data: {
          token: currentToken,
          expiresIn: 86400
        }
      }
    },
    
    async forgotPassword(email) {
      await delay()
      const user = mockDb.users.find(u => u.email === email)
      if (!user) {
        throw new Error('User not found')
      }
      return {
        success: true,
        message: 'Password reset email sent'
      }
    },
    
    async resetPassword(token, newPassword) {
      await delay()
      return {
        success: true,
        message: 'Password reset successfully'
      }
    }
  },

  // ==================== PROFILE ====================
  profile: {
    async get() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      return {
        success: true,
        data: mockDb.users[0]
      }
    },
    
    async update(updates) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      Object.assign(mockDb.users[0], updates)
      return {
        success: true,
        data: mockDb.users[0]
      }
    },
    
    async updatePreferences(preferences) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      Object.assign(mockDb.users[0].preferences, preferences)
      return {
        success: true,
        data: mockDb.users[0]
      }
    },
    
    async exportData() {
      await delay(500)
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: {
          user: mockDb.users[0],
          sessions: mockDb.sessions,
          goals: mockDb.goals,
          rewards: mockDb.rewards,
          resources: mockDb.resources
        }
      }
    },
    
    async deleteAccount() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      // In real app, this would delete all user data
      isAuthenticated = false
      return {
        success: true,
        message: 'Account deleted successfully'
      }
    }
  },

  // ==================== SESSIONS ====================
  sessions: {
    async list(filters = {}) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      let sessions = [...mockDb.sessions]
      
      // Apply filters
      if (filters.type) {
        sessions = sessions.filter(s => s.type === filters.type)
      }
      if (filters.completed !== undefined) {
        sessions = sessions.filter(s => s.completed === filters.completed)
      }
      if (filters.startDate) {
        sessions = sessions.filter(s => new Date(s.startTime) >= new Date(filters.startDate))
      }
      if (filters.endDate) {
        sessions = sessions.filter(s => new Date(s.startTime) <= new Date(filters.endDate))
      }
      
      return {
        success: true,
        data: sessions
      }
    },
    
    async get(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const session = mockDb.sessions.find(s => s.id === parseInt(id))
      if (!session) throw new Error('Session not found')
      
      return {
        success: true,
        data: session
      }
    },
    
    async start(sessionData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const newSession = {
        id: mockDb.sessions.length + 1,
        userId: 1,
        type: sessionData.type || 'focus',
        duration: sessionData.duration || 1500,
        actualDuration: 0,
        startTime: new Date().toISOString(),
        endTime: null,
        completed: false,
        notes: sessionData.notes || null,
        tags: sessionData.tags || []
      }
      
      mockDb.sessions.push(newSession)
      
      return {
        success: true,
        data: newSession
      }
    },
    
    async end(id, sessionData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const session = mockDb.sessions.find(s => s.id === parseInt(id))
      if (!session) throw new Error('Session not found')
      
      session.endTime = new Date().toISOString()
      session.actualDuration = sessionData.actualDuration || session.duration
      session.completed = sessionData.completed !== undefined ? sessionData.completed : true
      if (sessionData.notes) session.notes = sessionData.notes
      
      return {
        success: true,
        data: session
      }
    },
    
    async delete(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const index = mockDb.sessions.findIndex(s => s.id === parseInt(id))
      if (index === -1) throw new Error('Session not found')
      
      mockDb.sessions.splice(index, 1)
      
      return {
        success: true,
        message: 'Session deleted'
      }
    }
  },

  // ==================== GOALS ====================
  goals: {
    async list() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: mockDb.goals
      }
    },
    
    async get(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const goal = mockDb.goals.find(g => g.id === parseInt(id))
      if (!goal) throw new Error('Goal not found')
      
      return {
        success: true,
        data: goal
      }
    },
    
    async create(goalData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const newGoal = {
        id: mockDb.goals.length + 1,
        userId: 1,
        title: goalData.title,
        description: goalData.description || '',
        targetDate: goalData.targetDate,
        targetValue: goalData.targetValue,
        currentValue: 0,
        unit: goalData.unit || 'hours',
        category: goalData.category || 'general',
        status: 'active',
        milestones: goalData.milestones || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockDb.goals.push(newGoal)
      
      return {
        success: true,
        data: newGoal
      }
    },
    
    async update(id, updates) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const goal = mockDb.goals.find(g => g.id === parseInt(id))
      if (!goal) throw new Error('Goal not found')
      
      Object.assign(goal, updates)
      goal.updatedAt = new Date().toISOString()
      
      return {
        success: true,
        data: goal
      }
    },
    
    async delete(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const index = mockDb.goals.findIndex(g => g.id === parseInt(id))
      if (index === -1) throw new Error('Goal not found')
      
      mockDb.goals.splice(index, 1)
      
      return {
        success: true,
        message: 'Goal deleted'
      }
    },
    
    async updateProgress(id, progress) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const goal = mockDb.goals.find(g => g.id === parseInt(id))
      if (!goal) throw new Error('Goal not found')
      
      goal.currentValue = progress
      goal.updatedAt = new Date().toISOString()
      
      return {
        success: true,
        data: goal
      }
    }
  },

  // ==================== REWARDS ====================
  rewards: {
    async list() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: mockDb.rewards
      }
    },
    
    async getUserRewards() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: mockDb.userRewards
      }
    },
    
    async claim(rewardId) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      // In real app, this would unlock/claim a reward
      return {
        success: true,
        message: 'Reward claimed',
        data: { points: 10 }
      }
    }
  },

  // ==================== RESOURCES ====================
  resources: {
    async list(filters = {}) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      let resources = [...mockDb.resources]
      
      if (filters.type) {
        resources = resources.filter(r => r.type === filters.type)
      }
      if (filters.category) {
        resources = resources.filter(r => r.category === filters.category)
      }
      if (filters.tags && filters.tags.length > 0) {
        resources = resources.filter(r => 
          filters.tags.some(tag => r.tags.includes(tag))
        )
      }
      if (filters.favorite !== undefined) {
        resources = resources.filter(r => r.favorite === filters.favorite)
      }
      
      return {
        success: true,
        data: resources
      }
    },
    
    async get(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const resource = mockDb.resources.find(r => r.id === parseInt(id))
      if (!resource) throw new Error('Resource not found')
      
      return {
        success: true,
        data: resource
      }
    },
    
    async create(resourceData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const newResource = {
        id: mockDb.resources.length + 1,
        userId: 1,
        title: resourceData.title,
        url: resourceData.url,
        type: resourceData.type || 'article',
        category: resourceData.category || 'general',
        tags: resourceData.tags || [],
        notes: resourceData.notes || '',
        addedAt: new Date().toISOString(),
        lastAccessedAt: null,
        favorite: false
      }
      
      mockDb.resources.push(newResource)
      
      return {
        success: true,
        data: newResource
      }
    },
    
    async update(id, updates) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const resource = mockDb.resources.find(r => r.id === parseInt(id))
      if (!resource) throw new Error('Resource not found')
      
      Object.assign(resource, updates)
      
      return {
        success: true,
        data: resource
      }
    },
    
    async delete(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const index = mockDb.resources.findIndex(r => r.id === parseInt(id))
      if (index === -1) throw new Error('Resource not found')
      
      mockDb.resources.splice(index, 1)
      
      return {
        success: true,
        message: 'Resource deleted'
      }
    },
    
    async launch(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const resource = mockDb.resources.find(r => r.id === parseInt(id))
      if (!resource) throw new Error('Resource not found')
      
      resource.lastAccessedAt = new Date().toISOString()
      
      return {
        success: true,
        data: { url: resource.url }
      }
    }
  },

  // ==================== REPORTS ====================
  reports: {
    async getSessionReport(filters = {}) {
      await delay(500)
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      // Generate mock analytics
      return {
        success: true,
        data: {
          totalSessions: 24,
          completedSessions: 18,
          totalFocusTime: 36000, // seconds
          averageSessionLength: 1500,
          completionRate: 75,
          dailyStats: [
            { date: '2024-12-01', sessions: 4, focusTime: 6000 },
            { date: '2024-12-02', sessions: 3, focusTime: 4500 },
            { date: '2024-12-03', sessions: 5, focusTime: 7500 },
            { date: '2024-12-04', sessions: 6, focusTime: 9000 },
            { date: '2024-12-05', sessions: 6, focusTime: 9000 }
          ],
          topTags: [
            { tag: 'math', count: 8 },
            { tag: 'reading', count: 6 },
            { tag: 'programming', count: 5 }
          ]
        }
      }
    },
    
    async getUserReport() {
      await delay(500)
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: {
          totalStudyTime: 36000,
          streak: 7,
          level: 3,
          totalPoints: 285,
          goalsCompleted: 3,
          goalsActive: 2,
          badgesEarned: 8,
          joinedDate: '2024-01-01T00:00:00Z'
        }
      }
    }
  },

  // ==================== BLOCKER ====================
  blocker: {
    async list() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: mockDb.blockedApps
      }
    },
    
    async add(appData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const newApp = {
        id: mockDb.blockedApps.length + 1,
        userId: 1,
        appName: appData.appName,
        processName: appData.processName,
        isActive: appData.isActive !== undefined ? appData.isActive : true,
        blockedDuring: appData.blockedDuring || 'focus',
        createdAt: new Date().toISOString()
      }
      
      mockDb.blockedApps.push(newApp)
      
      return {
        success: true,
        data: newApp
      }
    },
    
    async update(id, updates) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const app = mockDb.blockedApps.find(a => a.id === parseInt(id))
      if (!app) throw new Error('Blocked app not found')
      
      Object.assign(app, updates)
      
      return {
        success: true,
        data: app
      }
    },
    
    async delete(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const index = mockDb.blockedApps.findIndex(a => a.id === parseInt(id))
      if (index === -1) throw new Error('Blocked app not found')
      
      mockDb.blockedApps.splice(index, 1)
      
      return {
        success: true,
        message: 'Blocked app removed'
      }
    }
  },

  // ==================== ACTIVITY ====================
  activity: {
    async ping(activityData) {
      await delay(50)
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const log = {
        id: mockDb.activityLogs.length + 1,
        userId: 1,
        timestamp: new Date().toISOString(),
        activity: activityData.activity,
        details: activityData.details || {}
      }
      
      mockDb.activityLogs.push(log)
      
      return {
        success: true,
        data: log
      }
    },
    
    async getLogs(filters = {}) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      let logs = [...mockDb.activityLogs]
      
      if (filters.startDate) {
        logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate))
      }
      if (filters.endDate) {
        logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate))
      }
      if (filters.activity) {
        logs = logs.filter(l => l.activity === filters.activity)
      }
      
      return {
        success: true,
        data: logs
      }
    }
  },

  // ==================== PRESETS ====================
  presets: {
    async list() {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      return {
        success: true,
        data: mockDb.presets
      }
    },
    
    async get(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const preset = mockDb.presets.find(p => p.id === parseInt(id))
      if (!preset) throw new Error('Preset not found')
      
      return {
        success: true,
        data: preset
      }
    },
    
    async create(presetData) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const newPreset = {
        id: mockDb.presets.length + 1,
        userId: 1,
        ...presetData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockDb.presets.push(newPreset)
      
      return {
        success: true,
        data: newPreset
      }
    },
    
    async update(id, updates) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const preset = mockDb.presets.find(p => p.id === parseInt(id))
      if (!preset) throw new Error('Preset not found')
      
      Object.assign(preset, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      
      return {
        success: true,
        data: preset
      }
    },
    
    async delete(id) {
      await delay()
      if (!isAuthenticated) throw new Error('Not authenticated')
      
      const index = mockDb.presets.findIndex(p => p.id === parseInt(id))
      if (index === -1) throw new Error('Preset not found')
      
      mockDb.presets.splice(index, 1)
      
      return {
        success: true,
        message: 'Preset deleted successfully'
      }
    }
  }
}

export default mockApi
