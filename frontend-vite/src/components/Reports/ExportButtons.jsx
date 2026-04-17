import React from 'react'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Button from '../UI/Button'

const buildCsv = (report, distractionLogs) => {
  const rows = []
  rows.push({
    type: 'summary',
    sessionId: report.sessionId,
    totalDuration: report.totalDuration,
    activeTime: report.activeTime,
    idleTime: report.idleTime,
    focusPercentage: report.focusPercentage,
    interruptions: report.interruptions,
    productivityScore: report.productivityScore
  })

  report.activityTimeline?.forEach((segment) => {
    const start = segment.startTime
    const end = segment.endTime
    const duration = start && end ? Math.round((new Date(end) - new Date(start)) / 1000) : 0
    rows.push({
      type: 'activity',
      status: segment.status,
      startTime: start,
      endTime: end,
      durationSeconds: duration
    })
  })

  distractionLogs?.forEach((log) => {
    rows.push({
      type: 'distraction',
      action: log.action,
      site: log.site,
      timestamp: log.timestamp,
      durationSeconds: log.duration || 0
    })
  })

  const headers = Object.keys(rows[0] || {})
  const csv = [headers.join(',')]
  rows.forEach((row) => {
    csv.push(headers.map((key) => JSON.stringify(row[key] ?? '')).join(','))
  })
  return csv.join('\n')
}

const downloadFile = (content, fileName, type) => {
  const blob = new Blob([content], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.URL.revokeObjectURL(url)
}

const ExportButtons = ({ report, distractionLogs, fileName, reportRef }) => {
  const handleCsv = () => {
    const csv = buildCsv(report, distractionLogs)
    downloadFile(csv, `${fileName}.csv`, 'text/csv')
  }

  const handlePdf = async () => {
    if (!reportRef?.current) return
    const canvas = await html2canvas(reportRef.current, { scale: 2 })
    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'pt', 'a4')
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imageData, 'PNG', 20, 20, width - 40, height)
    pdf.save(`${fileName}.pdf`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={handlePdf}>
        <Download className="h-4 w-4 mr-2" /> PDF
      </Button>
      <Button variant="outline" onClick={handleCsv}>
        <Download className="h-4 w-4 mr-2" /> CSV
      </Button>
    </div>
  )
}

export default ExportButtons
