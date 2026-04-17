import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Clock,
  Target,
  Trophy,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  Play,
  Users,
  Star,
  ChevronRight
} from 'lucide-react'
import Button from '../../components/UI/Button'

const Landing = () => {
  const { theme, toggleTheme } = useTheme()

  const features = [
    {
      icon: Clock,
      title: 'Focus Sessions',
      description: 'Pomodoro-style focus timer with customizable work and break intervals.',
      color: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set and track your learning goals with milestones and progress visualization.',
      color: 'from-accent-500 to-accent-600',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
    },
    {
      icon: Trophy,
      title: 'Rewards System',
      description: 'Earn badges, points, and achievements as you complete study sessions.',
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: Zap,
      title: 'Smart Breaks',
      description: 'AI-powered break scheduler that adapts to your unique study patterns.',
      color: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      icon: Shield,
      title: 'Distraction Blocker',
      description: 'Block distracting apps and websites during your focus sessions.',
      color: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Detailed insights into your study habits and productivity trends.',
      color: 'from-cyan-500 to-blue-600',
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    }
  ]

  const benefits = [
    'Increase focus and productivity by up to 40%',
    'Track your study progress with visual dashboards',
    'Stay motivated with gamification and rewards',
    'Manage resources and study materials in one place',
    'Get personalized study recommendations',
    'Export your data anytime'
  ]

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '2M+', label: 'Sessions Completed' },
    { value: '95%', label: 'Satisfaction Rate' },
    { value: '40%', label: 'Productivity Boost' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1120] transition-colors overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
          <div className="max-w-7xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/40 shadow-soft px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
                  StudyGuardian
                </span>
              </div>

              {/* Nav items */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
                </button>
                
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-[13px] font-medium">
                    Sign In
                  </Button>
                </Link>
                
                <Link to="/register">
                  <Button variant="primary" size="sm" className="text-[13px] rounded-xl shadow-md shadow-primary-500/20">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-400/10 dark:bg-primary-400/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-400/10 dark:bg-accent-400/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-primary-100/20 dark:from-primary-900/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700/40 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Trusted by 10,000+ students worldwide
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
              Study Smarter,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500">
                Not Harder
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              The all-in-one study companion with focus tracking, smart goals, 
              distraction blocking, and gamified rewards to keep you motivated.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 rounded-xl shadow-lg shadow-primary-500/25 text-[15px]">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 rounded-xl text-[15px]">
                  <Play className="mr-2 w-4 h-4" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual — Floating Cards */}
          <div className="mt-20 relative max-w-4xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/80 dark:border-gray-700/40 shadow-2xl p-2">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-8">
                {/* Mock dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { label: 'Focus Time', value: '2h 45m', icon: Clock, accent: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                    { label: 'Goals Done', value: '12/15', icon: Target, accent: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-900/20' },
                    { label: 'Streak', value: '7 days', icon: Trophy, accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { label: 'Sessions', value: '3 today', icon: Zap, accent: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} rounded-xl p-3 sm:p-4`}>
                      <stat.icon className={`w-5 h-5 ${stat.accent} mb-2`} />
                      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
                {/* Mock progress bars */}
                <div className="space-y-3">
                  {[
                    { label: 'React Fundamentals', progress: 78, color: 'bg-primary-500' },
                    { label: 'Data Structures', progress: 45, color: 'bg-accent-500' },
                    { label: 'System Design', progress: 92, color: 'bg-amber-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 truncate">{item.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-10 text-right">{item.progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Glow overlay */}
            <div className="absolute -inset-4 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#0B1120] pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-3">Features</p>
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Powerful tools designed to enhance every aspect of your learning experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="group bg-white dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700/40 hover:border-primary-200 dark:hover:border-primary-700/40 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span>Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/80 dark:bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide mb-3">Why StudyGuardian?</p>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                Transform Your Learning Habits
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
                Join thousands of students and professionals who have transformed 
                their study habits and achieved their learning goals faster.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                    </div>
                    <span className="text-[15px] text-gray-700 dark:text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              {/* Background glow */}
              <div className="absolute -inset-8 bg-gradient-to-br from-primary-200/30 to-accent-200/30 dark:from-primary-800/20 dark:to-accent-800/20 rounded-3xl blur-2xl" />
              <div className="relative space-y-4">
                {/* Card 1 — Goal progress */}
                <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-700/40">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">Complete React Course</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">12 of 18 chapters done</p>
                    </div>
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">65%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                {/* Card 2 — Focus time */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-700/40">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Today's Focus</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">2h 45m</p>
                    <p className="text-xs text-accent-600 dark:text-accent-400 font-medium mt-1">+32% vs yesterday</p>
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-800/60 rounded-2xl p-5 shadow-card border border-gray-100 dark:border-gray-700/40">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Streak</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">7 days</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">Personal best!</p>
                  </div>
                </div>

                {/* Card 3 — Achievement */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-700/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/40 rounded-xl flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Focus Master Badge Earned!</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Completed 50 focus sessions</p>
                    </div>
                    <Star className="w-5 h-5 text-amber-500 ml-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')] opacity-50" />
            
            <div className="relative py-16 sm:py-20 px-8 sm:px-12 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to Transform Your Learning?
              </h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Start your journey to better focus and productivity today. Free forever for personal use.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/register">
                  <button className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold text-[15px] hover:bg-gray-50 transition-colors shadow-lg">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="inline-flex items-center justify-center px-8 py-3 bg-white/10 text-white rounded-xl font-semibold text-[15px] hover:bg-white/20 transition-colors border border-white/20">
                    Sign In
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center space-x-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">StudyGuardian</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Intelligent study session management for productive learners.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Product</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Company</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-4">Legal</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} StudyGuardian. All rights reserved.</p>
            <div className="flex items-center space-x-1">
              <span>Built with</span>
              <span className="text-red-500">&#9829;</span>
              <span>for learners</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
