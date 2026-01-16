/**
 * Social Authentication Service
 * Handles Google OAuth authentication using backend routes
 */

class SocialAuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004'
  }

  /**
   * Get supported providers
   * @returns {Object} Provider configurations
   */
  getProviders() {
    return {
      google: {
        name: 'Google',
        color:
          'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
        iconComponent: 'GoogleIcon', // We'll handle the icon in the component
      },
    }
  }

  /**
   * Initiate Google OAuth login
   * Redirects to backend OAuth route
   */
  async loginWithGoogle(mode = 'signin') {
    try {
      console.log('=== GOOGLE OAUTH LOGIN INITIATED ===')
      console.log('Mode:', mode)
      console.log('Base URL:', this.baseURL)
      
      // Redirect to backend OAuth route
      const googleAuthURL =
        mode === 'signup'
          ? `${this.baseURL}/api/auth/google/signup`
          : `${this.baseURL}/api/auth/google/signin`

      console.log('Redirecting to:', googleAuthURL)
      
      // Direct redirect to backend OAuth endpoint
      window.location.href = googleAuthURL

      // This function won't return since we're redirecting
      // The backend will handle the OAuth flow and redirect back to dashboard
    } catch (error) {
      console.error('Google OAuth initiation error:', error)
      throw new Error('Failed to initiate Google login. Please try again.')
    }
  }

  /**
   * Handle OAuth callback (if needed for frontend processing)
   * This is mainly for error handling since success goes to dashboard
   */
  handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const success = urlParams.get('oauth')

    if (error) {
      console.error('OAuth error:', error)
      let errorMessage = 'Authentication failed. Please try again.'

      switch (error) {
        case 'oauth_failed':
          errorMessage = 'Google authentication failed. Please try again.'
          break
        case 'oauth_callback_failed':
          errorMessage = 'Authentication callback failed. Please try again.'
          break
        case 'account_exists':
          errorMessage =
            'Account already exists with this email. Please sign in instead.'
          break
        default:
          errorMessage = 'Authentication error. Please try again.'
      }

      throw new Error(errorMessage)
    }

    if (success === 'success') {
      return {
        success: true,
        message: 'Successfully authenticated with Google',
      }
    }

    return null
  }

  /**
   * Check if user arrived from OAuth callback
   */
  isOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('oauth') || urlParams.has('error')
  }

  /**
   * Check if a provider is supported
   * @param {string} provider - Provider name
   * @returns {boolean} Whether provider is supported
   */
  isProviderSupported(provider) {
    return provider in this.getProviders()
  }
}

// Export singleton instance
export default new SocialAuthService()
