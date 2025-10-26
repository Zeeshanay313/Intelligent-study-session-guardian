import React from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ClockIcon,
  BellIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  SparklesIcon,
  RocketLaunchIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
  const features = [
    {
      icon: ClockIcon,
      title: 'Smart Focus Timer',
      description: 'Pomodoro technique with adaptive break intervals and session analytics',
      gradient: 'from-neon-blue to-neon-cyan'
    },
    {
      icon: BellIcon,
      title: 'Intelligent Reminders',
      description: 'Never miss a deadline with smart notifications and recurring schedules',
      gradient: 'from-neon-green to-emerald-400'
    },
    {
      icon: ChartBarIcon,
      title: 'Goal Tracking',
      description: 'Set milestones, track progress, and achieve your learning objectives',
      gradient: 'from-neon-purple to-neon-pink'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Privacy First',
      description: 'Your data is encrypted and you control whats shared',
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      icon: AcademicCapIcon,
      title: 'Study Analytics',
      description: 'Detailed insights into your study patterns and productivity',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations to optimize your learning',
      gradient: 'from-yellow-400 to-orange-500'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Students', icon: AcademicCapIcon },
    { value: '50M+', label: 'Study Hours', icon: ClockIcon },
    { value: '95%', label: 'Goal Success', icon: CheckCircleIcon },
    { value: '4.9/5', label: 'User Rating', icon: SparklesIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-950 via-secondary-900 to-secondary-950">
      {/* Animated background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full filter blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full filter blur-3xl animate-pulse-glow animation-delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-neon-pink/10 rounded-full filter blur-3xl animate-pulse-glow animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-secondary-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
                StudyGuardian
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-cyan text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-neon-blue/50 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-800/50 border border-neon-blue/20 backdrop-blur-sm mb-8">
            <SparklesIcon className="w-4 h-4 text-neon-blue mr-2" />
            <span className="text-sm text-gray-300">AI-Powered Study Companion</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Master Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent animate-gradient">
              Study Sessions
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Transform your learning with intelligent timers, smart reminders, and goal tracking. 
            <span className="text-neon-cyan"> Achieve more, stress less.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:shadow-neon-blue/50 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center">
                Start Free Trial
                <RocketLaunchIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-secondary-800/50 border border-secondary-700 text-white text-lg font-semibold rounded-xl hover:bg-secondary-800 hover:border-neon-purple/50 transition-all duration-300 backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Hero Image/Demo */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-secondary-800 shadow-2xl bg-gradient-to-br from-secondary-900 to-secondary-950">
              {/* Mock Dashboard Preview */}
              <div className="aspect-video bg-secondary-900 p-8">
                <div className="grid grid-cols-3 gap-4 h-full">
                  {/* Timer Mock */}
                  <div className="col-span-2 bg-secondary-800/50 rounded-xl p-6 border border-secondary-700 flex flex-col items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-4 border-neon-blue/30 flex items-center justify-center mb-4">
                      <span className="text-5xl font-bold text-neon-blue">25:00</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan" />
                      <div className="w-12 h-12 rounded-full bg-secondary-700" />
                    </div>
                  </div>
                  {/* Stats Mock */}
                  <div className="space-y-4">
                    <div className="bg-secondary-800/50 rounded-lg p-4 border border-secondary-700">
                      <div className="h-2 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full w-3/4 mb-2" />
                      <div className="h-3 bg-secondary-700 rounded w-1/2" />
                    </div>
                    <div className="bg-secondary-800/50 rounded-lg p-4 border border-secondary-700">
                      <div className="h-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full w-2/3 mb-2" />
                      <div className="h-3 bg-secondary-700 rounded w-2/3" />
                    </div>
                    <div className="bg-secondary-800/50 rounded-lg p-4 border border-secondary-700">
                      <div className="h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full w-4/5 mb-2" />
                      <div className="h-3 bg-secondary-700 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-2xl opacity-20 blur-xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 border-y border-secondary-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary-800/50 border border-secondary-700 mb-3">
                  <stat.icon className="w-6 h-6 text-neon-cyan" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to
              <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent"> Succeed</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful tools designed to enhance your study experience and boost productivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-secondary-900/50 backdrop-blur-sm rounded-2xl p-8 border border-secondary-800 hover:border-secondary-700 transition-all duration-300 hover:transform hover:scale-105"
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative bg-gradient-to-br from-secondary-900 to-secondary-950 rounded-3xl p-12 border border-secondary-800 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neon-blue via-transparent to-neon-purple" />
            </div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform Your
                <span className="bg-gradient-to-r from-neon-blue to-neon-cyan bg-clip-text text-transparent"> Study Habits?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are achieving their academic goals with StudyGuardian
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:shadow-neon-blue/50 transition-all duration-300 hover:scale-105"
              >
                Get Started Free
                <RocketLaunchIcon className="w-5 h-5 ml-2" />
              </Link>
              <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-20 blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-secondary-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">StudyGuardian</span>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/login" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/login" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            © 2025 StudyGuardian. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
