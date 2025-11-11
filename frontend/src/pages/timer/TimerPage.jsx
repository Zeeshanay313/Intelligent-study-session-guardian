import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TimerControls from '../../components/timer/TimerControls';
import PresetManager from '../../components/timer/PresetManager';
import { useNotifications } from '../../components/shared/NotificationToast';
import { 
  ClockIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const TimerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socketService } = useSocket();
  const { showSuccess, showInfo, showError } = useNotifications();
  
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [presets, setPresets] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('work'); // 'work', 'break', 'longBreak'
  const [cycle, setCycle] = useState(1);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [breakSuggestion, setBreakSuggestion] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Load presets on component mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Socket.io listeners for real-time updates
  useEffect(() => {
    if (socketService && user) {
      socketService.emit('join', user._id);

      const unsubscribers = [
        socketService.on('timer:started', (data) => {
          console.log('Timer started:', data);
          showSuccess('Timer started!', 'Your focus session has begun.');
        }),

        socketService.on('timer:paused', (data) => {
          console.log('Timer paused:', data);
          showInfo('Timer paused', 'Take a break and resume when ready.');
        }),

        socketService.on('timer:stopped', (data) => {
          console.log('Timer stopped:', data);
          showSuccess('Timer completed!', 'Great job on completing your session!');
          setCurrentSession(null);
          setIsRunning(false);
          setIsPaused(false);
        })
      ];

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  }, [socketService, user, showSuccess, showInfo]);

  // Timer countdown effect
  useEffect(() => {
    let interval = null;
    
    if (isRunning && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  const loadPresets = async () => {
    try {
      const response = await api.get('/timer/presets');
      let presetsData = Array.isArray(response.data) ? response.data : [];
      
      // Merge with locally stored presets
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]');
      if (localPresets.length > 0) {
        // Merge API presets with local presets, avoiding duplicates
        const combinedPresets = [...presetsData];
        localPresets.forEach(localPreset => {
          if (!combinedPresets.find(p => p._id === localPreset._id)) {
            combinedPresets.push(localPreset);
          }
        });
        presetsData = combinedPresets;
      }
      
      // Add default preset if no presets exist
      if (presetsData.length === 0) {
        const defaultPreset = {
          _id: 'default',
          name: 'Pomodoro (25/5)',
          subject: 'General',
          workDuration: 1500, // 25 minutes
          breakDuration: 300, // 5 minutes
          longBreakDuration: 900, // 15 minutes
          cyclesBeforeLongBreak: 4,
          color: '#3B82F6',
          icon: '📚'
        };
        presetsData.push(defaultPreset);
      }
      
      // Save merged presets to localStorage
      localStorage.setItem('timerPresets', JSON.stringify(presetsData));
      setPresets(presetsData);
      
      // Auto-select the first preset if none is selected
      if (presetsData.length > 0 && !selectedPreset) {
        setSelectedPreset(presetsData[0]);
        setTimeRemaining(presetsData[0].workDuration);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      
      // Load from localStorage as fallback
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]');
      let presetsData = localPresets;
      
      // Provide default preset on error
      if (presetsData.length === 0) {
        const defaultPreset = {
          _id: 'default',
          name: 'Pomodoro (25/5)',
          subject: 'General',
          workDuration: 1500, // 25 minutes
          breakDuration: 300, // 5 minutes
          longBreakDuration: 900, // 15 minutes
          cyclesBeforeLongBreak: 4,
          color: '#3B82F6',
          icon: '📚'
        };
        presetsData.push(defaultPreset);
      }
      
      setPresets(presetsData);
      if (presetsData.length > 0 && !selectedPreset) {
        setSelectedPreset(presetsData[0]);
        setTimeRemaining(presetsData[0].workDuration);
      }
      showError('Could not load presets from server. Using local data.');
    }
  };

  const startTimer = async (preset = null) => {
    console.log('startTimer called with preset:', preset);
    
    const currentPreset = preset || selectedPreset;
    if (!currentPreset) {
      showError('Please select a preset first');
      return;
    }

    try {
      // Try to make API call if preset is not default
      if (currentPreset._id !== 'default') {
        const requestData = { presetId: currentPreset._id };
        console.log('Making timer start API call with:', requestData);
        const response = await api.post('/timers/start', requestData);
        
        if (response.data.success) {
          setCurrentSession(response.data.sessionId);
        }
      } else {
        // For default preset, create a mock session ID
        setCurrentSession('local-session-' + Date.now());
      }
      
      // Set timer state regardless of API success
      setSelectedPreset(currentPreset);
      setIsRunning(true);
      setIsPaused(false);
      setCycle(1);
      setCurrentPhase('work');
      setTimeRemaining(currentPreset.workDuration);
      setSessionStartTime(new Date());
      
      showSuccess('Timer started!');
    } catch (error) {
      console.error('Error starting timer:', error);
      // Still start the timer locally even if API fails
      setCurrentSession('local-session-' + Date.now());
      setSelectedPreset(currentPreset);
      setIsRunning(true);
      setIsPaused(false);
      setCycle(1);
      setCurrentPhase('work');
      setTimeRemaining(currentPreset.workDuration);
      setSessionStartTime(new Date());
      
      showSuccess('Timer started (offline mode)');
    }
  };

  const pauseTimer = async () => {
    if (!currentSession) return;
    
    try {
      // Only make API call if not a local session
      if (!currentSession.startsWith('local-session-')) {
        await api.post(`/timers/${currentSession}/pause`);
      }
      setIsPaused(true);
      showInfo('Timer paused');
    } catch (error) {
      console.error('Error pausing timer:', error);
      // Still pause locally even if API fails
      setIsPaused(true);
      showInfo('Timer paused (offline)');
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
    showInfo('Timer resumed');
  };

  const stopTimer = async () => {
    if (!currentSession) return;
    
    try {
      // Only make API call if not a local session
      if (!currentSession.startsWith('local-session-')) {
        const response = await api.post(`/timers/${currentSession}/stop`);
        if (response.data.success && response.data) {
          const summary = response.data;
          showSuccess(
            `Session completed! Duration: ${Math.floor(summary.totalDurationSec / 60)} minutes`
          );
        }
      } else {
        showSuccess('Timer stopped');
      }
      
      // Reset timer state
      setCurrentSession(null);
      setIsRunning(false);
      setIsPaused(false);
      setTimeRemaining(selectedPreset ? selectedPreset.workDuration : 0);
      setCurrentPhase('work');
      setCycle(1);
    } catch (error) {
      console.error('Error stopping timer:', error);
      // Still stop the timer locally even if API fails
      setCurrentSession(null);
      setIsRunning(false);
      setIsPaused(false);
      setTimeRemaining(selectedPreset ? selectedPreset.workDuration : 0);
      setCurrentPhase('work');
      setCycle(1);
      showSuccess('Timer stopped (offline)');
    }
  };

  const handlePhaseComplete = async () => {
    if (!selectedPreset) return;

    const { cyclesBeforeLongBreak, breakDuration, longBreakDuration, workDuration } = selectedPreset;

    // Log completed work session to backend
    if (currentPhase === 'work' && sessionStartTime) {
      try {
        await api.post('/timer/sessions', {
          subject: selectedPreset.subject || 'General',
          sessionType: 'work',
          duration: workDuration,
          actualDuration: workDuration,
          startTime: sessionStartTime,
          endTime: new Date(),
          completed: true,
          cycle: cycle,
          presetId: selectedPreset._id !== 'default' ? selectedPreset._id : null,
          notes: ''
        });
        console.log('Work session logged successfully');
      } catch (error) {
        console.error('Failed to log session:', error);
      }
    }

    // Play notification sound
    if (soundEnabled) {
      playNotificationSound(currentPhase);
    }

    // Show visual notification
    let notificationData;
    if (currentPhase === 'work') {
      // Determine if it's time for a long break
      // Long break happens after completing the specified number of work cycles
      const isLongBreak = cycle >= cyclesBeforeLongBreak;
      
      // Switch to appropriate break type
      setCurrentPhase(isLongBreak ? 'longBreak' : 'break');
      setTimeRemaining(isLongBreak ? longBreakDuration : breakDuration);
      setSessionStartTime(new Date());
      
      notificationData = {
        type: 'success',
        title: isLongBreak ? '🎉 Long Break Time!' : '☕ Short Break Time!',
        message: isLongBreak 
          ? `You've completed ${cycle} work sessions! Take a long break.`
          : `Work session ${cycle} completed! Take a short break.`,
        duration: 5000
      };
      showInfo(isLongBreak ? `Long break time! (${Math.floor(longBreakDuration / 60)} minutes)` : `Short break time! (${Math.floor(breakDuration / 60)} minutes)`);
    } else {
      // Break ended, switch back to work
      const wasLongBreak = currentPhase === 'longBreak';
      
      setCurrentPhase('work');
      setTimeRemaining(workDuration);
      setSessionStartTime(new Date());
      
      // Reset cycle counter after long break, otherwise increment
      if (wasLongBreak) {
        setCycle(1);
        notificationData = {
          type: 'info',
          title: '💪 Back to Work!',
          message: 'Starting fresh cycle after your long break. Stay focused!',
          duration: 5000
        };
        showInfo('Starting Cycle #1 after long break');
      } else {
        setCycle(prev => prev + 1);
        notificationData = {
          type: 'info',
          title: '💪 Back to Work!',
          message: `Starting Cycle #${cycle + 1}. Keep the momentum going!`,
          duration: 5000
        };
        showInfo(`Starting Cycle #${cycle + 1}`);
      }
    }

    // Show popup notification
    setNotification(notificationData);
    setTimeout(() => setNotification(null), notificationData.duration);

    // Request browser notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificationData.title, {
        body: notificationData.message,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  };

  // Audio notification system
  const playNotificationSound = (phase) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Different tones for different phases
      const frequencies = {
        work: [523.25, 659.25, 783.99], // Energetic tones
        break: [392.00, 493.88, 587.33], // Relaxing tones
        longBreak: [261.63, 329.63, 392.00] // Restful tones
      };
      
      const notes = frequencies[phase] || frequencies.work;
      
      // Play sequence
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          osc.type = 'sine';
          
          gain.gain.setValueAtTime(0, audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.8);
        }, index * 200);
      });
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  };

  // Quick action handlers
  const handleStudySession = () => {
    // If timer is already running, show message
    if (isRunning) {
      showInfo('Timer is already running!');
      return;
    }

    // If no preset is selected, select the first one
    if (!selectedPreset && presets.length > 0) {
      const firstPreset = presets[0];
      setSelectedPreset(firstPreset);
      setTimeRemaining(firstPreset.workDuration);
      showSuccess(`Selected preset: ${firstPreset.name}`);
      
      // Start timer with the selected preset
      setTimeout(() => startTimer(firstPreset), 100);
    } else if (selectedPreset) {
      // Start with currently selected preset
      startTimer(selectedPreset);
    } else {
      showError('No presets available. Please create one first.');
      setShowPresetManager(true);
    }
  };

  const handleViewStats = async () => {
    try {
      const response = await api.get('/timer/sessions/stats?days=7');
      const stats = response.data;
      
      const totalHours = Math.floor(stats.totalWorkTime / 3600);
      const totalMinutes = Math.floor((stats.totalWorkTime % 3600) / 60);
      
      showSuccess(
        `📊 Last 7 days: ${stats.totalSessions} sessions, ${totalHours}h ${totalMinutes}m total work time`,
        'Stats loaded!'
      );
      
      // Show session history
      setShowSessionHistory(true);
      loadSessionHistory();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      showInfo('Navigating to dashboard...');
      navigate('/dashboard');
    }
  };

  const handlePreferences = () => {
    setShowPresetManager(!showPresetManager);
    showInfo(showPresetManager ? 'Closing preset manager' : 'Opening preset manager');
  };

  const handleCustomTimer = () => {
    setShowPresetManager(true);
    showInfo('Create a custom preset with your preferred durations');
  };

  const loadSessionHistory = async () => {
    try {
      const response = await api.get('/timer/sessions?limit=20');
      setSessionHistory(response.data);
      setShowSessionHistory(true);
    } catch (error) {
      console.error('Failed to load session history:', error);
      showError('Could not load session history');
    }
  };

  const loadBreakSuggestion = async () => {
    try {
      const response = await api.get('/timer/suggestions/breaks');
      setBreakSuggestion(response.data.suggestion);
      showInfo(`Suggested break: ${Math.floor(response.data.suggestion.breakDuration / 60)} minutes. ${response.data.suggestion.reason}`);
    } catch (error) {
      console.error('Failed to load break suggestion:', error);
    }
  };



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'work': return 'bg-red-500';
      case 'break': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case 'work': return 'Work Time';
      case 'break': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Ready';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Visual Notification Popup */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-2xl shadow-2xl transform animate-slide-up bg-gradient-to-br from-blue-500 to-purple-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <ClockIcon className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold mb-2">{notification.title}</h3>
              <p className="text-lg opacity-90 mb-6">{notification.message}</p>
              
              <button
                onClick={() => setNotification(null)}
                className="px-6 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Focus Timer
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Use the Pomodoro Technique to boost your productivity
        </p>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleStudySession}
          disabled={isRunning}
          className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <BookOpenIcon className="w-8 h-8 mb-2" />
          <span className="text-sm font-semibold">Study Session</span>
        </button>

        <button
          onClick={handleViewStats}
          className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <ChartBarIcon className="w-8 h-8 mb-2" />
          <span className="text-sm font-semibold">View Stats</span>
        </button>

        <button
          onClick={handlePreferences}
          className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <Cog6ToothIcon className="w-8 h-8 mb-2" />
          <span className="text-sm font-semibold">Preferences</span>
        </button>

        <button
          onClick={handleCustomTimer}
          className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
        >
          <PlusCircleIcon className="w-8 h-8 mb-2" />
          <span className="text-sm font-semibold">Custom Timer</span>
        </button>
      </div>

      {/* Main Timer Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center">
          {/* Phase Indicator */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white mb-4 ${getPhaseColor()}`}>
            <ClockIcon className="w-5 h-5 mr-2" />
            {getPhaseText()}
            {currentPhase === 'work' && selectedPreset && (
              <span className="ml-2">
                - Cycle {cycle}/{selectedPreset.cyclesBeforeLongBreak}
              </span>
            )}
            {currentPhase === 'break' && (
              <span className="ml-2">- Short Break</span>
            )}
            {currentPhase === 'longBreak' && (
              <span className="ml-2">- Long Break!</span>
            )}
          </div>

          {/* Cycle Progress Dots */}
          {selectedPreset && isRunning && currentPhase === 'work' && (
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: selectedPreset.cyclesBeforeLongBreak }).map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index < cycle
                      ? 'bg-green-500 scale-110'
                      : index === cycle - 1
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  title={`Cycle ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Timer Display */}
          <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-8">
            {formatTime(timeRemaining)}
          </div>
          
          {/* Progress indicator */}
          {selectedPreset && isRunning && (
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${getPhaseColor()}`}
                  style={{
                    width: `${((selectedPreset[currentPhase === 'work' ? 'workDuration' : currentPhase === 'break' ? 'breakDuration' : 'longBreakDuration'] - timeRemaining) / selectedPreset[currentPhase === 'work' ? 'workDuration' : currentPhase === 'break' ? 'breakDuration' : 'longBreakDuration']) * 100}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Timer Controls */}
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            onStart={() => {
              console.log('Start button clicked, selectedPreset:', selectedPreset);
              startTimer(selectedPreset);
            }}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onStop={stopTimer}
            disabled={!selectedPreset && !currentSession}
          />

          {/* Preset Selection */}
          {!isRunning && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select a preset:
              </label>
              <select
                value={selectedPreset?._id || ''}
                onChange={(e) => {
                  const preset = presets.find(p => p._id === e.target.value);
                  setSelectedPreset(preset);
                  if (preset) {
                    setTimeRemaining(preset.workDuration);
                  }
                }}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Choose a preset...</option>
                {presets.map(preset => (
                  <option key={preset._id} value={preset._id}>
                    {preset.name} ({Math.floor(preset.workDuration / 60)}min work)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Preset Manager Button */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowPresetManager(!showPresetManager)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          Manage Presets
        </button>
      </div>

      {/* Preset Manager */}
      {showPresetManager && (
        <PresetManager
          presets={presets}
          onPresetsChange={loadPresets}
          onClose={() => setShowPresetManager(false)}
        />
      )}

      {/* Session History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Sessions</h2>
          <button
            onClick={loadSessionHistory}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showSessionHistory ? 'Hide' : 'Show History'}
          </button>
        </div>

        {showSessionHistory && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessionHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sessions yet. Start your first session!</p>
            ) : (
              sessionHistory.map((session, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{session.subject}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(session.startTime).toLocaleDateString()} - {Math.floor(session.actualDuration / 60)} min
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {session.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Break Suggestions */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Break Suggestions</h2>
          <button
            onClick={loadBreakSuggestion}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Get Suggestion
          </button>
        </div>

        {breakSuggestion && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Recommended Break: {Math.floor(breakSuggestion.breakDuration / 60)} minutes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{breakSuggestion.reason}</p>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    breakSuggestion.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    breakSuggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {breakSuggestion.confidence} confidence
                  </span>
                  {breakSuggestion.analytics && (
                    <span className="text-xs text-gray-500">
                      Based on {breakSuggestion.analytics.recentSessionsAnalyzed} recent sessions
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default TimerPage;