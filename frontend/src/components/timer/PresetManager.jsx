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
    workDuration: 1500, // 25 minutes
    breakDuration: 300, // 5 minutes
    longBreakDuration: 900, // 15 minutes
    cyclesBeforeLongBreak: 4
  });
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      workDuration: 1500,
      breakDuration: 300,
      longBreakDuration: 900,
      cyclesBeforeLongBreak: 4
    });
    setEditingPreset(null);
    setShowForm(false);
  };

  const handleEdit = (preset) => {
    setFormData({
      name: preset.name,
      workDuration: preset.workDuration,
      breakDuration: preset.breakDuration,
      longBreakDuration: preset.longBreakDuration,
      cyclesBeforeLongBreak: preset.cyclesBeforeLongBreak
    });
    setEditingPreset(preset);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingPreset) {
        // Update existing preset
        await api.put(`/timers/${editingPreset._id}`, formData);
      } else {
        // Create new preset
        await api.post('/timers', formData);
      }
      
      await onPresetsChange();
      resetForm();
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (presetId) => {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      await api.delete(`/timers/${presetId}`);
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preset Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Default Pomodoro"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={Math.floor(formData.workDuration / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, workDuration: parseInt(e.target.value) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={Math.floor(formData.breakDuration / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={Math.floor(formData.longBreakDuration / 60)}
                onChange={(e) => setFormData(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) * 60 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cycles Before Long Break
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={formData.cyclesBeforeLongBreak}
                onChange={(e) => setFormData(prev => ({ ...prev, cyclesBeforeLongBreak: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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