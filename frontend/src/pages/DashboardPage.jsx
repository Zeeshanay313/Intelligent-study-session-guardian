import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import IntegratedStudySession from '../components/IntegratedStudySession';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';
import { 
  ChartBarIcon, 
  ClockIcon, 
  AcademicCapIcon,
  TrophyIcon,
  SparklesIcon,
  ArrowUpIcon,
  FireIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlayIcon,
  UserIcon,
  LockClosedIcon,
  BookOpenIcon,
  CogIcon,
  BellIcon,
  StarIcon,
  GiftIcon,
  ChartPieIcon,
  EyeIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState('P1 Mid');
  const [isLoaded, setIsLoaded] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load real-time dashboard data
  useEffect(() => {
    loadDashboardData();
    setIsLoaded(true);
    
    // Set up polling for real-time updates every 2 minutes
    const interval = setInterval(loadDashboardData, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoadingStats(true);
      
      // Load all dashboard data in parallel
      const [stats, weekly, sessions] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getWeeklyProgress(),
        dashboardService.getRecentSessions()
      ]);
      
      setDashboardStats(stats);
      setWeeklyProgress(weekly);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleStartStudySession = async (sessionData = null) => {
    try {
      // Get session data from IntegratedStudySession component or use defaults
      const sessionConfig = sessionData || {
        subject: 'General Study',
        workDuration: 25,
        breakDuration: 5,
        syncCalendar: false,
        notifications: true
      };
      
      const loadingToast = toast.loading('Starting study session...');
      
      // Start the session via API
      const response = await dashboardService.startStudySession(sessionConfig);
      
      toast.dismiss(loadingToast);
      
      if (response.sessionId) {
        toast.success('Study session started successfully!');
        
        // Refresh dashboard data
        await loadDashboardData();
        
        // Navigate to timer page with session data
        navigate('/timer', { 
          state: { 
            sessionId: response.sessionId,
            sessionConfig 
          } 
        });
      } else {
        throw new Error('Failed to start session');
      }
    } catch (error) {
      console.error('Error starting study session:', error);
      toast.error('Failed to start study session');
      
      // Fallback: navigate to timer page anyway
      navigate('/timer');
    }
  };

  const modules = [
    // P1 Mid - 3 modules
    {
      id: 1,
      title: 'Profile and Privacy Settings',
      description: 'Manage your account, privacy controls, and device access',
      icon: UserIcon,
      status: 'Active',
      phase: 'P1 Mid',
      path: '/profile',
      color: 'from-blue-500 to-purple-600',
      progress: 100,
      features: ['Account Management', 'Privacy Controls', 'Device Access', 'Security Settings']
    },
    {
      id: 2,
      title: 'Focus Timer',
      description: 'Pomodoro and study sessions with custom presets',
      icon: ClockIcon,
      status: 'Active',
      phase: 'P1 Mid',
      path: '/timer',
      color: 'from-green-500 to-teal-600',
      progress: 100,
      features: ['Pomodoro Timer', 'Custom Presets', 'Break Reminders', 'Session Analytics']
    },
    {
      id: 3,
      title: 'Reminder and Scheduling',
      description: 'Study reminders, calendar sync, and smart notifications',
      icon: CalendarIcon,
      status: 'Active',
      phase: 'P1 Mid',
      path: '/reminders',
      color: 'from-orange-500 to-red-600',
      progress: 100,
      features: ['Smart Reminders', 'Calendar Integration', 'Notifications', 'Schedule Optimization']
    },
    
    // P1 Final - 3 modules
    {
      id: 4,
      title: 'Goal Tracker',
      description: 'Set and track weekly/monthly study goals',
      icon: StarIcon,
      status: 'Active',
      phase: 'P1 Final',
      path: '/goals',
      color: 'from-pink-500 to-rose-600',
      progress: 100,
      features: ['Goal Setting', 'Progress Tracking', 'Milestones', 'Achievement Badges']
    },
    {
      id: 5,
      title: 'Motivation and Rewards',
      description: 'Earn badges, streaks, and motivational insights',
      icon: TrophyIcon,
      status: 'Coming Soon',
      phase: 'P1 Final',
      color: 'from-yellow-500 to-orange-600',
      progress: 0,
      features: ['Achievement System', 'Streak Tracking', 'Leaderboards', 'Reward Points']
    },
    {
      id: 6,
      title: 'Smart Resource Hub',
      description: 'Organize notes, links, and study materials',
      icon: BookOpenIcon,
      status: 'Coming Soon',
      phase: 'P1 Final',
      color: 'from-indigo-500 to-purple-600',
      progress: 0,
      features: ['Resource Organization', 'Smart Tagging', 'Quick Access', 'Study Materials']
    },
    
    // P2 Mid - 3 modules
    {
      id: 7,
      title: 'Activity Logger',
      description: 'Track keyboard/mouse activity and engagement',
      icon: ChartBarIcon,
      status: 'Coming Soon',
      phase: 'P2 Mid',
      color: 'from-cyan-500 to-blue-600',
      progress: 0,
      features: ['Activity Monitoring', 'Engagement Metrics', 'Usage Analytics', 'Productivity Insights']
    },
    {
      id: 8,
      title: 'Distraction Blocker',
      description: 'Block distracting websites during study sessions',
      icon: LockClosedIcon,
      status: 'Coming Soon',
      phase: 'P2 Mid',
      color: 'from-red-500 to-pink-600',
      progress: 0,
      features: ['Website Blocking', 'Focus Mode', 'Whitelist Management', 'Break Exceptions']
    },
    {
      id: 9,
      title: 'Session Report Generator',
      description: 'Detailed analytics and study session insights',
      icon: ChartPieIcon,
      status: 'Coming Soon',
      phase: 'P2 Mid',
      color: 'from-emerald-500 to-green-600',
      progress: 0,
      features: ['Detailed Reports', 'Performance Analytics', 'Trend Analysis', 'Export Options']
    },
    
    // P2 Final - 3 modules
    {
      id: 10,
      title: 'Data Security and Governance',
      description: 'Data encryption, retention policies, and audit logs',
      icon: LockClosedIcon,
      status: 'Coming Soon',
      phase: 'P2 Final',
      color: 'from-slate-500 to-gray-600',
      progress: 0,
      features: ['Data Encryption', 'Privacy Policies', 'Audit Logs', 'Compliance Tools']
    },
    {
      id: 11,
      title: 'Presence Detection',
      description: 'Optional webcam presence monitoring',
      icon: EyeIcon,
      status: 'Coming Soon',
      phase: 'P2 Final',
      color: 'from-violet-500 to-purple-600',
      progress: 0,
      features: ['Presence Monitoring', 'Webcam Integration', 'Privacy Controls', 'Optional Activation']
    },
    {
      id: 12,
      title: 'Insights and Guardian Dashboard',
      description: 'Parent/teacher insights with privacy controls',
      icon: UsersIcon,
      status: 'Coming Soon',
      phase: 'P2 Final',
      color: 'from-teal-500 to-cyan-600',
      progress: 0,
      features: ['Guardian Access', 'Privacy Settings', 'Progress Reports', 'Parental Controls']
    }
  ];

  const phases = ['P1 Mid', 'P1 Final', 'P2 Mid', 'P2 Final'];
  const filteredModules = modules.filter(m => m.phase === activePhase);

  const handleModuleClick = (module) => {
    if (module.status === 'Active' && module.path) {
      navigate(module.path);
    }
  };

  const getOverallProgress = () => {
    const activeModules = modules.filter(m => m.status === 'Active').length;
    return Math.round((activeModules / modules.length) * 100);
  };

  const getPhaseProgress = (phase) => {
    const phaseModules = modules.filter(m => m.phase === phase);
    const activePhaseModules = phaseModules.filter(m => m.status === 'Active').length;
    return Math.round((activePhaseModules / phaseModules.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      {/* Header Section */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Welcome back, {user?.profile?.displayName || 'Student'}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Track your progress and stay focused on your learning journey
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadDashboardData}
                disabled={isLoadingStats}
                className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 disabled:opacity-50"
                title="Refresh dashboard data"
              >
                <div className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`}>
                  {isLoadingStats ? '⟳' : '↻'}
                </div>
                <span>{isLoadingStats ? 'Updating...' : 'Refresh'}</span>
              </button>
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl border border-blue-400/20 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:-rotate-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Study Hours Today</p>
                  {isLoadingStats ? (
                    <div className="w-16 h-8 bg-blue-400/50 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold mt-1">{dashboardStats?.studyHoursToday || 0}h</p>
                  )}
                </div>
                <ClockIcon className="h-8 w-8 text-blue-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-100">
                {dashboardStats?.studyHoursYesterday && dashboardStats.studyHoursToday > dashboardStats.studyHoursYesterday ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <div className="h-4 w-4 mr-1" />
                )}
                <span>
                  {dashboardStats?.studyHoursYesterday 
                    ? `${Math.round(((dashboardStats.studyHoursToday / dashboardStats.studyHoursYesterday - 1) * 100))}% from yesterday`
                    : 'Great start today!'}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl border border-green-400/20 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:rotate-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Sessions</p>
                  {isLoadingStats ? (
                    <div className="w-12 h-8 bg-green-400/50 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold mt-1">{dashboardStats?.completedSessions || 0}</p>
                  )}
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-100">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>{dashboardStats?.sessionsToday || 0} sessions today</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl border border-purple-400/20 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:-rotate-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Focus Streak</p>
                  {isLoadingStats ? (
                    <div className="w-20 h-8 bg-purple-400/50 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold mt-1">{dashboardStats?.focusStreak || 0} days</p>
                  )}
                </div>
                <FireIcon className="h-8 w-8 text-purple-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-100">
                <SparklesIcon className="h-4 w-4 mr-1" />
                <span>{(dashboardStats?.focusStreak || 0) > 0 ? 'Keep it up!' : 'Start your streak!'}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 text-white shadow-xl border border-orange-400/20 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 hover:rotate-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Achievement Score</p>
                  {isLoadingStats ? (
                    <div className="w-16 h-8 bg-orange-400/50 rounded animate-pulse mt-1"></div>
                  ) : (
                    <p className="text-3xl font-bold mt-1">{dashboardStats?.achievementScore || 0}</p>
                  )}
                </div>
                <TrophyIcon className="h-8 w-8 text-orange-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-orange-100">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+{dashboardStats?.achievementChange || 0} points today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Charts and Progress */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Integrated Study Session */}
            <IntegratedStudySession onStartSession={handleStartStudySession} />
            
            {/* Weekly Progress Chart */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <ChartBarIcon className="h-5 w-5 text-white" />
                  </div>
                  Weekly Progress
                </h3>
              </div>
              <div className="space-y-4">
                {isLoadingStats ? (
                  // Loading skeleton
                  Array.from({ length: 7 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 w-48 animate-pulse"></div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="w-8 h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                        <div className="w-12 h-3 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  weeklyProgress?.days?.map((dayData, index) => {
                    const maxHours = 5; // Max expected hours per day for progress bar
                    const progressPercent = Math.min((dayData.hours / maxHours) * 100, 100);
                    
                    return (
                      <div key={dayData.day} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-8">{dayData.day}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 w-48">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{dayData.hours}h</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{dayData.sessions} sessions</div>
                        </div>
                      </div>
                    );
                  }) || []
                )}
              </div>
            </div>

            {/* Module Phase Navigation */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
                Project Modules
              </h3>
              
              {/* Phase Selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {phases.map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setActivePhase(phase)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activePhase === phase
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {phase}
                    <span className="ml-2 text-xs opacity-75">
                      {getPhaseProgress(phase)}%
                    </span>
                  </button>
                ))}
              </div>

              {/* Modules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <div
                      key={module.id}
                      onClick={() => handleModuleClick(module)}
                      className={`relative group rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                        module.status === 'Active'
                          ? 'bg-gradient-to-r ' + module.color + ' text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          module.status === 'Active' 
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                        }`}>
                          {module.status}
                        </span>
                      </div>

                      {/* Icon */}
                      <div className="mb-4">
                        <IconComponent className={`h-8 w-8 ${
                          module.status === 'Active' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                        }`} />
                      </div>

                      {/* Content */}
                      <h4 className={`text-lg font-bold mb-2 ${
                        module.status === 'Active' ? 'text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        {module.title}
                      </h4>
                      
                      <p className={`text-sm mb-4 ${
                        module.status === 'Active' ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {module.description}
                      </p>

                      {/* Progress Bar */}
                      {module.progress > 0 && (
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-500"
                            style={{ width: `${module.progress}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Features */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {module.features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded text-xs ${
                              module.status === 'Active' 
                                ? 'bg-white/20 text-white' 
                                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                        {module.features.length > 2 && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            module.status === 'Active' 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                          }`}>
                            +{module.features.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Session Timeline & Quick Actions */}
          <div className="space-y-8">
            
            {/* Recent Sessions */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  Recent Sessions
                </h3>
              </div>
              <div className="space-y-3">
                {isLoadingStats ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                        <div className="space-y-1">
                          <div className="w-20 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                          <div className="w-32 h-3 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        </div>
                      </div>
                      <div className="w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    </div>
                  ))
                ) : recentSessions.length > 0 ? (
                  recentSessions.map((session) => {
                    const isCompleted = session.status === 'completed';
                    const durationMinutes = Math.round(session.duration / 60);
                    const timeAgo = new Date(session.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            isCompleted ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {session.subject}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {durationMinutes} min • {timeAgo}
                            </div>
                          </div>
                        </div>
                        {isCompleted ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <ClockIcon className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No recent sessions</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Start a study session to see it here</p>
                  </div>
                )}
              </div>
            </div>



            {/* Overall Progress */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl border border-indigo-400/20 hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Overall Progress</h3>
                <AcademicCapIcon className="h-6 w-6 text-indigo-200" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-indigo-100">Project Completion</span>
                    <span className="font-bold">{getOverallProgress()}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${getOverallProgress()}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{modules.filter(m => m.status === 'Active').length}</div>
                    <div className="text-indigo-200 text-sm">Active Modules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{modules.length}</div>
                    <div className="text-indigo-200 text-sm">Total Modules</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;