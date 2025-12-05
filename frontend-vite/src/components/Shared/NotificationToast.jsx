/**
 * NotificationToast Component
 * Toast notification display with animations and types
 */

import React from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'

const Toast = ({ toast, onDismiss }) => {
  const { id, message, type, action, dismissible } = toast

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'reminder':
        return <Bell className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300'
      case 'reminder':
        return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
    }
  }

  return (
    <div
      className={`flex items-start p-4 mb-3 border rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${getStyles()} animate-slide-in`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{getIcon()}</div>

      <div className="flex-1 mr-2">
        <p className="text-sm font-medium">{message}</p>
        {action && (
          <button
            onClick={() => {
              action.onClick()
              onDismiss(id)
            }}
            className="mt-2 text-xs underline hover:no-underline focus:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>

      {dismissible && (
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity focus:outline-none"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

const NotificationToast = () => {
  const { toasts, removeToast, removeAllToasts } = useNotification()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full pointer-events-auto">
      {/* Dismiss All button */}
      {toasts.length > 1 && (
        <div className="mb-2 text-right">
          <button
            onClick={removeAllToasts}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline focus:outline-none"
          >
            Dismiss all ({toasts.length})
          </button>
        </div>
      )}

      {/* Toast list */}
      <div className="space-y-0">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default NotificationToast
