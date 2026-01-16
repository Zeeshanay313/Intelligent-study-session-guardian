/**
 * Goal Selection Modal
 * 
 * Allows users to select a goal before starting a focus session.
 * The timer session will automatically update the selected goal's progress.
 */

import React, { useState, useEffect } from 'react'
import { Target, Clock, TrendingUp, X, CheckCircle2 } from 'lucide-react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import api from '../../services/api'

const GoalSelectionModal = ({ isOpen, onClose, onSelectGoal, onSkip }) => {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadGoals()
    }
  }, [isOpen])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const response = await api.goals.list()
      // Filter for active goals only
      const activeGoals = (response.goals || response.data || []).filter(
        g => g.status === 'active' && g.type === 'hours'
      )
      setGoals(activeGoals)
    } catch (error) {
      console.error('Failed to load goals:', error)
      setGoals([])
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = (goal) => {
    const current = goal.currentProgress ?? goal.currentValue ?? 0
    const target = goal.target ?? goal.targetValue ?? 1
    return Math.min(100, Math.round((current / target) * 100))
  }

  const handleConfirm = () => {
    const selectedGoal = goals.find(g => (g._id || g.id) === selectedGoalId)
    if (selectedGoal) {
      onSelectGoal(selectedGoal)
    }
    onClose()
  }

  const handleSkip = () => {
    onSkip()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select a Goal for This Session"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Choose a goal to track progress for this focus session. Your session time will automatically be added to the goal's progress.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No time-based goals available
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Create a goal with "hours" type to track your focus sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {goals.map((goal) => {
              const goalId = goal._id || goal.id
              const progress = getProgressPercentage(goal)
              const isSelected = selectedGoalId === goalId
              const current = goal.currentProgress ?? goal.currentValue ?? 0
              const target = goal.target ?? goal.targetValue ?? 0

              return (
                <button
                  key={goalId}
                  onClick={() => setSelectedGoalId(goalId)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {goal.title}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {current.toFixed(1)} / {target} {goal.progressUnit || 'hours'}
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {progress}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 dark:bg-primary-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSkip}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
          >
            Skip, start without goal
          </button>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedGoalId}
            >
              <Target className="w-4 h-4 mr-2" />
              Start with Goal
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default GoalSelectionModal
