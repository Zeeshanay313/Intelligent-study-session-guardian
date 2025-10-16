import React, { useState, useEffect } from 'react';
import { useGoalTracker } from '../goalTrackerContext';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const GoalForm = ({ goal, onClose, onSave }) => {
  const { createGoal, updateGoal, privacySettings, loading } = useGoalTracker();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetType: 'hours',
    targetValue: '',
    startDate: '',
    endDate: '',
    visibility: 'private',
    milestones: []
  });

  const [errors, setErrors] = useState({});
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' });

  useEffect(() => {
    if (goal) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        targetType: goal.targetType || 'hours',
        targetValue: goal.targetValue?.toString() || '',
        startDate: goal.startDate ? new Date(goal.startDate).toISOString().split('T')[0] : '',
        endDate: goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '',
        visibility: goal.visibility || 'private',
        milestones: goal.milestones?.map(m => ({
          _id: m._id,
          title: m.title,
          dueDate: new Date(m.dueDate).toISOString().split('T')[0],
          done: m.done
        })) || []
      });
    } else {
      // Set default dates for new goals
      const today = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(today.getMonth() + 3);

      setFormData(prev => ({
        ...prev,
        startDate: today.toISOString().split('T')[0],
        endDate: threeMonthsLater.toISOString().split('T')[0]
      }));
    }
  }, [goal]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.targetValue || isNaN(formData.targetValue) || parseInt(formData.targetValue) <= 0) {
      newErrors.targetValue = 'Valid target value is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    // Validate milestones
    formData.milestones.forEach((milestone, index) => {
      if (milestone.dueDate && formData.endDate && new Date(milestone.dueDate) > new Date(formData.endDate)) {
        newErrors[`milestone_${index}`] = 'Milestone due date cannot be after goal end date';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const goalData = {
        ...formData,
        targetValue: parseInt(formData.targetValue),
        milestones: formData.milestones.map(m => ({
          _id: m._id,
          title: m.title,
          dueDate: m.dueDate,
          done: m.done || false
        }))
      };

      let savedGoal;
      if (goal) {
        savedGoal = await updateGoal(goal._id, goalData);
      } else {
        savedGoal = await createGoal(goalData);
      }

      onSave && onSave(savedGoal);
      onClose();
    } catch (error) {
      // Error handling is done in context
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim() || !newMilestone.dueDate) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          _id: `temp_${Date.now()}`,
          title: newMilestone.title.trim(),
          dueDate: newMilestone.dueDate,
          done: false
        }
      ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    }));

    setNewMilestone({ title: '', dueDate: '' });
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const getTargetTypeIcon = (type) => {
    switch (type) {
      case 'hours': return <ClockIcon className="h-5 w-5" />;
      case 'sessions': return <ChartBarIcon className="h-5 w-5" />;
      case 'tasks': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const visibilityOptions = [
    { value: 'private', label: 'Private', description: 'Only you can see this goal' },
    { 
      value: 'shared', 
      label: 'Shared', 
      description: 'Share with guardians and teachers',
      disabled: !privacySettings.guardianSharing
    },
    { 
      value: 'public', 
      label: 'Public', 
      description: 'Visible to everyone',
      disabled: !privacySettings.guardianSharing
    }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Goal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.title 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
                placeholder="Enter goal title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe your goal"
              />
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Type *
              </label>
              <select
                value={formData.targetType}
                onChange={(e) => handleInputChange('targetType', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="hours">Hours</option>
                <option value="sessions">Sessions</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>

            {/* Target Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Value *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {getTargetTypeIcon(formData.targetType)}
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.targetValue}
                  onChange={(e) => handleInputChange('targetValue', e.target.value)}
                  className={`block w-full pl-10 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    errors.targetValue 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-700 dark:text-white`}
                  placeholder="100"
                />
              </div>
              {errors.targetValue && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.targetValue}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.startDate 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.endDate 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endDate}</p>
              )}
            </div>

            {/* Visibility */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                {visibilityOptions.map((option) => (
                  <div key={option.value} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`visibility-${option.value}`}
                        name="visibility"
                        type="radio"
                        value={option.value}
                        checked={formData.visibility === option.value}
                        onChange={(e) => handleInputChange('visibility', e.target.value)}
                        disabled={option.disabled}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label 
                        htmlFor={`visibility-${option.value}`}
                        className={`font-medium ${
                          option.disabled 
                            ? 'text-gray-400 dark:text-gray-500' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </label>
                      <p className={`${
                        option.disabled 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {!privacySettings.guardianSharing && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Sharing options are disabled in your privacy settings.
                      <a href="/profile" className="ml-1 font-medium underline hover:no-underline">
                        Update settings
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Milestones Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Milestones</h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">Optional</span>
            </div>

            {/* Existing Milestones */}
            {formData.milestones.length > 0 && (
              <div className="space-y-3 mb-4">
                {formData.milestones.map((milestone, index) => (
                  <div key={milestone._id || index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Milestone title"
                    />
                    <input
                      type="date"
                      value={milestone.dueDate}
                      onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                      className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                    {errors[`milestone_${index}`] && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors[`milestone_${index}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Milestone */}
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add milestone title"
              />
              <input
                type="date"
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={addMilestone}
                disabled={!newMilestone.title.trim() || !newMilestone.dueDate}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;