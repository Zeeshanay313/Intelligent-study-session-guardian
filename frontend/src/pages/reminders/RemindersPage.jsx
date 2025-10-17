import React, { useState } from 'react';
import ReminderList from '../../components/reminder/ReminderList';
import ReminderEditor from '../../components/reminder/ReminderEditor';
import api from '../../services/api';

const RemindersPage = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setEditingReminder(null);
    setShowEditor(true);
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setShowEditor(true);
  };

  const handleSave = () => {
    setShowEditor(false);
    setEditingReminder(null);
    setRefreshKey(prev => prev + 1); // Force refresh of ReminderList
  };

  const handleClose = () => {
    setShowEditor(false);
    setEditingReminder(null);
  };

  const createTestReminder = async () => {
    try {
      const testTime = new Date(Date.now() + 10000); // 10 seconds from now
      const testReminder = {
        title: 'Test Reminder',
        message: 'This is a test reminder that should fire in 10 seconds!',
        type: 'one-off',
        datetime: testTime.toISOString(),
        channels: { inApp: true, email: false, push: false },
        isActive: true
      };
      
      const response = await api.post('/reminders', testReminder);
      
      // Also save to localStorage
      const savedReminder = response.data;
      const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
      localReminders.push(savedReminder);
      localStorage.setItem('userReminders', JSON.stringify(localReminders));
      
      alert('Test reminder created! It will fire in 10 seconds.');
      setRefreshKey(prev => prev + 1); // Refresh the list
    } catch (error) {
      console.error('Error creating test reminder:', error);
      
      // Save to localStorage as fallback
      try {
        const testReminder = {
          _id: 'test-reminder-' + Date.now(),
          title: 'Test Reminder',
          message: 'This is a test reminder that should fire in 10 seconds!',
          type: 'one-off',
          datetime: new Date(Date.now() + 10000).toISOString(),
          channels: { inApp: true, email: false, push: false },
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        const localReminders = JSON.parse(localStorage.getItem('userReminders') || '[]');
        localReminders.push(testReminder);
        localStorage.setItem('userReminders', JSON.stringify(localReminders));
        
        alert('Test reminder created locally! It will fire in 10 seconds.');
        setRefreshKey(prev => prev + 1); // Refresh the list
      } catch (localError) {
        alert('Failed to create test reminder');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Test Button */}
      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          🧪 Test Reminder System
        </h3>
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
          Create a test reminder that will fire in 10 seconds to verify the notification system works.
        </p>
        <button
          onClick={createTestReminder}
          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
        >
          Create 10-Second Test Reminder
        </button>
      </div>

      <ReminderList
        key={refreshKey}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
      />

      {showEditor && (
        <ReminderEditor
          reminder={editingReminder}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default RemindersPage;