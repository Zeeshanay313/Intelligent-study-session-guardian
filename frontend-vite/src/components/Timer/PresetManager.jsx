/**
 * PresetManager Component
 * Manage timer presets with CRUD operations and localStorage backup
 */

import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import api from '../../services/api'
import Button from '../UI/Button'
import Input from '../UI/Input'
import Modal from '../UI/Modal'

const PresetManager = ({ isOpen, onClose, onPresetsChange }) => {
  const [presets, setPresets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingPreset, setEditingPreset] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    workDuration: 25, // minutes
    breakDuration: 5, // minutes
    longBreakDuration: 15, // minutes
    cyclesBeforeLongBreak: 4,
    color: '#3B82F6',
    icon: '📚',
  })
  const [isLoading, setIsLoading] = useState(false)

  // Load presets when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPresets()
    }
  }, [isOpen])

  const loadPresets = async () => {
    try {
      const response = await api.presets.list()
      if (response.success) {
        setPresets(response.data || [])
      } else {
        // Fallback to localStorage
        const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
        setPresets(localPresets)
      }
    } catch (error) {
      console.error('Error loading presets:', error)
      // Fallback to localStorage
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
      setPresets(localPresets)
    }
  }

  const presetIcons = ['📚', '💻', '✍️', '🎯', '🔬', '🎨', '📊', '🧮', '🌟', '⚡']
  const presetColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4,
      color: '#3B82F6',
      icon: '📚',
    })
    setEditingPreset(null)
    setShowForm(false)
  }

  const handleEdit = (preset) => {
    setFormData({
      name: preset.name,
      subject: preset.subject || '',
      workDuration: Math.floor(preset.workDuration / 60), // Convert seconds to minutes
      breakDuration: Math.floor(preset.breakDuration / 60),
      longBreakDuration: Math.floor(preset.longBreakDuration / 60),
      cyclesBeforeLongBreak: preset.cyclesBeforeLongBreak,
      color: preset.color || '#3B82F6',
      icon: preset.icon || '📚',
    })
    setEditingPreset(preset)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Convert minutes to seconds for API
      const presetData = {
        ...formData,
        workDuration: formData.workDuration * 60,
        breakDuration: formData.breakDuration * 60,
        longBreakDuration: formData.longBreakDuration * 60,
      }

      let savedPreset
      if (editingPreset) {
        const response = await api.presets.update(editingPreset.id, presetData)
        if (response.success) {
          savedPreset = response.data
        }
      } else {
        const response = await api.presets.create(presetData)
        if (response.success) {
          savedPreset = response.data
        }
      }

      // Also save to localStorage as backup
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
      if (editingPreset) {
        const index = localPresets.findIndex((p) => p.id === editingPreset.id)
        if (index >= 0) {
          localPresets[index] = savedPreset
        } else {
          localPresets.push(savedPreset)
        }
      } else {
        localPresets.push(savedPreset)
      }
      localStorage.setItem('timerPresets', JSON.stringify(localPresets))

      await loadPresets()
      if (onPresetsChange) onPresetsChange()
      resetForm()
    } catch (error) {
      console.error('Error saving preset:', error)

      // Save to localStorage as fallback
      try {
        const newPreset = {
          id: editingPreset?.id || 'local-' + Date.now(),
          ...formData,
          workDuration: formData.workDuration * 60,
          breakDuration: formData.breakDuration * 60,
          longBreakDuration: formData.longBreakDuration * 60,
          createdAt: editingPreset?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
        if (editingPreset) {
          const index = localPresets.findIndex((p) => p.id === editingPreset.id)
          if (index >= 0) {
            localPresets[index] = newPreset
          } else {
            localPresets.push(newPreset)
          }
        } else {
          localPresets.push(newPreset)
        }
        localStorage.setItem('timerPresets', JSON.stringify(localPresets))

        await loadPresets()
        if (onPresetsChange) onPresetsChange()
        resetForm()
        alert('Preset saved locally (server unavailable)')
      } catch (localError) {
        console.error('Error saving to localStorage:', localError)
        alert('Failed to save preset')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (presetId) => {
    if (!confirm('Are you sure you want to delete this preset?')) return

    try {
      await api.presets.delete(presetId)

      // Also remove from localStorage
      const localPresets = JSON.parse(localStorage.getItem('timerPresets') || '[]')
      const updatedPresets = localPresets.filter((p) => p.id !== presetId)
      localStorage.setItem('timerPresets', JSON.stringify(updatedPresets))

      await loadPresets()
      if (onPresetsChange) onPresetsChange()
    } catch (error) {
      console.error('Error deleting preset:', error)
      alert('Failed to delete preset')
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Timer Presets"
      size="lg"
    >
      <div className="space-y-4">
        {/* Presets List */}
        {!showForm && (
          <>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  style={{ borderLeftColor: preset.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-2xl">{preset.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {preset.name}
                      </h3>
                      {preset.subject && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {preset.subject}
                        </p>
                      )}
                      <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>Work: {formatDuration(preset.workDuration)}</span>
                        <span>•</span>
                        <span>Break: {formatDuration(preset.breakDuration)}</span>
                        <span>•</span>
                        <span>Cycles: {preset.cyclesBeforeLongBreak}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(preset)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="w-5 h-5 mr-2" />
              Create New Preset
            </Button>
          </>
        )}

        {/* Preset Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Preset Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Deep Study, Quick Review"
            />

            <Input
              label="Subject (Optional)"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics, Programming"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Work Duration (minutes)"
                type="number"
                min="1"
                max="120"
                value={formData.workDuration}
                onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value) })}
                required
              />

              <Input
                label="Break Duration (minutes)"
                type="number"
                min="1"
                max="30"
                value={formData.breakDuration}
                onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Long Break (minutes)"
                type="number"
                min="5"
                max="60"
                value={formData.longBreakDuration}
                onChange={(e) => setFormData({ ...formData, longBreakDuration: parseInt(e.target.value) })}
                required
              />

              <Input
                label="Cycles Before Long Break"
                type="number"
                min="2"
                max="10"
                value={formData.cyclesBeforeLongBreak}
                onChange={(e) => setFormData({ ...formData, cyclesBeforeLongBreak: parseInt(e.target.value) })}
                required
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label className="label">Icon</label>
              <div className="flex flex-wrap gap-2">
                {presetIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                      formData.icon === icon
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                {editingPreset ? 'Update' : 'Create'} Preset
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default PresetManager
