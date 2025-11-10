import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from './ui/Button';
import Card from './ui/Card';
import PresetDropdown from './timer/PresetDropdown';
import SessionEndModal from './timer/SessionEndModal';
import useFocusTimer from '../hooks/useFocusTimer';

const FocusTimer = ({ className = '' }) => {
  const [customDuration, setCustomDuration] = useState(25);
  
  // Use the enhanced hook with all new features:
  // - Automatic session logging
  // - Audio/visual completion alerts
  // - Intelligent break suggestions
  const {
    timeLeft,
    duration,
    isRunning,
    isPaused,
    sessionData,
    showEndModal,
    currentPreset,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setPreset,
    setShowEndModal,
    acceptBreakSuggestion,
    formatTime,
    getProgress,
    audioEnabled,
    visualEnabled
  } = useFocusTimer(customDuration);

  const handlePresetChange = (preset) => {
    setPreset(preset);
    setCustomDuration(preset.workDuration);
  };

  const handleDurationChange = (minutes) => {
    setCustomDuration(minutes);
  };

  const handleAcceptSuggestion = (breakMinutes) => {
    acceptBreakSuggestion(breakMinutes);
    setCustomDuration(breakMinutes);
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <Card className="text-center">
        {/* Header with Preset Selector */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
            🎯 Focus Timer
          </h2>
          
          {/* Preset Dropdown with CRUD */}
          <div className="mb-4">
            <PresetDropdown
              selectedPreset={currentPreset}
              onPresetChange={handlePresetChange}
              onDurationChange={handleDurationChange}
            />
          </div>

          {/* Custom Duration Input (when no preset selected) */}
          {!currentPreset && !isRunning && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Duration (minutes):
              </label>
              <input
                type="number"
                min="1"
                max="240"
                value={customDuration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-bold text-gray-900 dark:text-white mb-2 font-mono">
              {formatTime(timeLeft)}
            </div>
            {currentPreset && (
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {currentPreset.name}
              </div>
            )}
            {isPaused && (
              <div className="text-xs text-orange-500 font-semibold mt-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                ⏸️ PAUSED
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          {!isRunning ? (
            <Button
              onClick={startTimer}
              variant="primary"
              size="lg"
              className="px-8"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Start
            </Button>
          ) : isPaused ? (
            <>
              <Button
                onClick={resumeTimer}
                variant="primary"
                size="lg"
                className="px-6"
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={pauseTimer}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <PauseIcon className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="px-6"
              >
                <StopIcon className="w-5 h-5 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Settings Info */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-2">
            <span>🔊 Audio:</span>
            <span className={`font-semibold ${audioEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {audioEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>👁️ Visual:</span>
            <span className={`font-semibold ${visualEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {visualEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Feature Indicators */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-semibold">
            ✨ ENHANCED FEATURES
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">Auto Logging</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sessions saved automatically</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">Smart Breaks</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI-powered suggestions</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl mb-2">💾</div>
              <div className="text-gray-700 dark:text-gray-300 font-medium">Offline Ready</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Works without internet</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Session End Modal with Intelligent Suggestions */}
      <SessionEndModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        sessionData={sessionData}
        playAudio={audioEnabled}
        onAcceptSuggestion={handleAcceptSuggestion}
      />
    </div>
  );
};

export default FocusTimer;

      label: 'Focus Time',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      icon: ClockIcon
    },
    shortBreak: {
      duration: settings.shortBreak * 60,
      label: 'Short Break',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-700 dark:text-green-300',
      icon: CheckCircleIcon
    },
    longBreak: {
      duration: settings.longBreak * 60,
      label: 'Long Break',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300',
      icon: ExclamationTriangleIcon
    }
  };

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  useEffect(() => {
    const duration = sessionConfig[currentSession].duration;
    setTimeLeft(duration);
    initialTimeRef.current = duration;
  }, [currentSession, settings]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    setIsPaused(false);
    
    if (settings.notifications) {
      new Audio('/notification.mp3').play().catch(() => {});
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${sessionConfig[currentSession].label} Complete!`, {
          body: `Time to ${getNextSessionType() === 'focus' ? 'focus' : 'take a break'}`,
          icon: '/logo192.png'
        });
      }
    }

    // Auto-advance to next session
    if (currentSession === 'focus') {
      setCycleCount(prev => prev + 1);
      const isLongBreak = (cycleCount + 1) % settings.longBreakInterval === 0;
      setCurrentSession(isLongBreak ? 'longBreak' : 'shortBreak');
    } else {
      setCurrentSession('focus');
    }

    if (settings.autoStart) {
      setTimeout(() => setIsRunning(true), 1000);
    }
  };

  const getNextSessionType = () => {
    if (currentSession === 'focus') {
      return (cycleCount + 1) % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
    }
    return 'focus';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return ((initialTimeRef.current - timeLeft) / initialTimeRef.current) * 100;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(sessionConfig[currentSession].duration);
  };

  const handleReset = () => {
    handleStop();
    setCurrentSession('focus');
    setCycleCount(0);
  };

  const config = sessionConfig[currentSession];

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Card className="text-center">
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${config.bgColor} ${config.textColor}`}>
          <config.icon className="w-4 h-4 mr-2" />
          {config.label}
        </div>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-secondary-200 dark:text-secondary-700"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
              className="transition-all duration-300"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="text-blue-500" stopColor="currentColor" />
                <stop offset="100%" className="text-purple-500" stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary-900 dark:text-white font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                Session {cycleCount + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              variant="primary"
              size="lg"
              className="w-20"
            >
              <PlayIcon className="w-5 h-5" />
            </Button>
          ) : isPaused ? (
            <Button
              onClick={handleResume}
              variant="primary"
              size="lg"
              className="w-20"
            >
              <PlayIcon className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="outline"
              size="lg"
              className="w-20"
            >
              <PauseIcon className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            onClick={handleStop}
            variant="outline"
            size="lg"
            disabled={!isRunning && !isPaused}
            className="w-20"
          >
            <StopIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Session Info */}
        <div className="text-center mb-6">
          <p className="text-secondary-600 dark:text-secondary-400">
            Next: {sessionConfig[getNextSessionType()].label}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
          >
            <Cog6ToothIcon className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Timer Settings
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Focus (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.focusTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      focusTime: parseInt(e.target.value) || 25
                    }))}
                    className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Short Break
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreak}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      shortBreak: parseInt(e.target.value) || 5
                    }))}
                    className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                    Long Break
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreak}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      longBreak: parseInt(e.target.value) || 15
                    }))}
                    className="w-full px-2 py-1 text-sm border border-secondary-300 dark:border-secondary-600 rounded bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Notifications
                </span>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    notifications: !prev.notifications
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Auto-start sessions
                </span>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    autoStart: !prev.autoStart
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoStart ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoStart ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FocusTimer;