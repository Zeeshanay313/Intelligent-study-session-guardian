import React from 'react'

const formatInsight = (label, metric) => {
  if (!metric) return null
  const direction = metric.direction === 'improved' ? 'improved' : 'declined'
  const change = metric.percentChange !== null ? `${Math.abs(metric.percentChange)}%` : `${Math.abs(metric.diff)}`
  return `${label} ${direction} by ${change}`
}

const ComparisonBlock = ({ title, data }) => {
  if (!data) return null
  const insights = [
    formatInsight('Focus', data.focusPercentage),
    formatInsight('Productivity', data.productivityScore),
    formatInsight('Distractions', data.distractions)
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50 dark:bg-gray-900/40 p-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {insights.map((insight) => (
          <li key={insight}>{insight}</li>
        ))}
      </ul>
    </div>
  )
}

const ComparisonInsights = ({ comparison }) => {
  if (!comparison) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card text-sm text-gray-500 dark:text-gray-400">
        Comparison insights will appear once multiple sessions are available.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comparison Insights</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ComparisonBlock title="Last Session" data={comparison.lastSession} />
        <ComparisonBlock title="Last 7 Days" data={comparison.last7Days} />
        <ComparisonBlock title="Last 30 Days" data={comparison.last30Days} />
      </div>
    </div>
  )
}

export default ComparisonInsights
