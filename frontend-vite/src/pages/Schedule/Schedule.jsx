/**
 * Schedule Component
 * Weekly study schedule manager with time blocks and recurring sessions
 */

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import Input from '../../components/UI/Input'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

const Schedule = () => {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    reminderEnabled: true,
    reminderMinutesBefore: 15,
    color: '#3B82F6',
    icon: '📚',
  })

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      const response = await api.schedule.get()
      if (response.success) {
        setSchedule(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (start, end) => {
    const [startHour, startMin] = start.split(':').map(Number)
    const [endHour, endMin] = end.split(':').map(Number)
    return (endHour * 60 + endMin) - (startHour * 60 + startMin)
  }

  const handleTimeChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    if (field === 'startTime' || field === 'endTime') {
      const duration = calculateDuration(newFormData.startTime, newFormData.endTime)
      newFormData.duration = duration > 0 ? duration : 0
    }
    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.duration <= 0) {
      alert('End time must be after start time')
      return
    }

    try {
      if (editingEntry) {
        const response = await api.schedule.updateEntry(editingEntry._id, formData)
        if (response.success) {
          fetchSchedule()
        }
      } else {
        const response = await api.schedule.createEntry(formData)
        if (response.success) {
          fetchSchedule()
        }
      }

      setShowModal(false)
      setEditingEntry(null)
      setFormData({
        title: '',
        subject: '',
        description: '',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        reminderEnabled: true,
        reminderMinutesBefore: 15,
        color: '#3B82F6',
        icon: '📚',
      })
    } catch (error) {
      console.error('Failed to save schedule entry:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to save schedule entry. Please try again.')
      }
    }
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setFormData({
      title: entry.title,
      subject: entry.subject || '',
      description: entry.description || '',
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      reminderEnabled: entry.reminderEnabled,
      reminderMinutesBefore: entry.reminderMinutesBefore || 15,
      color: entry.color || '#3B82F6',
      icon: entry.icon || '📚',
    })
    setShowModal(true)
  }

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this schedule entry?')) return

    try {
      await api.schedule.deleteEntry(entryId)
      fetchSchedule()
    } catch (error) {
      console.error('Failed to delete schedule entry:', error)
      alert('Failed to delete schedule entry. Please try again.')
    }
  }

  const getEntriesForDay = (dayOfWeek) => {
    if (!schedule || !schedule.entries) return []
    return schedule.entries
      .filter((entry) => entry.dayOfWeek === dayOfWeek && entry.isActive)
      .sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number)
        const timeB = b.startTime.split(':').map(Number)
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
      })
  }

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const iconOptions = ['📚', '💻', '✍️', '🎯', '🔬', '🎨', '📊', '🧮', '🌟', '⚡']
  const colorOptions = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#14B8A6',
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Plan your weekly study sessions
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Session
        </Button>
      </div>

      {/* Statistics */}
      {schedule && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {schedule.entries?.filter((e) => e.isActive).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Weekly Hours</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {schedule.totalScheduledHours?.toFixed(1) || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reminders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {schedule.entries?.filter((e) => e.isActive && e.reminderEnabled).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Calendar View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="p-4 text-center font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            >
              <div className="hidden md:block">{day.label}</div>
              <div className="md:hidden">{day.short}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {DAYS_OF_WEEK.map((day) => {
            const entries = getEntriesForDay(day.value)
            return (
              <div
                key={day.value}
                className="min-h-[300px] p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              >
                <div className="space-y-2">
                  {entries.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
                      No sessions
                    </div>
                  ) : (
                    entries.map((entry) => (
                      <div
                        key={entry._id}
                        className="rounded-lg p-3 text-sm cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: entry.color + '20', borderLeft: `4px solid ${entry.color}` }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-lg">{entry.icon}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry._id)}
                              className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-700/50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {entry.title}
                        </p>
                        {entry.subject && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {entry.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {entry.duration} min
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEntry(null)
          setFormData({
            title: '',
            subject: '',
            description: '',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '10:00',
            duration: 60,
            reminderEnabled: true,
            reminderMinutesBefore: 15,
            color: '#3B82F6',
            icon: '📚',
          })
        }}
        title={editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Mathematics Study"
          />

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g., Calculus"
          />

          <div>
            <label className="label">Day of Week</label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
              className="input"
              required
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              className="input bg-gray-100 dark:bg-gray-700"
              readOnly
            />
          </div>

          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                    formData.icon === icon
                      ? 'bg-primary-600 text-white scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={formData.reminderEnabled}
              onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
              className="checkbox"
            />
            <label htmlFor="reminderEnabled" className="text-sm text-gray-700 dark:text-gray-300">
              Enable reminder
            </label>
          </div>

          {formData.reminderEnabled && (
            <Input
              type="number"
              label="Reminder (minutes before)"
              value={formData.reminderMinutesBefore}
              onChange={(e) => setFormData({ ...formData, reminderMinutesBefore: parseInt(e.target.value) })}
              min="0"
              max="120"
            />
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {editingEntry ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingEntry(null)
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Schedule
