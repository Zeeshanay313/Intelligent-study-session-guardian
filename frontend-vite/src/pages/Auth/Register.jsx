import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Lock, User, AlertCircle, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react'
import Button from '../../components/UI/Button'
import Input from '../../components/UI/Input'
import SocialLoginSection from '../../components/Auth/SocialLoginSection'

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle OAuth callback errors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorType = urlParams.get('error')
    const errorMessage = urlParams.get('message')

    if (errorType && errorMessage) {
      setError(decodeURIComponent(errorMessage))
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Pre-fill email if coming from login
    if (location.state?.email) {
      setFormData((prev) => ({ ...prev, email: location.state.email }))
    }
  }, [location])

  // Clear sensitive data on unmount
  useEffect(() => {
    return () => {
      setFormData({ name: '', email: '', password: '', confirmPassword: '' })
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Validate name field - only allow letters and spaces
    if (name === 'name') {
      const nameRegex = /^[a-zA-Z\s]*$/
      if (!nameRegex.test(value)) {
        setError('Name can only contain letters and spaces')
        return
      }
    }
    
    setFormData({
      ...formData,
      [name]: value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate name - only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/
    if (!nameRegex.test(formData.name.trim())) {
      setError('Name can only contain letters and spaces (no numbers or special characters)')
      return
    }

    // Validate name is not empty after trimming
    if (formData.name.trim().length === 0) {
      setError('Name is required')
      return
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength (must match backend requirements)
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Check for password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+\[\]{}|;:'",.<>~`])[A-Za-z\d@$!%*?&#^()\-_=+\[\]{}|;:'",.<>~`]+$/
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
      return
    }

    setLoading(true)

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
      
      if (result.success) {
        // Redirect to login with success message and pre-filled email
        navigate('/login', { 
          state: { 
            email: result.email,
            successMessage: result.message || 'Account created successfully! Please login.' 
          } 
        })
      } else {
        setError(result.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  const perks = [
    'Unlimited focus sessions & timer presets',
    'Goal tracking with real-time progress',
    'Distraction blocker & analytics',
    'Badges, streaks, and gamified rewards',
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] flex transition-colors overflow-hidden">
      {/* Left — Branding Panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-accent-600 via-primary-600 to-primary-700 items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-40" />
        <div className="relative max-w-md text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Start Your Learning Journey</h2>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            Join thousands of students achieving their goals with smarter study habits.
          </p>
          <div className="space-y-3 text-left">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-accent-300 flex-shrink-0" />
                <span className="text-white/90 text-sm">{perk}</span>
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
              Create your account
            </h1>
            <p className="text-[15px] text-gray-500 dark:text-gray-400">
              Free forever for personal use — no credit card needed
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700/40 p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="name"
                name="name"
                type="text"
                label="Full Name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                leftIcon={<User className="w-[18px] h-[18px]" />}
                required
                autoComplete="name"
                hint="Only letters and spaces"
              />

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
                autoComplete="new-password"
                hint="Min 8 chars: upper, lower, number & special"
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                leftIcon={<Lock className="w-[18px] h-[18px]" />}
                required
                autoComplete="new-password"
              />

              <div className="flex items-start pt-1">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-0.5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 bg-transparent"
                />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                    Privacy Policy
                  </a>
                </span>
              </div>

              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
                className="rounded-xl h-11 mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {/* Google OAuth Section */}
            <div className="mt-6">
              <SocialLoginSection mode="signup" />
            </div>
          </div>

          {/* Sign in link */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
