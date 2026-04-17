import React from 'react'
import { Clock, Activity, TrendingUp, AlertCircle } from 'lucide-react'

const formatSeconds = (value) => {
  const minutes = Math.floor((value || 0) / 60)
  const seconds = Math.floor((value || 0) % 60)
  if (minutes <= 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const SessionReportCard = ({ report, loading }) => {
  if (!report) return null

  return (
    <div className="flex-1 rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Session Summary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {report.sessionStartTime ? new Date(report.sessionStartTime).toLocaleString() : 'Session detail'}
          </p>
        </div>
        {loading && (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-600"></div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" /> Duration
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {formatSeconds(report.totalDuration)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            <Activity className="h-4 w-4" /> Focus %
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {report.focusPercentage}%
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" /> Productivity
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(report.productivityScore || 0)}%
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-4 w-4" /> Interruptions
          </div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {report.interruptions}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionReportCard
