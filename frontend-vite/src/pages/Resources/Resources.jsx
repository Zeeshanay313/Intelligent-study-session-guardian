/**
 * Resources Component
 * Manage and access study resources with filtering and search
 * Supports file uploads, inline viewing for videos/documents/notes
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  FileText,
  Link as LinkIcon,
  Video,
  Upload,
  Search,
  Download,
  ExternalLink,
  Plus,
  Tag,
  Edit2,
  Trash2,
  Star,
  Eye,
  Play,
  File,
  X,
  Image,
  Music,
  Sparkles,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import Input from '../../components/UI/Input'
import ResourceViewer from '../../components/Timer/ResourceViewer'

const Resources = () => {
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedTags, setSelectedTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [viewingResource, setViewingResource] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    url: '',
    tags: '',
    file: null,
  })

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    filterResources()
  }, [searchQuery, selectedType, selectedTags, resources])

  const fetchResources = async () => {
    try {
      const response = await api.resources.list()
      if (response.success) {
        setResources(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResources = () => {
    let filtered = [...resources]

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((r) => r.type === selectedType)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((r) =>
        selectedTags.some((tag) => r.tags.includes(tag))
      )
    }

    setFilteredResources(filtered)
  }

  const resourceTypes = [
    { value: 'all', label: 'All', icon: Tag },
    { value: 'article', label: 'Articles', icon: FileText },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'tool', label: 'Tools', icon: LinkIcon },
    { value: 'document', label: 'Documents', icon: BookOpen },
    { value: 'note', label: 'Notes', icon: FileText },
    { value: 'file', label: 'Files', icon: File },
  ]

  const availableTags = [...new Set(resources.flatMap((r) => r.tags || []))]

  const getResourceIcon = (type) => {
    const icons = {
      article: FileText,
      video: Video,
      tool: LinkIcon,
      document: BookOpen,
      note: FileText,
      file: File,
      note: FileText,
    }
    return icons[type] || FileText
  }

  const getResourceColor = (type) => {
    const colors = {
      article: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      video: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      tool: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      document: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      note: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
      file: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, file, title: formData.title || file.name })
      // Auto-detect type based on file extension
      const ext = file.name.split('.').pop().toLowerCase()
      if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext)) {
        setFormData(prev => ({ ...prev, file, type: 'video', title: prev.title || file.name }))
      } else if (['pdf', 'doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
        setFormData(prev => ({ ...prev, file, type: 'document', title: prev.title || file.name }))
      } else {
        setFormData(prev => ({ ...prev, file, type: 'file', title: prev.title || file.name }))
      }
    }
  }

  // Get viewable URL for a resource
  const getResourceViewUrl = (resource) => {
    // Check for uploaded file
    if (resource.content?.filePath) {
      return api.resources.getFileUrl(resource.content.filePath)
    }
    // Check for URL
    return resource.content?.url || resource.url || null
  }

  // Check if resource can be viewed inline
  const canViewInline = (resource) => {
    const url = getResourceViewUrl(resource)
    const text = resource.content?.text || resource.notes
    return url || text
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      // If there's a file, upload it
      if (formData.file) {
        const metadata = {
          title: formData.title,
          description: formData.description,
          category: formData.category || 'general',
          tags: formData.tags || '',
          folder: formData.folder || 'Unsorted'
        }
        
        const response = await api.resources.upload(formData.file, metadata)
        if (response.success) {
          await fetchResources()
        }
      } else {
        // Create URL-based or note resource
        const resourceData = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          category: formData.category || 'general',
          content: {
            url: formData.url || '',
            text: formData.notes || ''
          },
          tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          subject: formData.subject || '',
          folder: formData.folder || 'Unsorted'
        }

        if (editingResource) {
          const resourceId = editingResource.id || editingResource._id
          const response = await api.resources.update(resourceId, resourceData)
          if (response.success) {
            await fetchResources()
          }
        } else {
          const response = await api.resources.create(resourceData)
          if (response.success) {
            await fetchResources()
          }
        }
      }

      setShowModal(false)
      setEditingResource(null)
      setFormData({ title: '', description: '', type: 'article', url: '', tags: '', category: 'general', subject: '', folder: 'Unsorted', notes: '', file: null })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('Failed to save resource:', error)
      alert('Failed to save resource. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleEdit = (resource) => {
    setEditingResource(resource)
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.content?.url || resource.url || '',
      tags: resource.tags ? resource.tags.join(', ') : '',
      category: resource.category || 'general',
      subject: resource.subject || '',
      folder: resource.folder || 'Unsorted',
      notes: resource.content?.text || resource.notes || '',
      file: null
    })
    setShowModal(true)
  }

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      await api.resources.delete(resourceId)
      // Refetch to ensure consistency
      await fetchResources()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      alert('Failed to delete resource. Please try again.')
    }
  }

  const handleLaunch = async (resource) => {
    try {
      const resourceId = resource.id || resource._id
      await api.resources.launch(resourceId)
      const url = getResourceViewUrl(resource)
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Failed to launch resource:', error)
    }
  }

  const handleViewResource = (resource) => {
    setViewingResource(resource)
  }

  const toggleFavorite = async (resource) => {
    try {
      const resourceId = resource.id || resource._id
      const response = await api.resources.update(resourceId, {
        isFavorite: !resource.isFavorite,
      })
      if (response.success) {
        // Refetch to ensure data consistency
        await fetchResources()
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and access your learning materials
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {resourceTypes.map((type) => {
          const Icon = type.icon
          return (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedType === type.value
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{type.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                )
              }
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              #{tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Recommended Resources Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recommended Resources
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered suggestions based on your study patterns
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
            Coming Soon
          </span>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trending Card */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trending Topics</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Resources trending in your study area
            </p>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Based on Recent Activity</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Continue where you left off
            </p>
          </div>

          {/* Quick Boost Card */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-white/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Study Boost</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Short resources for quick learning
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Smart recommendations will be personalized to your learning style and goals</span>
          </p>
        </div>
      </div>

      {/* Your Resources Heading */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Resources</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filteredResources.length} items</span>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => {
          const Icon = getResourceIcon(resource.type)
          const colorClass = getResourceColor(resource.type)

          return (
            <div
              key={resource.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleFavorite(resource)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        resource.isFavorite
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource._id || resource.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {resource.description}
              </p>

              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* File info for uploaded files */}
              {resource.content?.fileName && (
                <div className="flex items-center space-x-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <File className="w-3 h-3" />
                  <span className="truncate">{resource.content.fileName}</span>
                  {resource.content.fileSize && (
                    <span className="flex-shrink-0">({formatFileSize(resource.content.fileSize)})</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  {new Date(resource.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  {canViewInline(resource) && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleViewResource(resource)}
                    >
                      {resource.type === 'video' ? (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLaunch(resource)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No resources found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || selectedTags.length > 0
              ? 'Try adjusting your filters'
              : 'Start by adding your first resource'}
          </p>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Resource
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingResource(null)
          setFormData({ title: '', description: '', type: 'article', url: '', tags: '' })
        }}
        title={editingResource ? 'Edit Resource' : 'Add New Resource'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., JavaScript Tutorial"
          />

          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows="3"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="tool">Tool</option>
              <option value="document">Document</option>
              <option value="note">Note / Text</option>
            </select>
          </div>

          {formData.type !== 'note' && (
            <div className="space-y-3">
              {/* URL Input */}
              <Input
                label="URL (or upload file below)"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value, file: null })}
                disabled={formData.file}
                placeholder={
                  formData.type === 'video' 
                    ? 'https://youtube.com/watch?v=...' 
                    : 'https://example.com'
                }
              />
              
              {/* File Upload */}
              <div className="relative">
                <p className="text-xs text-gray-500 text-center mb-2">— or upload a file —</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    formData.type === 'video' 
                      ? 'video/*,.mp4,.webm,.mov,.avi,.mkv' 
                      : formData.type === 'document' 
                        ? '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx'
                        : '*/*'
                  }
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {formData.file ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-3">
                      {formData.type === 'video' ? (
                        <Video className="w-5 h-5 text-green-600" />
                      ) : formData.type === 'document' ? (
                        <FileText className="w-5 h-5 text-green-600" />
                      ) : (
                        <File className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate max-w-[200px]">
                          {formData.file.name}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {formatFileSize(formData.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFormData({ ...formData, file: null })
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center"
                  >
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload {formData.type === 'video' ? 'video' : formData.type === 'document' ? 'document' : 'file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.type === 'video' 
                        ? 'MP4, WebM, MOV up to 100MB' 
                        : formData.type === 'document'
                          ? 'PDF, DOC, DOCX, TXT up to 100MB'
                          : 'Any file up to 100MB'}
                    </p>
                  </button>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {!formData.url && !formData.file && formData.type !== 'note' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Please provide either a URL or upload a file
                </p>
              )}
            </div>
          )}

          {(formData.type === 'note' || formData.type === 'document') && (
            <div>
              <label className="label">
                {formData.type === 'note' ? 'Notes / Content' : 'Notes (optional)'}
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input font-mono text-sm"
                rows="8"
                placeholder={
                  formData.type === 'note'
                    ? 'Write your study notes here...\n\nYou can include:\n- Key concepts\n- Important formulas\n- Summaries\n- Questions to review'
                    : 'Add notes about this document...'
                }
                required={formData.type === 'note'}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 {formData.type === 'note' 
                  ? 'These notes will be viewable inline during study sessions' 
                  : 'Notes will appear alongside the document'}
              </p>
            </div>
          )}

          <Input
            label="Tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="javascript, tutorial, beginner (comma separated)"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowModal(false)
                setEditingResource(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Uploading...' : editingResource ? 'Update' : 'Add'} Resource
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resource Viewer Modal */}
      {viewingResource && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <span className={`p-2 rounded-lg ${resourceTypes.find(t => t.value === viewingResource.type)?.color || 'bg-gray-100'}`}>
                  {React.createElement(resourceTypes.find(t => t.value === viewingResource.type)?.icon || FileText, { className: 'w-5 h-5' })}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{viewingResource.title}</h3>
                  <p className="text-sm text-gray-500">{viewingResource.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLaunch(viewingResource)}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open External
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingResource(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ResourceViewer 
                resource={viewingResource}
                onClose={() => setViewingResource(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resources
