import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ClockIcon,
  TrophyIcon,
  BellIcon,
  ChartBarIcon,
  FireIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  FireIcon as FireIconSolid,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';

const LandingPage = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data - replace with real data from your API
  const stats = {
    todayFocusTime: 125, // minutes
    weeklyGoalProgress: 68, // percentage
    activeGoals: 5,
    completedToday: 3,
    currentStreak: 7,
    totalStudyHours: 84
  };

  const quickActions = [
    {
      title: 'Start Focus Session',
      description: 'Begin a Pomodoro timer',
      icon: ClockIcon,
      iconBg: 'from-neon-blue to-neon-cyan',
      link: '/dashboard/timer',
      color: 'neon-blue'
    },
    {
      title: 'View Goals',
      description: 'Track your progress',
      icon: TrophyIcon,
      iconBg: 'from-neon-purple to-neon-pink',
      link: '/dashboard/goals',
      color: 'neon-purple'
    },
    {
      title: 'Check Reminders',
      description: 'Upcoming deadlines',
      icon: BellIcon,
      iconBg: 'from-neon-green to-emerald-400',
      link: '/dashboard/reminders',
      color: 'neon-green'
    },
    {
      title: 'View Analytics',
      description: 'Study insights',
      icon: ChartBarIcon,
      iconBg: 'from-neon-orange to-yellow-400',
      link: '/dashboard/main',
      color: 'neon-orange'
    }
  ];

  const recentActivity = [
    { type: 'focus', title: 'Completed 25-min focus session', time: '2 hours ago', icon: CheckCircleIcon },
    { type: 'goal', title: 'Updated "Complete React Course"', time: '5 hours ago', icon: TrophyIcon },
    { type: 'reminder', title: 'Assignment deadline reminder set', time: '1 day ago', icon: BellIcon }
  ];

  const upcomingReminders = [
    { title: 'Math Assignment Due', date: 'Tomorrow, 11:59 PM', priority: 'high' },
    { title: 'Study Group Meeting', date: 'Oct 28, 3:00 PM', priority: 'medium' },
    { title: 'Quiz Preparation', date: 'Oct 30, 9:00 AM', priority: 'medium' }
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/5 rounded-full filter blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full filter blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-pink/5 rounded-full filter blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {getGreeting()}, <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Student'}</span>
              </h1>
              <p className="text-secondary-400 text-lg">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {stats.currentStreak > 0 && (
                <div className="flex items-center px-4 py-2 bg-secondary-800/50 border border-secondary-700 rounded-lg">
                  <FireIconSolid className="w-6 h-6 text-neon-orange mr-2" />
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
                    <div className="text-xs text-secondary-400">Day Streak</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Today's Focus Time */}
            <div className="bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-4 hover:border-neon-blue/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <ClockIcon className="w-8 h-8 text-neon-blue" />
                <BoltIcon className="w-5 h-5 text-neon-cyan" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stats.todayFocusTime}m</div>
              <div className="text-sm text-secondary-400">Today's Focus</div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-4 hover:border-neon-purple/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <ChartBarIcon className="w-8 h-8 text-neon-purple" />
                <SparklesIcon className="w-5 h-5 text-neon-pink" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stats.weeklyGoalProgress}%</div>
              <div className="text-sm text-secondary-400">Weekly Goal</div>
            </div>

            {/* Active Goals */}
            <div className="bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-4 hover:border-neon-green/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <TrophyIcon className="w-8 h-8 text-neon-green" />
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stats.activeGoals}</div>
              <div className="text-sm text-secondary-400">Active Goals</div>
            </div>

            {/* Total Hours */}
            <div className="bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-4 hover:border-neon-orange/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <AcademicCapIcon className="w-8 h-8 text-neon-orange" />
                <FireIconSolid className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stats.totalStudyHours}h</div>
              <div className="text-sm text-secondary-400">Total Study</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="group relative bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-6 hover:border-secondary-700 hover:scale-105 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${action.iconBg} rounded-lg mb-4 shadow-lg transition-shadow`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                <p className="text-sm text-secondary-400 mb-3">{action.description}</p>
                <div className="flex items-center text-sm text-neon-cyan group-hover:text-neon-blue transition-colors">
                  <span>Start now</span>
                  <ArrowRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
              <Link to="/dashboard/main" className="text-sm text-neon-cyan hover:text-neon-blue transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-secondary-800/30 rounded-lg hover:bg-secondary-800/50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-secondary-700 rounded-lg flex items-center justify-center">
                      <activity.icon className="w-5 h-5 text-neon-cyan" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-secondary-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="bg-secondary-900/50 backdrop-blur-sm border border-secondary-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upcoming</h2>
              <Link to="/dashboard/reminders" className="text-sm text-neon-cyan hover:text-neon-blue transition-colors">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingReminders.map((reminder, index) => (
                <div key={index} className="p-4 bg-secondary-800/30 border-l-4 border-neon-orange rounded-lg hover:bg-secondary-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">{reminder.title}</h3>
                      <p className="text-xs text-secondary-400 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {reminder.date}
                      </p>
                    </div>
                    {reminder.priority === 'high' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
                        High
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="mt-8 relative bg-gradient-to-r from-neon-blue/10 via-neon-purple/10 to-neon-pink/10 border border-secondary-800 rounded-xl p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 rounded-full filter blur-3xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Keep Up the Great Work!</h3>
              <p className="text-secondary-300 mb-4">
                You've completed {stats.completedToday} tasks today. You're on fire! 🔥
              </p>
              <Link
                to="/dashboard/goals"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-cyan text-white font-semibold rounded-lg shadow-lg shadow-neon-blue/30 hover:shadow-neon-blue/50 hover:scale-105 transition-all duration-200"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Set New Goals
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="w-32 h-32 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center shadow-2xl shadow-neon-blue/20">
                <TrophyIcon className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
