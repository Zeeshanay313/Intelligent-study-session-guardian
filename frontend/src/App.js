import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

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
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;