/**
 * GoalTrackerContext
 * Comprehensive goal management with milestones and privacy settings
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'
import { useAchievementToast } from '../components/UI/AchievementToast'

const GoalTrackerContext = createContext()

export const GoalTrackerProvider = ({ children }) => {
  const [goals, setGoals] = useState([])
  const [currentGoal, setCurrentGoal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Get achievement toast - safely handle when not wrapped in provider
  let achievementToast = null
  try {
    achievementToast = useAchievementToast()
  } catch (e) {
    // Not wrapped in AchievementToastProvider, toasts will be disabled
  }

  // Helper to show goal completion celebration
  const celebrateGoalCompletion = useCallback((goalTitle, rewardResult) => {
    if (!achievementToast) return
    
    // Show points earned
    if (rewardResult?.pointsAwarded) {
      achievementToast.showPoints(rewardResult.pointsAwarded, `Completed: ${goalTitle}`)
    }
    
    // Show level up if applicable
    if (rewardResult?.levelUp?.didLevelUp) {
      setTimeout(() => {
        achievementToast.showLevelUp(rewardResult.levelUp.newLevel)
      }, 1500)
    }
    
    // Show goal achievement
    setTimeout(() => {
      achievementToast.showAchievement('🎯', `Goal Complete: ${goalTitle}`, 'You did it!')
    }, rewardResult?.levelUp?.didLevelUp ? 3000 : 0)
  }, [achievementToast])

  // Load all goals
  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.goals.list()
      // Handle both { goals: [] } and { data: [] } response formats
      const goalsData = response.goals || response.data || []
      // Normalize field names to match frontend expectations
      const normalizedGoals = goalsData.map(goal => ({
        ...goal,
        id: goal._id || goal.id,
        currentValue: goal.currentProgress ?? goal.currentValue ?? 0,
        targetValue: goal.target ?? goal.targetValue ?? 0,
        unit: goal.progressUnit || goal.unit || 'hours',
        targetDate: goal.dueDate || goal.targetDate,
        deadline: goal.dueDate || goal.deadline,
      }))
      setGoals(normalizedGoals)
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
        const newGoal = response.data || response.goal
        if (!newGoal) {
          throw new Error('No goal data returned from server')
        }
        // Normalize field names
        const normalizedGoal = {
          ...newGoal,
          id: newGoal._id || newGoal.id,
          currentValue: newGoal.currentProgress ?? newGoal.currentValue ?? 0,
          targetValue: newGoal.target ?? newGoal.targetValue ?? 0,
          unit: newGoal.progressUnit || newGoal.unit || 'hours',
          targetDate: newGoal.dueDate || newGoal.targetDate,
          deadline: newGoal.dueDate || newGoal.deadline,
        }
        setGoals((prev) => [...prev, normalizedGoal])
        return normalizedGoal
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
        
        // Track previous status to detect completion
        const previousGoal = goals.find((g) => (g._id || g.id) === goalId)
        const wasCompleted = previousGoal?.status === 'completed'
        
        const response = await api.goals.update(goalId, updates)
        const updatedGoal = response.data || response.goal
        if (!updatedGoal) {
          throw new Error('No goal data returned from server')
        }
        // Normalize field names
        const normalizedGoal = {
          ...updatedGoal,
          id: updatedGoal._id || updatedGoal.id,
          currentValue: updatedGoal.currentProgress ?? updatedGoal.currentValue ?? 0,
          targetValue: updatedGoal.target ?? updatedGoal.targetValue ?? 0,
          unit: updatedGoal.progressUnit || updatedGoal.unit || 'hours',
          targetDate: updatedGoal.dueDate || updatedGoal.targetDate,
          deadline: updatedGoal.dueDate || updatedGoal.deadline,
        }
        
        setGoals((prev) =>
          prev.map((goal) => ((goal._id || goal.id) === goalId ? normalizedGoal : goal))
        )
        
        const currentId = currentGoal?._id || currentGoal?.id;
        if (currentId === goalId) {
          setCurrentGoal(normalizedGoal)
        }
        
        // Celebrate if goal just got completed
        if (!wasCompleted && normalizedGoal.status === 'completed' && response.rewardResult) {
          celebrateGoalCompletion(normalizedGoal.title, response.rewardResult)
        }
        
        return normalizedGoal
      } catch (err) {
        console.error('Error updating goal:', err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentGoal, goals, celebrateGoalCompletion]
  )

  // Update goal progress
  const updateProgress = useCallback(
    async (goalId, progressChange, options = {}) => {
      try {
        const goal = goals.find((g) => (g._id || g.id) === goalId) || currentGoal
        if (!goal) return
        
        // Track previous status
        const wasCompleted = goal.status === 'completed'

        // Call the backend progress endpoint
        const response = await api.goals.addProgress(goalId, progressChange, options.note)
        
        if (response.success && response.goal) {
          const updatedGoal = {
            ...response.goal,
            id: response.goal._id || response.goal.id,
            currentValue: response.goal.currentProgress ?? 0,
            targetValue: response.goal.target ?? 0,
            unit: response.goal.progressUnit || 'hours',
            targetDate: response.goal.dueDate,
            deadline: response.goal.dueDate,
          }
          
          setGoals((prev) =>
            prev.map((g) => ((g._id || g.id) === goalId ? updatedGoal : g))
          )
          
          // Celebrate if goal just got completed
          if (!wasCompleted && response.goal.status === 'completed' && response.rewardResult) {
            celebrateGoalCompletion(response.goal.title, response.rewardResult)
          }
          
          return updatedGoal
        }
        
        return response
      } catch (err) {
        console.error('Error updating progress:', err)
        throw err
      }
    },
    [goals, currentGoal, celebrateGoalCompletion]
  )

  // Add milestone to goal
  const addMilestone = useCallback(
    async (goalId, milestoneData) => {
      try {
        const goal = goals.find((g) => (g._id || g.id) === goalId) || currentGoal
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
        const goal = goals.find((g) => (g._id || g.id) === goalId) || currentGoal
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
        const goal = goals.find((g) => (g._id || g.id) === goalId) || currentGoal
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
        setGoals((prev) => prev.filter((goal) => (goal._id || goal.id) !== goalId))
        
        const currentId = currentGoal?._id || currentGoal?.id;
        if (currentId === goalId) {
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

    const progress = goal.currentValue ?? goal.currentProgress ?? 0
    const target = goal.targetValue ?? goal.target ?? 1
    const percentage = Math.min(100, Math.round((progress / target) * 100))

    const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length
    const totalMilestones = (goal.milestones || []).length

    const deadline = goal.deadline || goal.dueDate || goal.targetDate
    const daysRemaining = deadline
      ? Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
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
