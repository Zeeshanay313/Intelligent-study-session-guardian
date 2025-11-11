import React from 'react';
import FocusTimer from '../../components/FocusTimer';
import FocusTimerDebug from '../../components/FocusTimerDebug';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const TimerPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 py-8">
      {/* Debug Panel - Remove after testing */}
      <FocusTimerDebug />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Focus Timer
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Stay focused with the Pomodoro technique and track your productivity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer - Main Column */}
          <div className="lg:col-span-2">
            <FocusTimer />
            
            {/* Quick Actions */}
            <div className="mt-8">
              <Card>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Study Session
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    View Stats
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Preferences
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Custom Timer
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar - Stats & Tips */}
          <div className="space-y-6">
            {/* Today's Progress */}
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Today's Progress
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Sessions</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">0</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Focus Time</span>
                  <span className="font-bold text-green-600 dark:text-green-400">0m</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-sm text-secondary-700 dark:text-secondary-300">Breaks</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">0m</span>
                </div>
              </div>
            </Card>

            {/* Tips Card */}
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Pomodoro Tips
              </h3>
              <ul className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Work in focused 25-minute intervals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Take short breaks to recharge</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Use presets to customize your workflow</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Enable audio alerts to stay on track</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerPage;
