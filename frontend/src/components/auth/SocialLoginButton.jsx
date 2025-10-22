import React, { useState } from 'react';
import socialAuthService from '../../services/socialAuthService';
import toast from 'react-hot-toast';

const SocialLoginButton = ({ provider, onSuccess, onError, children, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
      let result;
      
      switch (provider) {
        case 'google':
          result = await socialAuthService.loginWithGoogle();
          break;
        case 'github':
          result = await socialAuthService.loginWithGithub();
          break;
        case 'facebook':
          result = await socialAuthService.loginWithFacebook();
          break;
        case 'twitter':
          result = await socialAuthService.loginWithTwitter();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      if (onSuccess) {
        onSuccess(result);
      }
      
      toast.success(`Successfully signed in with ${provider}!`);
      
    } catch (error) {
      console.error(`${provider} login error:`, error);
      const errorMessage = error.message || `Failed to sign in with ${provider}`;
      
      if (onError) {
        onError(error);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const providers = socialAuthService.getProviders();
  const providerConfig = providers[provider];

  if (!providerConfig) {
    console.error(`Unknown provider: ${provider}`);
    return null;
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
          <span className="mr-2">
            {providerConfig.icon}
          </span>
          {children || `Continue with ${providerConfig.name}`}
        </div>
      )}
    </button>
  );
};

export default SocialLoginButton;