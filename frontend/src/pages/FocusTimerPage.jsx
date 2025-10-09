import React from 'react';
import {
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import FocusTimer from '../components/FocusTimer';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const FocusTimerPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 py-8">
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

          {/* Sidebar - Stats & History */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Today's Progress
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Focus Sessions
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    3 / 8
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Total Focus Time
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    75 min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Breaks Taken
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    2
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2 mt-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/8"></div>
                </div>
                <p className="text-xs text-secondary-500 dark:text-secondary-400 text-center">
                  38% of daily goal completed
                </p>
              </div>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {[
                  { time: '2:30 PM', duration: '25 min', type: 'Focus', subject: 'Mathematics' },
                  { time: '1:50 PM', duration: '5 min', type: 'Break', subject: null },
                  { time: '1:25 PM', duration: '25 min', type: 'Focus', subject: 'Physics' },
                  { time: '12:45 PM', duration: '25 min', type: 'Focus', subject: 'Chemistry' }
                ].map((session, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-secondary-200 dark:border-secondary-700 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-secondary-900 dark:text-white">
                        {session.type}
                        {session.subject && ` - ${session.subject}`}
                      </div>
                      <div className="text-xs text-secondary-500 dark:text-secondary-400">
                        {session.time} • {session.duration}
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      session.type === 'Focus' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                This Week
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Total Sessions
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    24
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Focus Time
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    10h 45m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Average/Day
                  </span>
                  <span className="font-semibold text-secondary-900 dark:text-white">
                    1h 32m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-600 dark:text-secondary-400">
                    Streak
                  </span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    7 days 🔥
                  </span>
                </div>
              </div>
            </Card>

            {/* Productivity Tips */}
            <Card padding="p-4" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Productivity Tip
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Take your breaks away from your workspace to fully reset your mind and maintain focus throughout the day.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimerPage;