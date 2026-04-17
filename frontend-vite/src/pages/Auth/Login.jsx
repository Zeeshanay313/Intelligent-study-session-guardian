import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react'
import Button from '../../components/UI/Button'
import Input from '../../components/UI/Input'
import SocialLoginSection from '../../components/Auth/SocialLoginSection'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle OAuth callback errors and pre-fill email from registration
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorType = urlParams.get('error')
    const errorMessage = urlParams.get('message')
    const userEmail = urlParams.get('email')

    if (errorType && errorMessage) {
      if (errorType === 'account_exists') {
        setError(
          `Account already exists${userEmail ? ` for ${userEmail}` : ''}. Please sign in instead.`
        )
        if (userEmail) {
          setFormData((prev) => ({ ...prev, email: userEmail }))
        }
      } else if (errorType === 'oauth_failed') {
        setError(decodeURIComponent(errorMessage))
      } else {
        setError(decodeURIComponent(errorMessage))
      }
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Handle success message from registration
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage)
      // Auto-dismiss after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    }

    // Pre-fill email if coming from registration
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }))
    }
  }, [location])

  // Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setFormData({ email: '', password: '' })
    }
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.message || 'Login failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex transition-colors overflow-hidden">
      {/* Left — Branding Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-md text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Welcome Back to StudyGuardian</h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Pick up where you left off. Your goals, sessions, and streaks are waiting for you.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { value: '2.4h', label: 'Avg Daily Focus' },
              { value: '89%', label: 'Goal Completion' },
              { value: '12', label: 'Day Streak' },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="max-w-[420px] w-full">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="lg:hidden w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mb-5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1.5 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400">
              Enter your credentials to continue learning
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700/40 p-6 sm:p-8">
            {successMessage && (
              <div className="mb-5 p-3.5 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/40 rounded-xl flex items-start space-x-3">
                <svg className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-accent-700 dark:text-accent-300">{successMessage}</p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-[18px] h-[18px]" />}
                required
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock className="w-[18px] h-[18px]" />}
                required
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-transparent"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
                className="rounded-xl h-11"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Google OAuth Section */}
            <div className="mt-6">
              <SocialLoginSection mode="signin" />
            </div>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
