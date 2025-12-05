/**
 * SessionEndModal Component
 * Displays session completion with audio, suggestions, and streak tracking
 */

import React, { useState, useEffect } from 'react'
import { CheckCircle2, Trophy, Flame, Clock, TrendingUp, X } from 'lucide-react'
import Button from '../UI/Button'
import Modal from '../UI/Modal'

const SessionEndModal = ({
  isOpen,
  onClose,
  sessionData,
  playAudio = true,
  onAcceptSuggestion,
}) => {
  const [suggestion, setSuggestion] = useState(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadSuggestion()

      if (playAudio) {
        playCompletionSound()
      }
    }
  }, [isOpen, playAudio])

  const loadSuggestion = async () => {
    try {
      setLoadingSuggestion(true)
      
      // Calculate suggestion based on session data
      const duration = sessionData?.durationSeconds || 1500 // 25 min default
      const todayCount = sessionData?.todayCount || 1
      
      let suggestedBreakMinutes = 5
      let confidence = 'medium'
      let reason = 'Standard break time recommended.'
      
      if (duration >= 3000) { // 50+ minutes
        suggestedBreakMinutes = 15
        confidence = 'high'
        reason = 'Long session completed! Take a longer break to recharge.'
      } else if (duration >= 1800) { // 30+ minutes
        suggestedBreakMinutes = 10
        confidence = 'high'
        reason = 'Great focus! A moderate break will help maintain productivity.'
      } else if (todayCount >= 4) {
        suggestedBreakMinutes = 10
        confidence = 'high'
        reason = 'You\'ve completed multiple sessions today. Take a longer break.'
      }
      
      setSuggestion({
        suggestedBreakMinutes,
        confidence,
        reason,
        streak: sessionData?.streak || 0
      })
    } catch (error) {
      console.error('Error loading suggestion:', error)
      setSuggestion({
        suggestedBreakMinutes: 5,
        confidence: 'low',
        reason: 'Using default suggestion.',
        streak: 0
      })
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const playCompletionSound = () => {
    try {
      // Create a simple success sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('Audio playback error:', error)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    }
    return colors[confidence] || colors.low
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 -m-6 mb-6 rounded-t-xl">
        <div className="flex items-center justify-center mb-3">
          <CheckCircle2 className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-center">🎉 Session Complete!</h2>
        <p className="text-green-100 text-center mt-2">Great job staying focused</p>
      </div>

      {/* Session Summary */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Session Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Duration
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatDuration(sessionData?.durationSeconds || 0)}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Trophy className="w-4 h-4 mr-1" />
              Preset
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {sessionData?.presetName || 'Quick Session'}
            </div>
          </div>

          {sessionData?.todayCount && (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                Today's Sessions
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {sessionData.todayCount}
              </div>
            </div>
          )}

          {suggestion?.streak > 0 && (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Flame className="w-4 h-4 mr-1" />
                Streak
              </div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center">
                🔥 {suggestion.streak}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Break Suggestion */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">
            💡 Recommended Break
          </h3>
          {suggestion && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${getConfidenceBadge(
                suggestion.confidence
              )}`}
            >
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
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {suggestion?.suggestedBreakMinutes || 5} minutes
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              {suggestion?.reason || 'Take a break to recharge.'}
            </p>

            {onAcceptSuggestion && (
              <button
                onClick={() => {
                  onAcceptSuggestion(suggestion.suggestedBreakMinutes)
                  onClose()
                }}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Start {suggestion?.suggestedBreakMinutes || 5} Min Break
              </button>
            )}
          </>
        )}
      </div>

      {/* Motivational message */}
      <div className="text-center mb-4">
        <p className="text-gray-600 dark:text-gray-400 italic">
          "Success is the sum of small efforts, repeated day in and day out."
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button
          onClick={() => {
            onClose()
            // Could trigger another session here
          }}
          className="flex-1"
        >
          Start Another Session
        </Button>
      </div>
    </Modal>
  )
}

export default SessionEndModal
