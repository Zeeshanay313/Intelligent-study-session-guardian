/**
 * Resources Component
 * Manage and access study resources with filtering and search
 */

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Modal from '../../components/UI/Modal'
import Input from '../../components/UI/Input'

const Resources = () => {
  const [resources, setResources] = useState([])
  const [filteredResources, setFilteredResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedTags, setSelectedTags] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'article',
    url: '',
    tags: '',
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
  ]

  const availableTags = [...new Set(resources.flatMap((r) => r.tags || []))]

  const getResourceIcon = (type) => {
    const icons = {
      article: FileText,
      video: Video,
      tool: LinkIcon,
      document: BookOpen,
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
    }
    return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

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

    try {
      if (editingResource) {
        const resourceId = editingResource.id || editingResource._id
        const response = await api.resources.update(resourceId, resourceData)
        if (response.success) {
          // Refetch to get the updated list
          await fetchResources()
        }
      } else {
        const response = await api.resources.create(resourceData)
        if (response.success) {
          // Refetch to get the new resource with proper ID
          await fetchResources()
        }
      }

      setShowModal(false)
      setEditingResource(null)
      setFormData({ title: '', description: '', type: 'article', url: '', tags: '', category: 'general', subject: '', folder: 'Unsorted', notes: '' })
    } catch (error) {
      console.error('Failed to save resource:', error)
      alert('Failed to save resource. Please try again.')
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
      notes: resource.content?.text || resource.notes || ''
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
      const url = resource.content?.url || resource.url
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Failed to launch resource:', error)
    }
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500">
                  {new Date(resource.createdAt).toLocaleDateString()}
                </span>
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
            <Input
              label="URL"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required={formData.type !== 'note'}
              placeholder={
                formData.type === 'video' 
                  ? 'https://youtube.com/watch?v=...' 
                  : 'https://example.com'
              }
            />
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
            <Button type="submit">
              {editingResource ? 'Update' : 'Add'} Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Resources
