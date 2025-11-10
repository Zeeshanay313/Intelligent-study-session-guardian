import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GoalDetail from '../modules/GoalTracker/components/GoalDetail';
import { GoalTrackerProvider } from '../modules/GoalTracker/goalTrackerContext';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

const GoalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/goals');
  };

  const handleEdit = () => {
    navigate(`/goals/${id}/edit`);
  };

  return (
    <GoalTrackerProvider>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-4"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Goals
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Goal Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                View and manage your goal progress, milestones, and achievements.
              </p>
            </div>

            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Goal
            </button>
          </div>

          <GoalDetail 
            goalId={id}
            onEdit={handleEdit}
          />
        </div>
      </div>
    </GoalTrackerProvider>
  );
};

export default GoalDetailPage;