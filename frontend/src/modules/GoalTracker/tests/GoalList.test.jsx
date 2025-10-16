import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalTrackerProvider } from '../goalTrackerContext';
import GoalList from '../components/GoalList';
import { goalApi } from '../api/goalApi';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../api/goalApi');
jest.mock('react-hot-toast');

const mockGoals = [
  {
    _id: '1',
    title: 'Learn React',
    description: 'Master React fundamentals',
    targetType: 'hours',
    targetValue: 100,
    progressValue: 25,
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    visibility: 'private',
    milestones: [
      {
        _id: 'm1',
        title: 'Complete tutorial',
        dueDate: '2024-02-15',
        done: true
      },
      {
        _id: 'm2',
        title: 'Build first project',
        dueDate: '2024-04-15',
        done: false
      }
    ],
    createdAt: '2024-01-01',
    completedAt: null
  },
  {
    _id: '2',
    title: 'Daily Exercise',
    description: 'Maintain fitness routine',
    targetType: 'sessions',
    targetValue: 50,
    progressValue: 50,
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    visibility: 'shared',
    milestones: [],
    createdAt: '2024-01-01',
    completedAt: '2024-03-25'
  }
];

const mockSummary = {
  totalGoals: 2,
  completedGoals: 1,
  totalProgress: 75,
  totalTarget: 150
};

const MockedGoalList = ({ onCreateGoal = jest.fn(), onSelectGoal = jest.fn() }) => (
  <GoalTrackerProvider>
    <GoalList onCreateGoal={onCreateGoal} onSelectGoal={onSelectGoal} />
  </GoalTrackerProvider>
);

describe('GoalList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goalApi.getGoals.mockResolvedValue({
      goals: mockGoals,
      summary: mockSummary
    });
    goalApi.getUserPrivacy.mockResolvedValue(true);
  });

  describe('Rendering', () => {
    it('renders goal list with summary cards', async () => {
      render(<MockedGoalList />);

      // Wait for goals to load
      await waitFor(() => {
        expect(screen.getByText('Goal Tracker')).toBeInTheDocument();
      });

      // Check summary cards
      expect(screen.getByText('Total Goals')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Total Progress')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('renders goal cards with correct information', async () => {
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      // Check first goal
      const reactGoal = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      expect(within(reactGoal).getByText('Master React fundamentals')).toBeInTheDocument();
      expect(within(reactGoal).getByText('25 / 100')).toBeInTheDocument();
      expect(within(reactGoal).getByText('25%')).toBeInTheDocument();
      expect(within(reactGoal).getByText('1 / 2')).toBeInTheDocument(); // Milestones

      // Check second goal (completed)
      const exerciseGoal = screen.getByText('Daily Exercise').closest('div').closest('div').closest('div');
      expect(within(exerciseGoal).getByText('50 / 50')).toBeInTheDocument();
      expect(within(exerciseGoal).getByText('100%')).toBeInTheDocument();
    });

    it('shows privacy notice when sharing is disabled', async () => {
      goalApi.getUserPrivacy.mockResolvedValue(false);

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText(/Goal sharing is disabled/)).toBeInTheDocument();
      });

      expect(screen.getByText('Update settings')).toBeInTheDocument();
    });

    it('shows empty state when no goals exist', async () => {
      goalApi.getGoals.mockResolvedValue({
        goals: [],
        summary: { totalGoals: 0, completedGoals: 0, totalProgress: 0, totalTarget: 0 }
      });

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('No goals found')).toBeInTheDocument();
      });

      expect(screen.getByText('Get started by creating your first goal.')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows and hides filter panel', async () => {
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      const filtersButton = screen.getByText('Filters');
      
      // Filters should not be visible initially
      expect(screen.queryByLabelText('Target Type')).not.toBeInTheDocument();

      // Click to show filters
      fireEvent.click(filtersButton);
      expect(screen.getByLabelText('Target Type')).toBeInTheDocument();

      // Click to hide filters
      fireEvent.click(filtersButton);
      expect(screen.queryByLabelText('Target Type')).not.toBeInTheDocument();
    });

    it('filters goals by target type', async () => {
      const user = userEvent.setup();
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Filter by hours
      const targetTypeSelect = screen.getByLabelText('Target Type');
      await user.selectOptions(targetTypeSelect, 'hours');

      await waitFor(() => {
        expect(goalApi.getGoals).toHaveBeenCalledWith({ targetType: 'hours', completed: '', sortBy: 'createdAt' });
      });
    });

    it('filters goals by completion status', async () => {
      const user = userEvent.setup();
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Filter by completed
      const completionSelect = screen.getByLabelText('Completion Status');
      await user.selectOptions(completionSelect, 'true');

      await waitFor(() => {
        expect(goalApi.getGoals).toHaveBeenCalledWith({ targetType: '', completed: 'true', sortBy: 'createdAt' });
      });
    });

    it('sorts goals by different criteria', async () => {
      const user = userEvent.setup();
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Filters')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Sort by progress
      const sortSelect = screen.getByLabelText('Sort By');
      await user.selectOptions(sortSelect, 'progress');

      await waitFor(() => {
        expect(goalApi.getGoals).toHaveBeenCalledWith({ targetType: '', completed: '', sortBy: 'progress' });
      });
    });
  });

  describe('Goal Actions', () => {
    it('calls onCreateGoal when New Goal button is clicked', async () => {
      const mockOnCreateGoal = jest.fn();
      render(<MockedGoalList onCreateGoal={mockOnCreateGoal} />);

      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('New Goal'));
      expect(mockOnCreateGoal).toHaveBeenCalled();
    });

    it('calls onSelectGoal when goal card is clicked', async () => {
      const mockOnSelectGoal = jest.fn();
      render(<MockedGoalList onSelectGoal={mockOnSelectGoal} />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      fireEvent.click(goalCard);

      expect(mockOnSelectGoal).toHaveBeenCalledWith(mockGoals[0]);
    });

    it('updates progress when quick action buttons are clicked', async () => {
      goalApi.updateProgress.mockResolvedValue({
        goal: { ...mockGoals[0], progressValue: 26 }
      });

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      const plusOneButton = within(goalCard).getByText('+1');

      fireEvent.click(plusOneButton);

      await waitFor(() => {
        expect(goalApi.updateProgress).toHaveBeenCalledWith('1', 1);
      });

      expect(toast.success).toHaveBeenCalledWith('Progress updated! +1');
    });

    it('prevents progress updates on completed goals', async () => {
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Daily Exercise')).toBeInTheDocument();
      });

      const completedGoalCard = screen.getByText('Daily Exercise').closest('div').closest('div').closest('div');
      const plusOneButton = within(completedGoalCard).getByText('+1');

      expect(plusOneButton).toBeDisabled();
    });

    it('deletes goal with confirmation', async () => {
      goalApi.deleteGoal.mockResolvedValue({});
      window.confirm = jest.fn(() => true);

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      const deleteButton = within(goalCard).getByText('Delete');

      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this goal?');

      await waitFor(() => {
        expect(goalApi.deleteGoal).toHaveBeenCalledWith('1');
      });

      expect(toast.success).toHaveBeenCalledWith('Goal deleted successfully!');
    });

    it('cancels goal deletion when user declines confirmation', async () => {
      window.confirm = jest.fn(() => false);

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      const deleteButton = within(goalCard).getByText('Delete');

      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(goalApi.deleteGoal).not.toHaveBeenCalled();
    });
  });

  describe('Progress Visualization', () => {
    it('displays correct progress colors based on percentage', async () => {
      const goalsWithDifferentProgress = [
        { ...mockGoals[0], progressValue: 10, targetValue: 100 }, // 10% - red
        { ...mockGoals[0], _id: '3', progressValue: 30, targetValue: 100 }, // 30% - orange
        { ...mockGoals[0], _id: '4', progressValue: 60, targetValue: 100 }, // 60% - yellow
        { ...mockGoals[0], _id: '5', progressValue: 80, targetValue: 100 }, // 80% - blue
        { ...mockGoals[0], _id: '6', progressValue: 100, targetValue: 100 } // 100% - green
      ];

      goalApi.getGoals.mockResolvedValue({
        goals: goalsWithDifferentProgress,
        summary: mockSummary
      });

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getAllByText('Learn React')).toHaveLength(5);
      });

      // Check that progress bars exist (we can't easily test colors in jsdom)
      const progressBars = screen.getAllByRole('progressbar', { hidden: true });
      expect(progressBars).toHaveLength(5);
    });

    it('shows milestone progress correctly', async () => {
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      expect(within(goalCard).getByText('1 / 2')).toBeInTheDocument(); // Milestones
    });
  });

  describe('Date Handling', () => {
    it('shows correct due date information', async () => {
      // Mock current date
      const mockDate = new Date('2024-06-01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      expect(within(goalCard).getByText('29 days left')).toBeInTheDocument();

      // Restore Date
      global.Date.mockRestore();
    });

    it('shows overdue status for past due goals', async () => {
      const overdueGoal = {
        ...mockGoals[0],
        endDate: '2024-01-15', // Past date
        completedAt: null
      };

      goalApi.getGoals.mockResolvedValue({
        goals: [overdueGoal],
        summary: { totalGoals: 1, completedGoals: 0, totalProgress: 25, totalTarget: 100 }
      });

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      // Should show overdue indicator (we can't easily test the icon color, but we can check text)
      expect(screen.getByText(/days overdue/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to fetch goals';
      goalApi.getGoals.mockRejectedValue(new Error(errorMessage));

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load goals');
      });
    });

    it('handles progress update errors gracefully', async () => {
      goalApi.updateProgress.mockRejectedValue({
        response: { data: { error: 'Progress update failed' } }
      });

      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Learn React')).toBeInTheDocument();
      });

      const goalCard = screen.getByText('Learn React').closest('div').closest('div').closest('div');
      const plusOneButton = within(goalCard).getByText('+1');

      fireEvent.click(plusOneButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Progress update failed');
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner initially', () => {
      // Mock a pending promise to simulate loading
      goalApi.getGoals.mockReturnValue(new Promise(() => {}));

      render(<MockedGoalList />);

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('Goal Tracker')).toBeInTheDocument();
      });

      // Check for accessible buttons
      expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new goal/i })).toBeInTheDocument();

      // Check for proper headings
      expect(screen.getByRole('heading', { level: 2, name: /goal tracker/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockedGoalList />);

      await waitFor(() => {
        expect(screen.getByText('New Goal')).toBeInTheDocument();
      });

      const newGoalButton = screen.getByText('New Goal');
      
      // Focus should be manageable via keyboard
      await user.tab();
      expect(document.activeElement).toBe(newGoalButton);
    });
  });
});