import { renderHook, act, waitFor } from '@testing-library/react';
import { AppStateProvider, useAppState } from '../AppStateContext';
import { AuthProvider } from '../AuthContext';
import * as api from '../../services/api';

jest.mock('../../services/api');
jest.mock('../AuthContext', () => ({
  ...jest.requireActual('../AuthContext'),
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    token: 'test-token'
  })
}));

jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    socketService: {
      on: jest.fn(),
      emit: jest.fn()
    }
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

const wrapper = ({ children }) => (
  <AuthProvider>
    <AppStateProvider>{children}</AppStateProvider>
  </AuthProvider>
);

describe('AppStateContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.settingsAPI.getSettings.mockResolvedValue({
      data: {
        settings: {
          timerDefaults: { focusTime: 25, shortBreak: 5 },
          reminderDefaults: { enabled: true },
          goalDefaults: { weeklyTarget: 20 }
        }
      }
    });
    api.timerAPI.getPresets.mockResolvedValue({ data: [] });
    api.reminderAPI.getReminders.mockResolvedValue({ data: [] });
    api.goalAPI.getGoals.mockResolvedValue({ data: [] });
  });

  it('should provide initial state', async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toBeDefined();
    });

    expect(result.current.settings.timerDefaults.focusTime).toBe(25);
    expect(result.current.timerPresets).toEqual([]);
    expect(result.current.reminders).toEqual([]);
    expect(result.current.goals).toEqual([]);
  });

  it('should update settings optimistically', async () => {
    api.settingsAPI.saveSettings.mockResolvedValue({
      data: {
        settings: {
          timerDefaults: { focusTime: 30 }
        }
      }
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.updateSettings({
        timerDefaults: { focusTime: 30 }
      });
    });

    expect(result.current.settings.timerDefaults.focusTime).toBe(30);
    expect(api.settingsAPI.saveSettings).toHaveBeenCalled();
  });

  it('should rollback on settings update failure', async () => {
    api.settingsAPI.saveSettings.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAppState(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings.timerDefaults.focusTime).toBe(25);
    });

    const originalValue = result.current.settings.timerDefaults.focusTime;

    await act(async () => {
      await result.current.updateSettings({
        timerDefaults: { focusTime: 50 }
      });
    });

    expect(result.current.settings.timerDefaults.focusTime).toBe(originalValue);
  });

  it('should create timer preset', async () => {
    const newPreset = {
      name: 'Test Preset',
      workDuration: 1500,
      breakDuration: 300
    };

    api.timerAPI.createPreset.mockResolvedValue({
      data: { _id: 'preset-1', ...newPreset }
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.createTimerPreset(newPreset);
    });

    expect(api.timerAPI.createPreset).toHaveBeenCalledWith(newPreset);
  });

  it('should create reminder', async () => {
    const newReminder = {
      title: 'Test Reminder',
      type: 'one-off',
      datetime: '2025-10-27T10:00:00Z'
    };

    api.reminderAPI.createReminder.mockResolvedValue({
      data: { _id: 'reminder-1', ...newReminder }
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.createReminder(newReminder);
    });

    expect(api.reminderAPI.createReminder).toHaveBeenCalledWith(newReminder);
  });

  it('should update goal', async () => {
    const goalData = {
      _id: 'goal-1',
      title: 'Updated Goal',
      currentValue: 10
    };

    api.goalAPI.updateGoal.mockResolvedValue({
      data: goalData
    });

    const { result } = renderHook(() => useAppState(), { wrapper });

    await act(async () => {
      await result.current.updateGoal('goal-1', { currentValue: 10 });
    });

    expect(api.goalAPI.updateGoal).toHaveBeenCalledWith('goal-1', { currentValue: 10 });
  });
});
