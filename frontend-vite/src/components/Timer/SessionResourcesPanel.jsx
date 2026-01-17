/**
 * Session Resources Panel
 * 
 * A collapsible panel that displays selected resources during a study session.
 * Users can quickly access their study materials without leaving the focus page.
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
  Maximize2
} from 'lucide-react'

const resourceTypeIcons = {
  article: FileText,
  video: Video,
  tool: LinkIcon,
  document: BookOpen,
  default: BookOpen,
}

const resourceTypeColors = {
  article: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  tool: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  document: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const SessionResourcesPanel = ({ resources = [], onRemoveResource, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (resources.length === 0) return null

  const getIcon = (type) => {
    return resourceTypeIcons[type] || resourceTypeIcons.default
  }

  const getColorClass = (type) => {
    return resourceTypeColors[type] || resourceTypeColors.default
  }

  const openResource = (resource) => {
    if (resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (isMinimized) {
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
                </div>
              </div>

              {/* Actions - visible on hover */}
              <div className="flex items-center justify-end space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {resource.url && (
                  <button
                    onClick={() => openResource(resource)}
                    className="flex items-center space-x-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </button>
                )}
                {onRemoveResource && (
                  <button
                    onClick={() => onRemoveResource(resourceId)}
                    className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
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
          💡 Click on a resource to open it in a new tab
        </p>
      </div>
    </div>
  )
}

export default SessionResourcesPanel
