import React from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon 
} from '@heroicons/react/24/outline';

const TimerControls = ({
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  disabled = false
}) => {
  const handlePause = () => {
    if (onPause) onPause();
  };

  const handleResume = () => {
    if (onResume) onResume();
  };

  const handleStop = () => {
    if (onStop) onStop();
  };

  const handleStart = () => {
    if (onStart) onStart();
  };

  return (
    <div className="flex items-center justify-center space-x-4">
      {!isRunning ? (
        <button
          onClick={handleStart}
          disabled={disabled}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <PlayIcon className="w-5 h-5 mr-2" />
          Start
        </button>
      ) : (
        <>
          {isPaused ? (
            <button
              onClick={handleResume}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
            >
              <PauseIcon className="w-5 h-5 mr-2" />
              Pause
            </button>
          )}

          <button
            onClick={handleStop}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <StopIcon className="w-5 h-5 mr-2" />
            Stop
          </button>
        </>
      )}
    </div>
  );
};

export default TimerControls;