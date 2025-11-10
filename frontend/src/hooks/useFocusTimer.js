import { useState, useEffect, useCallback, useRef } from 'react';
import { completeSession } from '../services/sessionsApi';

/**
 * Enhanced focus timer hook with session logging and notifications
 */
const useFocusTimer = (initialDuration = 25) => {
  const [duration, setDuration] = useState(initialDuration * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Settings from localStorage
  const audioEnabled = localStorage.getItem('notifications_audio') !== 'false';
  const visualEnabled = localStorage.getItem('notifications_visual') !== 'false';

  // Update duration when initial duration changes
  useEffect(() => {
    if (!isRunning) {
      const newDuration = initialDuration * 60;
      setDuration(newDuration);
      setTimeLeft(newDuration);
    }
  }, [initialDuration, isRunning]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    return undefined;
  }, [isRunning, isPaused]);

  const startTimer = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = new Date();
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration);
    startTimeRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [duration]);

  const handleSessionComplete = useCallback(async () => {
    setIsRunning(false);
    
    const endTime = new Date();
    const actualDuration = duration - timeLeft;

    const sessionPayload = {
      presetId: currentPreset?._id || null,
      durationSeconds: actualDuration,
      startedAt: startTimeRef.current?.toISOString() || new Date(endTime.getTime() - actualDuration * 1000).toISOString(),
      endedAt: endTime.toISOString()
    };

    try {
      const response = await completeSession(sessionPayload);
      
      if (response.success) {
        const completedSession = {
          ...response.data,
          todayCount: response.todayCount,
          presetName: currentPreset?.name || 'Quick Session'
        };

        setSessionData(completedSession);
        
        if (visualEnabled) {
          setShowEndModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to log session:', error);
    }

    // Reset for next session
    setTimeLeft(duration);
    startTimeRef.current = null;
  }, [duration, timeLeft, currentPreset, visualEnabled]);

  const setPreset = useCallback((preset) => {
    setCurrentPreset(preset);
    if (preset && !isRunning) {
      const newDuration = preset.workDuration * 60;
      setDuration(newDuration);
      setTimeLeft(newDuration);
    }
  }, [isRunning]);

  const acceptBreakSuggestion = useCallback((breakMinutes) => {
    const breakDuration = breakMinutes * 60;
    setDuration(breakDuration);
    setTimeLeft(breakDuration);
    setCurrentPreset({
      name: `${breakMinutes}-min Break`,
      workDuration: breakMinutes,
      breakDuration: 0
    });
  }, []);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    return ((duration - timeLeft) / duration) * 100;
  }, [duration, timeLeft]);

  return {
    // State
    timeLeft,
    duration,
    isRunning,
    isPaused,
    sessionData,
    showEndModal,
    currentPreset,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setPreset,
    setShowEndModal,
    acceptBreakSuggestion,

    // Utilities
    formatTime,
    getProgress,

    // Settings
    audioEnabled,
    visualEnabled
  };
};

export default useFocusTimer;
