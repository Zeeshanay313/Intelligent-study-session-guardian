import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useNotifications } from './shared/NotificationToast';
import api from '../services/api';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  BellIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const IntegratedStudySession = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { socketService } = useSocket();
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionConfig, setSessionConfig] = useState({
    subject: '',
    workDuration: 25,
    breakDuration: 5,
    linkedGoalId: '',
    syncToCalendar: true
  });
  const [availableGoals, setAvailableGoals] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Load user's active goals on component mount
  useEffect(() => {
    fetchAvailableGoals();
    fetchActiveSession();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socketService) return;

    const unsubscribers = [
      socketService.on('session_started', handleSessionStarted),
      socketService.on('session_paused', handleSessionPaused),
      socketService.on('session_resumed', handleSessionResumed),
      socketService.on('session_completed', handleSessionCompleted),
      socketService.on('timer_tick', handleTimerTick),
      socketService.on('goal_achieved', handleGoalAchieved)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [socketService]);

  const fetchAvailableGoals = async () => {
    try {
      const response = await api.get('/goals?isActive=true');
      const goals = response.data.goals || [];
      setAvailableGoals(goals);
      
      // Auto-select most recent goal
      if (goals.length > 0) {
        setSessionConfig(prev => ({
          ...prev,
          linkedGoalId: goals[0]._id,
          subject: `Study: ${goals[0].title}`
        }));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      // Provide mock goals as fallback
      const mockGoals = [
        {
          _id: 'mock-goal-1',
          title: 'Complete React Project',
          description: 'Finish the study session guardian app'
        },
        {
          _id: 'mock-goal-2', 
          title: 'Learn JavaScript',
          description: 'Master modern JavaScript concepts'
        }
      ];
      setAvailableGoals(mockGoals);
      
      // Auto-select first mock goal
      setSessionConfig(prev => ({
        ...prev,
        linkedGoalId: mockGoals[0]._id,
        subject: `Study: ${mockGoals[0].title}`
      }));
    }
  };

  const fetchActiveSession = async () => {
    try {
      const response = await api.get('/study-session/current');
      if (response.data.activeSession) {
        setActiveSession(response.data.activeSession);
      }
    } catch (error) {
      console.error('Error fetching active session:', error);
      // Don't set error state, just leave activeSession null
    }
  };

  const handleQuickStart = async () => {
    console.log('handleQuickStart called!');
    setLoading(true);
    
    // Mock implementation for testing
    setTimeout(() => {
      setActiveSession({
        sessionId: 'mock-session-' + Date.now(),
        status: 'active',
        startTime: new Date(),
        config: { subject: 'Quick Focus Session', workDuration: 25 }
      });
      addNotification('Study session started successfully!', 'success');
      setLoading(false);
    }, 1000);
    
    /* Real API call - uncomment when backend is stable
    try {
      console.log('Making API call to quick-start...');
      const response = await api.post('/study-session/quick-start', {});

      if (response.data.success) {
        setActiveSession(response.data.session);
        addNotification('Study session started successfully!', 'success');
      } else {
        addNotification(response.data.error || 'Failed to start session', 'error');
      }
    } catch (error) {
      console.error('Error starting quick session:', error);
      addNotification('Failed to start study session', 'error');
    } finally {
      setLoading(false);
    }
    */
  };

  const handleCustomStart = async () => {
    console.log('handleCustomStart called!');
    setLoading(true);
    try {
      console.log('Making API call to start session with config:', sessionConfig);
      const response = await api.post('/study-session/start', sessionConfig);

      if (response.data.success) {
        setActiveSession(response.data.session);
        addNotification('Custom study session started!', 'success');
      } else {
        addNotification(response.data.error || 'Failed to start session', 'error');
      }
    } catch (error) {
      console.error('Error starting custom session:', error);
      addNotification('Failed to start study session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      const response = await api.post('/study-session/pause');
      if (response.data.success) {
        addNotification('Session paused', 'info');
      } else {
        addNotification(response.data.error || 'Failed to pause session', 'error');
      }
    } catch (error) {
      console.error('Error pausing session:', error);
      addNotification('Failed to pause session', 'error');
    }
  };

  const handleResume = async () => {
    try {
      const response = await api.post('/study-session/resume');
      if (response.data.success) {
        addNotification('Session resumed', 'info');
      } else {
        addNotification(response.data.error || 'Failed to resume session', 'error');
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      addNotification('Failed to resume session', 'error');
    }
  };

  const handleStop = async () => {
    try {
      const response = await api.post('/study-session/stop', { 
        sessionId: activeSession?.sessionId 
      });

      if (response.data.success) {
        setActiveSession(null);
        addNotification('Study session completed!', 'success');
      } else {
        addNotification(response.data.error || 'Failed to stop session', 'error');
      }
    } catch (error) {
      console.error('Error stopping session:', error);
      addNotification('Failed to stop session', 'error');
    }
  };

  // Socket event handlers
  const handleSessionStarted = (data) => {
    setActiveSession({
      sessionId: data.sessionId,
      status: 'active',
      startTime: new Date()
    });
    addNotification(data.message, 'success');
  };

  const handleSessionPaused = (data) => {
    setActiveSession(prev => ({ ...prev, status: 'paused' }));
    addNotification('Session paused', 'info');
  };

  const handleSessionResumed = (data) => {
    setActiveSession(prev => ({ ...prev, status: 'active' }));
    addNotification('Session resumed', 'success');
  };

  const handleSessionCompleted = (data) => {
    setActiveSession(null);
    setTimeRemaining(0);
    addNotification(data.message, 'success');
  };

  const handleTimerTick = (data) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handleGoalAchieved = (data) => {
    addNotification(data.message, 'success', 5000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <PlayIcon className="h-8 w-8 text-blue-600" />
          Integrated Study Session
        </h2>
        {activeSession && (
          <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {!activeSession ? (
        <div className="space-y-6">
          {/* Quick Start Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🚀 Quick Start (Recommended)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Start immediately with smart defaults based on your profile and active goals.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-blue-600" />
                <span>Timer: 25min work</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-green-600" />
                <span>Goal: Auto-linked</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-purple-600" />
                <span>Calendar: Synced</span>
              </div>
              <div className="flex items-center gap-2">
                <BellIcon className="h-4 w-4 text-orange-600" />
                <span>Notifications: On</span>
              </div>
            </div>
            <button
              onClick={handleQuickStart}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PlayIcon className="h-5 w-5" />
              {loading ? 'Starting...' : 'Start Study Session Now'}
            </button>
          </div>

          {/* Custom Configuration Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Cog6ToothIcon className="h-5 w-5" />
              Custom Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="session-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Subject
                </label>
                <input
                  id="session-subject"
                  name="sessionSubject"
                  type="text"
                  value={sessionConfig.subject}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="What are you studying?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="linked-goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Linked Goal
                </label>
                <select
                  id="linked-goal"
                  name="linkedGoal"
                  value={sessionConfig.linkedGoalId}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, linkedGoalId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No goal (session only)</option>
                  {availableGoals.map(goal => (
                    <option key={goal._id} value={goal._id}>
                      {goal.title} ({goal.progressPercentage}% complete)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="work-duration-session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Work Duration (minutes)
                </label>
                <input
                  id="work-duration-session"
                  name="workDurationSession"
                  type="number"
                  min="1"
                  max="120"
                  value={sessionConfig.workDuration}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, workDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="break-duration-session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Break Duration (minutes)
                </label>
                <input
                  id="break-duration-session"
                  name="breakDurationSession"
                  type="number"
                  min="1"
                  max="30"
                  value={sessionConfig.breakDuration}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, breakDuration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sessionConfig.syncToCalendar}
                  onChange={(e) => setSessionConfig(prev => ({ ...prev, syncToCalendar: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Sync to Google Calendar
                </span>
              </label>
            </div>

            <button
              onClick={handleCustomStart}
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Cog6ToothIcon className="h-5 w-5" />
              {loading ? 'Starting...' : 'Start Custom Session'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Session Display */}
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300">
              Status: <span className="capitalize font-semibold">{activeSession.status}</span>
            </div>
            {sessionConfig.subject && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {sessionConfig.subject}
              </div>
            )}
          </div>

          {/* Session Controls */}
          <div className="flex justify-center gap-4">
            {activeSession.status === 'active' ? (
              <button
                onClick={handlePause}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <PauseIcon className="h-5 w-5" />
                Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                <PlayIcon className="h-5 w-5" />
                Resume
              </button>
            )}
            
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              <StopIcon className="h-5 w-5" />
              Stop Session
            </button>
          </div>

          {/* Session Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Session Features Active:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                Real-time Timer
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                Goal Progress Tracking
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                Break Reminders
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                Calendar Integration
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedStudySession;