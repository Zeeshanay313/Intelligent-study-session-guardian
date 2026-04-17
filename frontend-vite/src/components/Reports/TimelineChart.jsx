import React from 'react'
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Customized } from 'recharts'

const buildSegments = (timeline = [], totalDuration = 0) => {
  if (!timeline.length) {
    return []
  }

  const sorted = [...timeline].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  const start = new Date(sorted[0].startTime).getTime()
  return sorted.map((segment) => {
    const startMs = new Date(segment.startTime).getTime()
    const endMs = new Date(segment.endTime || segment.startTime).getTime()
    const duration = Math.max(0, Math.round((endMs - startMs) / 1000))
    return {
      status: segment.status,
      start: Math.max(0, Math.round((startMs - start) / 1000)),
      duration
    }
  }).filter(seg => seg.duration > 0 || totalDuration === 0)
}

const TimelineChart = ({ timeline, totalDuration }) => {
  const segments = buildSegments(timeline, totalDuration)
  const duration = totalDuration || segments.reduce((sum, seg) => sum + seg.duration, 0)

  const chartData = [{ start: 0 }]

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <XAxis type="number" dataKey="start" domain={[0, Math.max(duration, 1)]} tickFormatter={(value) => `${Math.round(value / 60)}m`} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={(value) => `${Math.round(value)}s`} />
            <Customized component={({ xAxisMap, yAxisMap, width, height }) => {
              const xScale = xAxisMap?.start?.scale
              if (!xScale) return null
              const y = (yAxisMap?.name?.scale?.('timeline') || 0) + (height / 3)
              const barHeight = 16

              return (
                <g>
                  {segments.map((segment, index) => {
                    const x = xScale(segment.start)
                    const segmentWidth = Math.max(2, xScale(segment.start + segment.duration) - xScale(segment.start))
                    const fill = segment.status === 'idle' ? '#ef4444' : '#22c55e'
                    return (
                      <rect
                        key={`${segment.status}-${index}`}
                        x={x}
                        y={y}
                        width={segmentWidth}
                        height={barHeight}
                        rx={4}
                        fill={fill}
                      />
                    )
                  })}
                </g>
              )
            }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"></span> Active</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500"></span> Idle</span>
      </div>
    </div>
  )
}

export default TimelineChart
