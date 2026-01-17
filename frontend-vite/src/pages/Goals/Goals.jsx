/**
 * Goals Component
 * Track and manage learning goals with progress visualization, milestones, and quick progress updates
 */

import React, { useState, useEffect } from 'react'
import { Plus, Target, Calendar, TrendingUp, Edit2, Trash2, CheckCircle2, ChevronRight, ChevronDown, Award, AlertCircle, Zap, Bell, Share2, Lightbulb, Users, X } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import Input from '../../components/UI/Input'
import { useGoalTracker } from '../../contexts/GoalTrackerContext'
import { useNotification } from '../../contexts/NotificationContext'

const Goals = () => {
  const { goals, loading, error, loadGoals, createGoal, updateGoal, deleteGoal, updateProgress, getGoalStats } = useGoalTracker()
  const { success, error: showError, warning } = useNotification()
  
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [expandedGoals, setExpandedGoals] = useState({})
  const [presets, setPresets] = useState([])
  const [catchUpSuggestions, setCatchUpSuggestions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showCatchUpModal, setShowCatchUpModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedGoalForShare, setSelectedGoalForShare] = useState(null)
  const [guardians, setGuardians] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'hours',
    target: '',
    period: 'daily',
    targetDate: '',
    progressUnit: 'hours',
    category: 'personal',
    milestones: [],
    linkedSubjects: [],
  })

  useEffect(() => {
    loadGoals()
    loadPresets()
    loadCatchUpSuggestions()
    loadNotifications()
    loadGuardians()
  }, [loadGoals])

  const loadPresets = async () => {
    try {
      const response = await api.presets.list()
      if (response.success) {
        setPresets(response.data)
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const loadCatchUpSuggestions = async () => {
    try {
      const response = await api.goals.getCatchUpSuggestions()
      if (response.success) {
        // Flatten the suggestions from nested format
        const allSuggestions = []
        const suggestions = response.suggestions || []
        suggestions.forEach(goalData => {
          if (goalData.suggestions && Array.isArray(goalData.suggestions)) {
            goalData.suggestions.forEach(suggestion => {
              allSuggestions.push({
                ...suggestion,
                goalId: goalData.goalId,
                goalTitle: goalData.goalTitle
              })
            })
          } else if (goalData.type && goalData.suggestion) {
            // Handle flat format from mock API
            allSuggestions.push(goalData)
          }
        })
        setCatchUpSuggestions(allSuggestions)
      }
    } catch (error) {
      console.error('Failed to load catch-up suggestions:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await api.goals.getNotifications()
      if (response.success) {
        setNotifications(response.notifications || [])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  const loadGuardians = async () => {
    try {
      const response = await api.profile.getGuardians()
      if (response?.guardians) {
        setGuardians(response.guardians)
      } else if (response?.data) {
        setGuardians(response.data)
      }
    } catch (error) {
      console.error('Failed to load guardians:', error)
    }
  }

  const handleShareWithGuardian = async (goalId, guardianId) => {
    try {
      const response = await api.goals.shareWithGuardian(goalId, guardianId, 'progress', true)
      if (response.success) {
        success('Goal shared with guardian successfully!')
        setShowShareModal(false)
        setSelectedGoalForShare(null)
      }
    } catch (error) {
      showError('Failed to share goal with guardian')
    }
  }

  const addMilestoneToForm = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          title: '',
          target: '',
          dueDate: formData.targetDate || '',
          description: ''
        }
      ]
    })
  }

  const updateMilestone = (index, field, value) => {
    const updatedMilestones = [...formData.milestones]
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value }
    setFormData({ ...formData, milestones: updatedMilestones })
  }

  const removeMilestone = (index) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Convert target to number and ensure progressUnit is set
      // Map targetDate to dueDate for backend compatibility
      const { targetDate, milestones, ...rest } = formData
      
      // Process milestones - filter out empty ones and ensure proper types
      const processedMilestones = (milestones || []).filter(m => m.title && m.title.trim()).map(m => ({
        title: m.title.trim(),
        target: Number(m.target) || 0,
        dueDate: m.dueDate || targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: m.description || ''
      }))
      
      const goalData = {
        ...rest,
        target: Number(formData.target),
        progressUnit: formData.progressUnit || formData.type || 'hours',
        dueDate: targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestones: processedMilestones
      }
      
      console.log('Submitting goal data:', goalData)
      
      if (editingGoal) {
        const goalId = editingGoal._id || editingGoal.id
        await updateGoal(goalId, goalData)
        success('Goal updated successfully!')
      } else {
        const newGoal = await createGoal(goalData)
        console.log('Goal created:', newGoal)
        success('Goal created successfully!')
      }
      
      setShowModal(false)
      setEditingGoal(null)
      resetForm()
      // Reload goals to ensure we have the latest data
      loadGoals()
    } catch (err) {
      console.error('Goal save error:', err)
      showError(err.response?.data?.error || err.message || 'Failed to save goal')
    }
  }

  // Helper to format date for input[type=date]
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return ''
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description,
      type: goal.type || 'hours',
      target: goal.target || goal.targetValue || '',
      period: goal.period || 'daily',
      targetDate: formatDateForInput(goal.dueDate || goal.targetDate),
      progressUnit: goal.progressUnit || 'hours',
      category: goal.category || 'personal',
      milestones: (goal.milestones || []).map(m => ({
        ...m,
        dueDate: formatDateForInput(m.dueDate)
      })),
      linkedSubjects: goal.linkedSubjects || [],
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
      type: 'hours',
      target: '',
      period: 'daily',
      targetDate: '',
      progressUnit: 'hours',
      category: 'personal',
      milestones: [],
    })
  }

  const getProgressPercentage = (goal) => {
    if (!goal) return 0
    const current = goal.currentValue ?? goal.currentProgress ?? 0
    const target = goal.targetValue ?? goal.target ?? 1
    if (target === 0) return 0
    return Math.min(100, Math.round((current / target) * 100))
  }

  // Format progress value to avoid floating point display issues
  const formatProgress = (value) => {
    if (value === null || value === undefined) return 0
    const num = Number(value)
    // Round to 2 decimal places and remove trailing zeros
    return Number(num.toFixed(2))
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

      {/* Catch-Up Suggestions Alert */}
      {catchUpSuggestions && catchUpSuggestions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  {catchUpSuggestions.length} Catch-Up Suggestion{catchUpSuggestions.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Some goals are behind schedule. Click to view suggestions to get back on track.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCatchUpModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Suggestions
            </button>
          </div>
        </div>
      )}

      {/* Notifications Alert */}
      {notifications && notifications.filter(n => !n.read).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-700 dark:text-blue-300">
              You have {notifications.filter(n => !n.read).length} new notification{notifications.filter(n => !n.read).length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
          <button 
            onClick={loadGoals}
            className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Goals List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.isArray(goals) && goals.length > 0 && goals.map((goal) => {
          if (!goal) return null
          const progress = getProgressPercentage(goal)
          const color = getCategoryColor(goal.category)
          const goalId = goal._id || goal.id;
          
          return (
            <div
              key={goalId || Math.random()}
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
                    onClick={() => {
                      setSelectedGoalForShare(goal)
                      setShowShareModal(true)
                    }}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Share with Guardian"
                  >
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleEdit(goal)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(goalId)}
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
                    {formatProgress(goal.currentValue ?? goal.currentProgress ?? 0)} / {formatProgress(goal.targetValue ?? goal.target ?? 0)} {goal.unit || goal.progressUnit}
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
                  onClick={() => handleQuickProgress(goalId, 1)}
                  className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  +1
                </button>
                <button
                  onClick={() => handleQuickProgress(goalId, 5)}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  +5
                </button>
                <button
                  onClick={() => {
                    const custom = prompt(`Add custom progress (${goal.unit || goal.progressUnit}):`)
                    if (custom && !isNaN(custom)) {
                      handleQuickProgress(goalId, parseInt(custom))
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
                  <span>Target: {(goal.targetDate || goal.dueDate) ? new Date(goal.targetDate || goal.dueDate).toLocaleDateString() : 'No deadline'}</span>
                </div>
                {(() => {
                  const stats = getGoalStats(goal)
                  if (!stats || stats.daysRemaining === null) return null
                  return (
                    <span className={stats.daysRemaining < 7 ? 'text-orange-600 dark:text-orange-400 font-medium' : ''}>
                      {stats.daysRemaining > 0 
                        ? `${stats.daysRemaining} days left`
                        : 'Overdue'}
                    </span>
                  )
                })()}
              </div>

              {/* Milestones */}
              {goal.milestones && Array.isArray(goal.milestones) && goal.milestones.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => toggleGoalExpand(goalId)}
                    className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <span className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Milestones ({getGoalStats(goal)?.completedMilestones || 0}/{goal.milestones.length})
                    </span>
                    {expandedGoals[goalId] ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {expandedGoals[goalId] && (
                    <div className="space-y-2 pl-1">
                      {goal.milestones.map((milestone, index) => (
                        <div key={milestone._id || milestone.id || index} className="flex items-start space-x-2 text-sm">
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
                            {(milestone.target || milestone.targetProgress) && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                (at {milestone.target || milestone.targetProgress} {goal.unit || goal.progressUnit})
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
      )}

      {/* Empty State */}
      {!loading && !error && goals.length === 0 && (
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
            type: 'hours',
            target: '',
            period: 'daily',
            targetDate: '',
            progressUnit: 'hours',
            category: 'personal',
            milestones: [],
            linkedSubjects: [],
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
            <div>
              <label className="label">Goal Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                required
              >
                <option value="hours">Time-Based (Hours)</option>
                <option value="sessions">Sessions Count</option>
                <option value="tasks">Tasks/Assignments</option>
                <option value="streak">Daily Streak</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <Input
              label="Target Value"
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: e.target.value })}
              required
              placeholder="40"
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Progress Unit</label>
              <select
                value={formData.progressUnit}
                onChange={(e) => setFormData({ ...formData, progressUnit: e.target.value })}
                className="input"
                required
              >
                <option value="hours">Hours</option>
                <option value="minutes">Minutes</option>
                <option value="sessions">Sessions</option>
                <option value="tasks">Tasks</option>
                <option value="points">Points</option>
                <option value="days">Days</option>
              </select>
            </div>

            <div>
              <label className="label">Period</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="input"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="lifetime">Lifetime</option>
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
              <option value="academic">Academic</option>
              <option value="personal">Personal</option>
              <option value="professional">Professional</option>
              <option value="health">Health</option>
              <option value="skill">Skill Development</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Milestones Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Milestones (Optional)</label>
              <button
                type="button"
                onClick={addMilestoneToForm}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Break your goal into smaller milestones to track progress
            </p>
            {formData.milestones && formData.milestones.length > 0 && (
              <div className="space-y-3 mb-3">
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={milestone.title}
                        onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        placeholder="Milestone title"
                        className="input text-sm"
                      />
                      <input
                        type="number"
                        value={milestone.target || ''}
                        onChange={(e) => updateMilestone(index, 'target', e.target.value)}
                        placeholder="At progress"
                        className="input text-sm"
                        min="1"
                      />
                      <input
                        type="date"
                        value={milestone.dueDate || ''}
                        onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Linked Subjects/Presets (Optional)</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Select which subjects or timer presets this goal tracks
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
              {presets.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No presets available. Create timer presets in the Focus page.</p>
              ) : (
                presets.map((preset) => (
                  <label key={preset._id || preset.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.linkedSubjects.includes(preset.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            linkedSubjects: [...formData.linkedSubjects, preset.name]
                          })
                        } else {
                          setFormData({
                            ...formData,
                            linkedSubjects: formData.linkedSubjects.filter(s => s !== preset.name)
                          })
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="flex items-center space-x-2">
                      <span className="text-xl">{preset.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{preset.name}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {formData.linkedSubjects.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.linkedSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          linkedSubjects: formData.linkedSubjects.filter(s => s !== subject)
                        })
                      }}
                      className="ml-1 hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
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

      {/* Catch-Up Suggestions Modal */}
      <Modal
        isOpen={showCatchUpModal}
        onClose={() => setShowCatchUpModal(false)}
        title="Catch-Up Suggestions"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Here are some suggestions to help you get back on track with your goals:
          </p>
          {catchUpSuggestions && catchUpSuggestions.length > 0 ? (
            <div className="space-y-3">
              {catchUpSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          suggestion.type === 'schedule' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          suggestion.type === 'intensity' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {suggestion.type}
                        </span>
                        {suggestion.difficulty && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            suggestion.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            suggestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {suggestion.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{suggestion.suggestion}</p>
                      {suggestion.impact && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Impact: {suggestion.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                All goals are on track! Keep up the great work!
              </p>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowCatchUpModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share with Guardian Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false)
          setSelectedGoalForShare(null)
        }}
        title="Share Goal with Guardian"
      >
        <div className="space-y-4">
          {selectedGoalForShare && (
            <>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white">{selectedGoalForShare.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {formatProgress(selectedGoalForShare.currentValue ?? selectedGoalForShare.currentProgress ?? 0)} / {formatProgress(selectedGoalForShare.targetValue ?? selectedGoalForShare.target ?? 0)} {selectedGoalForShare.unit || selectedGoalForShare.progressUnit}
                </p>
              </div>

              <div>
                <label className="label">Select Guardian/Teacher</label>
                {guardians && guardians.length > 0 ? (
                  <div className="space-y-2">
                    {guardians.map((guardian) => (
                      <label
                        key={guardian._id || guardian.id || guardian.email}
                        className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="guardian"
                          value={guardian._id || guardian.id || guardian.email}
                          className="w-4 h-4 text-primary-600"
                        />
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{guardian.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{guardian.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No guardians connected. Add a guardian in your profile settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent"
                    className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    I consent to sharing my goal progress, including milestones and completion status, with the selected guardian. They will be able to view my progress but cannot modify goals.
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowShareModal(false)
                    setSelectedGoalForShare(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const consent = document.getElementById('consent')?.checked
                    const selected = document.querySelector('input[name="guardian"]:checked')?.value
                    if (!consent) {
                      showError('Please provide consent to share')
                      return
                    }
                    if (!selected && guardians && guardians.length > 0) {
                      showError('Please select a guardian')
                      return
                    }
                    handleShareWithGuardian(selectedGoalForShare._id || selectedGoalForShare.id, selected)
                  }}
                  disabled={!guardians || guardians.length === 0}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Goal
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Goals
