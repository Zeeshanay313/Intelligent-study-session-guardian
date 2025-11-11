import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../components/shared/NotificationToast';
import { useSocket } from '../../hooks/useSocket';
import ReminderPopup from '../../components/reminder/ReminderPopup';
import {
  BellIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BellSnoozeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const ReminderPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useNotifications();
  const { socketService } = useSocket();

  const [reminders, setReminders] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // active, history
  const [activePopup, setActivePopup] = useState(null); // For showing reminder popup

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    customMessage: '',
    type: 'one-off',
    datetime: '',
    recurring: {
      frequency: 'daily',
      interval: 1,
      daysOfWeek: [],
      timeOfDay: '09:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    },
    channels: {
      inApp: true,
      email: false,
      push: false
    },
    sound: {
      enabled: true,
      type: 'default'
    },
    priority: 'medium',
    category: 'general',
    tags: [],
    idleNudge: {
      enabled: false,
      idleThreshold: 5,
      nudgeInterval: 10
    },
    calendarSync: {
      provider: null,
      syncEnabled: false
    }
  });

  useEffect(() => {
    loadReminders();
  }, [activeTab]);

  // Socket.IO listener for real-time reminder notifications
  useEffect(() => {
    console.log('🔌 Setting up Socket.IO listeners for reminders...');
    console.log('Socket service available:', !!socketService);
    
    if (!socketService) {
      console.warn('⚠️ Socket service not available yet');
      return;
    }

    const handleReminderNotification = (data) => {
      console.log('🔔 REMINDER NOTIFICATION RECEIVED:', data);
      console.log('Reminder data:', data.reminder);
      
      const reminderData = data.reminder || data;
      console.log('Setting active popup with:', reminderData);
      setActivePopup(reminderData);
      loadReminders(); // Refresh the list
    };

    const handleIdleNudge = (data) => {
      console.log('💤 Idle nudge received:', data);
      showInfo('Study Reminder', data.message || 'Time to get back to studying!');
    };

    // Listen for reminder events
    console.log('📡 Registering event listeners...');
    socketService.on('reminder:notification', handleReminderNotification);
    socketService.on('reminder:nudge', handleIdleNudge);
    console.log('✅ Event listeners registered');

    return () => {
      console.log('🔌 Cleaning up Socket.IO listeners...');
      socketService.off('reminder:notification', handleReminderNotification);
      socketService.off('reminder:nudge', handleIdleNudge);
    };
  }, [socketService, showInfo]);

  const loadReminders = async () => {
    setLoading(true);
    try {
      let endpoint = '/reminder';
      if (activeTab === 'active') {
        endpoint = '/reminder/active/list';
      } else if (activeTab === 'history') {
        endpoint = '/reminder/history/all';
      }

      const response = await api.get(endpoint);
      setReminders(Array.isArray(response.data) ? response.data : response.data.reminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      showError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = { ...formData };

      // Validate based on type
      if (formData.type === 'one-off' && !formData.datetime) {
        showError('Please select a date and time');
        setLoading(false);
        return;
      }

      await api.post('/reminder', submitData);
      
      showSuccess('Reminder created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadReminders();
    } catch (error) {
      console.error('Error creating reminder:', error);
      showError('Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (reminderId, duration) => {
    try {
      await api.post(`/reminder/${reminderId}/snooze`, { duration });
      showInfo(`Reminder snoozed for ${duration} minutes`);
      loadReminders();
    } catch (error) {
      console.error('Error snoozing reminder:', error);
      showError('Failed to snooze reminder');
    }
  };

  const handleDismiss = async (reminderId) => {
    try {
      await api.post(`/reminder/${reminderId}/dismiss`);
      showSuccess('Reminder dismissed');
      loadReminders();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
      showError('Failed to dismiss reminder');
    }
  };

  const handleComplete = async (reminderId) => {
    try {
      await api.post(`/reminder/${reminderId}/complete`);
      showSuccess('Reminder completed!');
      loadReminders();
    } catch (error) {
      console.error('Error completing reminder:', error);
      showError('Failed to complete reminder');
    }
  };

  const handleDelete = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await api.delete(`/reminder/${reminderId}`);
      showSuccess('Reminder deleted');
      loadReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      showError('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      customMessage: '',
      type: 'one-off',
      datetime: '',
      recurring: {
        frequency: 'daily',
        interval: 1,
        daysOfWeek: [],
        timeOfDay: '09:00',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      },
      channels: {
        inApp: true,
        email: false,
        push: false
      },
      sound: {
        enabled: true,
        type: 'default'
      },
      priority: 'medium',
      category: 'general',
      tags: [],
      idleNudge: {
        enabled: false,
        idleThreshold: 5,
        nudgeInterval: 10
      },
      calendarSync: {
        provider: null,
        syncEnabled: false
      }
    });
  };

  const toggleDayOfWeek = (day) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        daysOfWeek: prev.recurring.daysOfWeek.includes(day)
          ? prev.recurring.daysOfWeek.filter(d => d !== day)
          : [...prev.recurring.daysOfWeek, day].sort()
      }
    }));
  };

  const formatDateTime = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      snoozed: 'bg-yellow-100 text-yellow-800',
      dismissed: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create and manage your study reminders with advanced scheduling
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              console.log('🧪 Testing reminder popup...');
              const testReminder = {
                _id: 'test-' + Date.now(),
                title: 'Test Reminder',
                customMessage: 'This is a test reminder to verify the alarm sound works!',
                priority: 'high',
                category: 'study',
                sound: { enabled: true, type: 'alarm' },
                type: 'one-off',
                datetime: new Date(),
                channels: { inApp: true }
              };
              setActivePopup(testReminder);
            }}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            🧪 Test Alarm
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Reminder
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-2 px-4 ${
            activeTab === 'active'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Active Reminders
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-4 ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          History
        </button>
        
        {/* Debug Info */}
        <div className="ml-auto flex items-center space-x-2 text-xs">
          <div className={`px-2 py-1 rounded ${socketService ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            Socket: {socketService ? '✅ Connected' : '❌ Disconnected'}
          </div>
          <button
            onClick={async () => {
              try {
                await api.post('/reminder/test/check-now');
                showInfo('Manually triggered reminder check');
              } catch (error) {
                showError('Failed to trigger check: ' + error.message);
              }
            }}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            🔄 Check Now
          </button>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="text-center py-12">
          <ArrowPathIcon className="w-12 h-12 mx-auto animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <BellIcon className="w-16 h-16 mx-auto text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {activeTab === 'active' ? 'No active reminders' : 'No reminder history'}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Create your first reminder
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reminders.map((reminder) => (
            <div
              key={reminder._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {reminder.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(reminder.priority)}`}>
                      {reminder.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(reminder.status)}`}>
                      {reminder.status}
                    </span>
                  </div>

                  {reminder.customMessage && (
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {reminder.customMessage}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {reminder.type === 'one-off' 
                        ? formatDateTime(reminder.datetime)
                        : `${reminder.recurring?.frequency} at ${reminder.recurring?.timeOfDay}`
                      }
                    </span>
                    <span className="capitalize">{reminder.category}</span>
                    {reminder.calendarLinked && (
                      <span className="flex items-center text-green-600">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Calendar Synced
                      </span>
                    )}
                  </div>

                  {/* Channel indicators */}
                  <div className="flex items-center space-x-2 mt-2">
                    {reminder.channels.inApp && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📱 In-App</span>
                    )}
                    {reminder.channels.email && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">📧 Email</span>
                    )}
                    {reminder.channels.push && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🔔 Push</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {activeTab === 'active' && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleSnooze(reminder._id, 15)}
                      className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded text-sm"
                    >
                      Snooze 15min
                    </button>
                    <button
                      onClick={() => handleComplete(reminder._id)}
                      className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDismiss(reminder._id)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDelete(reminder._id)}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Snooze info */}
              {reminder.status === 'snoozed' && reminder.snooze?.snoozedUntil && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    Snoozed until {formatDateTime(reminder.snooze.snoozedUntil)}
                    {reminder.snooze.count > 1 && ` (${reminder.snooze.count} times)`}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Reminder</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title & Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Study Session Reminder"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message
                </label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Time to review your notes for the upcoming exam!"
                  rows="3"
                />
              </div>

              {/* Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminder Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'one-off' })}
                    className={`px-4 py-2 rounded-lg ${
                      formData.type === 'one-off'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    One-Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'recurring' })}
                    className={`px-4 py-2 rounded-lg ${
                      formData.type === 'recurring'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>

              {/* One-off datetime */}
              {formData.type === 'one-off' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.datetime}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              )}

              {/* Recurring settings */}
              {formData.type === 'recurring' && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Frequency
                      </label>
                      <select
                        value={formData.recurring.frequency}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, frequency: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Every (interval)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurring.interval}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, interval: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {formData.recurring.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const days = [...formData.recurring.daysOfWeek];
                              if (days.includes(index)) {
                                setFormData({
                                  ...formData,
                                  recurring: { ...formData.recurring, daysOfWeek: days.filter(d => d !== index) }
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  recurring: { ...formData.recurring, daysOfWeek: [...days, index] }
                                });
                              }
                            }}
                            className={`px-3 py-1 rounded ${
                              formData.recurring.daysOfWeek.includes(index)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time of Day
                    </label>
                    <input
                      type="time"
                      value={formData.recurring.timeOfDay}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurring: { ...formData.recurring, timeOfDay: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.recurring.startDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, startDate: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date (optional)
                      </label>
                      <input
                        type="date"
                        value={formData.recurring.endDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          recurring: { ...formData.recurring, endDate: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Channels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.channels.inApp}
                      onChange={(e) => setFormData({
                        ...formData,
                        channels: { ...formData.channels, inApp: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">📱 In-App Notification</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.channels.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        channels: { ...formData.channels, email: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">📧 Email Notification</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.channels.push}
                      onChange={(e) => setFormData({
                        ...formData,
                        channels: { ...formData.channels, push: e.target.checked }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">🔔 Push Notification</span>
                  </label>
                </div>
              </div>

              {/* Sound Settings */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.sound.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      sound: { ...formData.sound, enabled: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Sound Alert</span>
                </label>
                {formData.sound.enabled && (
                  <select
                    value={formData.sound.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      sound: { ...formData.sound, type: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="default">Default</option>
                    <option value="bell">Bell</option>
                    <option value="chime">Chime</option>
                    <option value="alarm">Alarm</option>
                  </select>
                )}
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="study">Study</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="break">Break</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Idle Nudge Settings */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.idleNudge.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      idleNudge: { ...formData.idleNudge, enabled: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Idle Nudges</span>
                </label>
                {formData.idleNudge.enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Idle Threshold (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={formData.idleNudge.idleThreshold}
                        onChange={(e) => setFormData({
                          ...formData,
                          idleNudge: { ...formData.idleNudge, idleThreshold: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Nudge Interval (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.idleNudge.nudgeInterval}
                        onChange={(e) => setFormData({
                          ...formData,
                          idleNudge: { ...formData.idleNudge, nudgeInterval: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Sync */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.calendarSync.syncEnabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      calendarSync: { ...formData.calendarSync, syncEnabled: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sync to Calendar</span>
                </label>
                {formData.calendarSync.syncEnabled && (
                  <select
                    value={formData.calendarSync.provider}
                    onChange={(e) => setFormData({
                      ...formData,
                      calendarSync: { ...formData.calendarSync, provider: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Calendar Provider</option>
                    <option value="google">Google Calendar</option>
                    <option value="outlook">Outlook Calendar</option>
                  </select>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Popup Notification */}
      {activePopup && (
        <ReminderPopup
          reminder={activePopup}
          onSnooze={(id, duration) => {
            console.log('Snooze clicked:', id, duration);
            if (id.toString().startsWith('test-')) {
              // Test reminder - just close
              setActivePopup(null);
              showInfo(`Test alarm snoozed for ${duration} minutes`);
            } else {
              // Real reminder - call API
              handleSnooze(id, duration);
              setActivePopup(null);
            }
          }}
          onDismiss={(id) => {
            console.log('Dismiss clicked:', id);
            if (id.toString().startsWith('test-')) {
              // Test reminder - just close
              setActivePopup(null);
              showInfo('Test alarm dismissed');
            } else {
              // Real reminder - call API
              handleDismiss(id);
              setActivePopup(null);
            }
          }}
          onComplete={(id) => {
            console.log('Complete clicked:', id);
            if (id.toString().startsWith('test-')) {
              // Test reminder - just close
              setActivePopup(null);
              showSuccess('Test alarm completed');
            } else {
              // Real reminder - call API
              handleComplete(id);
              setActivePopup(null);
            }
          }}
          onClose={() => {
            console.log('Close clicked');
            setActivePopup(null);
          }}
        />
      )}
    </div>
  );
};

export default ReminderPage;

