/**
 * Goals Component
 * Track and manage learning goals with progress visualization, milestones, and quick progress updates
 */

import React, { useState, useEffect } from 'react'
import { Plus, Target, Calendar, TrendingUp, Edit2, Trash2, CheckCircle2, ChevronRight, ChevronDown, Award, AlertCircle, Zap } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import Input from '../../components/UI/Input'
import { useGoalTracker } from '../../contexts/GoalTrackerContext'
import { useNotification } from '../../contexts/NotificationContext'

const Goals = () => {
  const { goals, loading, loadGoals, createGoal, updateGoal, deleteGoal, updateProgress, getGoalStats } = useGoalTracker()
  const { success, error: showError, warning } = useNotification()
  
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [expandedGoals, setExpandedGoals] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    targetValue: '',
    unit: 'hours',
    category: 'learning',
    milestones: [],
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, formData)
        success('Goal updated successfully!')
      } else {
        await createGoal(formData)
        success('Goal created successfully!')
      }
      
      setShowModal(false)
      setEditingGoal(null)
      resetForm()
    } catch (err) {
      showError('Failed to save goal')
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      targetValue: goal.targetValue,
      unit: goal.unit,
      category: goal.category,
      milestones: goal.milestones || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) return
    
    try {
      await deleteGoal(goalId)
      success('Goal deleted successfully')
    } catch (err) {
      showError('Failed to delete goal')
    }
  }

  const handleQuickProgress = async (goalId, amount) => {
    try {
      await updateProgress(goalId, amount)
      success(`Added ${amount} to progress!`)
    } catch (err) {
      showError('Failed to update progress')
    }
  }

  const toggleGoalExpand = (goalId) => {
    setExpandedGoals(prev => ({ ...prev, [goalId]: !prev[goalId] }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetDate: '',
      targetValue: '',
      unit: 'hours',
      category: 'learning',
      milestones: [],
    })
  }

  const getProgressPercentage = (goal) => {
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  }

  const getCategoryColor = (category) => {
    const colors = {
      learning: 'blue',
      study: 'green',
      reading: 'purple',
      programming: 'orange',
      general: 'gray',
    }
    return colors[category] || 'gray'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set and track your learning objectives
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Goals</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {goals.filter(g => g.status === 'active').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {goals.filter(g => g.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = getProgressPercentage(goal)
          const color = getCategoryColor(goal.category)
          
          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300`}>
                      {goal.category}
                    </span>
                    {goal.status === 'completed' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {goal.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {progress}% complete
                  </p>
                  {getGoalStats(goal)?.isOverdue && (
                    <span className="text-xs text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Progress Buttons */}
              <div className="flex items-center space-x-2 mb-3">
                <button
                  onClick={() => handleQuickProgress(goal.id, 1)}
                  className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  +1
                </button>
                <button
                  onClick={() => handleQuickProgress(goal.id, 5)}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  +5
                </button>
                <button
                  onClick={() => {
                    const custom = prompt(`Add custom progress (${goal.unit}):`)
                    if (custom && !isNaN(custom)) {
                      handleQuickProgress(goal.id, parseInt(custom))
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Custom
                </button>
              </div>

              {/* Target Date */}
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                </div>
                {getGoalStats(goal)?.daysRemaining !== null && (
                  <span className={getGoalStats(goal).daysRemaining < 7 ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                    {getGoalStats(goal).daysRemaining > 0 
                      ? `${getGoalStats(goal).daysRemaining} days left`
                      : 'Overdue'}
                  </span>
                )}
              </div>

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toggleGoalExpand(goal.id)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <span className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Milestones ({getGoalStats(goal)?.completedMilestones || 0}/{goal.milestones.length})
                    </span>
                    {expandedGoals[goal.id] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedGoals[goal.id] && (
                    <div className="space-y-2 pl-1">
                      {goal.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start space-x-2 text-sm">
                          <CheckCircle2
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              milestone.completed
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                          <div className="flex-1">
                            <span
                              className={
                                milestone.completed
                                  ? 'line-through text-gray-500 dark:text-gray-400'
                                  : 'text-gray-700 dark:text-gray-300'
                              }
                            >
                              {milestone.title}
                            </span>
                            {milestone.targetProgress && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                (at {milestone.targetProgress} {goal.unit})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {goals.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start by creating your first learning goal
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Goal
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingGoal(null)
          setFormData({
            title: '',
            description: '',
            targetDate: '',
            targetValue: '',
            unit: 'hours',
            category: 'learning',
          })
        }}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Complete React Course"
          />

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Describe your goal..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Value"
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              required
              placeholder="40"
            />

            <div>
              <label className="label">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="input"
              >
                <option value="hours">Hours</option>
                <option value="sessions">Sessions</option>
                <option value="pages">Pages</option>
                <option value="chapters">Chapters</option>
              </select>
            </div>
          </div>

          <Input
            label="Target Date"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            required
          />

          <div>
            <label className="label">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            >
              <option value="learning">Learning</option>
              <option value="study">Study</option>
              <option value="reading">Reading</option>
              <option value="programming">Programming</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingGoal(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Goals
