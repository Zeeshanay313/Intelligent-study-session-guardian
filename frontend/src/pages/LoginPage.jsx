import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SocialLoginSection from '../components/auth/SocialLoginSection';
import toast from 'react-hot-toast';
import FormClearingService from '../services/formClearingService';

const LoginPage = () => {
  const { login, error, loading, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [formKey, setFormKey] = useState(Math.random()); // Force form re-render
  const location = useLocation();
  const navigate = useNavigate();
  
  // Listen for user state changes (login/logout)
  useEffect(() => {
    if (!user) {
      // User logged out or page refreshed - clear form
      clearForm();
    }
  }, [user]);

  // Controlled inputs - no react-hook-form
  const [formErrors, setFormErrors] = useState({});

  // Aggressive form clearing function
  const clearForm = () => {
    setEmailValue('');
    setPasswordValue('');
    setFormErrors({});
    setFormKey(Math.random()); // Force complete re-render
    
    // Clear any stored form data
    try {
      localStorage.removeItem('loginEmail');
      localStorage.removeItem('loginPassword');
      sessionStorage.removeItem('loginEmail');
      sessionStorage.removeItem('loginPassword');
      
      // Clear any potential browser form data
      const formData = new FormData();
      formData.delete('email');
      formData.delete('password');
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Smart clearing on mount - clear only when needed
  useEffect(() => {
    // Immediate clearing on page load
    clearForm();
    FormClearingService.clearAllForms();
    
    // Only pre-fill email if coming from registration
    setTimeout(() => {
      if (location.state?.email) {
        setEmailValue(location.state.email);
      }
    }, 100);
    
    // Show success message if provided
    if (location.state?.message) {
      toast.success(location.state.message);
    }

    // Handle OAuth error messages from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorType = urlParams.get('error');
    const errorMessage = urlParams.get('message');
    const userEmail = urlParams.get('email');

    if (errorType && errorMessage) {
      if (errorType === 'account_exists') {
        toast.error(`Account already exists${userEmail ? ` for ${userEmail}` : ''}. Please sign in instead.`);
        if (userEmail) {
          setEmailValue(userEmail);
        }
      } else if (errorType === 'oauth_failed') {
        toast.error(decodeURIComponent(errorMessage));
      } else {
        toast.error(decodeURIComponent(errorMessage));
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.pathname, location.key]); // Clear on navigation only

  // Smart clearing only on specific events
  useEffect(() => {
    const handlePageShow = () => {
      // Only clear if no email should be preserved
      if (!location.state?.email) {
        setTimeout(() => {
          FormClearingService.clearIfAutofilled();
        }, 100);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [location.state?.email]);

  // Smart clearing only when fields should be empty
  useEffect(() => {
    // Only clear if we navigated to login page and no email should be preserved
    if (!location.state?.email && emailValue === '' && passwordValue === '') {
      // Single clearing attempt on mount
      setTimeout(() => {
        FormClearingService.clearAllForms();
      }, 50);
    }
  }, [location.pathname]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!emailValue) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+$/i.test(emailValue)) {
      errors.email = 'Invalid email address';
    }
    
    if (!passwordValue) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await login({ email: emailValue, password: passwordValue });
    
    // Handle redirect to register if account not found
    if (result && !result.success && result.redirectToRegister) {
      toast.success('Redirecting to sign up page...');
      setTimeout(() => {
        navigate('/register', { 
          state: { 
            email: emailValue,
            message: 'Please create an account first'
          }
        });
      }, 1500);
    }
    
    // Clear password after login attempt
    setPasswordValue('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold font-display bg-gradient-to-r from-secondary-900 to-secondary-700 dark:from-secondary-100 dark:to-secondary-300 bg-clip-text text-transparent">
            Welcome 
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400 font-medium">
            Sign in to access your Study Guardian account
          </p>
        </div>

        <form 
          key={formKey} 
          className="mt-4 space-y-4" 
          onSubmit={onSubmit}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          noValidate
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
        >
          {/* Honeypot fields to confuse autofill */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
            <input type="text" name="fakeusernameremembered" autoComplete="username" tabIndex="-1" />
            <input type="password" name="fakepasswordremembered" autoComplete="current-password" tabIndex="-1" />
          </div>
          
          <div className="space-y-3">
            <Input
              id={`email-${formKey}`}
              name={`email-${formKey}`}
              type="email"
              label="Email address"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-has-state-value={emailValue ? 'true' : 'false'}
              required
              error={formErrors.email}
            />

            <div className="relative">
              <Input
                id={`password-${formKey}`}
                name={`password-${formKey}`}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
                data-has-state-value={passwordValue ? 'true' : 'false'}
                required
                error={formErrors.password}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <svg className="h-5 w-5 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-800 dark:text-danger-200">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Sign in
            </Button>
          </div>

          <div className="text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Social Login Section */}
        <SocialLoginSection mode="signin" />

        <div className="text-center">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;