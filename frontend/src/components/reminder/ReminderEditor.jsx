import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  BellIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const ReminderEditor = ({ reminder, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    dateTime: '',
    recurrence: {
      frequency: '',
      interval: 1,
      endDate: ''
    },
    notificationMethods: ['inApp'],
    tags: [],
    calendarIntegration: false,
    isActive: true
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (reminder) {
      // Format datetime for input
      const formattedDateTime = reminder.dateTime 
        ? new Date(reminder.dateTime).toISOString().slice(0, 16)
        : '';
      
      setFormData({
        title: reminder.title || '',
        message: reminder.message || '',
        dateTime: formattedDateTime,
        recurrence: {
          frequency: reminder.recurrence?.frequency || '',
          interval: reminder.recurrence?.interval || 1,
          endDate: reminder.recurrence?.endDate 
            ? new Date(reminder.recurrence.endDate).toISOString().slice(0, 10)
            : ''
        },
        notificationMethods: reminder.notificationMethods || ['inApp'],
        tags: reminder.tags || [],
        calendarIntegration: reminder.calendarIntegration || false,
        isActive: reminder.isActive !== undefined ? reminder.isActive : true
      });
    } else {
      // Set default datetime to next hour
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      setFormData(prev => ({
        ...prev,
        dateTime: now.toISOString().slice(0, 16)
      }));
    }
  }, [reminder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        dateTime: new Date(formData.dateTime).toISOString(),
        recurrence: formData.recurrence.frequency ? {
          ...formData.recurrence,
          endDate: formData.recurrence.endDate 
            ? new Date(formData.recurrence.endDate).toISOString()
            : null
        } : null
      };

      let savedReminder;
      if (reminder) {
        const response = await api.put(`/reminders/${reminder._id}`, payload);
        savedReminder = response.data;
      } else {
        const response = await api.post('/reminders', payload);
        savedReminder = response.data;
      }
      
      // Also save to localStorage as backup
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      if (reminder) {
        const index = localReminders.findIndex(r => r._id === reminder._id);
        if (index >= 0) {
          localReminders[index] = savedReminder;
        } else {
          localReminders.push(savedReminder);
        }
      } else {
        localReminders.push(savedReminder);
      }
      localStorage.setItem('userReminders', JSON.stringify(localReminders));
      
      onSave();
    } catch (error) {
      console.error('Error saving reminder:', error);
      
      // Save to localStorage as fallback
      try {
        const newReminder = {
          _id: reminder?._id || 'local-reminder-' + Date.now(),
          ...formData,
          dateTime: new Date(formData.dateTime).toISOString(),
          recurrence: formData.recurrence.frequency ? {
            ...formData.recurrence,
            endDate: formData.recurrence.endDate 
              ? new Date(formData.recurrence.endDate).toISOString()
              : null
          } : null,
          createdAt: reminder?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };
        
        const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
        if (reminder) {
          const index = localReminders.findIndex(r => r._id === reminder._id);
          if (index >= 0) {
            localReminders[index] = newReminder;
          } else {
            localReminders.push(newReminder);
          }
        } else {
          localReminders.push(newReminder);
        }
        localStorage.setItem('userReminders', JSON.stringify(localReminders));
        
        onSave();
        alert('Reminder saved locally (server unavailable)');
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        alert('Failed to save reminder');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleNotificationMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      notificationMethods: prev.notificationMethods.includes(method)
        ? prev.notificationMethods.filter(m => m !== method)
        : [...prev.notificationMethods, method]
    }));
  };

  const isRecurring = formData.recurrence.frequency !== '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {reminder ? 'Edit Reminder' : 'Create New Reminder'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Reminder title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Optional reminder message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Recurrence
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.recurrence.frequency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    recurrence: { ...prev.recurrence, frequency: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {isRecurring && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Repeat every
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.recurrence.interval}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          recurrence: { ...prev.recurrence, interval: parseInt(e.target.value) }
                        }))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formData.recurrence.frequency}(s)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End date (optional)
                    </label>
                    <input
                      type="date"
                      value={formData.recurrence.endDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recurrence: { ...prev.recurrence, endDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Notification Methods */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Notification Methods
              </h3>
              
              <div className="space-y-2">
                {[
                  { value: 'inApp', label: 'In-app notification' },
                  { value: 'email', label: 'Email' },
                  { value: 'push', label: 'Push notification' }
                ].map(method => (
                  <label key={method.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notificationMethods.includes(method.value)}
                      onChange={() => handleNotificationMethodChange(method.value)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Tags
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleTagAdd(e)}
                />
                <button
                  type="button"
                  onClick={handleTagAdd}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Calendar Integration */}
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.calendarIntegration}
                  onChange={(e) => setFormData(prev => ({ ...prev, calendarIntegration: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Add to calendar
                </span>
              </label>
            </div>

            {/* Active Status */}
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active reminder
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? 'Saving...' : (reminder ? 'Update Reminder' : 'Create Reminder')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReminderEditor;