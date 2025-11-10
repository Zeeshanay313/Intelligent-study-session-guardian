import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  className = '',
  endAdornment,
  ...props 
}, ref) => {
  const baseClasses = 'block w-full px-4 py-3 text-sm font-medium placeholder-secondary-400 transition-all duration-200 ease-in-out border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const stateClasses = error 
    ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500 bg-danger-50 dark:bg-danger-900/10 dark:border-danger-600'
    : 'border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white hover:border-secondary-400 dark:bg-secondary-800 dark:border-secondary-600 dark:hover:border-secondary-500';

  const inputClasses = `${baseClasses} ${stateClasses} ${className}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={endAdornment ? `${inputClasses} pr-12` : inputClasses}
          {...props}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {endAdornment}
          </div>
        )}
      </div>
      
      {error && (
        <p className="flex items-center text-sm text-danger-600 dark:text-danger-400">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-secondary-500 dark:text-secondary-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;