/**
 * ProfileSettings Component
 * User profile and settings management with tabbed interface
 */

import React, { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Bell,
  Database,
  Camera,
  Mail,
  Save,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import Button from '../../components/UI/Button'
import Input from '../../components/UI/Input'
import Modal from '../../components/UI/Modal'

const ProfileSettings = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    bio: '',
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    cameraAccess: false,
    guardianSharing: true,
    showProgress: true,
    shareStats: false,
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    sessionReminders: true,
    goalUpdates: true,
    achievementAlerts: true,
    weeklyReports: true,
    emailNotifications: false,
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || user.name || '',
        email: user.email || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Database },
  ]

  const handleProfileSave = async () => {
    setLoading(true)
    try {
      const response = await api.profile.update(profileData)
      if (response.success) {
        updateUser(response.data)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacySave = async () => {
    setLoading(true)
    try {
      const response = await api.profile.updatePreferences({ privacy: privacySettings })
      if (response.success) {
        alert('Privacy settings updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    setLoading(true)
    try {
      const response = await api.profile.updatePreferences({ notifications: notificationSettings })
      if (response.success) {
        alert('Notification settings updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      alert('Failed to update settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await api.profile.exportData()
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
        const exportFileDefaultName = `study-guardian-data-${new Date().toISOString().split('T')[0]}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()

        setShowExportModal(false)
        alert('Data exported successfully!')
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await api.profile.deleteAccount()
      if (response.success) {
        alert('Account deleted successfully.')
        setShowDeleteModal(false)
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      alert('Failed to delete account. Please try again.')
    }
  }

  const ToggleSwitch = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      aria-label="Toggle setting"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  // Show loading state if user is not loaded yet
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Profile Information
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your personal information and profile details
              </p>
            </div>

            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {profileData.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>Change Photo</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <Input
                label="Display Name"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                placeholder="Enter your name"
              />

              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="your.email@example.com"
                leftIcon={Mail}
              />

              <div>
                <label className="label">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  className="input resize-none"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>

            <Button onClick={handleProfileSave} loading={loading}>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </Button>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Privacy Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control your privacy and data sharing preferences
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Camera Access
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Allow Study Guardian to access your camera for focus monitoring
                  </p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.cameraAccess}
                  onChange={() =>
                    setPrivacySettings({ ...privacySettings, cameraAccess: !privacySettings.cameraAccess })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Guardian Sharing
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Share your study progress with parent/guardian
                  </p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.guardianSharing}
                  onChange={() =>
                    setPrivacySettings({
                      ...privacySettings,
                      guardianSharing: !privacySettings.guardianSharing,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Show Progress Publicly
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Display your study progress on public leaderboards
                  </p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.showProgress}
                  onChange={() =>
                    setPrivacySettings({ ...privacySettings, showProgress: !privacySettings.showProgress })
                  }
                />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Share Statistics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Allow anonymous statistics sharing to improve the app
                  </p>
                </div>
                <ToggleSwitch
                  enabled={privacySettings.shareStats}
                  onChange={() =>
                    setPrivacySettings({ ...privacySettings, shareStats: !privacySettings.shareStats })
                  }
                />
              </div>
            </div>

            <Button onClick={handlePrivacySave} loading={loading}>
              <Save className="w-5 h-5 mr-2" />
              Save Privacy Settings
            </Button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Notification Preferences
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose what notifications you want to receive
              </p>
            </div>

            <div className="space-y-4">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700 first:border-t-0"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {key
                        .split(/(?=[A-Z])/)
                        .join(' ')
                        .replace(/^\w/, (c) => c.toUpperCase())}
                    </h3>
                  </div>
                  <ToggleSwitch
                    enabled={value}
                    onChange={() => setNotificationSettings({ ...notificationSettings, [key]: !value })}
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleNotificationSave} loading={loading}>
              <Save className="w-5 h-5 mr-2" />
              Save Notification Settings
            </Button>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Data Management
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export or delete your account data
              </p>
            </div>

            {/* Export Data */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Export Your Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Download a copy of all your study sessions, goals, rewards, and settings in JSON format.
                  </p>
                  <Button onClick={() => setShowExportModal(true)}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Your Data"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Your data will be exported as a JSON file containing all your study sessions, goals, rewards, and settings.
        </p>
        <div className="flex space-x-3">
          <Button onClick={handleExportData} className="flex-1">
            Export
          </Button>
          <Button variant="secondary" onClick={() => setShowExportModal(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account?"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently delete your account and all associated data including study sessions, goals, and rewards. This action cannot be undone.
          </p>
        </div>
        <div className="flex space-x-3 mt-6">
          <Button variant="danger" onClick={handleDeleteAccount} className="flex-1">
            Yes, Delete
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ProfileSettings
