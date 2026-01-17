/**
 * Resource Selection Modal
 * 
 * Allows users to optionally select resources before starting a focus session.
 * Selected resources will be displayed in a convenient panel during the study session.
 */

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  FileText, 
  Link as LinkIcon, 
  Video, 
  X, 
  Check,
  Search,
  ExternalLink
} from 'lucide-react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import api from '../../services/api'

const resourceTypeIcons = {
  article: FileText,
  video: Video,
  tool: LinkIcon,
  document: BookOpen,
  default: BookOpen,
}

const ResourceSelectionModal = ({ isOpen, onClose, onSelectResources, onSkip, selectedResources = [] }) => {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  useEffect(() => {
    if (isOpen) {
      loadResources()
      // Pre-select previously selected resources
      setSelectedIds(new Set(selectedResources.map(r => r._id || r.id)))
    }
  }, [isOpen])

  const loadResources = async () => {
    setLoading(true)
    try {
      const response = await api.resources.list()
      const resourceList = response.data || response.resources || []
      setResources(resourceList)
    } catch (error) {
      console.error('Failed to load resources:', error)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const toggleResource = (resourceId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const handleConfirm = () => {
    const selected = resources.filter(r => selectedIds.has(r._id || r.id))
    onSelectResources(selected)
    onClose()
  }

  const handleSkip = () => {
    onSkip()
    onClose()
  }

  const filteredResources = resources.filter(r => 
    r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getIcon = (type) => {
    const Icon = resourceTypeIcons[type] || resourceTypeIcons.default
    return Icon
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Study Resources"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Optionally select resources to have quick access during your study session. 
          They'll appear in a convenient panel while you work.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No resources available
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Add resources in the Resources section to use them during study sessions.
            </p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No resources match your search
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredResources.map((resource) => {
              const resourceId = resource._id || resource.id
              const isSelected = selectedIds.has(resourceId)
              const Icon = getIcon(resource.type)

              return (
                <button
                  key={resourceId}
                  onClick={() => toggleResource(resourceId)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected 
                        ? 'bg-primary-100 dark:bg-primary-800' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isSelected 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {resource.title}
                        </h4>
                        {isSelected && (
                          <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 ml-2 flex-shrink-0" />
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                          {resource.description}
                        </p>
                      )}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resource.tags.slice(0, 3).map((tag, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{resource.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Selection count */}
        {selectedIds.size > 0 && (
          <div className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {selectedIds.size} resource{selectedIds.size !== 1 ? 's' : ''} selected
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
          <Button onClick={handleConfirm}>
            {selectedIds.size > 0 ? `Use ${selectedIds.size} Resource${selectedIds.size !== 1 ? 's' : ''}` : 'Continue Without Resources'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ResourceSelectionModal
