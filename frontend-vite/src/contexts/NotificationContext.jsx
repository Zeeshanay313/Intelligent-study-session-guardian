/**
 * NotificationContext
 * Global toast notification management
 */

import React, { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

let toastIdCounter = 0

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(
    (message, type = 'info', options = {}) => {
      const id = ++toastIdCounter
      const {
        duration = type === 'error' ? 6000 : 4000,
        action,
        dismissible = true,
      } = options

      const toast = {
        id,
        message,
        type, // success, error, warning, info, reminder
        timestamp: Date.now(),
        action,
        dismissible,
      }

      setToasts((prev) => [...prev, toast])

      // Auto-dismiss after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    []
  )

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const success = useCallback(
    (message, options) => addToast(message, 'success', options),
    [addToast]
  )

  const error = useCallback(
    (message, options) => addToast(message, 'error', options),
    [addToast]
  )

  const warning = useCallback(
    (message, options) => addToast(message, 'warning', options),
    [addToast]
  )

  const info = useCallback(
    (message, options) => addToast(message, 'info', options),
    [addToast]
  )

  const reminder = useCallback(
    (message, options) => addToast(message, 'reminder', options),
    [addToast]
  )

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        removeAllToasts,
        success,
        error,
        warning,
        info,
        reminder,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
