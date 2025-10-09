import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-750 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 ${className}`}
      aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {darkMode ? (
          <SunIcon className="w-5 h-5 text-amber-500" />
        ) : (
          <MoonIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;