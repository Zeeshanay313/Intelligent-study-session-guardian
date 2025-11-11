import React, { useState, useEffect } from 'react';
import { getPresets } from '../services/presetsApi';
import { getSessions } from '../services/sessionsApi';

/**
 * Debug panel to verify Focus Timer features are working
 * Add this to FocusTimerPage to test the integration
 */
const FocusTimerDebug = () => {
  const [debug, setDebug] = useState({
    presetsLoaded: false,
    presetsCount: 0,
    sessionsLoaded: false,
    sessionsCount: 0,
    apiConnected: false,
    errors: []
  });

  useEffect(() => {
    testIntegration();
  }, []);

  const testIntegration = async () => {
    const errors = [];

    // Test 1: API Connection
    try {
      const response = await fetch('http://localhost:5004/health');
      if (response.ok) {
        setDebug(prev => ({ ...prev, apiConnected: true }));
      }
    } catch (error) {
      errors.push(`API Connection Failed: ${error.message}`);
    }

    // Test 2: Presets API
    try {
      const presets = await getPresets();
      setDebug(prev => ({
        ...prev,
        presetsLoaded: true,
        presetsCount: presets.length
      }));
    } catch (error) {
      errors.push(`Presets API Failed: ${error.message}`);
    }

    // Test 3: Sessions API
    try {
      const sessions = await getSessions(1, 10);
      setDebug(prev => ({
        ...prev,
        sessionsLoaded: true,
        sessionsCount: sessions.data?.length || 0
      }));
    } catch (error) {
      errors.push(`Sessions API Failed: ${error.message}`);
    }

    setDebug(prev => ({ ...prev, errors }));
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
        🔧 Focus Timer Debug
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          {debug.apiConnected ? '✅' : '❌'}
          <span className="text-gray-700 dark:text-gray-300">
            Backend Connected
          </span>
        </div>

        <div className="flex items-center gap-2">
          {debug.presetsLoaded ? '✅' : '❌'}
          <span className="text-gray-700 dark:text-gray-300">
            Presets API ({debug.presetsCount} presets)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {debug.sessionsLoaded ? '✅' : '❌'}
          <span className="text-gray-700 dark:text-gray-300">
            Sessions API ({debug.sessionsCount} sessions)
          </span>
        </div>

        {debug.errors.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="font-semibold text-red-800 dark:text-red-300 mb-1">
              Errors:
            </p>
            {debug.errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                • {err}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={testIntegration}
          className="mt-3 w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
        >
          🔄 Re-test
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
        Remove this component when done debugging
      </p>
    </div>
  );
};

export default FocusTimerDebug;
