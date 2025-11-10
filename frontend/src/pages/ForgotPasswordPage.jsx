import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetLink, setResetLink] = useState(''); // For development
  const [showRegistrationMessage, setShowRegistrationMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();
  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors }, watch: watchReset } = useForm();
  const watchPassword = watchReset('password');

  // Verify token when reset form is shown
  useEffect(() => {
    const verifyToken = async () => {
      if (!showResetForm || !resetToken) return;

      try {
        console.log('Verifying reset token:', resetToken);
        const response = await authAPI.verifyResetToken(resetToken);
        
        if (response.data.success) {
          setTokenValid(true);
          console.log('Token is valid for email:', response.data.email);
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        toast.error(error.response?.data?.error || 'Invalid or expired reset token');
      }
    };

    verifyToken();
  }, [showResetForm, resetToken]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setShowRegistrationMessage(false); // Reset previous messages
    
    try {
      console.log('Requesting password reset for:', data.email);
      const response = await authAPI.forgotPassword(data.email);
      
      if (response.data.success) {
        setEmailSent(true);
        toast.success(response.data.message);
        
        // In development, show the reset link
        if (response.data.resetUrl) {
          setResetLink(response.data.resetUrl);
          console.log('Development reset link:', response.data.resetUrl);
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle unregistered email case
      if (error.response?.status === 404 && error.response?.data?.needsRegistration) {
        setShowRegistrationMessage(true);
        setSubmittedEmail(data.email);
        // Don't show toast for unregistered email - we have a visual message instead
      } else {
        const errorMessage = error.response?.data?.error || 'Failed to send reset email';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setResetLink('');
    setShowRegistrationMessage(false);
    setSubmittedEmail('');
    setShowResetForm(false);
    setResetToken('');
  };

  const handleResetLinkClick = (event) => {
    event.preventDefault();
    if (resetLink) {
      // Extract token from the reset link
      const url = new URL(resetLink);
      const token = url.searchParams.get('token');
      if (token) {
        setResetToken(token);
        setShowResetForm(true);
        setEmailSent(false);
      }
    }
  };

  const onResetSubmit = async (data) => {
    setResetLoading(true);
    
    try {
      console.log('Resetting password with token:', resetToken);
      
      const response = await authAPI.resetPassword(resetToken, data.password);
      
      if (response.data.success) {
        toast.success('Password reset successful!');
        
        // Redirect to login page with email pre-filled and success message
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              email: getValues('email'),
              message: 'Password reset successful! Please log in with your new password.'
            }
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      toast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  // Show reset password form if token is available and valid
  if (showResetForm) {
    if (tokenValid === false) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
                The password reset link is invalid or has expired
              </p>
            </div>
            <div className="bg-white dark:bg-secondary-800 py-8 px-6 shadow-xl rounded-lg">
              <Button onClick={handleTryAgain} className="w-full">
                Request New Reset Link
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (tokenValid === true) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0h.01" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
                Reset Your Password
              </h2>
              <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
                Enter your new password below
              </p>
            </div>

            <div className="bg-white dark:bg-secondary-800 py-8 px-6 shadow-xl rounded-lg">
              <form className="space-y-6" onSubmit={handleSubmitReset(onResetSubmit)}>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      {...registerReset('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Password must contain uppercase, lowercase, number and special character'
                        }
                      })}
                      error={resetErrors.password?.message}
                      placeholder="Enter your new password"
                      endAdornment={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      }
                    />
                  </div>

                  <div>
                    <Input
                      label="Confirm New Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      {...registerReset('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value =>
                          value === watchPassword || 'Passwords do not match'
                      })}
                      error={resetErrors.confirmPassword?.message}
                      placeholder="Confirm your new password"
                      endAdornment={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {showConfirmPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      }
                    />
                  </div>
                </div>

                <div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting password...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                  >
                    Back to forgot password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    // Loading state while verifying token
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
              Verifying Reset Token
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              Please wait while we verify your reset token...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
              We've sent a password reset link to <strong>{getValues('email')}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-secondary-800 py-8 px-6 shadow-xl rounded-lg space-y-6">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  What's next?
                </h3>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Check your email inbox (and spam folder)</li>
                  <li>• Click the reset link in the email</li>
                  <li>• Create your new password</li>
                  <li>• The link expires in 15 minutes</li>
                </ul>
              </div>

              {/* Development mode - show reset link */}
              {resetLink && process.env.NODE_ENV === 'development' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Development Mode
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    <button 
                      onClick={handleResetLinkClick}
                      className="underline hover:no-underline text-yellow-700 dark:text-yellow-300 hover:text-yellow-600 dark:hover:text-yellow-200"
                    >
                      Click here to reset password
                    </button>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full"
                >
                  Try another email
                </Button>
                
                <Link
                  to="/login"
                  className="block w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2m0 0V7a2 2 0 012-2m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m6 0h.01" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-900 dark:text-secondary-100">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-secondary-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="bg-white dark:bg-secondary-800 py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                required
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </div>

            <div className="text-center space-y-2">
              <Link
                to="/login"
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
              >
                Remember your password? Sign in
              </Link>
              <div className="text-sm text-secondary-500 dark:text-secondary-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Registration message for unregistered emails */}
        {showRegistrationMessage && (
          <div className="mt-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Account not found
                </h3>
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                  <p>The email <strong>{submittedEmail}</strong> is not registered with us.</p>
                  <div className="mt-3">
                    <Link
                      to="/register"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 dark:text-orange-200 dark:bg-orange-800 dark:hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
                    >
                      Create account now
                      <svg className="ml-2 -mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;