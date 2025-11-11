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
    autoStart: false,
    soundEnabled: true,
    visualNotifications: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const intervalRef = useRef(null);
  const initialTimeRef = useRef(25 * 60);

  const sessionConfig = {
    focus: {
      duration: settings.focusTime * 60,
      label: 'Focus Time',
      color: 'from-blue-500 to-blue-600',
      neonColor: 'from-neon-blue to-neon-cyan',
      glowColor: 'rgba(0, 212, 255, 0.4)',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      textColor: 'text-blue-700 dark:text-neon-blue',
      icon: ClockIcon
    },
    shortBreak: {
      duration: settings.shortBreak * 60,
      label: 'Short Break',
      color: 'from-green-500 to-green-600',
      neonColor: 'from-neon-green to-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      textColor: 'text-green-700 dark:text-neon-green',
      icon: CheckCircleIcon
    },
    longBreak: {
      duration: settings.longBreak * 60,
      label: 'Long Break',
      color: 'from-purple-500 to-purple-600',
      neonColor: 'from-neon-purple to-neon-pink',
      glowColor: 'rgba(168, 85, 247, 0.4)',
      bgColor: 'bg-purple-50 dark:bg-purple-900/10',
      textColor: 'text-purple-700 dark:text-neon-purple',
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
    
    const currentConfig = sessionConfig[currentSession];
    const nextSessionType = getNextSessionType();
    const nextConfig = sessionConfig[nextSessionType];
    
    // Show visual notification
    if (settings.visualNotifications || settings.notifications) {
      const notificationData = {
        type: 'success',
        title: `${currentConfig.label} Complete! 🎉`,
        message: `Great work! ${nextSessionType === 'focus' ? 'Time to focus on your next session' : 'Take a well-deserved break'}`,
        sessionType: currentSession,
        nextSessionType,
        duration: 5000
      };
      setNotification(notificationData);
      
      // Auto-hide notification after duration
      setTimeout(() => setNotification(null), notificationData.duration);
    }
    
    // Play notification sound
    if (settings.soundEnabled && settings.notifications) {
      playNotificationSound(currentSession);
    }
    
    // Browser notification
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${currentConfig.label} Complete!`, {
        body: `Time to ${nextSessionType === 'focus' ? 'focus' : 'take a break'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'focus-timer',
        requireInteraction: true,
        actions: [
          { action: 'start', title: 'Start Next Session' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
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
      setTimeout(() => setIsRunning(true), 2000); // Give time to see notification
    }
  };

  const getNextSessionType = () => {
    if (currentSession === 'focus') {
      return (cycleCount + 1) % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
    }
    return 'focus';
  };

  // Enhanced audio notification system
  const playNotificationSound = (sessionType) => {
    try {
      // Create different tones for different session types
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set frequency based on session type
      const frequencies = {
        focus: [523.25, 659.25, 783.99], // C5, E5, G5 (major chord)
        shortBreak: [392.00, 493.88, 587.33], // G4, B4, D5 (relaxing)
        longBreak: [261.63, 329.63, 392.00] // C4, E4, G4 (lower, restful)
      };
      
      const notes = frequencies[sessionType] || frequencies.focus;
      
      // Play sequence of notes
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          
          osc.connect(gain);
          gain.connect(audioContext.destination);
          
          osc.frequency.setValueAtTime(freq, audioContext.currentTime);
          osc.type = 'sine';
          
          // Envelope for smooth sound
          gain.gain.setValueAtTime(0, audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
          
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.8);
        }, index * 200);
      });
      
      // Final celebration sound for completed sessions
      setTimeout(() => {
        const finalOsc = audioContext.createOscillator();
        const finalGain = audioContext.createGain();
        
        finalOsc.connect(finalGain);
        finalGain.connect(audioContext.destination);
        
        finalOsc.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        finalOsc.type = 'triangle';
        
        finalGain.gain.setValueAtTime(0, audioContext.currentTime);
        finalGain.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1);
        finalGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);
        
        finalOsc.start(audioContext.currentTime);
        finalOsc.stop(audioContext.currentTime + 1.2);
      }, 800);
      
    } catch (error) {
      console.log('Audio notification not supported or failed:', error);
      // Fallback to simple beep
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEgBSyA0fPZmT0OHm6x9Of3f+j7m43Y+3hH');
        audio.play();
      } catch (fallbackError) {
        console.log('Fallback audio also failed:', fallbackError);
      }
    }
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
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
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

  const config = sessionConfig[currentSession] || sessionConfig.focus;

  return (
    <div className={`${className}`}>
      <Card className="relative overflow-hidden">
        {/* Visual Notification Popup */}
        {notification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`
              max-w-md w-full p-6 rounded-2xl shadow-2xl transform animate-slide-up
              bg-gradient-to-br ${sessionConfig[notification.sessionType]?.neonColor || 'from-blue-500 to-blue-600'}
              text-white relative overflow-hidden
            `}>
              {/* Animated background effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
              
              <div className="relative z-10 text-center">
                {/* Large celebration icon */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center animate-pulse-glow">
                  {notification.sessionType === 'focus' ? (
                    <CheckCircleIcon className="w-8 h-8" />
                  ) : notification.sessionType === 'shortBreak' ? (
                    <ClockIcon className="w-8 h-8" />
                  ) : (
                    <ExclamationTriangleIcon className="w-8 h-8" />
                  )}
                </div>
                
                <h3 className="text-2xl font-bold mb-2">{notification.title}</h3>
                <p className="text-lg opacity-90 mb-6">{notification.message}</p>
                
                {/* Next session preview */}
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium">
                    Next: {sessionConfig[notification.nextSessionType]?.label}
                  </p>
                  <div className="flex items-center justify-center mt-1">
                    {React.createElement(sessionConfig[notification.nextSessionType]?.icon, { 
                      className: "w-4 h-4 mr-2" 
                    })}
                    <span className="text-xs opacity-80">
                      {sessionConfig[notification.nextSessionType]?.duration / 60} minutes
                    </span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setNotification(null)}
                    className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                  >
                    OK
                  </button>
                  {!settings.autoStart && (
                    <button
                      onClick={() => {
                        setNotification(null);
                        setTimeout(() => setIsRunning(true), 500);
                      }}
                      className="flex-1 px-4 py-2 bg-white hover:bg-white/90 text-gray-900 rounded-lg font-medium transition-colors"
                    >
                      Start Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Background gradient glow effect */}
        <div className={`absolute inset-0 opacity-5 dark:opacity-10 bg-gradient-to-br ${config.neonColor}`} />
        
        {/* Session Type Badge */}
        <div className="relative flex justify-between items-center mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${config.bgColor} ${config.textColor} border border-current/20`}>
            <config.icon className="w-4 h-4 mr-2" />
            {config.label}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
          </button>
        </div>

        {/* Large Central Countdown */}
        <div className="relative mb-12">
          {/* Circular Progress Ring */}
          <div className="relative w-80 h-80 mx-auto">
            {/* Glow effect ring */}
            {isRunning && !isPaused && (
              <div 
                className="absolute inset-0 rounded-full animate-pulse-glow"
                style={{
                  background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
              />
            )}
            
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-secondary-200/50 dark:text-secondary-800/50"
              />
              {/* Progress circle with gradient */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - getProgress() / 100)}`}
                className="transition-all duration-500 ease-out drop-shadow-lg"
                strokeLinecap="round"
                style={{
                  filter: `drop-shadow(0 0 8px ${config.glowColor})`,
                }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={
                    currentSession === 'focus' ? '#00d4ff' :
                    currentSession === 'shortBreak' ? '#10b981' : '#a855f7'
                  } />
                  <stop offset="100%" stopColor={
                    currentSession === 'focus' ? '#06b6d4' :
                    currentSession === 'shortBreak' ? '#059669' : '#ec4899'
                  } />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Time Display - Centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-7xl font-bold font-mono tracking-tight mb-2 ${config.textColor} transition-all duration-300`}
                   style={{
                     textShadow: isRunning && !isPaused ? `0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}` : 'none',
                   }}>
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-secondary-500 dark:text-secondary-400 font-medium">
                Cycle {cycleCount + 1} • {Math.floor((initialTimeRef.current - timeLeft) / 60)}m elapsed
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons - Modern Design */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className={`group relative w-24 h-24 rounded-full bg-gradient-to-br ${config.neonColor} hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-2xl`}
              style={{
                boxShadow: `0 10px 40px ${config.glowColor}, 0 0 0 0 ${config.glowColor}`,
              }}
              aria-label="Start"
            >
              <PlayIcon className="w-10 h-10 text-white mx-auto" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                Start
              </span>
            </button>
          ) : isPaused ? (
            <>
              <button
                onClick={handleResume}
                className={`group relative w-20 h-20 rounded-full bg-gradient-to-br ${config.neonColor} hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg`}
                style={{
                  boxShadow: `0 8px 30px ${config.glowColor}`,
                }}
                aria-label="Resume"
              >
                <PlayIcon className="w-8 h-8 text-white mx-auto" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                  Resume
                </span>
              </button>
              <button
                onClick={handleStop}
                className="group relative w-16 h-16 rounded-full bg-secondary-200 dark:bg-secondary-800 hover:bg-secondary-300 dark:hover:bg-secondary-700 hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Stop"
              >
                <StopIcon className="w-6 h-6 text-secondary-700 dark:text-secondary-300 mx-auto" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                  Stop
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="group relative w-20 h-20 rounded-full bg-secondary-200 dark:bg-secondary-800 hover:bg-secondary-300 dark:hover:bg-secondary-700 hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Pause"
              >
                <PauseIcon className="w-8 h-8 text-secondary-700 dark:text-secondary-300 mx-auto" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                  Pause
                </span>
              </button>
              <button
                onClick={handleStop}
                className="group relative w-16 h-16 rounded-full bg-secondary-200 dark:bg-secondary-800 hover:bg-secondary-300 dark:hover:bg-secondary-700 hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Stop"
              >
                <StopIcon className="w-6 h-6 text-secondary-700 dark:text-secondary-300 mx-auto" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                  Stop
                </span>
              </button>
            </>
          )}
        </div>

        {/* Session Type Switcher */}
        <div className="grid grid-cols-3 gap-3 pt-8 border-t border-secondary-200 dark:border-secondary-800">
          {[
            { type: 'focus', label: 'Focus', icon: ClockIcon },
            { type: 'shortBreak', label: 'Short Break', icon: CheckCircleIcon },
            { type: 'longBreak', label: 'Long Break', icon: ExclamationTriangleIcon }
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => !isRunning && setCurrentSession(type)}
              disabled={isRunning}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentSession === type
                  ? `${sessionConfig[type].bgColor} ${sessionConfig[type].textColor} ring-2 ring-current/20`
                  : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <div className="text-xs">{label}</div>
            </button>
          ))}
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
                  Visual notifications
                </span>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    visualNotifications: !prev.visualNotifications
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.visualNotifications ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.visualNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  Sound effects
                </span>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    soundEnabled: !prev.soundEnabled
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Test Notification Button */}
              <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
                <button
                  onClick={() => {
                    // Test notification
                    setNotification({
                      type: 'info',
                      title: 'Test Notification 🔔',
                      message: 'This is how your notifications will look when sessions complete!',
                      sessionType: currentSession,
                      nextSessionType: 'focus',
                      duration: 3000
                    });
                    setTimeout(() => setNotification(null), 3000);
                    
                    // Test sound
                    if (settings.soundEnabled) {
                      playNotificationSound(currentSession);
                    }
                  }}
                  className="w-full px-3 py-2 bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 dark:hover:bg-primary-900/40 text-primary-700 dark:text-primary-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Test Notifications
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