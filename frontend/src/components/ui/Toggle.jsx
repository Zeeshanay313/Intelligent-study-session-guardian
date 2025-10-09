import React from 'react';

const Toggle = ({ 
  enabled, 
  onChange, 
  label, 
  description,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex flex-col">
        {label && (
          <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
            {label}
          </span>
        )}
        {description && (
          <span className="text-sm text-secondary-500 dark:text-secondary-400">
            {description}
          </span>
        )}
      </div>
      
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          enabled 
            ? 'bg-primary-600' 
            : 'bg-secondary-200 dark:bg-secondary-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={enabled}
        aria-disabled={disabled}
        onClick={() => !disabled && onChange(!enabled)}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export default Toggle;