import React, { useState, useEffect, useRef } from 'react';
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

const FocusTimer = ({ className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'
  const [cycleCount, setCycleCount] = useState(0);
  const [settings, setSettings] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakInterval: 4,
    notifications: true,
    autoStart: false
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const intervalRef = useRef(null);
  const initialTimeRef = useRef(25 * 60);

  const sessionConfig = {
    focus: {
      duration: settings.focusTime * 60,
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