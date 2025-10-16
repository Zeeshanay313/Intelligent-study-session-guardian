import React from 'react';
import GoalList from '../modules/GoalTracker/components/GoalList';
import { GoalTrackerProvider } from '../modules/GoalTracker/goalTrackerContext';
import { useNavigate } from 'react-router-dom';

const GoalListPage = () => {
  const navigate = useNavigate();

  const handleCreateGoal = () => {
    navigate('/goals/new');
  };

  const handleSelectGoal = (goalId) => {
    navigate(`/goals/${goalId}`);
  };

  return (
    <GoalTrackerProvider>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Goal Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Track your weekly and monthly goals, manage milestones, and monitor your progress.
            </p>
          </div>
          
          <GoalList 
            onCreateGoal={handleCreateGoal}
            onSelectGoal={handleSelectGoal}
          />
        </div>
      </div>
    </GoalTrackerProvider>
  );
};

export default GoalListPage;