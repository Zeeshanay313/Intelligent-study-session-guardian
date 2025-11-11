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
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

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
      const response = await api.get('/timers');
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
          workDuration: 1500, // 25 minutes
          breakDuration: 300, // 5 minutes
          longBreakDuration: 900, // 15 minutes
          cyclesBeforeLongBreak: 4
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
          workDuration: 1500, // 25 minutes
          breakDuration: 300, // 5 minutes
          longBreakDuration: 900, // 15 minutes
          cyclesBeforeLongBreak: 4
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

  const handlePhaseComplete = () => {
    if (!selectedPreset) return;

    const { cyclesBeforeLongBreak, breakDuration, longBreakDuration, workDuration } = selectedPreset;

    // Play notification sound
    if (soundEnabled) {
      playNotificationSound(currentPhase);
    }

    // Show visual notification
    let notificationData;
    if (currentPhase === 'work') {
      // Switch to break
      const isLongBreak = cycle % cyclesBeforeLongBreak === 0;
      setCurrentPhase(isLongBreak ? 'longBreak' : 'break');
      setTimeRemaining(isLongBreak ? longBreakDuration : breakDuration);
      
      notificationData = {
        type: 'success',
        title: isLongBreak ? '🎉 Long Break Time!' : '☕ Break Time!',
        message: 'Great work! Take a well-deserved break.',
        duration: 5000
      };
      showInfo(isLongBreak ? 'Long break time!' : 'Break time!');
    } else {
      // Switch back to work
      setCurrentPhase('work');
      setTimeRemaining(workDuration);
      setCycle(prev => prev + 1);
      notificationData = {
        type: 'info',
        title: '💪 Back to Work!',
        message: `Starting Cycle #${cycle + 1}. Stay focused!`,
        duration: 5000
      };
      showInfo('Back to work!');
    }

    // Show popup notification
    setNotification(notificationData);
    setTimeout(() => setNotification(null), notificationData.duration);

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


    </div>
  );
};

export default TimerPage;