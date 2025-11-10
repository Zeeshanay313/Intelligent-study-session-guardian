import React, { useState, useEffect } from 'react';
import { useGoalTracker } from '../goalTrackerContext';
import {
  PlusIcon,
  FunnelIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid
} from '@heroicons/react/24/solid';

const GoalList = ({ onCreateGoal, onSelectGoal }) => {
  const {
    goals,
    summary,
    loading,
    error,
    loadGoals,
    updateProgress,
    deleteGoal,
    privacySettings
  } = useGoalTracker();

  const [filters, setFilters] = useState({
    targetType: '',
    completed: '',
    sortBy: 'createdAt'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGoals(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuickProgress = async (goalId, amount) => {
    try {
      await updateProgress(goalId, amount);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const getTargetTypeIcon = (type) => {
    switch (type) {
      case 'hours': return <ClockIcon className="h-5 w-5" />;
      case 'sessions': return <ChartBarIcon className="h-5 w-5" />;
      case 'tasks': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const isOverdue = (endDate, completed) => {
    if (completed) return false;
    return getDaysRemaining(endDate) < 0;
  };

  const filteredGoals = goals.filter(goal => {
    if (filters.targetType && goal.targetType !== filters.targetType) return false;
    if (filters.completed === 'true' && !goal.completedAt) return false;
    if (filters.completed === 'false' && goal.completedAt) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'progress':
        return (b.progressValue / b.targetValue) - (a.progressValue / a.targetValue);
      case 'dueDate':
        return new Date(a.endDate) - new Date(b.endDate);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  if (loading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Goal Tracker
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track your learning goals and milestones
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={onCreateGoal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Goal
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      {!privacySettings.guardianSharing && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Goal sharing is disabled in your privacy settings. Goals will be private only.
                <a href="/profile" className="ml-1 font-medium underline hover:no-underline">
                  Update settings
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Goals
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summary.totalGoals}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleSolid className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summary.completedGoals}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockSolid className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summary.totalProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Overall Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summary.totalTarget > 0 
                      ? Math.round((summary.totalProgress / summary.totalTarget) * 100)
                      : 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Type
              </label>
              <select
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="hours">Hours</option>
                <option value="sessions">Sessions</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Completion Status
              </label>
              <select
                value={filters.completed}
                onChange={(e) => handleFilterChange('completed', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Goals</option>
                <option value="false">In Progress</option>
                <option value="true">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="createdAt">Created Date</option>
                <option value="progress">Progress</option>
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No goals found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first goal.
          </p>
          <div className="mt-6">
            <button
              onClick={onCreateGoal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => {
            const progressPercentage = Math.round((goal.progressValue / goal.targetValue) * 100);
            const daysRemaining = getDaysRemaining(goal.endDate);
            const overdue = isOverdue(goal.endDate, goal.completedAt);
            const completedMilestones = goal.milestones?.filter(m => m.done).length || 0;
            const totalMilestones = goal.milestones?.length || 0;

            return (
              <div
                key={goal._id}
                className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectGoal(goal)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {getTargetTypeIcon(goal.targetType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {goal.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {goal.targetType} Goal
                        </p>
                      </div>
                    </div>
                    {goal.completedAt && (
                      <CheckCircleSolid className="h-6 w-6 text-green-500" />
                    )}
                    {overdue && (
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                    )}
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                      <span>Progress</span>
                      <span>{goal.progressValue} / {goal.targetValue}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {progressPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Milestones */}
                  {totalMilestones > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                        <span>Milestones</span>
                        <span>{completedMilestones} / {totalMilestones}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Due: {new Date(goal.endDate).toLocaleDateString()}
                    </span>
                    <span className={`font-medium ${
                      overdue 
                        ? 'text-red-600' 
                        : daysRemaining <= 7 
                          ? 'text-yellow-600' 
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {overdue 
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : daysRemaining === 0
                          ? 'Due today'
                          : `${daysRemaining} days left`
                      }
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickProgress(goal._id, 1);
                        }}
                        disabled={goal.completedAt}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +1
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickProgress(goal._id, 5);
                        }}
                        disabled={goal.completedAt}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +5
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal._id);
                      }}
                      className="text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalList;