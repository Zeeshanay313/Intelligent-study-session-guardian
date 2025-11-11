import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const ReminderPopup = ({ reminder, onSnooze, onDismiss, onComplete, onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(reminder?.sound?.enabled !== false);
  const [alarmInterval, setAlarmInterval] = useState(null);

  useEffect(() => {
    // Play alarm sound immediately and repeat every 3 seconds until dismissed
    console.log('🔔 ReminderPopup mounted, starting repeating alarm...');
    if (soundEnabled) {
      // Play immediately
      playAlarmSound(reminder?.sound?.type || 'alarm');
      
      // Then repeat every 3 seconds
      const interval = setInterval(() => {
        console.log('🔁 Repeating alarm sound...');
        playAlarmSound(reminder?.sound?.type || 'alarm');
      }, 3000); // Repeat every 3 seconds
      
      setAlarmInterval(interval);
    }

    // Cleanup: stop alarm when component unmounts
    return () => {
      if (alarmInterval) {
        console.log('🛑 Stopping alarm sound');
        clearInterval(alarmInterval);
      }
    };
  }, []);

  const playAlarmSound = (soundType) => {
    try {
      console.log('🔊 Playing alarm sound:', soundType);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // ALARM sequences - more urgent and attention-grabbing
      const alarmSequences = {
        default: [
          { freq: 880, duration: 0.15 },   // A5
          { freq: 1046.50, duration: 0.15 }, // C6
          { freq: 1318.51, duration: 0.15 }, // E6
          { freq: 1046.50, duration: 0.15 }, // C6
          { freq: 880, duration: 0.3 }       // A5 (longer)
        ],
        bell: [
          { freq: 987.77, duration: 0.2 },   // B5
          { freq: 1174.66, duration: 0.2 },  // D6
          { freq: 1318.51, duration: 0.4 }   // E6 (longer)
        ],
        chime: [
          { freq: 523.25, duration: 0.15 },  // C5
          { freq: 659.25, duration: 0.15 },  // E5
          { freq: 783.99, duration: 0.15 },  // G5
          { freq: 1046.50, duration: 0.3 }   // C6 (longer)
        ],
        alarm: [
          { freq: 1046.50, duration: 0.1 },  // C6 - fast urgent beeps
          { freq: 1318.51, duration: 0.1 },  // E6
          { freq: 1046.50, duration: 0.1 },  // C6
          { freq: 1318.51, duration: 0.1 },  // E6
          { freq: 1568.00, duration: 0.3 }   // G6 (longer urgent)
        ]
      };
      
      const sequence = alarmSequences[soundType] || alarmSequences.alarm;
      let time = audioContext.currentTime;
      
      // Play each note in sequence
      sequence.forEach((note, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(note.freq, time);
        osc.type = 'sine';
        
        // Sharp attack, sustained, then quick release for alarm effect
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.4, time + 0.02); // Fast attack
        gain.gain.setValueAtTime(0.4, time + note.duration - 0.05); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration); // Quick release
        
        osc.start(time);
        osc.stop(time + note.duration);
        
        time += note.duration + 0.05; // Small gap between notes
      });

      console.log('✅ Alarm sound played successfully');
    } catch (error) {
      console.error('❌ Audio notification failed:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-gray-300 bg-white dark:bg-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const snoozeDurations = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 }
  ];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`w-96 rounded-lg shadow-2xl border-l-4 ${getPriorityColor(reminder.priority)} overflow-hidden`}>
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className={`h-5 w-5 text-white ${soundEnabled ? 'animate-bounce' : ''}`} />
            <span className="text-white font-semibold">
              Study Reminder {soundEnabled && '🔊'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                // Stop the alarm when toggling sound off
                if (soundEnabled && alarmInterval) {
                  clearInterval(alarmInterval);
                  setAlarmInterval(null);
                } else {
                  // Start alarm when toggling sound on
                  playAlarmSound(reminder.sound?.type || 'alarm');
                  const interval = setInterval(() => {
                    playAlarmSound(reminder.sound?.type || 'alarm');
                  }, 3000);
                  setAlarmInterval(interval);
                }
                setSoundEnabled(!soundEnabled);
              }}
              className="text-white hover:text-gray-200 transition-colors"
              title={soundEnabled ? 'Mute alarm' : 'Unmute alarm'}
            >
              {soundEnabled ? (
                <SpeakerWaveIcon className="h-5 w-5 animate-pulse" />
              ) : (
                <SpeakerXMarkIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => {
                // Stop alarm when closed
                if (alarmInterval) {
                  clearInterval(alarmInterval);
                  setAlarmInterval(null);
                }
                onClose();
              }}
              className="text-white hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Priority Badge */}
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(reminder.priority)}`}>
              {reminder.priority?.toUpperCase()} PRIORITY
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {reminder.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {reminder.title}
          </h3>

          {/* Custom Message */}
          {reminder.customMessage && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {reminder.customMessage}
            </p>
          )}

          {/* Time Info */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>
              {reminder.type === 'recurring'
                ? `Recurring ${reminder.recurring?.frequency}`
                : new Date(reminder.datetime).toLocaleString()}
            </span>
          </div>

          {/* Snooze Options */}
          <div className="mb-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Snooze for:</p>
            <div className="grid grid-cols-3 gap-2">
              {snoozeDurations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => {
                    // Stop alarm when snoozed
                    if (alarmInterval) {
                      clearInterval(alarmInterval);
                      setAlarmInterval(null);
                    }
                    onSnooze(reminder._id, duration.value);
                  }}
                  className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => {
                // Stop alarm when completed
                if (alarmInterval) {
                  clearInterval(alarmInterval);
                  setAlarmInterval(null);
                }
                onComplete(reminder._id);
              }}
              className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              Complete
            </button>
            <button
              onClick={() => {
                // Stop alarm when dismissed
                if (alarmInterval) {
                  clearInterval(alarmInterval);
                  setAlarmInterval(null);
                }
                onDismiss(reminder._id);
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Footer - Recurring Info */}
        {reminder.type === 'recurring' && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              🔄 This reminder repeats {reminder.recurring?.frequency}
              {reminder.recurring?.nextTrigger && 
                ` · Next: ${new Date(reminder.recurring.nextTrigger).toLocaleString()}`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderPopup;
