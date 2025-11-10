import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'p-6',
  shadow = 'shadow-sm',
  border = true,
  hover = false,
  ...props 
}) => {
  const baseClasses = 'bg-white dark:bg-secondary-800 rounded-lg transition-all duration-200';
  const shadowClasses = shadow;
  const borderClasses = border ? 'border border-secondary-200 dark:border-secondary-700' : '';
  const hoverClasses = hover ? 'hover:shadow-md hover:border-secondary-300 dark:hover:border-secondary-600' : '';
  const paddingClasses = padding;

  return (
    <div
      className={`${baseClasses} ${shadowClasses} ${borderClasses} ${hoverClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;