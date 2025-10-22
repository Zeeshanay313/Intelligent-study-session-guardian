import React from 'react';
import SocialLoginButton from './SocialLoginButton';
import { useAuth } from '../../contexts/AuthContext';

const SocialLoginSection = ({ className = '' }) => {
  const { socialLogin } = useAuth();

  const handleSocialSuccess = async (provider, result) => {
    try {
      // Store the social login result
      if (result.user && result.token) {
        localStorage.setItem('token', result.token);
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }
        
        // Update auth context
        if (socialLogin) {
          await socialLogin(result);
        }
      }
    } catch (error) {
      console.error('Social login processing error:', error);
    }
  };

  const handleSocialError = (error) => {
    console.error('Social login error:', error);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-secondary-300 dark:border-secondary-600" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 font-medium">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-2">
        <SocialLoginButton
          provider="google"
          onSuccess={(result) => handleSocialSuccess('google', result)}
          onError={handleSocialError}
        />
        
        <SocialLoginButton
          provider="github"
          onSuccess={(result) => handleSocialSuccess('github', result)}
          onError={handleSocialError}
        />
        
        <div className="grid grid-cols-2 gap-2">
          <SocialLoginButton
            provider="facebook"
            onSuccess={(result) => handleSocialSuccess('facebook', result)}
            onError={handleSocialError}
            className="text-xs py-2"
          >
            <span className="hidden sm:inline">Continue with </span>Facebook
          </SocialLoginButton>
          
          <SocialLoginButton
            provider="twitter"
            onSuccess={(result) => handleSocialSuccess('twitter', result)}
            onError={handleSocialError}
            className="text-xs py-2"
          >
            <span className="hidden sm:inline">Continue with </span>Twitter
          </SocialLoginButton>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="text-xs text-center text-secondary-500 dark:text-secondary-400 px-4">
        By continuing, you agree to our{' '}
        <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
};

export default SocialLoginSection;