import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { goalApi } from './api/goalApi';
import toast from 'react-hot-toast';

const GoalTrackerContext = createContext();

// Action types
const GOAL_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_GOALS: 'SET_GOALS',
  ADD_GOAL: 'ADD_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  SET_SELECTED_GOAL: 'SET_SELECTED_GOAL',
  SET_SUMMARY: 'SET_SUMMARY',
  SET_PRIVACY_SETTINGS: 'SET_PRIVACY_SETTINGS',
  SET_ERROR: 'SET_ERROR'
};

// Initial state
const initialState = {
  goals: [],
  selectedGoal: null,
  summary: {
    totalGoals: 0,
    completedGoals: 0,
    totalProgress: 0,
    totalTarget: 0
  },
  privacySettings: {
    guardianSharing: false
  },
  loading: false,
  error: null
};

// Reducer
const goalTrackerReducer = (state, action) => {
  switch (action.type) {
    case GOAL_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case GOAL_ACTIONS.SET_GOALS:
      return {
        ...state,
        goals: action.payload,
        loading: false,
        error: null
      };

    case GOAL_ACTIONS.ADD_GOAL:
      return {
        ...state,
        goals: [action.payload, ...state.goals],
        loading: false,
        error: null
      };

    case GOAL_ACTIONS.UPDATE_GOAL:
      return {
        ...state,
        goals: state.goals.map(goal => 
          goal._id === action.payload._id ? action.payload : goal
        ),
        selectedGoal: state.selectedGoal?._id === action.payload._id ? action.payload : state.selectedGoal,
        loading: false,
        error: null
      };

    case GOAL_ACTIONS.DELETE_GOAL:
      return {
        ...state,
        goals: state.goals.filter(goal => goal._id !== action.payload),
        selectedGoal: state.selectedGoal?._id === action.payload ? null : state.selectedGoal,
        loading: false,
        error: null
      };

    case GOAL_ACTIONS.SET_SELECTED_GOAL:
      return {
        ...state,
        selectedGoal: action.payload,
        loading: false,
        error: null
      };

    case GOAL_ACTIONS.SET_SUMMARY:
      return {
        ...state,
        summary: action.payload
      };

    case GOAL_ACTIONS.SET_PRIVACY_SETTINGS:
      return {
        ...state,
        privacySettings: action.payload
      };

    case GOAL_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    default:
      return state;
  }
};

// Provider component
export const GoalTrackerProvider = ({ children }) => {
  const [state, dispatch] = useReducer(goalTrackerReducer, initialState);

  // Load privacy settings on mount
  useEffect(() => {
    const loadPrivacySettings = async () => {
      try {
        const guardianSharing = await goalApi.getUserPrivacy();
        dispatch({
          type: GOAL_ACTIONS.SET_PRIVACY_SETTINGS,
          payload: { guardianSharing }
        });
      } catch (error) {
        console.error('Failed to load privacy settings:', error);
      }
    };

    loadPrivacySettings();
  }, []);

  // Actions
  const actions = {
    // Load goals with optional filters
    loadGoals: async (filters = {}) => {
      try {
        dispatch({ type: GOAL_ACTIONS.SET_LOADING, payload: true });
        const data = await goalApi.getGoals(filters);
        dispatch({ type: GOAL_ACTIONS.SET_GOALS, payload: data.goals });
        dispatch({ type: GOAL_ACTIONS.SET_SUMMARY, payload: data.summary });
      } catch (error) {
        dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: error.message });
        toast.error('Failed to load goals');
      }
    },

    // Load specific goal
    loadGoal: async (id) => {
      try {
        dispatch({ type: GOAL_ACTIONS.SET_LOADING, payload: true });
        const data = await goalApi.getGoalById(id);
        dispatch({ type: GOAL_ACTIONS.SET_SELECTED_GOAL, payload: data.goal });
      } catch (error) {
        dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: error.message });
        toast.error('Failed to load goal');
      }
    },

    // Create new goal
    createGoal: async (goalData) => {
      try {
        dispatch({ type: GOAL_ACTIONS.SET_LOADING, payload: true });
        const data = await goalApi.createGoal(goalData);
        dispatch({ type: GOAL_ACTIONS.ADD_GOAL, payload: data.goal });
        
        if (data.privacyNote) {
          toast(data.privacyNote, { icon: 'ℹ️', duration: 5000 });
        }
        
        toast.success('Goal created successfully!');
        return data.goal;
      } catch (error) {
        dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.response?.data?.error || 'Failed to create goal');
        throw error;
      }
    },

    // Update goal
    updateGoal: async (id, updates) => {
      try {
        dispatch({ type: GOAL_ACTIONS.SET_LOADING, payload: true });
        const data = await goalApi.updateGoal(id, updates);
        dispatch({ type: GOAL_ACTIONS.UPDATE_GOAL, payload: data.goal });
        toast.success('Goal updated successfully!');
        return data.goal;
      } catch (error) {
        dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.response?.data?.error || 'Failed to update goal');
        throw error;
      }
    },

    // Delete goal
    deleteGoal: async (id) => {
      try {
        dispatch({ type: GOAL_ACTIONS.SET_LOADING, payload: true });
        await goalApi.deleteGoal(id);
        dispatch({ type: GOAL_ACTIONS.DELETE_GOAL, payload: id });
        toast.success('Goal deleted successfully!');
      } catch (error) {
        dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: error.message });
        toast.error(error.response?.data?.error || 'Failed to delete goal');
        throw error;
      }
    },

    // Update progress
    updateProgress: async (id, amount) => {
      try {
        const data = await goalApi.updateProgress(id, amount);
        dispatch({ type: GOAL_ACTIONS.UPDATE_GOAL, payload: data.goal });
        
        if (data.justCompleted) {
          toast.success('🎉 Goal completed! Congratulations!', { duration: 5000 });
        } else {
          toast.success(`Progress updated! +${amount}`);
        }
        
        return data.goal;
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update progress');
        throw error;
      }
    },

    // Toggle milestone
    toggleMilestone: async (goalId, milestoneId) => {
      try {
        const data = await goalApi.toggleMilestone(goalId, milestoneId);
        dispatch({ type: GOAL_ACTIONS.UPDATE_GOAL, payload: data.goal });
        toast.success(data.message);
        return data.goal;
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to toggle milestone');
        throw error;
      }
    },

    // Clear selected goal
    clearSelectedGoal: () => {
      dispatch({ type: GOAL_ACTIONS.SET_SELECTED_GOAL, payload: null });
    },

    // Clear error
    clearError: () => {
      dispatch({ type: GOAL_ACTIONS.SET_ERROR, payload: null });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  return (
    <GoalTrackerContext.Provider value={value}>
      {children}
    </GoalTrackerContext.Provider>
  );
};

// Custom hook to use the context
export const useGoalTracker = () => {
  const context = useContext(GoalTrackerContext);
  if (!context) {
    throw new Error('useGoalTracker must be used within a GoalTrackerProvider');
  }
  return context;
};