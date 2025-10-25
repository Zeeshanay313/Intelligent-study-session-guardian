import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { timerAPI, reminderAPI, goalAPI, userAPI, settingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const AppStateContext = createContext();

const initialState = {
  settings: {
    timerDefaults: {
      focusTime: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStart: false,
      soundEnabled: true
    },
    reminderDefaults: {
      enabled: true,
      breakReminders: true,
      studyReminders: true,
      channels: { inApp: true, email: false, push: false }
    },
    goalDefaults: {
      weeklyTarget: 20,
      dailyTarget: 3,
      visibility: 'private'
    },
    privacy: {
      shareTimerStats: false,
      shareGoalProgress: false,
      guardianAccess: false
    }
  },
  timerPresets: [],
  activeTimerSession: null,
  reminders: [],
  goals: [],
  loading: {
    settings: false,
    timerPresets: false,
    reminders: false,
    goals: false
  },
  errors: {}
};

function appStateReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    
    case 'SET_TIMER_PRESETS':
      return {
        ...state,
        timerPresets: action.payload
      };
    
    case 'ADD_TIMER_PRESET':
      return {
        ...state,
        timerPresets: [...state.timerPresets, action.payload]
      };
    
    case 'UPDATE_TIMER_PRESET':
      return {
        ...state,
        timerPresets: state.timerPresets.map(p =>
          p._id === action.payload._id ? action.payload : p
        )
      };
    
    case 'DELETE_TIMER_PRESET':
      return {
        ...state,
        timerPresets: state.timerPresets.filter(p => p._id !== action.payload)
      };
    
    case 'SET_ACTIVE_TIMER_SESSION':
      return {
        ...state,
        activeTimerSession: action.payload
      };
    
    case 'SET_REMINDERS':
      return {
        ...state,
        reminders: action.payload
      };
    
    case 'ADD_REMINDER':
      return {
        ...state,
        reminders: [...state.reminders, action.payload]
      };
    
    case 'UPDATE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map(r =>
          r._id === action.payload._id ? action.payload : r
        )
      };
    
    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter(r => r._id !== action.payload)
      };
    
    case 'SET_GOALS':
      return {
        ...state,
        goals: action.payload
      };
    
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, action.payload]
      };
    
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g =>
          g._id === action.payload._id ? action.payload : g
        )
      };
    
    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g._id !== action.payload)
      };
    
    default:
      return state;
  }
}

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  const { user } = useAuth();
  const { socketService } = useSocket();

  // Load initial data when user logs in
  useEffect(() => {
    if (user) {
      loadAllData();
      setupSocketListeners();
    }
  }, [user]);

  const setupSocketListeners = () => {
    if (!socketService) return;

    socketService.on('timer:started', (data) => {
      dispatch({ type: 'SET_ACTIVE_TIMER_SESSION', payload: data });
    });

    socketService.on('timer:stopped', () => {
      dispatch({ type: 'SET_ACTIVE_TIMER_SESSION', payload: null });
    });

    socketService.on('reminder:created', (data) => {
      dispatch({ type: 'ADD_REMINDER', payload: data });
    });

    socketService.on('reminder:updated', (data) => {
      dispatch({ type: 'UPDATE_REMINDER', payload: data });
    });

    socketService.on('goal:updated', (data) => {
      dispatch({ type: 'UPDATE_GOAL', payload: data });
    });

    socketService.on('settings:updated', (data) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    });
  };

  const loadAllData = async () => {
    await Promise.all([
      loadTimerPresets(),
      loadReminders(),
      loadGoals(),
      loadSettings()
    ]);
  };

  const loadSettings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'settings', value: true } });
      const response = await settingsAPI.getSettings();
      if (response.data.settings) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: response.data.settings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      dispatch({ type: 'SET_ERROR', payload: { key: 'settings', value: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'settings', value: false } });
    }
  };

  const loadTimerPresets = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'timerPresets', value: true } });
      const response = await timerAPI.getPresets();
      const presets = Array.isArray(response.data) ? response.data : response.data.data || [];
      dispatch({ type: 'SET_TIMER_PRESETS', payload: presets });
    } catch (error) {
      console.error('Error loading timer presets:', error);
      dispatch({ type: 'SET_ERROR', payload: { key: 'timerPresets', value: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'timerPresets', value: false } });
    }
  };

  const loadReminders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'reminders', value: true } });
      const response = await reminderAPI.getReminders();
      const reminders = Array.isArray(response.data) ? response.data : response.data.data || [];
      dispatch({ type: 'SET_REMINDERS', payload: reminders });
    } catch (error) {
      console.error('Error loading reminders:', error);
      dispatch({ type: 'SET_ERROR', payload: { key: 'reminders', value: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'reminders', value: false } });
    }
  };

  const loadGoals = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'goals', value: true } });
      const response = await goalAPI.getGoals();
      const goals = Array.isArray(response.data) ? response.data : response.data.data || [];
      dispatch({ type: 'SET_GOALS', payload: goals });
    } catch (error) {
      console.error('Error loading goals:', error);
      dispatch({ type: 'SET_ERROR', payload: { key: 'goals', value: error.message } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'goals', value: false } });
    }
  };

  // Settings actions
  const updateSettings = async (updates, optimistic = true) => {
    const previousSettings = state.settings;
    
    if (optimistic) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
    }

    try {
      const response = await settingsAPI.saveSettings({ ...state.settings, ...updates });
      dispatch({ type: 'UPDATE_SETTINGS', payload: response.data.settings || updates });
      
      if (socketService) {
        socketService.emit('settings:update', updates);
      }
      
      toast.success('Settings updated successfully');
      return { success: true };
    } catch (error) {
      if (optimistic) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: previousSettings });
      }
      toast.error('Failed to update settings');
      console.error('Error updating settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Timer actions
  const createTimerPreset = async (presetData) => {
    try {
      const response = await timerAPI.createPreset(presetData);
      dispatch({ type: 'ADD_TIMER_PRESET', payload: response.data });
      toast.success('Timer preset created');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Failed to create timer preset');
      console.error('Error creating timer preset:', error);
      return { success: false, error: error.message };
    }
  };

  const updateTimerPreset = async (presetId, updates, optimistic = true) => {
    const previousPresets = state.timerPresets;
    
    if (optimistic) {
      const optimisticPreset = state.timerPresets.find(p => p._id === presetId);
      if (optimisticPreset) {
        dispatch({ type: 'UPDATE_TIMER_PRESET', payload: { ...optimisticPreset, ...updates } });
      }
    }

    try {
      const response = await timerAPI.updatePreset(presetId, updates);
      dispatch({ type: 'UPDATE_TIMER_PRESET', payload: response.data });
      toast.success('Timer preset updated');
      return { success: true, data: response.data };
    } catch (error) {
      if (optimistic) {
        dispatch({ type: 'SET_TIMER_PRESETS', payload: previousPresets });
      }
      toast.error('Failed to update timer preset');
      console.error('Error updating timer preset:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteTimerPreset = async (presetId) => {
    const previousPresets = state.timerPresets;
    dispatch({ type: 'DELETE_TIMER_PRESET', payload: presetId });

    try {
      await timerAPI.deletePreset(presetId);
      toast.success('Timer preset deleted');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_TIMER_PRESETS', payload: previousPresets });
      toast.error('Failed to delete timer preset');
      console.error('Error deleting timer preset:', error);
      return { success: false, error: error.message };
    }
  };

  // Reminder actions
  const createReminder = async (reminderData) => {
    try {
      const response = await reminderAPI.createReminder(reminderData);
      dispatch({ type: 'ADD_REMINDER', payload: response.data });
      
      if (socketService) {
        socketService.emit('reminder:created', response.data);
      }
      
      toast.success('Reminder created');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Failed to create reminder');
      console.error('Error creating reminder:', error);
      return { success: false, error: error.message };
    }
  };

  const updateReminder = async (reminderId, updates, optimistic = true) => {
    const previousReminders = state.reminders;
    
    if (optimistic) {
      const optimisticReminder = state.reminders.find(r => r._id === reminderId);
      if (optimisticReminder) {
        dispatch({ type: 'UPDATE_REMINDER', payload: { ...optimisticReminder, ...updates } });
      }
    }

    try {
      const response = await reminderAPI.updateReminder(reminderId, updates);
      dispatch({ type: 'UPDATE_REMINDER', payload: response.data });
      
      if (socketService) {
        socketService.emit('reminder:updated', response.data);
      }
      
      toast.success('Reminder updated');
      return { success: true, data: response.data };
    } catch (error) {
      if (optimistic) {
        dispatch({ type: 'SET_REMINDERS', payload: previousReminders });
      }
      toast.error('Failed to update reminder');
      console.error('Error updating reminder:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteReminder = async (reminderId) => {
    const previousReminders = state.reminders;
    dispatch({ type: 'DELETE_REMINDER', payload: reminderId });

    try {
      await reminderAPI.deleteReminder(reminderId);
      toast.success('Reminder deleted');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_REMINDERS', payload: previousReminders });
      toast.error('Failed to delete reminder');
      console.error('Error deleting reminder:', error);
      return { success: false, error: error.message };
    }
  };

  // Goal actions
  const createGoal = async (goalData) => {
    try {
      const response = await goalAPI.createGoal(goalData);
      dispatch({ type: 'ADD_GOAL', payload: response.data });
      toast.success('Goal created');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Failed to create goal');
      console.error('Error creating goal:', error);
      return { success: false, error: error.message };
    }
  };

  const updateGoal = async (goalId, updates, optimistic = true) => {
    const previousGoals = state.goals;
    
    if (optimistic) {
      const optimisticGoal = state.goals.find(g => g._id === goalId);
      if (optimisticGoal) {
        dispatch({ type: 'UPDATE_GOAL', payload: { ...optimisticGoal, ...updates } });
      }
    }

    try {
      const response = await goalAPI.updateGoal(goalId, updates);
      dispatch({ type: 'UPDATE_GOAL', payload: response.data });
      
      if (socketService) {
        socketService.emit('goal:updated', response.data);
      }
      
      toast.success('Goal updated');
      return { success: true, data: response.data };
    } catch (error) {
      if (optimistic) {
        dispatch({ type: 'SET_GOALS', payload: previousGoals });
      }
      toast.error('Failed to update goal');
      console.error('Error updating goal:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteGoal = async (goalId) => {
    const previousGoals = state.goals;
    dispatch({ type: 'DELETE_GOAL', payload: goalId });

    try {
      await goalAPI.deleteGoal(goalId);
      toast.success('Goal deleted');
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_GOALS', payload: previousGoals });
      toast.error('Failed to delete goal');
      console.error('Error deleting goal:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...state,
    // Settings
    updateSettings,
    loadSettings,
    // Timers
    createTimerPreset,
    updateTimerPreset,
    deleteTimerPreset,
    loadTimerPresets,
    // Reminders
    createReminder,
    updateReminder,
    deleteReminder,
    loadReminders,
    // Goals
    createGoal,
    updateGoal,
    deleteGoal,
    loadGoals,
    // Reload all
    loadAllData
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export default AppStateContext;
