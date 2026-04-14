import React from 'react'

const formatSeconds = (value) => {
  if (!value && value !== 0) return '0s'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

const ActivityTimeline = ({ timeline = [] }) => {
  const now = Date.now()
  const segments = timeline
    .filter(segment => segment.startTime)
    .map(segment => {
      const start = new Date(segment.startTime).getTime()
      const end = segment.endTime ? new Date(segment.endTime).getTime() : now
      const duration = Math.max(1, Math.round((end - start) / 1000))
      return {
        ...segment,
        duration,
        status: segment.status || 'active'
      }
    })

  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0)

  if (segments.length === 0 || totalDuration === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 text-sm text-gray-500 dark:text-gray-400">
        No activity timeline recorded yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        {segments.map((segment, index) => {
          const width = Math.max(2, Math.round((segment.duration / totalDuration) * 100))
          const color = segment.status === 'idle' ? 'bg-red-500' : 'bg-green-500'
          return (
            <div
              key={`${segment.startTime}-${index}`}
              className={`${color} h-full`}
              style={{ width: `${width}%` }}
            />
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Active
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Idle
        </div>
        <div>Total: {formatSeconds(totalDuration)}</div>
      </div>
    </div>
  )
}

export default ActivityTimeline
