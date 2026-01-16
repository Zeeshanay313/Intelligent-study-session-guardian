import React from 'react'
import clsx from 'clsx'

const Card = ({
  children,
  title,
  subtitle,
  action,
  padding = true,
  hover = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'card',
        hover && 'hover:shadow-lg cursor-pointer',
        !padding && 'p-0',
        className
      )}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default Card
