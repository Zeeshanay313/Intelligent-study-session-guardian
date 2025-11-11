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
      {/* VERIFICATION BANNER - YOU SHOULD SEE THIS! */}
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