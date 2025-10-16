import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleStartStudySession = () => {
    // For now, navigate to goals where users can track study progress
    // This can be expanded later to include a dedicated study session timer
    navigate('/goals');
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
      status: 'Coming Soon',
      phase: 'P1 Mid',
      color: 'from-green-500 to-teal-600',
      progress: 0,
      features: ['Pomodoro Timer', 'Custom Presets', 'Break Reminders', 'Session Analytics']
    },
    {
      id: 3,
      title: 'Reminder and Scheduling',
      description: 'Study reminders, calendar sync, and smart notifications',
      icon: CalendarIcon,
      status: 'Coming Soon',
      phase: 'P1 Mid',
      color: 'from-orange-500 to-red-600',
      progress: 0,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
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
              <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Study Hours Today</p>
                  <p className="text-3xl font-bold mt-1">2.5h</p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-100">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+15% from yesterday</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Sessions</p>
                  <p className="text-3xl font-bold mt-1">12</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-100">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>3 sessions today</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Focus Streak</p>
                  <p className="text-3xl font-bold mt-1">7 days</p>
                </div>
                <FireIcon className="h-8 w-8 text-purple-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-purple-100">
                <SparklesIcon className="h-4 w-4 mr-1" />
                <span>Keep it up!</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Achievement Score</p>
                  <p className="text-3xl font-bold mt-1">850</p>
                </div>
                <TrophyIcon className="h-8 w-8 text-orange-200" />
              </div>
              <div className="mt-4 flex items-center text-sm text-orange-100">
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                <span>+50 points today</span>
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
            
            {/* Weekly Progress Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Weekly Progress</h3>
                <ChartBarIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const hours = [3.2, 2.8, 4.1, 2.3, 3.7, 2.1, 2.5][index];
                  const sessions = [4, 3, 5, 3, 4, 2, 3][index];
                  return (
                    <div key={day} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-8">{day}</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 w-48">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(hours / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{hours}h</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{sessions} sessions</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Module Phase Navigation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Project Modules</h3>
              
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
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Sessions</h3>
                <CalendarIcon className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                {[
                  { id: 1, subject: 'Mathematics', duration: 45, completed: true, timestamp: '2 hours ago' },
                  { id: 2, subject: 'Physics', duration: 30, completed: true, timestamp: '4 hours ago' },
                  { id: 3, subject: 'Chemistry', duration: 60, completed: false, timestamp: '6 hours ago' },
                  { id: 4, subject: 'Biology', duration: 25, completed: true, timestamp: '1 day ago' }
                ].map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.completed ? 'bg-green-500' : 'bg-orange-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {session.subject}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {session.duration} min • {session.timestamp}
                        </div>
                      </div>
                    </div>
                    {session.completed ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClockIcon className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5" />
                    <span className="font-medium">Profile Settings</span>
                  </div>
                  <ArrowUpIcon className="h-4 w-4 rotate-45" />
                </button>
                
                <button 
                  onClick={handleStartStudySession}
                  className="w-full flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <PlayIcon className="h-5 w-5" />
                    <span className="font-medium">Start Study Session</span>
                  </div>
                  <ArrowUpIcon className="h-4 w-4 rotate-45" />
                </button>
                
                <button className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <CogIcon className="h-5 w-5" />
                    <span className="font-medium">App Settings</span>
                  </div>
                  <ArrowUpIcon className="h-4 w-4 rotate-45" />
                </button>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
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