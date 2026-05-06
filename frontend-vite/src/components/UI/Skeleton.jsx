/**
 * Skeleton UI primitives
 *
 * Usage:
 *   import { SkeletonCard, SkeletonText, SkeletonChart, SkeletonTable, SkeletonCircle } from '../UI/Skeleton'
 */
import React from 'react'

const pulse = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded'

export const SkeletonText = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div className={`${pulse} ${width} ${height} ${className}`} />
)

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <div className={`${pulse} rounded-full ${size} ${className}`} />
)

export const SkeletonCard = ({ rows = 3, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 shadow-card space-y-3 ${className}`}>
    <div className="flex items-center space-x-3">
      <SkeletonCircle size="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <SkeletonText width="w-2/5" />
        <SkeletonText width="w-3/5" height="h-3" />
      </div>
    </div>
    {Array.from({ length: rows - 1 }).map((_, i) => (
      <SkeletonText key={i} width={i % 2 === 0 ? 'w-full' : 'w-4/5'} />
    ))}
  </div>
)

export const SkeletonChart = ({ height = 'h-48', className = '' }) => (
  <div className={`bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 shadow-card ${className}`}>
    <div className="space-y-2 mb-4">
      <SkeletonText width="w-1/3" height="h-5" />
      <SkeletonText width="w-1/4" height="h-3" />
    </div>
    <div className={`${pulse} w-full ${height} rounded-xl`} />
  </div>
)

export const SkeletonTable = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/40 shadow-card overflow-hidden ${className}`}>
    {/* Header */}
    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/40 flex space-x-4">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonText key={i} width={i === 0 ? 'w-1/3' : 'w-1/6'} height="h-4" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="px-5 py-4 border-b border-gray-50 dark:border-gray-700/20 flex items-center space-x-4">
        <SkeletonCircle size="w-8 h-8" />
        {Array.from({ length: cols - 1 }).map((_, c) => (
          <SkeletonText key={c} width={c === 0 ? 'w-2/5' : 'w-1/6'} height="h-3.5" />
        ))}
      </div>
    ))}
  </div>
)

export const SkeletonMetricCards = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/40 shadow-card animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
        <div className="w-24 h-7 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    ))}
  </div>
)
