/**
 * GoalTrackerContext
 * Comprehensive goal management with milestones and privacy settings
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'

const GoalTrackerContext = createContext()

export const GoalTrackerProvider = ({ children }) => {
  const [goals, setGoals] = useState([])
  const [currentGoal, setCurrentGoal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load all goals
  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.goals.list()
      setGoals(response.goals || [])
    } catch (err) {
      console.error('Error loading goals:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load single goal with milestones
  const loadGoal = useCallback(async (goalId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.goals.get(goalId)
      setCurrentGoal(response.data)
      return response.data
    } catch (err) {
      console.error('Error loading goal:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new goal
  const createGoal = useCallback(
    async (goalData) => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.goals.create(goalData)
        setGoals((prev) => [...prev, response.data])
        return response.data
      } catch (err) {
        console.error('Error creating goal:', err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Update goal
  const updateGoal = useCallback(
    async (goalId, updates) => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.goals.update(goalId, updates)
        
        setGoals((prev) =>
          prev.map((goal) => (goal.id === goalId ? response.data : goal))
        )
        
        if (currentGoal?.id === goalId) {
          setCurrentGoal(response.data)
        }
        
        return response.data
      } catch (err) {
        console.error('Error updating goal:', err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentGoal]
  )

  // Update goal progress
  const updateProgress = useCallback(
    async (goalId, progressChange, options = {}) => {
      try {
        const goal = goals.find((g) => g.id === goalId) || currentGoal
        if (!goal) return

        const newProgress = Math.max(
          0,
          Math.min(goal.targetValue, (goal.currentProgress || 0) + progressChange)
        )

        const updates = {
          currentProgress: newProgress,
          lastUpdated: new Date().toISOString(),
        }

        // Add to progress history
        if (options.addToHistory !== false) {
          const historyEntry = {
            timestamp: new Date().toISOString(),
            progress: newProgress,
            change: progressChange,
            note: options.note || '',
          }
          updates.progressHistory = [...(goal.progressHistory || []), historyEntry]
        }

        return await updateGoal(goalId, updates)
      } catch (err) {
        console.error('Error updating progress:', err)
        throw err
      }
    },
    [goals, currentGoal, updateGoal]
  )

  // Add milestone to goal
  const addMilestone = useCallback(
    async (goalId, milestoneData) => {
      try {
        const goal = goals.find((g) => g.id === goalId) || currentGoal
        if (!goal) return

        const newMilestone = {
          id: Date.now().toString(),
          title: milestoneData.title,
          targetProgress: milestoneData.targetProgress,
          completed: false,
          completedAt: null,
          ...milestoneData,
        }

        const updates = {
          milestones: [...(goal.milestones || []), newMilestone],
        }

        return await updateGoal(goalId, updates)
      } catch (err) {
        console.error('Error adding milestone:', err)
        throw err
      }
    },
    [goals, currentGoal, updateGoal]
  )

  // Toggle milestone completion
  const toggleMilestone = useCallback(
    async (goalId, milestoneId) => {
      try {
        const goal = goals.find((g) => g.id === goalId) || currentGoal
        if (!goal) return

        const updatedMilestones = goal.milestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                completed: !m.completed,
                completedAt: !m.completed ? new Date().toISOString() : null,
              }
            : m
        )

        return await updateGoal(goalId, { milestones: updatedMilestones })
      } catch (err) {
        console.error('Error toggling milestone:', err)
        throw err
      }
    },
    [goals, currentGoal, updateGoal]
  )

  // Delete milestone
  const deleteMilestone = useCallback(
    async (goalId, milestoneId) => {
      try {
        const goal = goals.find((g) => g.id === goalId) || currentGoal
        if (!goal) return

        const updatedMilestones = goal.milestones.filter((m) => m.id !== milestoneId)

        return await updateGoal(goalId, { milestones: updatedMilestones })
      } catch (err) {
        console.error('Error deleting milestone:', err)
        throw err
      }
    },
    [goals, currentGoal, updateGoal]
  )

  // Delete goal
  const deleteGoal = useCallback(
    async (goalId) => {
      try {
        setLoading(true)
        setError(null)
        await api.goals.delete(goalId)
        setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
        
        if (currentGoal?.id === goalId) {
          setCurrentGoal(null)
        }
      } catch (err) {
        console.error('Error deleting goal:', err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentGoal]
  )

  // Privacy settings
  const updatePrivacySettings = useCallback(
    async (goalId, privacySettings) => {
      try {
        return await updateGoal(goalId, { privacySettings })
      } catch (err) {
        console.error('Error updating privacy settings:', err)
        throw err
      }
    },
    [updateGoal]
  )

  // Calculate goal statistics
  const getGoalStats = useCallback((goal) => {
    if (!goal) return null

    const progress = goal.currentProgress || 0
    const target = goal.targetValue || 1
    const percentage = Math.min(100, Math.round((progress / target) * 100))

    const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length
    const totalMilestones = (goal.milestones || []).length

    const daysRemaining = goal.deadline
      ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    const isOverdue = daysRemaining !== null && daysRemaining < 0

    return {
      percentage,
      completedMilestones,
      totalMilestones,
      daysRemaining,
      isOverdue,
      isCompleted: progress >= target,
    }
  }, [])

  return (
    <GoalTrackerContext.Provider
      value={{
        goals,
        currentGoal,
        loading,
        error,
        loadGoals,
        loadGoal,
        createGoal,
        updateGoal,
        updateProgress,
        addMilestone,
        toggleMilestone,
        deleteMilestone,
        deleteGoal,
        updatePrivacySettings,
        getGoalStats,
      }}
    >
      {children}
    </GoalTrackerContext.Provider>
  )
}

export const useGoalTracker = () => {
  const context = useContext(GoalTrackerContext)
  if (!context) {
    throw new Error('useGoalTracker must be used within GoalTrackerProvider')
  }
  return context
}
