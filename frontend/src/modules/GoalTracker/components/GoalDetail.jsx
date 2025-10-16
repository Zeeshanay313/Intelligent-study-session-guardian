import React, { useState, useEffect } from 'react';
import { useGoalTracker } from '../goalTrackerContext';
import {
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CalendarIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid
} from '@heroicons/react/24/solid';

const GoalDetail = ({ goalId, onClose, onEdit }) => {
  const {
    selectedGoal,
    loading,
    loadGoal,
    updateProgress,
    toggleMilestone,
    deleteGoal
  } = useGoalTracker();

  const [customAmount, setCustomAmount] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (goalId) {
      loadGoal(goalId);
    }
  }, [goalId, loadGoal]);

  const handleQuickProgress = async (amount) => {
    try {
      await updateProgress(goalId, amount);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleCustomProgress = async () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount === 0) return;

    try {
      await updateProgress(goalId, amount);
      setCustomAmount('');
      setShowCustomInput(false);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleMilestoneToggle = async (milestoneId) => {
    try {
      await toggleMilestone(goalId, milestoneId);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
        onClose();
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const getTargetTypeIcon = (type) => {
    switch (type) {
      case 'hours': return <ClockIcon className="h-6 w-6" />;
      case 'sessions': return <ChartBarIcon className="h-6 w-6" />;
      case 'tasks': return <CheckCircleIcon className="h-6 w-6" />;
      default: return <ChartBarIcon className="h-6 w-6" />;
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
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || !selectedGoal) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">Loading goal...</p>
        </div>
      </div>
    );
  }

  const goal = selectedGoal;
  const progressPercentage = Math.round((goal.progressValue / goal.targetValue) * 100);
  const daysRemaining = getDaysRemaining(goal.endDate);
  const isOverdue = daysRemaining < 0 && !goal.completedAt;
  const completedMilestones = goal.milestones?.filter(m => m.done).length || 0;
  const totalMilestones = goal.milestones?.length || 0;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
              {getTargetTypeIcon(goal.targetType)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {goal.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {goal.targetType} Goal • Created {formatDate(goal.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(goal)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {goal.description && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  {goal.description}
                </p>
              </div>
            )}

            {/* Progress Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Progress</h3>
                {goal.completedAt && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircleSolid className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Completed!</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm font-medium text-gray-900 dark:text-white mb-2">
                  <span>Current Progress</span>
                  <span>{goal.progressValue} / {goal.targetValue} ({progressPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Progress Controls */}
              {!goal.completedAt && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Update Progress</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => handleQuickProgress(1)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleQuickProgress(5)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickProgress(10)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleQuickProgress(-1)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Custom
                    </button>
                  </div>

                  {showCustomInput && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={handleCustomProgress}
                        disabled={!customAmount}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Milestones */}
            {goal.milestones && goal.milestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Milestones</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {completedMilestones} of {totalMilestones} completed ({milestoneProgress}%)
                  </span>
                </div>

                {/* Milestone Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${milestoneProgress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Milestone List */}
                <div className="space-y-3">
                  {goal.milestones
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .map((milestone) => {
                      const milestoneOverdue = new Date(milestone.dueDate) < new Date() && !milestone.done;
                      
                      return (
                        <div
                          key={milestone._id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${
                            milestone.done
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : milestoneOverdue
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <button
                            onClick={() => handleMilestoneToggle(milestone._id)}
                            className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              milestone.done
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                            }`}
                          >
                            {milestone.done && <CheckCircleSolid className="h-3 w-3" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              milestone.done
                                ? 'text-green-900 dark:text-green-100 line-through'
                                : milestoneOverdue
                                  ? 'text-red-900 dark:text-red-100'
                                  : 'text-gray-900 dark:text-white'
                            }`}>
                              {milestone.title}
                            </p>
                            <p className={`text-xs ${
                              milestone.done
                                ? 'text-green-600 dark:text-green-400'
                                : milestoneOverdue
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Due: {formatDate(milestone.dueDate)}
                              {milestoneOverdue && ' (Overdue)'}
                              {milestone.done && ' (Completed)'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Goal Stats */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Goal Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target</dt>
                  <dd className="text-sm text-gray-900 dark:text-white capitalize">
                    {goal.targetValue} {goal.targetType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {formatDate(goal.startDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</dt>
                  <dd className={`text-sm ${
                    isOverdue 
                      ? 'text-red-600 dark:text-red-400 font-medium' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(goal.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-sm">
                    {goal.completedAt ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                    ) : isOverdue ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Overdue ({Math.abs(daysRemaining)} days)
                      </span>
                    ) : daysRemaining === 0 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">Due today</span>
                    ) : (
                      <span className="text-gray-900 dark:text-white">
                        {daysRemaining} days remaining
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</dt>
                  <dd className="text-sm text-gray-900 dark:text-white capitalize">
                    {goal.visibility}
                  </dd>
                </div>
                {goal.completedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</dt>
                    <dd className="text-sm text-green-600 dark:text-green-400 font-medium">
                      {formatDate(goal.completedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onEdit(goal)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Goal
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;