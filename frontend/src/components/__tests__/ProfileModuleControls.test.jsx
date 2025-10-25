import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileModuleControls from '../ProfileModuleControls';
import { AppStateProvider } from '../../contexts/AppStateContext';
import { AuthProvider } from '../../contexts/AuthContext';

const mockUpdateSettings = jest.fn();
const mockCreateTimerPreset = jest.fn();
const mockDeleteTimerPreset = jest.fn();
const mockCreateReminder = jest.fn();
const mockDeleteReminder = jest.fn();

jest.mock('../../contexts/AppStateContext', () => ({
  ...jest.requireActual('../../contexts/AppStateContext'),
  useAppState: () => ({
    settings: {
      timerDefaults: { focusTime: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4, autoStart: false, soundEnabled: true },
      reminderDefaults: { enabled: true, breakReminders: true, studyReminders: true, channels: { inApp: true, email: false, push: false } },
      goalDefaults: { weeklyTarget: 20, dailyTarget: 4, visibility: 'private' }
    },
    timerPresets: [
      { _id: 'preset-1', name: 'Pomodoro', workDuration: 1500, breakDuration: 300 }
    ],
    reminders: [
      { _id: 'reminder-1', title: 'Study Time', type: 'one-off', datetime: '2025-10-27T10:00:00Z', isActive: true }
    ],
    goals: [
      { _id: 'goal-1', title: 'Complete Course', currentValue: 5, targetValue: 10 }
    ],
    loading: { timerPresets: false, reminders: false, goals: false },
    updateSettings: mockUpdateSettings,
    createTimerPreset: mockCreateTimerPreset,
    deleteTimerPreset: mockDeleteTimerPreset,
    createReminder: mockCreateReminder,
    deleteReminder: mockDeleteReminder,
    updateReminder: jest.fn(),
    updateGoal: jest.fn()
  })
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' }
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ProfileModuleControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three tabs', () => {
    render(<ProfileModuleControls />);
    
    expect(screen.getByText(/Timer/i)).toBeInTheDocument();
    expect(screen.getByText(/Reminders/i)).toBeInTheDocument();
    expect(screen.getByText(/Goals/i)).toBeInTheDocument();
  });

  it('should display timer settings', () => {
    render(<ProfileModuleControls />);
    
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByText(/Default Timer Settings/i)).toBeInTheDocument();
  });

  it('should change focus time setting', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const focusTimeInput = screen.getByDisplayValue('25');
    await user.clear(focusTimeInput);
    await user.type(focusTimeInput, '30');
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalled();
    });
  });

  it('should toggle auto-start setting', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const autoStartCheckbox = screen.getByLabelText(/Auto-start next session/i);
    await user.click(autoStartCheckbox);
    
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        timerDefaults: expect.objectContaining({
          autoStart: true
        })
      })
    );
  });

  it('should display timer presets list', () => {
    render(<ProfileModuleControls />);
    
    expect(screen.getByText('Pomodoro')).toBeInTheDocument();
    expect(screen.getByText(/25m work/i)).toBeInTheDocument();
  });

  it('should open add preset form', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const addButton = screen.getByText(/Add Preset/i);
    await user.click(addButton);
    
    expect(screen.getByPlaceholderText(/Preset name/i)).toBeInTheDocument();
  });

  it('should create new timer preset', async () => {
    mockCreateTimerPreset.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const addButton = screen.getByText(/Add Preset/i);
    await user.click(addButton);
    
    const nameInput = screen.getByPlaceholderText(/Preset name/i);
    await user.type(nameInput, 'Custom Preset');
    
    const createButton = screen.getByRole('button', { name: /Create/i });
    await user.click(createButton);
    
    await waitFor(() => {
      expect(mockCreateTimerPreset).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Custom Preset'
        })
      );
    });
  });

  it('should switch to reminders tab', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const remindersTab = screen.getByText(/Reminders/i);
    await user.click(remindersTab);
    
    expect(screen.getByText(/Reminder Preferences/i)).toBeInTheDocument();
  });

  it('should display active reminders', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const remindersTab = screen.getByText(/Reminders/i);
    await user.click(remindersTab);
    
    expect(screen.getByText('Study Time')).toBeInTheDocument();
  });

  it('should toggle reminder preferences', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const remindersTab = screen.getByText(/Reminders/i);
    await user.click(remindersTab);
    
    const breakRemindersCheckbox = screen.getByLabelText(/Break time reminders/i);
    await user.click(breakRemindersCheckbox);
    
    expect(mockUpdateSettings).toHaveBeenCalled();
  });

  it('should switch to goals tab', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const goalsTab = screen.getByText(/Goals/i);
    await user.click(goalsTab);
    
    expect(screen.getByText(/Goal Settings/i)).toBeInTheDocument();
  });

  it('should display active goals with progress', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const goalsTab = screen.getByText(/Goals/i);
    await user.click(goalsTab);
    
    expect(screen.getByText('Complete Course')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  it('should change weekly target', async () => {
    const user = userEvent.setup();
    render(<ProfileModuleControls />);
    
    const goalsTab = screen.getByText(/Goals/i);
    await user.click(goalsTab);
    
    const weeklyTargetInput = screen.getByDisplayValue('20');
    await user.clear(weeklyTargetInput);
    await user.type(weeklyTargetInput, '25');
    
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalled();
    });
  });
});
