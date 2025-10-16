import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalTrackerProvider } from '../goalTrackerContext';
import GoalDetail from '../components/GoalDetail';
import { goalApi } from '../api/goalApi';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../api/goalApi');
jest.mock('react-hot-toast');

const mockGoal = {
  _id: '123',
  title: 'Learn React Advanced Concepts',
  description: 'Master advanced React patterns including hooks, context, and performance optimization',
  targetType: 'hours',
  targetValue: 100,
  progressValue: 35,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-06-30T23:59:59.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  visibility: 'private',
  completedAt: null,
  milestones: [
    {
      _id: 'm1',
      title: 'Complete Hooks Tutorial',
      dueDate: '2024-02-15T00:00:00.000Z',
      done: true
    },
    {
      _id: 'm2',
      title: 'Build Context API Project',
      dueDate: '2024-04-15T00:00:00.000Z',
      done: false
    },
    {
      _id: 'm3',
      title: 'Performance Optimization Study',
      dueDate: '2024-05-30T00:00:00.000Z',
      done: false
    }
  ]
};

const MockedGoalDetail = ({ 
  goalId = '123', 
  onClose = jest.fn(), 
  onEdit = jest.fn() 
}) => (
  <GoalTrackerProvider>
    <GoalDetail goalId={goalId} onClose={onClose} onEdit={onEdit} />
  </GoalTrackerProvider>
);

describe('GoalDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goalApi.getGoalById.mockResolvedValue({ goal: mockGoal });
    
    // Mock current date for consistent testing
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2024-03-15').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading and Display', () => {
    it('shows loading state initially', () => {
      goalApi.getGoalById.mockReturnValue(new Promise(() => {})); // Pending promise

      render(<MockedGoalDetail />);

      expect(screen.getByText('Loading goal...')).toBeInTheDocument();
      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument(); // Loading spinner
    });

    it('loads and displays goal details correctly', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Learn React Advanced Concepts')).toBeInTheDocument();
      });

      expect(goalApi.getGoalById).toHaveBeenCalledWith('123');
      
      // Check goal information
      expect(screen.getByText('Master advanced React patterns including hooks, context, and performance optimization')).toBeInTheDocument();
      expect(screen.getByText('35 / 100 (35%)')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument(); // Start date
      expect(screen.getByText('June 30, 2024')).toBeInTheDocument(); // End date
      expect(screen.getByText('Private')).toBeInTheDocument(); // Visibility
    });

    it('displays milestone information correctly', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Milestones')).toBeInTheDocument();
      });

      expect(screen.getByText('1 of 3 completed (33%)')).toBeInTheDocument();
      expect(screen.getByText('Complete Hooks Tutorial')).toBeInTheDocument();
      expect(screen.getByText('Build Context API Project')).toBeInTheDocument();
      expect(screen.getByText('Performance Optimization Study')).toBeInTheDocument();
    });

    it('shows completed milestone with proper styling', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Complete Hooks Tutorial')).toBeInTheDocument();
      });

      const completedMilestone = screen.getByText('Complete Hooks Tutorial').closest('div');
      expect(completedMilestone).toHaveClass('bg-green-50', 'border-green-200');
      expect(within(completedMilestone).getByText('(Completed)')).toBeInTheDocument();
    });

    it('shows overdue milestone with proper styling', async () => {
      const goalWithOverdueMilestone = {
        ...mockGoal,
        milestones: [
          {
            _id: 'm1',
            title: 'Overdue Milestone',
            dueDate: '2024-02-01T00:00:00.000Z', // Past date
            done: false
          }
        ]
      };

      goalApi.getGoalById.mockResolvedValue({ goal: goalWithOverdueMilestone });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Overdue Milestone')).toBeInTheDocument();
      });

      const overdueMilestone = screen.getByText('Overdue Milestone').closest('div');
      expect(overdueMilestone).toHaveClass('bg-red-50', 'border-red-200');
      expect(within(overdueMilestone).getByText('(Overdue)')).toBeInTheDocument();
    });
  });

  describe('Progress Management', () => {
    it('shows progress controls for incomplete goals', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Update Progress')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+10' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '-1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
    });

    it('updates progress with quick action buttons', async () => {
      const updatedGoal = { ...mockGoal, progressValue: 36 };
      goalApi.updateProgress.mockResolvedValue({ goal: updatedGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+1' }));

      await waitFor(() => {
        expect(goalApi.updateProgress).toHaveBeenCalledWith('123', 1);
      });

      expect(toast.success).toHaveBeenCalledWith('Progress updated! +1');
    });

    it('shows custom progress input when Custom button is clicked', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
    });

    it('updates progress with custom amount', async () => {
      const user = userEvent.setup();
      const updatedGoal = { ...mockGoal, progressValue: 50 };
      goalApi.updateProgress.mockResolvedValue({ goal: updatedGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument();
      });

      // Open custom input
      fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

      // Enter custom amount
      const customInput = screen.getByPlaceholderText('Enter amount');
      await user.type(customInput, '15');

      // Update progress
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));

      await waitFor(() => {
        expect(goalApi.updateProgress).toHaveBeenCalledWith('123', 15);
      });

      expect(toast.success).toHaveBeenCalledWith('Progress updated! +15');
    });

    it('shows completion message when goal is completed', async () => {
      const updatedGoal = { 
        ...mockGoal, 
        progressValue: 100, 
        completedAt: new Date().toISOString() 
      };
      goalApi.updateProgress.mockResolvedValue({ 
        goal: updatedGoal, 
        justCompleted: true 
      });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+1' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('🎉 Goal completed! Congratulations!');
      });
    });

    it('hides progress controls for completed goals', async () => {
      const completedGoal = {
        ...mockGoal,
        progressValue: 100,
        completedAt: '2024-03-10T00:00:00.000Z'
      };

      goalApi.getGoalById.mockResolvedValue({ goal: completedGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Completed!')).toBeInTheDocument();
      });

      expect(screen.queryByText('Update Progress')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '+1' })).not.toBeInTheDocument();
    });
  });

  describe('Milestone Management', () => {
    it('toggles milestone completion', async () => {
      const updatedGoal = {
        ...mockGoal,
        milestones: [
          ...mockGoal.milestones.slice(0, 1),
          { ...mockGoal.milestones[1], done: true },
          ...mockGoal.milestones.slice(2)
        ]
      };

      goalApi.toggleMilestone.mockResolvedValue({ 
        goal: updatedGoal,
        message: 'Milestone completed'
      });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Build Context API Project')).toBeInTheDocument();
      });

      // Find and click the milestone checkbox
      const milestone = screen.getByText('Build Context API Project').closest('div');
      const checkboxButton = within(milestone).getByRole('button');
      fireEvent.click(checkboxButton);

      await waitFor(() => {
        expect(goalApi.toggleMilestone).toHaveBeenCalledWith('123', 'm2');
      });

      expect(toast.success).toHaveBeenCalledWith('Milestone completed');
    });

    it('sorts milestones by due date', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Complete Hooks Tutorial')).toBeInTheDocument();
      });

      const milestoneTexts = screen.getAllByText(/Complete|Build|Performance/).map(el => el.textContent);
      
      // Should be sorted by due date (Feb 15, Apr 15, May 30)
      expect(milestoneTexts[0]).toBe('Complete Hooks Tutorial');
      expect(milestoneTexts[1]).toBe('Build Context API Project');
      expect(milestoneTexts[2]).toBe('Performance Optimization Study');
    });
  });

  describe('Goal Actions', () => {
    it('opens edit mode when edit button is clicked', async () => {
      const mockOnEdit = jest.fn();

      render(<MockedGoalDetail onEdit={mockOnEdit} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit Goal' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Edit Goal' }));
      expect(mockOnEdit).toHaveBeenCalledWith(mockGoal);
    });

    it('deletes goal with confirmation', async () => {
      const mockOnClose = jest.fn();
      window.confirm = jest.fn(() => true);
      goalApi.deleteGoal.mockResolvedValue({});

      render(<MockedGoalDetail onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete Goal' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete Goal' }));

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this goal? This action cannot be undone.'
      );

      await waitFor(() => {
        expect(goalApi.deleteGoal).toHaveBeenCalledWith('123');
      });

      expect(toast.success).toHaveBeenCalledWith('Goal deleted successfully!');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('cancels goal deletion when user declines', async () => {
      window.confirm = jest.fn(() => false);

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Delete Goal' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Delete Goal' }));

      expect(window.confirm).toHaveBeenCalled();
      expect(goalApi.deleteGoal).not.toHaveBeenCalled();
    });

    it('closes modal when close button is clicked', async () => {
      const mockOnClose = jest.fn();

      render(<MockedGoalDetail onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText('Learn React Advanced Concepts')).toBeInTheDocument();
      });

      // Find close button (X button in header)
      const closeButton = screen.getByRole('button', { name: '' }); // X typically has no accessible name
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Date and Status Display', () => {
    it('shows correct days remaining for active goal', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Learn React Advanced Concepts')).toBeInTheDocument();
      });

      // Goal ends June 30, current date is March 15
      // Should show ~107 days remaining
      expect(screen.getByText(/107 days remaining/)).toBeInTheDocument();
    });

    it('shows overdue status for past due goals', async () => {
      const overdueGoal = {
        ...mockGoal,
        endDate: '2024-02-28T23:59:59.000Z', // Past date
        completedAt: null
      };

      goalApi.getGoalById.mockResolvedValue({ goal: overdueGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText(/Overdue \(\d+ days\)/)).toBeInTheDocument();
      });
    });

    it('shows completed status and date for finished goals', async () => {
      const completedGoal = {
        ...mockGoal,
        progressValue: 100,
        completedAt: '2024-03-10T00:00:00.000Z'
      };

      goalApi.getGoalById.mockResolvedValue({ goal: completedGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Completed!')).toBeInTheDocument();
      });

      expect(screen.getByText('March 10, 2024')).toBeInTheDocument();
    });

    it('shows due today status', async () => {
      const dueTodayGoal = {
        ...mockGoal,
        endDate: '2024-03-15T23:59:59.000Z', // Today
        completedAt: null
      };

      goalApi.getGoalById.mockResolvedValue({ goal: dueTodayGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Due today')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Visualization', () => {
    it('displays progress bar with correct percentage', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('35 / 100 (35%)')).toBeInTheDocument();
      });

      // Progress bar should be visible (we can't test the actual width in jsdom)
      const progressSection = screen.getByText('Current Progress').closest('div');
      expect(progressSection).toBeInTheDocument();
    });

    it('displays milestone progress correctly', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('1 of 3 completed (33%)')).toBeInTheDocument();
      });
    });

    it('shows 100% progress for completed goals', async () => {
      const completedGoal = {
        ...mockGoal,
        progressValue: 100,
        completedAt: '2024-03-10T00:00:00.000Z'
      };

      goalApi.getGoalById.mockResolvedValue({ goal: completedGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('100 / 100 (100%)')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors when loading goal', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      goalApi.getGoalById.mockRejectedValue(new Error('Goal not found'));

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(goalApi.getGoalById).toHaveBeenCalledWith('123');
      });

      // Should handle error gracefully (exact implementation depends on error boundary)
      consoleError.mockRestore();
    });

    it('handles progress update errors', async () => {
      goalApi.updateProgress.mockRejectedValue({
        response: { data: { error: 'Update failed' } }
      });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: '+1' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });

    it('handles milestone toggle errors', async () => {
      goalApi.toggleMilestone.mockRejectedValue({
        response: { data: { error: 'Toggle failed' } }
      });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Build Context API Project')).toBeInTheDocument();
      });

      const milestone = screen.getByText('Build Context API Project').closest('div');
      const checkboxButton = within(milestone).getByRole('button');
      fireEvent.click(checkboxButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Toggle failed');
      });
    });
  });

  describe('Target Type Icons', () => {
    it('shows correct icon for different target types', async () => {
      const sessionsGoal = { ...mockGoal, targetType: 'sessions' };
      goalApi.getGoalById.mockResolvedValue({ goal: sessionsGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Sessions Goal')).toBeInTheDocument();
      });

      // Icon should be present in header (we can't test the actual icon in jsdom)
      expect(screen.getByText('Sessions Goal')).toBeInTheDocument();
    });

    it('shows tasks icon for tasks goal', async () => {
      const tasksGoal = { ...mockGoal, targetType: 'tasks' };
      goalApi.getGoalById.mockResolvedValue({ goal: tasksGoal });

      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tasks Goal')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: /learn react advanced concepts/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { level: 3, name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /progress/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /milestones/i })).toBeInTheDocument();
    });

    it('has accessible buttons with proper labels', async () => {
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit Goal' })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: 'Delete Goal' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '+5' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockedGoalDetail />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
      });

      // Should be able to tab to buttons
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button');
    });
  });
});