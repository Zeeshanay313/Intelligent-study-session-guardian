import React, { useState, useEffect } from 'react';
import { getSuggestion } from '../../services/sessionsApi';

const SessionEndModal = ({ 
  isOpen, 
  onClose, 
  sessionData, 
  playAudio = true,
  onAcceptSuggestion 
}) => {
  const [suggestion, setSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSuggestion();
      
      if (playAudio) {
        playCompletionSound();
      }
    }
  }, [isOpen, playAudio]);

  const loadSuggestion = async () => {
    try {
      setLoadingSuggestion(true);
      const data = await getSuggestion({ limit: 5 });
      setSuggestion(data);
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setSuggestion({
        suggestedBreakMinutes: 5,
        confidence: 'low',
        reason: 'Using default suggestion.'
      });
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const playCompletionSound = () => {
    try {
      // Note: Audio file should be placed in public/assets/session-end.mp3
      const audio = new Audio('/assets/session-end.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.warn('Could not play audio:', err);
      });
    } catch (error) {
      console.warn('Audio playback error:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[confidence] || colors.low;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">🎉 Session Complete!</h2>
          <p className="text-green-100 mt-1">Great job staying focused</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Session Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Session Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Duration</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatDuration(sessionData?.durationSeconds || 0)}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500">Preset</div>
                <div className="text-lg font-bold text-gray-900">
                  {sessionData?.presetName || 'Quick Session'}
                </div>
              </div>

              {sessionData?.todayCount && (
                <div>
                  <div className="text-sm text-gray-500">Today&apos;s Sessions</div>
                  <div className="text-lg font-bold text-green-600">
                    {sessionData.todayCount}
                  </div>
                </div>
              )}

              {suggestion?.streak > 0 && (
                <div>
                  <div className="text-sm text-gray-500">Streak (24h)</div>
                  <div className="text-lg font-bold text-orange-600">
                    🔥 {suggestion.streak}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Break Suggestion */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-blue-900">💡 Recommended Break</h3>
              {suggestion && (
                <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceBadge(suggestion.confidence)}`}>
                  {suggestion.confidence} confidence
                </span>
              )}
            </div>

            {loadingSuggestion ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {suggestion?.suggestedBreakMinutes || 5} minutes
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  {suggestion?.reason || 'Take a break to recharge.'}
                </p>

                {onAcceptSuggestion && (
                  <button
                    onClick={() => {
                      onAcceptSuggestion(suggestion.suggestedBreakMinutes);
                      onClose();
                    }}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Start {suggestion?.suggestedBreakMinutes || 5}-Minute Break
                  </button>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionEndModal;
