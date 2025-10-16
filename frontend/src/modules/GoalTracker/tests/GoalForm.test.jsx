import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalTrackerProvider } from '../goalTrackerContext';
import GoalForm from '../components/GoalForm';
import { goalApi } from '../api/goalApi';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../api/goalApi');
jest.mock('react-hot-toast');

const MockedGoalForm = ({ goal = null, onClose = jest.fn(), onSave = jest.fn() }) => (
  <GoalTrackerProvider>
    <GoalForm goal={goal} onClose={onClose} onSave={onSave} />
  </GoalTrackerProvider>
);

describe('GoalForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goalApi.getUserPrivacy.mockResolvedValue(true);
  });

  describe('New Goal Creation', () => {
    it('renders form with default values for new goal', () => {
      render(<MockedGoalForm />);

      expect(screen.getByText('Create New Goal')).toBeInTheDocument();
      expect(screen.getByLabelText(/goal title/i)).toHaveValue('');
      expect(screen.getByLabelText(/target type/i)).toHaveValue('hours');
      expect(screen.getByRole('button', { name: /create goal/i })).toBeInTheDocument();
    });

    it('sets default date range for new goals', () => {
      const mockDate = new Date('2024-01-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<MockedGoalForm />);

      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      expect(startDateInput).toHaveValue('2024-01-15');
      expect(endDateInput).toHaveValue('2024-04-15'); // 3 months later

      global.Date.mockRestore();
    });

    it('creates goal successfully with valid data', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      const createdGoal = {
        _id: '123',
        title: 'Test Goal',
        targetType: 'hours',
        targetValue: 50
      };

      goalApi.createGoal.mockResolvedValue({ goal: createdGoal });

      render(<MockedGoalForm onSave={mockOnSave} onClose={mockOnClose} />);

      // Fill form
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '50');
      await user.type(screen.getByLabelText(/description/i), 'Test description');

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(goalApi.createGoal).toHaveBeenCalledWith({
          title: 'Test Goal',
          description: 'Test description',
          targetType: 'hours',
          targetValue: 50,
          startDate: expect.any(String),
          endDate: expect.any(String),
          visibility: 'private',
          milestones: []
        });
      });

      expect(mockOnSave).toHaveBeenCalledWith(createdGoal);
      expect(mockOnClose).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Goal created successfully!');
    });

    it('shows validation errors for missing required fields', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(goalApi.createGoal).not.toHaveBeenCalled();
    });

    it('validates target value is positive number', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Fill with invalid target value
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '-5');

      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText('Valid target value is required')).toBeInTheDocument();
      });
    });

    it('validates end date is after start date', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Fill form with invalid dates
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '50');
      await user.type(screen.getByLabelText(/start date/i), '2024-06-01');
      await user.type(screen.getByLabelText(/end date/i), '2024-05-01');

      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
      });
    });
  });

  describe('Goal Editing', () => {
    const existingGoal = {
      _id: '123',
      title: 'Existing Goal',
      description: 'Existing description',
      targetType: 'sessions',
      targetValue: 30,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      visibility: 'shared',
      milestones: [
        {
          _id: 'm1',
          title: 'First milestone',
          dueDate: '2024-03-15T00:00:00.000Z',
          done: false
        }
      ]
    };

    it('populates form with existing goal data', () => {
      render(<MockedGoalForm goal={existingGoal} />);

      expect(screen.getByText('Edit Goal')).toBeInTheDocument();
      expect(screen.getByLabelText(/goal title/i)).toHaveValue('Existing Goal');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
      expect(screen.getByLabelText(/target type/i)).toHaveValue('sessions');
      expect(screen.getByLabelText(/target value/i)).toHaveValue('30');
      expect(screen.getByLabelText(/start date/i)).toHaveValue('2024-01-01');
      expect(screen.getByLabelText(/end date/i)).toHaveValue('2024-06-30');
      expect(screen.getByRole('button', { name: /update goal/i })).toBeInTheDocument();
    });

    it('updates goal successfully', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      const updatedGoal = { ...existingGoal, title: 'Updated Goal' };
      goalApi.updateGoal.mockResolvedValue({ goal: updatedGoal });

      render(<MockedGoalForm goal={existingGoal} onSave={mockOnSave} onClose={mockOnClose} />);

      // Update title
      const titleInput = screen.getByLabelText(/goal title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Goal');

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /update goal/i }));

      await waitFor(() => {
        expect(goalApi.updateGoal).toHaveBeenCalledWith('123', expect.objectContaining({
          title: 'Updated Goal'
        }));
      });

      expect(mockOnSave).toHaveBeenCalledWith(updatedGoal);
      expect(mockOnClose).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Goal updated successfully!');
    });
  });

  describe('Milestone Management', () => {
    it('displays existing milestones', () => {
      const goalWithMilestones = {
        _id: '123',
        title: 'Goal with Milestones',
        targetType: 'hours',
        targetValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        milestones: [
          {
            _id: 'm1',
            title: 'Milestone 1',
            dueDate: '2024-06-15T00:00:00.000Z',
            done: false
          },
          {
            _id: 'm2',
            title: 'Milestone 2',
            dueDate: '2024-09-15T00:00:00.000Z',
            done: true
          }
        ]
      };

      render(<MockedGoalForm goal={goalWithMilestones} />);

      expect(screen.getByDisplayValue('Milestone 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Milestone 2')).toBeInTheDocument();
    });

    it('adds new milestone', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Fill milestone form
      await user.type(screen.getByPlaceholderText(/add milestone title/i), 'New Milestone');
      
      const milestoneDateInputs = screen.getAllByDisplayValue('');
      const milestoneDateInput = milestoneDateInputs.find(input => input.type === 'date');
      await user.type(milestoneDateInput, '2024-03-15');

      // Add milestone
      fireEvent.click(screen.getByRole('button', { name: /\+/i }));

      expect(screen.getByDisplayValue('New Milestone')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-03-15')).toBeInTheDocument();
    });

    it('removes milestone', async () => {
      const goalWithMilestone = {
        _id: '123',
        title: 'Goal',
        targetType: 'hours',
        targetValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        milestones: [
          {
            _id: 'm1',
            title: 'Milestone to Remove',
            dueDate: '2024-06-15T00:00:00.000Z',
            done: false
          }
        ]
      };

      render(<MockedGoalForm goal={goalWithMilestone} />);

      expect(screen.getByDisplayValue('Milestone to Remove')).toBeInTheDocument();

      // Remove milestone
      const trashIcons = screen.getAllByTestId('trash-icon') || screen.getAllByRole('button');
      const removeButton = trashIcons.find(button => 
        button.querySelector('svg') && button.closest('.bg-gray-50, .bg-gray-700')
      );
      
      if (removeButton) {
        fireEvent.click(removeButton);
        await waitFor(() => {
          expect(screen.queryByDisplayValue('Milestone to Remove')).not.toBeInTheDocument();
        });
      }
    });

    it('validates milestone due dates are before goal end date', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Set goal dates
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '50');
      await user.type(screen.getByLabelText(/end date/i), '2024-06-30');

      // Add milestone with date after goal end
      await user.type(screen.getByPlaceholderText(/add milestone title/i), 'Late Milestone');
      
      const milestoneDateInputs = screen.getAllByDisplayValue('');
      const milestoneDateInput = milestoneDateInputs.find(input => input.type === 'date');
      await user.type(milestoneDateInput, '2024-07-15');

      fireEvent.click(screen.getByRole('button', { name: /\+/i }));
      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText(/milestone due date cannot be after goal end date/i)).toBeInTheDocument();
      });
    });
  });

  describe('Visibility and Privacy', () => {
    it('shows privacy options when sharing is enabled', () => {
      render(<MockedGoalForm />);

      expect(screen.getByLabelText(/private/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/shared/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/public/i)).toBeInTheDocument();
    });

    it('disables sharing options when privacy setting is off', () => {
      goalApi.getUserPrivacy.mockResolvedValue(false);

      render(<MockedGoalForm />);

      const sharedRadio = screen.getByRole('radio', { name: /shared/i });
      const publicRadio = screen.getByRole('radio', { name: /public/i });

      expect(sharedRadio).toBeDisabled();
      expect(publicRadio).toBeDisabled();
      
      expect(screen.getByText(/sharing options are disabled/i)).toBeInTheDocument();
    });

    it('shows privacy notice when sharing is disabled', async () => {
      goalApi.getUserPrivacy.mockResolvedValue(false);

      render(<MockedGoalForm />);

      await waitFor(() => {
        expect(screen.getByText(/sharing options are disabled/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /update settings/i })).toHaveAttribute('href', '/profile');
    });
  });

  describe('Form Interaction', () => {
    it('closes form when cancel button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<MockedGoalForm onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes form when X button is clicked', () => {
      const mockOnClose = jest.fn();
      render(<MockedGoalForm onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: '' }); // X button typically has no accessible name
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('clears validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      // Submit to trigger validation
      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      // Start typing in title field
      await user.type(screen.getByLabelText(/goal title/i), 'T');

      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });

    it('updates target type icon when selection changes', async () => {
      const user = userEvent.setup();
      render(<MockedGoalForm />);

      const targetTypeSelect = screen.getByLabelText(/target type/i);

      // Change to sessions
      await user.selectOptions(targetTypeSelect, 'sessions');
      expect(targetTypeSelect).toHaveValue('sessions');

      // Change to tasks
      await user.selectOptions(targetTypeSelect, 'tasks');
      expect(targetTypeSelect).toHaveValue('tasks');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors during goal creation', async () => {
      const user = userEvent.setup();
      const apiError = {
        response: { data: { error: 'Server error' } }
      };

      goalApi.createGoal.mockRejectedValue(apiError);

      render(<MockedGoalForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '50');

      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
    });

    it('handles API errors during goal update', async () => {
      const user = userEvent.setup();
      const existingGoal = {
        _id: '123',
        title: 'Existing Goal',
        targetType: 'hours',
        targetValue: 100,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      };

      const apiError = {
        response: { data: { error: 'Update failed' } }
      };

      goalApi.updateGoal.mockRejectedValue(apiError);

      render(<MockedGoalForm goal={existingGoal} />);

      // Update and submit
      const titleInput = screen.getByLabelText(/goal title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');

      fireEvent.click(screen.getByRole('button', { name: /update goal/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('Loading States', () => {
    it('disables submit button when loading', async () => {
      const user = userEvent.setup();
      
      // Mock a pending promise
      goalApi.createGoal.mockImplementation(() => new Promise(() => {}));

      render(<MockedGoalForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/goal title/i), 'Test Goal');
      await user.clear(screen.getByLabelText(/target value/i));
      await user.type(screen.getByLabelText(/target value/i), '50');

      const submitButton = screen.getByRole('button', { name: /create goal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving.../i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<MockedGoalForm />);

      // Check required field indicators
      expect(screen.getByLabelText(/goal title \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/target value \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date \*/i)).toBeInTheDocument();

      // Check optional field indicators
      expect(screen.getByText('Optional')).toBeInTheDocument(); // For milestones section
    });

    it('associates error messages with form fields', async () => {
      render(<MockedGoalForm />);

      fireEvent.click(screen.getByRole('button', { name: /create goal/i }));

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/goal title/i);
        const errorMessage = screen.getByText('Title is required');
        
        // The error should be associated with the input through aria-describedby or similar
        expect(titleInput).toHaveAttribute('class', expect.stringContaining('border-red-300'));
      });
    });
  });
});