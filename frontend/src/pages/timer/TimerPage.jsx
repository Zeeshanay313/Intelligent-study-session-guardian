import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TimerControls from '../../components/timer/TimerControls';
import PresetManager from '../../components/timer/PresetManager';
import { useNotifications } from '../../components/shared/NotificationToast';
import { 
  ClockIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { useSocket } from '../../hooks/useSocket';
import api from '../../services/api';

const TimerPage = () => {
  const { user } = useAuth();
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
  }, [isRunning, isPaused, timeRemaining]);

  const loadPresets = async () => {
    try {
      const response = await api.get('/timers');
      const presetsData = Array.isArray(response.data) ? response.data : [];
      setPresets(presetsData);
      
      // Auto-select the first preset if none is selected
      if (presetsData.length > 0 && !selectedPreset) {
        setSelectedPreset(presetsData[0]);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
      showError('Failed to load presets', 'Please check your connection and try again.');
    }
  };

  const startTimer = async (preset = null) => {
    console.log('startTimer called with preset:', preset);
    try {
      const requestData = preset ? { presetId: preset._id } : {};
      console.log('Making timer start API call with:', requestData);
      const response = await api.post('/timers/start', requestData);
      
      if (response.success) {
        setCurrentSession(response.data.sessionId);
        setSelectedPreset(preset);
        setIsRunning(true);
        setIsPaused(false);
        setCycle(1);
        setCurrentPhase('work');
        
        // Set initial time
        const workDuration = preset ? preset.workDuration : 1500; // Default 25 minutes
        setTimeRemaining(workDuration);
        
        addNotification('Timer started!', 'success');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      addNotification('Failed to start timer', 'error');
    }
  };

  const pauseTimer = async () => {
    if (!currentSession) return;
    
    try {
      await api.post(`/timers/${currentSession}/pause`);
      setIsPaused(true);
    } catch (error) {
      console.error('Error pausing timer:', error);
      addNotification('Failed to pause timer', 'error');
    }
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = async () => {
    if (!currentSession) return;
    
    try {
      const response = await api.post(`/timers/${currentSession}/stop`);
      if (response.success) {
        setCurrentSession(null);
        setIsRunning(false);
        setIsPaused(false);
        setTimeRemaining(0);
        
        // Show session summary
        const summary = response.data;
        addNotification(
          `Session completed! Duration: ${Math.floor(summary.totalDurationSec / 60)} minutes`,
          'success'
        );
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      addNotification('Failed to stop timer', 'error');
    }
  };

  const handlePhaseComplete = () => {
    if (!selectedPreset) return;

    const { cyclesBeforeLongBreak, breakDuration, longBreakDuration, workDuration } = selectedPreset;

    if (currentPhase === 'work') {
      // Switch to break
      const isLongBreak = cycle % cyclesBeforeLongBreak === 0;
      setCurrentPhase(isLongBreak ? 'longBreak' : 'break');
      setTimeRemaining(isLongBreak ? longBreakDuration : breakDuration);
      
      addNotification(
        isLongBreak ? 'Long break time!' : 'Break time!',
        'info'
      );
    } else {
      // Switch back to work
      setCurrentPhase('work');
      setTimeRemaining(workDuration);
      setCycle(prev => prev + 1);
      addNotification('Back to work!', 'info');
    }
  };

  const addNotification = (message, type = 'info') => {
    switch(type) {
      case 'success':
        showSuccess('Timer Update', message);
        break;
      case 'error':
        showError('Timer Error', message);
        break;
      default:
        showInfo('Timer Info', message);
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Focus Timer
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Use the Pomodoro Technique to boost your productivity
        </p>
      </div>

      {/* Main Timer Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
        <div className="text-center">
          {/* Phase Indicator */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-white mb-4 ${getPhaseColor()}`}>
            <ClockIcon className="w-5 h-5 mr-2" />
            {getPhaseText()}
            {currentPhase === 'work' && <span className="ml-2">- Cycle {cycle}</span>}
          </div>

          {/* Timer Display */}
          <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-8">
            {formatTime(timeRemaining)}
          </div>

          {/* Timer Controls */}
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            onStart={() => startTimer(selectedPreset)}
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


    </div>
  );
};

export default TimerPage;