import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';

const ReminderList = ({ onCreateNew, onEdit }) => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/reminders');
      // Ensure we always set an array, even if response.data is not an array
      let reminderData = Array.isArray(response.data) ? response.data : 
                         Array.isArray(response.data.data) ? response.data.data : [];
      
      // Merge with locally stored reminders
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      if (localReminders.length > 0) {
        // Merge API reminders with local reminders, avoiding duplicates
        const combinedReminders = [...reminderData];
        localReminders.forEach(localReminder => {
          if (!combinedReminders.find(r => r._id === localReminder._id)) {
            combinedReminders.push(localReminder);
          }
        });
        reminderData = combinedReminders;
      }
      
      // Save merged reminders to localStorage
      localStorage.setItem('userReminders', JSON.stringify(reminderData));
      setReminders(reminderData);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      
      // Load from localStorage as fallback
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      if (localReminders.length > 0) {
        setReminders(localReminders);
      } else {
        // Provide mock reminders as fallback if no local data
        const mockReminders = [
          {
            _id: 'mock-reminder-1',
            title: 'Study Break Reminder',
            message: 'Time to take a 15-minute break!',
            type: 'recurring',
            isActive: true,
            nextTrigger: new Date(Date.now() + 60000), // 1 minute from now
            recurrence: { frequency: 'daily', interval: 1 },
            channels: { inApp: true, email: false, push: false }
          },
          {
            _id: 'mock-reminder-2',
            title: 'Project Deadline',
            message: 'Submit your final project today!',
            type: 'one-off',
            isActive: true,
            datetime: new Date(Date.now() + 3600000), // 1 hour from now
            channels: { inApp: true, email: true, push: false }
          }
        ];
        setReminders(mockReminders);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (reminderId) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await api.delete(`/reminders/${reminderId}`);
      
      // Also remove from localStorage
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      const updatedReminders = localReminders.filter(r => r._id !== reminderId);
      localStorage.setItem('userReminders', JSON.stringify(updatedReminders));
      
      setReminders(prev => prev.filter(r => r._id !== reminderId));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      
      // Still try to remove from localStorage
      try {
        const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
        const updatedReminders = localReminders.filter(r => r._id !== reminderId);
        localStorage.setItem('userReminders', JSON.stringify(updatedReminders));
        setReminders(prev => prev.filter(r => r._id !== reminderId));
      } catch (localError) {
        alert('Failed to delete reminder');
      }
    }
  };

  const handleToggleActive = async (reminder) => {
    try {
      const response = await api.put(`/reminders/${reminder._id}`, {
        isActive: !reminder.isActive
      });
      
      // Also update localStorage
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      const updatedReminders = localReminders.map(r => 
        r._id === reminder._id ? response.data : r
      );
      localStorage.setItem('userReminders', JSON.stringify(updatedReminders));
      
      setReminders(prev => prev.map(r => 
        r._id === reminder._id ? response.data : r
      ));
    } catch (error) {
      console.error('Error updating reminder:', error);
      
      // Still try to update localStorage
      try {
        const updatedReminder = { ...reminder, isActive: !reminder.isActive };
        const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
        const updatedReminders = localReminders.map(r => 
          r._id === reminder._id ? updatedReminder : r
        );
        localStorage.setItem('userReminders', JSON.stringify(updatedReminders));
        setReminders(prev => prev.map(r => 
          r._id === reminder._id ? updatedReminder : r
        ));
      } catch (localError) {
        alert('Failed to update reminder');
      }
    }
  };

  const handleTestReminder = async (reminder) => {
    try {
      await api.post(`/reminders/${reminder._id}/trigger`);
      alert('Test reminder triggered! Check for notification.');
    } catch (error) {
      console.error('Error testing reminder:', error);
      alert('Failed to trigger test reminder');
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRecurrence = (recurrence) => {
    if (!recurrence?.frequency) return 'One-time';
    
    const { frequency, interval = 1 } = recurrence;
    const frequencyText = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
      yearly: 'year'
    };

    return interval === 1 
      ? `Every ${frequencyText[frequency]}`
      : `Every ${interval} ${frequencyText[frequency]}s`;
  };

  const getNextOccurrence = (reminder) => {
    if (!reminder.recurrence?.frequency) {
      return reminder.dateTime;
    }
    // For recurring reminders, we'd calculate the next occurrence
    // This is a simplified version
    return reminder.dateTime;
  };

  const isOverdue = (dateTime) => {
    return new Date(dateTime) < new Date();
  };

  const isPastReminder = (reminder) => {
    return !reminder.recurrence?.frequency && isOverdue(reminder.dateTime);
  };

  // Group reminders - ensure reminders is always an array
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const activeReminders = safeReminders.filter(r => r.isActive && !isPastReminder(r));
  const inactiveReminders = safeReminders.filter(r => !r.isActive);
  const pastReminders = safeReminders.filter(r => isPastReminder(r));

  const ReminderCard = ({ reminder, showStatus = false }) => (
    <div className={`p-4 border rounded-lg transition-all ${
      reminder.isActive 
        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {reminder.isActive ? (
              <BellSolidIcon className="w-5 h-5 text-blue-600" />
            ) : (
              <BellIcon className="w-5 h-5 text-gray-400" />
            )}
            <h3 className="font-medium text-gray-900 dark:text-white">
              {reminder.title}
            </h3>
            {showStatus && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                reminder.isActive
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {reminder.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>

          {reminder.message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {reminder.message}
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>{formatDateTime(getNextOccurrence(reminder))}</span>
              {isOverdue(reminder.dateTime) && (
                <span className="text-red-500 font-medium">(Overdue)</span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{formatRecurrence(reminder.recurrence)}</span>
            </div>
          </div>

          {reminder.tags && reminder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reminder.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => handleToggleActive(reminder)}
            className={`p-2 rounded transition-colors ${
              reminder.isActive
                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={reminder.isActive ? 'Deactivate' : 'Activate'}
          >
            <BellIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleTestReminder(reminder)}
            className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900 rounded transition-colors"
            title="Test Reminder"
          >
            <span className="w-4 h-4 text-xs font-bold">🔔</span>
          </button>
          
          <button
            onClick={() => onEdit(reminder)}
            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleDelete(reminder._id)}
            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reminders
        </h2>
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Reminder
        </button>
      </div>

      {/* Active Reminders */}
      {activeReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Reminders ({activeReminders.length})
          </h3>
          <div className="space-y-3">
            {activeReminders.map(reminder => (
              <ReminderCard key={reminder._id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Reminders */}
      {inactiveReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
            Inactive Reminders ({inactiveReminders.length})
          </h3>
          <div className="space-y-3">
            {inactiveReminders.map(reminder => (
              <ReminderCard key={reminder._id} reminder={reminder} showStatus />
            ))}
          </div>
        </div>
      )}

      {/* Past Reminders */}
      {pastReminders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
            Past Reminders ({pastReminders.length})
          </h3>
          <div className="space-y-3">
            {pastReminders.map(reminder => (
              <ReminderCard key={reminder._id} reminder={reminder} showStatus />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {reminders.length === 0 && (
        <div className="text-center py-12">
          <BellIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No reminders yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first reminder to stay on track with your goals.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Reminder
          </button>
        </div>
      )}
    </div>
  );
};

export default ReminderList;