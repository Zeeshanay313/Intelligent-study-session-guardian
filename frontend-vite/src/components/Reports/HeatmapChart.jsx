import React, { useMemo } from 'react'
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, Scatter, Tooltip } from 'recharts'

const buildHeatmapData = (reports = []) => {
  const recent = [...reports]
    .filter((report) => report.sessionStartTime)
    .sort((a, b) => new Date(a.sessionStartTime) - new Date(b.sessionStartTime))
    .slice(-20)

  const dayLabels = Array.from(new Set(recent.map((report) => new Date(report.sessionStartTime).toISOString().split('T')[0])))
  const data = []

  recent.forEach((report) => {
    const date = new Date(report.sessionStartTime)
    const dayLabel = date.toISOString().split('T')[0]
    const hour = date.getHours()
    const dayIndex = dayLabels.indexOf(dayLabel)
    const intensity = Math.round((report.activeTime || 0) / 60)

    data.push({
      hour,
      dayIndex,
      intensity,
      dayLabel
    })
  })

  return { data, dayLabels }
}

const HeatmapChart = ({ reports }) => {
  const { data, dayLabels } = useMemo(() => buildHeatmapData(reports), [reports])
  const maxIntensity = Math.max(1, ...data.map((item) => item.intensity || 0))

  const getColor = (value) => {
    const ratio = value / maxIntensity
    if (ratio > 0.75) return '#1d4ed8'
    if (ratio > 0.5) return '#3b82f6'
    if (ratio > 0.25) return '#60a5fa'
    return '#bfdbfe'
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/40 bg-white dark:bg-gray-800/60 p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Heatmap</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis type="number" dataKey="hour" domain={[0, 23]} tickFormatter={(value) => `${value}:00`} />
            <YAxis type="number" dataKey="dayIndex" tickFormatter={(value) => dayLabels[value] || ''} />
            <Tooltip formatter={(value) => `${value} min active`} />
            <Scatter
              data={data}
              shape={(props) => {
                const { cx, cy, payload } = props
                if (cx === undefined || cy === undefined) return null
                const size = 16
                const fill = getColor(payload.intensity || 0)
                return <rect x={cx - size / 2} y={cy - size / 2} width={size} height={size} rx={3} fill={fill} />
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Darker cells indicate higher activity minutes.</p>
    </div>
  )
}

export default HeatmapChart
