import React, { useState } from 'react';
import ReminderList from '../../components/reminder/ReminderList';
import ReminderEditor from '../../components/reminder/ReminderEditor';

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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