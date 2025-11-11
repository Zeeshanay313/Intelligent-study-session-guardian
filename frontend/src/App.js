import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import NotificationToast, { useNotifications } from './components/shared/NotificationToast';
import { useSocket } from './hooks/useSocket';

// Lazy load heavy components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Goal Tracker Components
const GoalListPage = lazy(() => import('./pages/GoalListPage'));
const GoalFormPage = lazy(() => import('./pages/GoalFormPage'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));

// Timer and Reminder Components
const FocusTimerPage = lazy(() => import('./pages/FocusTimerPage'));
const RemindersPage = lazy(() => import('./pages/reminders/RemindersPage'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  const { notifications, removeNotification, clearAllNotifications, showInfo, showSuccess } = useNotifications();
  const { socketService, setupReminderListeners } = useSocket();

  // Set up reminder listeners
  useEffect(() => {
    if (socketService && setupReminderListeners) {
      const handleReminderDue = (data) => {
        console.log('Reminder due:', data);
        showSuccess('Reminder', data.message || data.title, {
          duration: 8000, // Show for 8 seconds
          action: {
            label: 'Dismiss',
            onClick: () => {} // Already handled by the notification system
          }
        });
        
        // Try to show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      };

      const unsubscribe = setupReminderListeners(handleReminderDue);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [socketService, setupReminderListeners, showSuccess]);

  // Request notification permission on app load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
        <Suspense fallback={<LoadingSpinner message="Loading application..." />}>
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            {/* Goal Tracker Routes */}
            <Route path="goals" element={<GoalListPage />} />
            <Route path="goals/new" element={<GoalFormPage />} />
            <Route path="goals/:id" element={<GoalDetailPage />} />
            <Route path="goals/:id/edit" element={<GoalFormPage />} />
            {/* Timer and Reminder Routes */}
            <Route path="timer" element={<FocusTimerPage />} />
            <Route path="focus-timer" element={<FocusTimerPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="reminder-scheduling" element={<RemindersPage />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        
        {/* Global Notification Toast */}
        <NotificationToast 
          notifications={notifications}
          onDismiss={removeNotification}
          onDismissAll={clearAllNotifications}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;