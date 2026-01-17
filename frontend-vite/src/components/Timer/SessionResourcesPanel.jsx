/**
 * Session Resources Panel
 * 
 * A collapsible panel that displays selected resources during a study session.
 * Features inline viewing for videos, documents, and notes.
 */

import React, { useState } from 'react'
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Minimize2,
  Maximize2,
  Play,
  Eye
} from 'lucide-react'
import ResourceViewer from './ResourceViewer'

const resourceTypeIcons = {
  article: FileText,
  video: Video,
  tool: LinkIcon,
  document: BookOpen,
  note: FileText,
  default: BookOpen,
}

const resourceTypeColors = {
  article: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  tool: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  document: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  note: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const SessionResourcesPanel = ({ resources = [], onRemoveResource, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewingResource, setViewingResource] = useState(null)
  const [isViewerFullscreen, setIsViewerFullscreen] = useState(false)

  if (resources.length === 0) return null

  const getIcon = (type) => {
    return resourceTypeIcons[type] || resourceTypeIcons.default
  }

  const getColorClass = (type) => {
    return resourceTypeColors[type] || resourceTypeColors.default
  }

  const openResourceExternally = (resource) => {
    const url = resource.content?.url || resource.url
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const viewResource = (resource) => {
    setViewingResource(resource)
    setIsViewerFullscreen(true) // Open viewer in larger mode
  }

  const closeViewer = () => {
    setViewingResource(null)
    setIsViewerFullscreen(false)
  }

  const getResourceUrl = (resource) => {
    return resource.content?.url || resource.url
  }

  const hasViewableContent = (resource) => {
    const url = getResourceUrl(resource)
    const text = resource.content?.text || resource.notes
    return url || text
  }

  // Minimized state - just a floating button
  if (isMinimized && !viewingResource) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all"
        >
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">{resources.length} Resource{resources.length !== 1 ? 's' : ''}</span>
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Full screen viewer mode
  if (viewingResource) {
    return (
      <div className={`fixed z-50 ${
        isViewerFullscreen 
          ? 'inset-4 md:inset-8 lg:inset-12' 
          : 'bottom-4 right-4 w-[600px] h-[450px]'
      } transition-all duration-300`}>
        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
          <ResourceViewer
            resource={viewingResource}
            onClose={closeViewer}
            onBack={closeViewer}
          />
        </div>
        
        {/* Resource list sidebar when viewing */}
        {isViewerFullscreen && resources.length > 1 && (
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg transform -translate-x-full hover:translate-x-0 transition-transform duration-300 rounded-l-xl overflow-hidden">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Other Resources</h3>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100%-48px)]">
              {resources.filter(r => (r._id || r.id) !== (viewingResource._id || viewingResource.id)).map((resource) => {
                const resourceId = resource._id || resource.id
                const Icon = getIcon(resource.type)
                return (
                  <button
                    key={resourceId}
                    onClick={() => setViewingResource(resource)}
                    className="w-full flex items-center space-x-2 p-2 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{resource.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Normal panel state
  return (
    <div className={`fixed bottom-4 right-4 z-40 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${
      isExpanded ? 'max-h-[500px]' : 'max-h-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-semibold">Study Resources</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {resources.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
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

      {/* Resources List */}
      <div className="p-2 space-y-2 overflow-y-auto max-h-72">
        {resources.map((resource) => {
          const resourceId = resource._id || resource.id
          const Icon = getIcon(resource.type)
          const colorClass = getColorClass(resource.type)
          const url = getResourceUrl(resource)
          const canView = hasViewableContent(resource)

          return (
            <div
              key={resourceId}
              className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {resource.title}
                  </h4>
                  {resource.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center mt-1 space-x-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass}`}>
                      {resource.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                {canView && (
                  <button
                    onClick={() => viewResource(resource)}
                    className="flex items-center space-x-1 text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                  >
                    {resource.type === 'video' ? (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Watch</span>
                      </>
                    ) : resource.type === 'document' || resource.type === 'note' ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Read</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </>
                    )}
                  </button>
                )}
                {url && (
                  <button
                    onClick={() => openResourceExternally(resource)}
                    className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>External</span>
                  </button>
                )}
                {onRemoveResource && (
                  <button
                    onClick={() => onRemoveResource(resourceId)}
                    className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick tip footer */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 Click <strong>Watch</strong> or <strong>Read</strong> to view inline
        </p>
      </div>
    </div>
  )
}

export default SessionResourcesPanel
