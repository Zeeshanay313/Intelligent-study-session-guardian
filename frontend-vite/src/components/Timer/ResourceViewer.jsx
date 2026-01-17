/**
 * Resource Viewer Component
 * 
 * Inline viewer for different resource types:
 * - Videos: YouTube, Vimeo embeds or direct video URLs
 * - Documents: PDF viewer, text content display
 * - Notes: Rich text display
 * - Articles: Embedded iframe or link preview
 */

import React, { useState, useMemo } from 'react'
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  FileText,
  BookOpen,
  Link as LinkIcon,
  Video,
  ChevronLeft,
  Volume2,
  VolumeX
} from 'lucide-react'

// Get the API base URL for uploaded files
const getFileUrl = (filePath) => {
  if (!filePath) return null
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5004'
  return `${baseUrl}${filePath}`
}

// Get the viewable URL for a resource (handles both URL and uploaded files)
const getResourceUrl = (resource) => {
  // Check for uploaded file first
  if (resource.content?.filePath) {
    return getFileUrl(resource.content.filePath)
  }
  // Then check for URL
  return resource.content?.url || resource.url || null
}

// Extract video ID and type from URL
const parseVideoUrl = (url) => {
  if (!url) return null

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  if (youtubeMatch) {
    return { type: 'youtube', id: youtubeMatch[1] }
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1] }
  }

  // Direct video file (including uploaded files)
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv)$/i
  if (videoExtensions.test(url)) {
    return { type: 'direct', url }
  }

  return null
}

// Text File Viewer - fetches and displays text content
const TextFileViewer = ({ url, title, description }) => {
  const [content, setContent] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const fetchText = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to load file')
        const text = await response.text()
        setContent(text)
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchText()
  }, [url])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
        <FileText className="w-16 h-16 mb-4 text-red-400" />
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open File</span>
        </a>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4 italic">{description}</p>
      )}
      <div className="prose dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed font-mono text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          {content}
        </pre>
      </div>
    </div>
  )
}

// Video Player Component
const VideoPlayer = ({ resource, isFullscreen, onToggleFullscreen }) => {
  const [isMuted, setIsMuted] = useState(false)
  const url = getResourceUrl(resource)

  const videoInfo = useMemo(() => parseVideoUrl(url), [url])

  if (!videoInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white p-8">
        <Video className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-center mb-4">Unable to embed this video</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in New Tab</span>
        </a>
      </div>
    )
  }

  if (videoInfo.type === 'youtube') {
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=0&rel=0`}
          title={resource.title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (videoInfo.type === 'vimeo') {
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${videoInfo.id}`}
          title={resource.title}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (videoInfo.type === 'direct') {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <video
          src={videoInfo.url}
          controls
          className="max-w-full max-h-full"
          muted={isMuted}
        >
          Your browser does not support the video tag.
        </video>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
        </button>
      </div>
    )
  }

  return null
}

// Document/Note Viewer Component
const DocumentViewer = ({ resource }) => {
  const url = getResourceUrl(resource)
  const text = resource.content?.text || resource.notes || ''
  const fileName = resource.content?.fileName || ''
  const mimeType = resource.content?.mimeType || ''
  
  // Determine file type from extension or mime type
  const isPDF = url?.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf'
  const isText = url?.toLowerCase().match(/\.(txt|md)$/) || mimeType?.startsWith('text/')
  const isWord = url?.toLowerCase().match(/\.(doc|docx)$/) || mimeType?.includes('word')
  const isExcel = url?.toLowerCase().match(/\.(xls|xlsx)$/) || mimeType?.includes('spreadsheet')
  const isPowerPoint = url?.toLowerCase().match(/\.(ppt|pptx)$/) || mimeType?.includes('presentation')

  // If there's text content (notes), show it
  if (text) {
    return (
      <div className="h-full overflow-auto bg-white dark:bg-gray-900 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {resource.title}
        </h2>
        {resource.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 italic">
            {resource.description}
          </p>
        )}
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
            {text}
          </div>
        </div>
      </div>
    )
  }

  // If it's a PDF, try to embed it
  if (isPDF && url) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-900 flex flex-col">
        <div className="flex-1">
          <iframe
            src={url}
            title={resource.title}
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
        <div className="p-3 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {fileName || 'PDF Document'}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            download
          >
            <ExternalLink className="w-4 h-4" />
            <span>Download / Open</span>
          </a>
        </div>
      </div>
    )
  }

  // Text files - fetch and display content
  if (isText && url) {
    return <TextFileViewer url={url} title={resource.title} description={resource.description} />
  }

  // Office documents (Word, Excel, PowerPoint) - use Office Online viewer or download
  if ((isWord || isExcel || isPowerPoint) && url) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
        <FileText className="w-20 h-20 mb-6 text-indigo-500" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {resource.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-2">
          {fileName || (isWord ? 'Word Document' : isExcel ? 'Excel Spreadsheet' : 'PowerPoint Presentation')}
        </p>
        {resource.description && (
          <p className="text-gray-500 dark:text-gray-500 text-center mb-6 max-w-md text-sm">
            {resource.description}
          </p>
        )}
        <div className="flex space-x-3">
          <a
            href={url}
            download
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Download File</span>
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          💡 Download to view in Microsoft Office or compatible app
        </p>
      </div>
    )
  }

  // Google Docs, Sheets, Slides
  const googleDocsRegex = /docs\.google\.com\/(document|spreadsheets|presentation)/
  if (googleDocsRegex.test(url)) {
    // Convert to embed URL if needed
    let embedUrl = url
    if (!url.includes('/embed')) {
      embedUrl = url.replace(/\/edit.*$/, '/preview')
    }
    return (
      <div className="h-full bg-white">
        <iframe
          src={embedUrl}
          title={resource.title}
          className="w-full h-full"
          frameBorder="0"
        />
      </div>
    )
  }

  // Fallback - show link
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 p-8">
      <FileText className="w-16 h-16 mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {resource.title}
      </h3>
      {resource.description && (
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4 max-w-md">
          {resource.description}
        </p>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Document</span>
        </a>
      )}
    </div>
  )
}

// Article/Link Viewer Component
const ArticleViewer = ({ resource }) => {
  const url = getResourceUrl(resource)

  // Some sites don't allow iframe embedding, show a preview instead
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          title={resource.title}
          className="w-full h-full"
          frameBorder="0"
          sandbox="allow-scripts allow-same-origin allow-popups"
          onError={() => {
            // Fallback handled by parent
          }}
        />
      </div>
      <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1 mr-4">
            {url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>
    </div>
  )
}

// Main Resource Viewer Component
const ResourceViewer = ({ resource, onClose, onBack }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!resource) return null

  const resourceType = resource.type
  const url = resource.content?.url || resource.url

  const getViewer = () => {
    switch (resourceType) {
      case 'video':
        return <VideoPlayer resource={resource} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />
      case 'document':
      case 'note':
        return <DocumentViewer resource={resource} />
      case 'article':
      case 'tool':
      case 'link':
      default:
        if (parseVideoUrl(url)) {
          return <VideoPlayer resource={resource} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />
        }
        return <ArticleViewer resource={resource} />
    }
  }

  const resourceTypeIcons = {
    article: FileText,
    video: Video,
    tool: LinkIcon,
    document: BookOpen,
    note: FileText,
    default: BookOpen,
  }

  const Icon = resourceTypeIcons[resourceType] || resourceTypeIcons.default

  return (
    <div className={`flex flex-col bg-white dark:bg-gray-800 ${
      isFullscreen 
        ? 'fixed inset-0 z-50' 
        : 'h-full rounded-lg overflow-hidden'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center space-x-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Back to list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold truncate">{resource.title}</span>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {getViewer()}
      </div>
    </div>
  )
}

export default ResourceViewer
