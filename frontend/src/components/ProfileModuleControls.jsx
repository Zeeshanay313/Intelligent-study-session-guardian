import React, { useState, useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import {
  ClockIcon,
  BellIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Card from './ui/Card';
import Button from './ui/Button';

const ProfileModuleControls = () => {
  const {
    settings,
    timerPresets,
    reminders,
    goals,
    updateSettings,
    createTimerPreset,
    updateTimerPreset,
    deleteTimerPreset,
    createReminder,
    updateReminder,
    deleteReminder,
    updateGoal,
    loading
  } = useAppState();

  const [activeTab, setActiveTab] = useState('timer');
  const [newPresetForm, setNewPresetForm] = useState(false);
  const [newReminderForm, setNewReminderForm] = useState(false);

  // Timer Preset Form
  const [presetData, setPresetData] = useState({
    name: '',
    workDuration: 1500,
    breakDuration: 300,
    longBreakDuration: 900,
    cyclesBeforeLongBreak: 4
  });

  // Reminder Form
  const [reminderData, setReminderData] = useState({
    title: '',
    message: '',
    type: 'one-off',
    datetime: '',
    cronExpression: '',
    channels: { inApp: true, email: false, push: false }
  });

  const handleTimerDefaultsChange = (key, value) => {
    updateSettings({
      timerDefaults: {
        ...settings.timerDefaults,
        [key]: value
      }
    });
  };

  const handleReminderDefaultsChange = (key, value) => {
    updateSettings({
      reminderDefaults: {
        ...settings.reminderDefaults,
        [key]: value
      }
    });
  };

  const handleGoalDefaultsChange = (key, value) => {
    updateSettings({
      goalDefaults: {
        ...settings.goalDefaults,
        [key]: value
      }
    });
  };

  const handleCreatePreset = async () => {
    const result = await createTimerPreset(presetData);
    if (result.success) {
      setNewPresetForm(false);
      setPresetData({
        name: '',
        workDuration: 1500,
        breakDuration: 300,
        longBreakDuration: 900,
        cyclesBeforeLongBreak: 4
      });
    }
  };

  const handleDeletePreset = async (presetId) => {
    if (window.confirm('Are you sure you want to delete this preset?')) {
      await deleteTimerPreset(presetId);
    }
  };

  const handleCreateReminder = async () => {
    const result = await createReminder(reminderData);
    if (result.success) {
      setNewReminderForm(false);
      setReminderData({
        title: '',
        message: '',
        type: 'one-off',
        datetime: '',
        cronExpression: '',
        channels: { inApp: true, email: false, push: false }
      });
    }
  };

  const handleToggleReminderActive = async (reminderId, currentState) => {
    const reminder = reminders.find(r => r._id === reminderId);
    if (reminder) {
      await updateReminder(reminderId, { ...reminder, isActive: !currentState });
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      await deleteReminder(reminderId);
    }
  };

  const renderTimerControls = () => (
    <div className="space-y-6">
      {/* Default Timer Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2" />
          Default Timer Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Focus Time (minutes)</label>
            <input
              type="number"
              value={settings.timerDefaults.focusTime}
              onChange={(e) => handleTimerDefaultsChange('focusTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="120"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Short Break (minutes)</label>
            <input
              type="number"
              value={settings.timerDefaults.shortBreak}
              onChange={(e) => handleTimerDefaultsChange('shortBreak', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Long Break (minutes)</label>
            <input
              type="number"
              value={settings.timerDefaults.longBreak}
              onChange={(e) => handleTimerDefaultsChange('longBreak', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Long Break Interval</label>
            <input
              type="number"
              value={settings.timerDefaults.longBreakInterval}
              onChange={(e) => handleTimerDefaultsChange('longBreakInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="2"
              max="10"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.timerDefaults.autoStart}
              onChange={(e) => handleTimerDefaultsChange('autoStart', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Auto-start next session</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.timerDefaults.soundEnabled}
              onChange={(e) => handleTimerDefaultsChange('soundEnabled', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Enable sound notifications</span>
          </label>
        </div>
      </Card>

      {/* Timer Presets */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Cog6ToothIcon className="w-5 h-5 mr-2" />
            Custom Timer Presets
          </h3>
          <Button
            onClick={() => setNewPresetForm(!newPresetForm)}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Preset
          </Button>
        </div>

        {newPresetForm && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Preset name"
                value={presetData.name}
                onChange={(e) => setPresetData({ ...presetData, name: e.target.value })}
                className="col-span-2 px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Work (seconds)"
                value={presetData.workDuration}
                onChange={(e) => setPresetData({ ...presetData, workDuration: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Break (seconds)"
                value={presetData.breakDuration}
                onChange={(e) => setPresetData({ ...presetData, breakDuration: parseInt(e.target.value) })}
                className="px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleCreatePreset} size="sm">Create</Button>
              <Button onClick={() => setNewPresetForm(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loading.timerPresets ? (
            <p className="text-sm text-gray-500">Loading presets...</p>
          ) : timerPresets.length === 0 ? (
            <p className="text-sm text-gray-500">No custom presets yet</p>
          ) : (
            timerPresets.map((preset) => (
              <div key={preset._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-gray-500">
                    {Math.floor(preset.workDuration / 60)}m work / {Math.floor(preset.breakDuration / 60)}m break
                  </p>
                </div>
                <Button
                  onClick={() => handleDeletePreset(preset._id)}
                  variant="ghost"
                  size="sm"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );

  const renderReminderControls = () => (
    <div className="space-y-6">
      {/* Reminder Defaults */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BellIcon className="w-5 h-5 mr-2" />
          Reminder Preferences
        </h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.reminderDefaults.enabled}
              onChange={(e) => handleReminderDefaultsChange('enabled', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Enable reminders</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.reminderDefaults.breakReminders}
              onChange={(e) => handleReminderDefaultsChange('breakReminders', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Break time reminders</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.reminderDefaults.studyReminders}
              onChange={(e) => handleReminderDefaultsChange('studyReminders', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Study session reminders</span>
          </label>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Notification Channels</p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.reminderDefaults.channels.inApp}
                onChange={(e) => handleReminderDefaultsChange('channels', {
                  ...settings.reminderDefaults.channels,
                  inApp: e.target.checked
                })}
                className="mr-2"
              />
              <span className="text-sm">In-app notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.reminderDefaults.channels.email}
                onChange={(e) => handleReminderDefaultsChange('channels', {
                  ...settings.reminderDefaults.channels,
                  email: e.target.checked
                })}
                className="mr-2"
              />
              <span className="text-sm">Email notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.reminderDefaults.channels.push}
                onChange={(e) => handleReminderDefaultsChange('channels', {
                  ...settings.reminderDefaults.channels,
                  push: e.target.checked
                })}
                className="mr-2"
              />
              <span className="text-sm">Push notifications</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Active Reminders */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Active Reminders</h3>
          <Button
            onClick={() => setNewReminderForm(!newReminderForm)}
            variant="outline"
            size="sm"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Reminder
          </Button>
        </div>

        {newReminderForm && (
          <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Reminder title"
                value={reminderData.title}
                onChange={(e) => setReminderData({ ...reminderData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <textarea
                placeholder="Message (optional)"
                value={reminderData.message}
                onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="2"
              />
              <select
                value={reminderData.type}
                onChange={(e) => setReminderData({ ...reminderData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="one-off">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
              {reminderData.type === 'one-off' ? (
                <input
                  type="datetime-local"
                  value={reminderData.datetime}
                  onChange={(e) => setReminderData({ ...reminderData, datetime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Cron expression (e.g., 0 9 * * *)"
                  value={reminderData.cronExpression}
                  onChange={(e) => setReminderData({ ...reminderData, cronExpression: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              )}
            </div>
            <div className="flex space-x-2 mt-3">
              <Button onClick={handleCreateReminder} size="sm">Create</Button>
              <Button onClick={() => setNewReminderForm(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {loading.reminders ? (
            <p className="text-sm text-gray-500">Loading reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-gray-500">No active reminders</p>
          ) : (
            reminders.map((reminder) => (
              <div key={reminder._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{reminder.title}</p>
                  <p className="text-sm text-gray-500">
                    {reminder.type === 'one-off' 
                      ? new Date(reminder.datetime).toLocaleString()
                      : `Recurring: ${reminder.cronExpression}`
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleReminderActive(reminder._id, reminder.isActive)}
                    className={`p-1 rounded ${reminder.isActive ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <Button
                    onClick={() => handleDeleteReminder(reminder._id)}
                    variant="ghost"
                    size="sm"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );

  const renderGoalControls = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2" />
          Goal Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Weekly Study Target (hours)</label>
            <input
              type="number"
              value={settings.goalDefaults.weeklyTarget}
              onChange={(e) => handleGoalDefaultsChange('weeklyTarget', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Daily Study Target (hours)</label>
            <input
              type="number"
              value={settings.goalDefaults.dailyTarget}
              onChange={(e) => handleGoalDefaultsChange('dailyTarget', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
              max="24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default Goal Visibility</label>
            <select
              value={settings.goalDefaults.visibility}
              onChange={(e) => handleGoalDefaultsChange('visibility', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="private">Private</option>
              <option value="friends">Friends Only</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Goals</h3>
        <div className="space-y-2">
          {loading.goals ? (
            <p className="text-sm text-gray-500">Loading goals...</p>
          ) : goals.length === 0 ? (
            <p className="text-sm text-gray-500">No active goals. <a href="/goals/new" className="text-primary-600 hover:underline">Create one now</a></p>
          ) : (
            goals.slice(0, 5).map((goal) => (
              <div key={goal._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{goal.title}</p>
                  <div className="flex items-center mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(goal.currentValue / goal.targetValue) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">
                      {goal.currentValue} / {goal.targetValue}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {goals.length > 5 && (
          <div className="mt-4 text-center">
            <a href="/goals" className="text-primary-600 hover:underline text-sm">View all goals</a>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Module Settings & Controls</h2>
      
      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('timer')}
          className={`pb-2 px-4 ${activeTab === 'timer' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}
        >
          <ClockIcon className="w-5 h-5 inline-block mr-2" />
          Timer
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`pb-2 px-4 ${activeTab === 'reminders' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}
        >
          <BellIcon className="w-5 h-5 inline-block mr-2" />
          Reminders
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-2 px-4 ${activeTab === 'goals' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600'}`}
        >
          <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
          Goals
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'timer' && renderTimerControls()}
      {activeTab === 'reminders' && renderReminderControls()}
      {activeTab === 'goals' && renderGoalControls()}
    </div>
  );
};

export default ProfileModuleControls;
