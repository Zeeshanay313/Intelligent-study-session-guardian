import React, { useState, useEffect } from 'react';
import { getPresets, createPreset, updatePreset, deletePreset } from '../../services/presetsApi';

const PresetDropdown = ({ selectedPreset, onPresetChange, onDurationChange }) => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    workDuration: 25,
    breakDuration: 5,
    isDefault: false
  });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const data = await getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (e) => {
    const presetId = e.target.value;
    
    if (presetId === 'custom') {
      // User selected "Add Custom"
      setShowModal(true);
      setEditingPreset(null);
      setFormData({
        name: '',
        workDuration: 25,
        breakDuration: 5,
        isDefault: false
      });
      return;
    }

    const preset = presets.find((p) => p._id === presetId);
    if (preset) {
      onPresetChange(preset);
      if (onDurationChange) {
        onDurationChange(preset.workDuration);
      }
    }
  };

  const handleEditPreset = (preset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      workDuration: preset.workDuration,
      breakDuration: preset.breakDuration,
      isDefault: preset.isDefault || false
    });
    setShowModal(true);
  };

  const handleDeletePreset = async (presetId) => {
    if (!window.confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      await deletePreset(presetId);
      await loadPresets();
    } catch (error) {
      alert('Failed to delete preset');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingPreset) {
        await updatePreset(editingPreset._id, formData);
      } else {
        await createPreset(formData);
      }

      setShowModal(false);
      await loadPresets();
    } catch (error) {
      alert(`Failed to ${editingPreset ? 'update' : 'create'} preset`);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading presets...</div>;
  }

  return (
    <div className="preset-dropdown">
      <div className="flex items-center gap-2">
        <select
          value={selectedPreset?._id || ''}
          onChange={handlePresetSelect}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a preset</option>
          {presets.map((preset) => (
            <option key={preset._id} value={preset._id}>
              {preset.name} ({preset.workDuration}m work, {preset.breakDuration}m break)
              {preset.isDefault ? ' ⭐' : ''}
            </option>
          ))}
          <option value="custom">+ Add Custom Preset</option>
        </select>
      </div>

      {selectedPreset && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => handleEditPreset(selectedPreset)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeletePreset(selectedPreset._id)}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingPreset ? 'Edit Preset' : 'Create Preset'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={formData.workDuration}
                  onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Break Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.breakDuration}
                  onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Set as default preset</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  {editingPreset ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetDropdown;
