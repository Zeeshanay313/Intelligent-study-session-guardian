import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GoalForm from '../modules/GoalTracker/components/GoalForm';
import { GoalTrackerProvider } from '../modules/GoalTracker/goalTrackerContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const GoalFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const handleBack = () => {
    navigate('/goals');
  };

  const handleSave = () => {
    navigate('/goals');
  };

  return (
    <GoalTrackerProvider>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Goals
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Goal' : 'Create New Goal'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {isEditing 
                ? 'Update your goal details, targets, and milestones.' 
                : 'Set up a new goal with targets and milestones to track your progress.'
              }
            </p>
          </div>

          <GoalForm 
            goalId={id}
            onSave={handleSave}
            onCancel={handleBack}
          />
        </div>
      </div>
    </GoalTrackerProvider>
  );
};

export default GoalFormPage;