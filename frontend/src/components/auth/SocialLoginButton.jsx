import React, { useState } from 'react';
import socialAuthService from '../../services/socialAuthService';
import toast from 'react-hot-toast';

const SocialLoginButton = ({ provider, onSuccess, onError, children, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (provider !== 'google') {
      toast.error('Only Google login is currently supported');
      return;
    }

    setLoading(true);
    
    try {
      // For Google OAuth, we redirect to backend
      await socialAuthService.loginWithGoogle();
      // Note: loginWithGoogle() redirects to backend, so this won't execute
      
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      
      if (onError) {
        onError(error);
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const providers = socialAuthService.getProviders();
  const providerConfig = providers[provider];

  // Debug logging
  console.log('SocialLoginButton render:', { provider, providers, providerConfig });

  if (!providerConfig) {
    console.error(`Unknown provider: ${provider}`);
    return (
      <div className="text-red-500 text-sm p-2 border border-red-300 rounded">
        Error: Unknown provider "{provider}"
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={loading}
      className={`
        relative w-full flex justify-center items-center px-3 py-2.5 border border-transparent rounded-lg text-sm font-medium
        transition-all duration-200 ease-in-out
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        ${providerConfig.color}
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Connecting...
        </div>
      ) : (
        <div className="flex items-center">
          {provider === 'google' && (
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {children || `Continue with ${providerConfig.name}`}
        </div>
      )}
    </button>
  );
};

export default SocialLoginButton;