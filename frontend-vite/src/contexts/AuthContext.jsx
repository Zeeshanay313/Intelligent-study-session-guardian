import React, { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is logged in on mount
    // Skip auto-authentication for login/register pages
    const currentPath = window.location.pathname
    const isAuthPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/'
    
    if (isAuthPage) {
      // Don't auto-authenticate on auth pages - let user manually login
      setLoading(false)
      setIsAuthenticated(false)
      return
    }
    
    // Since we use HTTP-only cookies, we don't check localStorage
    // Just try to fetch profile - cookies will be sent automatically
    const checkAuth = async () => {
      try {
        const response = await api.profile.get()
        if (response && response.success && response.data) {
          // Profile returns: { success: true, data: { user, profile, settings, ... } }
          // Store complete data so we can access profile.displayName
          setUser(response.data)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        // User not logged in - this is normal
        setIsAuthenticated(false)
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.auth.login(email, password)
      
      // Backend returns { message: '...', token, refreshToken, user: {...} }
      if (response && response.user) {
        // Store tokens if provided
        if (response.token) {
          localStorage.setItem('authToken', response.token)
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken)
        }
        
        // Fetch complete profile to get displayName
        const profileResponse = await api.profile.get()
        if (profileResponse && profileResponse.success) {
          setUser(profileResponse.data)
          setIsAuthenticated(true)
          return { success: true, user: profileResponse.data }
        }
        
        // Fallback if profile fetch fails
        setUser(response.user)
        setIsAuthenticated(true)
        return { success: true, user: response.user }
      }
      
      return { success: false, message: response.message || 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.auth.register(userData)
      
      if (response.success) {
        // Don't auto-login - user should manually login after registration
        return { 
          success: true, 
          message: 'Account created successfully! Please login with your credentials.',
          email: userData.email 
        }
      }
      
      return { success: false, message: response.message || response.error || 'Registration failed' }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear state regardless of API call result
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const updateUser = async (updates) => {
    try {
      const response = await api.profile.update(updates)
      
      if (response.success) {
        setUser(response.data)
        return { success: true, user: response.data }
      }
      
      return { success: false, message: 'Update failed' }
    } catch (error) {
      console.error('Update user error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Update failed' 
      }
    }
  }

  const updatePreferences = async (preferences) => {
    try {
      const response = await api.profile.updatePreferences(preferences)
      
      if (response.success) {
        setUser(response.data)
        return { success: true, user: response.data }
      }
      
      return { success: false, message: 'Preferences update failed' }
    } catch (error) {
      console.error('Update preferences error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Update failed' 
      }
    }
  }

  // For OAuth: Backend sets cookies, this fetches user to update context
  const refreshAuth = async () => {
    try {
      console.log('Refreshing auth state (OAuth callback)...')
      const response = await api.profile.get()
      
      if (response && response.success && response.data) {
        setUser(response.data)
        setIsAuthenticated(true)
        console.log('Auth refreshed, user:', response.data.user.email)
        return { success: true, user: response.data }
      }
      
      return { success: false, message: 'Could not refresh auth' }
    } catch (error) {
      console.error('Refresh auth error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Refresh failed' 
      }
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updatePreferences,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
