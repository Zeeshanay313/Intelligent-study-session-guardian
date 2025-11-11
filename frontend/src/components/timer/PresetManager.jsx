import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const PresetManager = ({ presets, onPresetsChange, onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    workDuration: 1500, // 25 minutes
    breakDuration: 300, // 5 minutes
    longBreakDuration: 900, // 15 minutes
    cyclesBeforeLongBreak: 4,
    color: '#3B82F6',
    icon: '📚'
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      workDuration: 1500,
      breakDuration: 300,
      longBreakDuration: 900,
      cyclesBeforeLongBreak: 4,
      color: '#3B82F6',
      icon: '📚'
    });
    setEditingPreset(null);
    setShowForm(false);
  };

  const handleEdit = (preset) => {
    setFormData({
      name: preset.name,
      subject: preset.subject || '',
      workDuration: preset.workDuration,
      breakDuration: preset.breakDuration,
      longBreakDuration: preset.longBreakDuration,
      cyclesBeforeLongBreak: preset.cyclesBeforeLongBreak,
      color: preset.color || '#3B82F6',
      icon: preset.icon || '📚'
    });
    setEditingPreset(preset);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let savedPreset;
      if (editingPreset) {
        // Update existing preset
        const response = await api.patch(`/timer/presets/${editingPreset._id}`, formData);
        savedPreset = response.data;
      } else {
        // Create new preset
        const response = await api.post('/timer/presets', formData);
        savedPreset = response.data;
      }
      
      // Also save to localStorage as backup
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]');
      if (editingPreset) {
        const index = localPresets.findIndex(p => p._id === editingPreset._id);
        if (index >= 0) {
          localPresets[index] = savedPreset;
        } else {
          localPresets.push(savedPreset);
        }
      } else {
        localPresets.push(savedPreset);
      }
      localStorage.setItem('timerPresets', JSON.stringify(localPresets));
      
      await onPresetsChange();
      resetForm();
    } catch (error) {
      console.error('Error saving preset:', error);
      
      // Save to localStorage as fallback
      try {
        const newPreset = {
          _id: editingPreset?._id || 'local-' + Date.now(),
          ...formData,
          createdAt: editingPreset?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]');
        if (editingPreset) {
          const index = localPresets.findIndex(p => p._id === editingPreset._id);
          if (index >= 0) {
            localPresets[index] = newPreset;
          } else {
            localPresets.push(newPreset);
          }
        } else {
          localPresets.push(newPreset);
        }
        localStorage.setItem('timerPresets', JSON.stringify(localPresets));
        
        await onPresetsChange();
        resetForm();
        alert('Preset saved locally (server unavailable)');
      } catch (localError) {
        console.error('Error saving to localStorage:', localError);
        alert('Failed to save preset');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (presetId) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      await api.delete(`/timer/presets/${presetId}`);
      
      // Also remove from localStorage
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]');
      const updatedPresets = localPresets.filter(p => p._id !== presetId);
      localStorage.setItem('timerPresets', JSON.stringify(updatedPresets));
      
      await onPresetsChange();
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Timer Presets
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Preset List */}
      <div className="space-y-4 mb-6">
        {presets.map(preset => (
          <div
            key={preset._id}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {preset.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Work: {formatDuration(preset.workDuration)} | 
                Break: {formatDuration(preset.breakDuration)} | 
                Long Break: {formatDuration(preset.longBreakDuration)} | 
                Cycles: {preset.cyclesBeforeLongBreak}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEdit(preset)}
                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(preset._id)}
                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {presets.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No presets yet. Create your first one!
          </p>
        )}
      </div>

      {/* Add New Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add New Preset
        </button>
      )}

      {/* Preset Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preset Name
            </label>
            <input
              id="preset-name"
              name="presetName"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Default Pomodoro"
              required
            />
          </div>

          <div>
            <label htmlFor="preset-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              id="preset-subject"
              name="presetSubject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Mathematics, Science, Reading"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="preset-icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon
              </label>
              <input
                id="preset-icon"
                name="presetIcon"
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="📚"
                maxLength="2"
              />
            </div>

            <div>
              <label htmlFor="preset-color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                id="preset-color"
                name="presetColor"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="work-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Duration (minutes)
              </label>
              <input
                id="work-duration"
                name="workDuration"
                type="number"
                min="1"
                max="120"
                value={Math.floor((formData.workDuration || 1500) / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, workDuration: (parseInt(e.target.value) || 1) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Break Duration (minutes)
              </label>
              <input
                id="break-duration"
                name="breakDuration"
                type="number"
                min="1"
                max="30"
                value={Math.floor((formData.breakDuration || 300) / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, breakDuration: (parseInt(e.target.value) || 1) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="long-break-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Duration (minutes)
              </label>
              <input
                id="long-break-duration"
                name="longBreakDuration"
                type="number"
                min="1"
                max="60"
                value={Math.floor((formData.longBreakDuration || 900) / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, longBreakDuration: (parseInt(e.target.value) || 1) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="cycles-before-long-break" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cycles Before Long Break
              </label>
              <input
                id="cycles-before-long-break"
                name="cyclesBeforeLongBreak"
                type="number"
                min="2"
                max="10"
                value={formData.cyclesBeforeLongBreak || 4}
                onChange={(e) => setFormData(prev => ({ ...prev, cyclesBeforeLongBreak: parseInt(e.target.value) || 4 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Saving...' : (editingPreset ? 'Update Preset' : 'Create Preset')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PresetManager;