import React, { createContext, useState, useEffect, useContext } from 'react'
import { api } from '../services/api'

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
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        try {
          const response = await api.profile.get()
          if (response.success) {
            setUser(response.data)
            setIsAuthenticated(true)
          } else {
            // Invalid token
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
        }
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.auth.login(email, password)
      
      if (response.success) {
        const { user: userData, token } = response.data
        
        // Store tokens
        localStorage.setItem('authToken', token)
        
        // Set user state
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      }
      
      return { success: false, message: 'Login failed' }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.auth.register(userData)
      
      if (response.success) {
        const { user: newUser, token } = response.data
        
        // Store tokens
        localStorage.setItem('authToken', token)
        
        // Set user state
        setUser(newUser)
        setIsAuthenticated(true)
        
        return { success: true, user: newUser }
      }
      
      return { success: false, message: 'Registration failed' }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Registration failed' 
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

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    updatePreferences,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
