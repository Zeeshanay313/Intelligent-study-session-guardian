import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, generateDeviceId, getDeviceFingerprint, clearAuthData } from '../services/api';
import toast from 'react-hot-toast';

// Auth context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return { ...state, user: null, loading: false };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  user: null,
  loading: true,
  error: null,
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    // Clear authentication on page refresh - always redirect to login
    clearAuthData();
    dispatch({ type: 'LOGOUT' });
    dispatch({ type: 'SET_LOADING', payload: false });
    
    // Uncomment the line below if you want to verify token with backend
    // checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.getMe();
      dispatch({ type: 'SET_USER', payload: response.data.user });
    } catch (error) {
      // Only try to refresh if we have a specific token expired error
      // Don't attempt refresh on 401 Unauthorized (no valid refresh token)
      if (error.response?.data?.code === 'TOKEN_EXPIRED' && error.response?.status !== 401) {
        try {
          const refreshResponse = await authAPI.refresh();
          dispatch({ type: 'SET_USER', payload: refreshResponse.data.user });
        } catch (refreshError) {
          // Clear any stored tokens and logout
          clearAuthData();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        // For 401 or other auth errors, just logout without refresh attempt
        clearAuthData();
        dispatch({ type: 'LOGOUT' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await authAPI.register(userData);
      
      // Clear loading state immediately after successful registration
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Don't set user - they need to login manually
      // dispatch({ type: 'SET_USER', payload: response.data.user });
      
      toast.success(response.data.message || 'Account created successfully! Please login with your credentials.');
      return { 
        success: true, 
        redirectToLogin: response.data.redirectToLogin,
        email: response.data.user?.email // For pre-filling login form
      };
    } catch (error) {
      // Clear loading state on error too
      dispatch({ type: 'SET_LOADING', payload: false });
      const errorMessage = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Add device information to login
      const deviceId = generateDeviceId();
      const fingerprint = getDeviceFingerprint();
      
      const loginData = {
        ...credentials,
        deviceId,
        deviceInfo: {
          name: `${fingerprint.platform} - ${fingerprint.userAgent.split(' ')[0]}`,
          type: getMobileDetection() ? 'mobile' : 'desktop',
          os: fingerprint.platform,
          browser: getBrowserName(fingerprint.userAgent),
          userAgent: fingerprint.userAgent
        },
        fingerprint
      };
      
      const response = await authAPI.login(loginData);
      
      // Store user and token data
      const userData = response.data.user;
      const token = response.data.token || response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      
      if (userData) {
        dispatch({ type: 'SET_USER', payload: userData });
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token); // Fallback for old code
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      clearAuthData();
      localStorage.removeItem('user'); // Clear stored user data
      dispatch({ type: 'LOGOUT' });
      
      // Aggressive form clearing on logout
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
        inputs.forEach(input => {
          input.value = '';
          input.setAttribute('value', '');
          input.removeAttribute('value');
          
          // Trigger React events
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        });
        
        // Clear any form storage
        try {
          localStorage.removeItem('loginEmail');
          localStorage.removeItem('loginPassword');
          sessionStorage.removeItem('loginEmail');
          sessionStorage.removeItem('loginPassword');
        } catch (e) {
          // Ignore
        }
      }, 10);
      
      toast.success('Logged out successfully');
    }
  };

  const socialLogin = async (socialData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Store user and token data from social login
      const userData = socialData.user;
      const token = socialData.token || socialData.accessToken;
      const refreshToken = socialData.refreshToken;
      
      if (userData) {
        dispatch({ type: 'SET_USER', payload: userData });
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.message || 'Social login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'SET_USER', payload: { ...state.user, ...userData } });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Helper functions
  const getMobileDetection = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const getBrowserName = (userAgent) => {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  };

  const value = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    register,
    login,
    socialLogin,
    logout,
    updateUser,
    clearError,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};