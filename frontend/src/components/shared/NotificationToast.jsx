import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';

const NotificationToast = ({ notifications, onDismiss, onDismissAll }) => {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'reminder':
        return <BellIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'reminder':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const handleDismiss = (notificationId) => {
    setVisibleNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
    onDismiss(notificationId);
  };

  const handleDismissAll = () => {
    setVisibleNotifications([]);
    onDismissAll();
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {/* Dismiss All Button */}
      {visibleNotifications.length > 1 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-700"
          >
            Dismiss All ({visibleNotifications.length})
          </button>
        </div>
      )}

      {/* Notification Items */}
      {visibleNotifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
          getIcon={getIcon}
          getBackgroundColor={getBackgroundColor}
          index={index}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ 
  notification, 
  onDismiss, 
  getIcon, 
  getBackgroundColor, 
  index 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleAction = (action) => {
    if (action.handler) {
      action.handler();
    }
    handleDismiss();
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`relative p-4 rounded-lg border shadow-lg backdrop-blur-sm ${getBackgroundColor(
          notification.type
        )}`}
      >
        {/* Progress bar for timed notifications */}
        {notification.duration && notification.duration > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all ease-linear"
              style={{
                animation: `shrink ${notification.duration}ms linear`,
                transformOrigin: 'left'
              }}
            />
          </div>
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            
            {notification.message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>
            )}

            {/* Metadata */}
            {notification.timestamp && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            )}

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={() => handleAction(action)}
                    className={`text-xs px-3 py-1 rounded transition-colors ${
                      action.primary
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      duration: 5000, // Default 5 seconds
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    });
  };

  const showError = (title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 8000, // Longer for errors
      ...options
    });
  };

  const showWarning = (title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    });
  };

  const showInfo = (title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    });
  };

  const showReminder = (title, message, options = {}) => {
    return addNotification({
      type: 'reminder',
      title,
      message,
      duration: 0, // Don't auto-dismiss reminders
      ...options
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showReminder
  };
};

// CSS for animation (add to your global CSS)
const animationCSS = `
@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
`;

// Add CSS to document head if it doesn't exist
if (typeof document !== 'undefined' && !document.getElementById('notification-animations')) {
  const style = document.createElement('style');
  style.id = 'notification-animations';
  style.textContent = animationCSS;
  document.head.appendChild(style);
}

export default NotificationToast;