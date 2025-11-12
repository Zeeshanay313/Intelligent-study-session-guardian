/**
 * PrivacyPage Component
 * 
 * This component serves as the main privacy information and policy page for the
 * Intelligent Study Session Guardian application. It provides users with comprehensive
 * information about data collection, usage policies, and privacy controls.
 * 
 * Key Features:
 * - Display privacy policy and terms of service
 * - User privacy settings management interface
 * - Device access and session management
 * - Data export and deletion controls
 * - Transparent data usage information
 * 
 * This page ensures compliance with privacy regulations (GDPR, COPPA) and provides
 * users with full control over their personal information and study data.
 * 
 * @component
 * @author Intelligent Study Session Guardian Team
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useApi } from '../hooks/useApi';

const PrivacyPage = () => {
  // Authentication context for user data access
  const { user } = useAuth();
  // API hook for making authenticated requests
  const { apiCall } = useApi();
  
  // Loading state for async operations
  const [loading, setLoading] = useState(false);
  // List of user's registered devices for session management
  const [devices, setDevices] = useState([]);
  
  /**
   * Privacy settings state containing user's privacy preferences
   * These settings control data visibility and sharing permissions
   */
  const [privacySettings, setPrivacySettings] = useState({
    // Profile visibility level (private, friends, public)
    profileVisibility: 'private',
    // Whether to show email in public profile
    showEmail: false,
    // Whether to show phone number in public profile  
    showPhone: false,
    // Allow sharing of study session data for research
    shareStudyData: false,
    // Enable analytics data collection for app improvement
    allowAnalytics: true,
    // Email notification preferences
    emailNotifications: true,
    // Push notification preferences
    pushNotifications: true,
    // Study reminder notification preferences
    studyReminders: true,
    // Security alert notification preferences
    securityAlerts: true
  });

  /**
   * Component initialization effect
   * Loads user's current privacy settings and registered devices
   */
  useEffect(() => {
    fetchPrivacySettings();
    fetchDevices();
  }, []);

  /**
   * Fetches current privacy settings from the backend
   * Merges server settings with default local settings
   * 
   * @async
   * @function fetchPrivacySettings
   */
  const fetchPrivacySettings = async () => {
    try {
      const response = await apiCall('/users/me/privacy');
      if (response.ok) {
        const data = await response.json();
        // Merge fetched settings with defaults
        setPrivacySettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
    }
  };

  /**
   * Fetches list of user's registered devices
   * Used for displaying active sessions and device management
   * 
   * @async  
   * @function fetchDevices
   */
  const fetchDevices = async () => {
    try {
      const response = await apiCall('/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  const updatePrivacySetting = async (key, value) => {
    setLoading(true);
    try {
      const response = await apiCall('/users/me/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [key]: value })
      });

      if (response.ok) {
        setPrivacySettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      alert('Failed to update privacy setting');
    } finally {
      setLoading(false);
    }
  };

  const revokeDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to revoke access for this device? You will need to log in again on that device.')) {
      return;
    }

    try {
      const response = await apiCall(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDevices(devices.filter(d => d._id !== deviceId));
      }
    } catch (error) {
      console.error('Failed to revoke device:', error);
      alert('Failed to revoke device access');
    }
  };

  const exportData = async () => {
    try {
      const response = await apiCall('/api/users/export', {
        method: 'POST'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-guardian-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      alert('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    );

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await apiCall('/users/account', {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Account deletion initiated. You will receive an email confirmation.');
        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      className={`${
        checked ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );

  const PrivacySetting = ({ title, description, checked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
          {title}
        </h4>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          {description}
        </p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-secondary-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            Privacy Settings
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Manage your privacy preferences and control how your data is used.
          </p>
        </div>

        {/* Camera and Presence Privacy */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 font-display">
            Camera and Presence Detection
          </h3>
          <div className="space-y-1 divide-y divide-secondary-200 dark:divide-secondary-700">
            <PrivacySetting
              title="Enable Camera Presence Detection"
              description="Allow the app to use your webcam to verify presence during study sessions (on-device processing only)"
              checked={privacySettings.cameraEnabled || false}
              onChange={(value) => updatePrivacySetting('cameraEnabled', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Store Presence Logs"
              description="Keep logs of presence detection events (no images stored, percentage data only)"
              checked={privacySettings.storPresenceLogs || false}
              onChange={(value) => updatePrivacySetting('storPresenceLogs', value)}
              disabled={loading || !privacySettings.cameraEnabled}
            />

            <PrivacySetting
              title="Manual Check-in Option"
              description="Allow manual 'I'm here' check-ins as alternative to camera detection"
              checked={privacySettings.manualCheckin || true}
              onChange={(value) => updatePrivacySetting('manualCheckin', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Absence Alerts"
              description="Receive gentle notifications when prolonged absence is detected"
              checked={privacySettings.absenceAlerts || true}
              onChange={(value) => updatePrivacySetting('absenceAlerts', value)}
              disabled={loading}
            />
          </div>
        </Card>

        {/* Guardian Access Controls */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 font-display">
            Guardian Dashboard Access
          </h3>
          <div className="space-y-4">
            <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-warning-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-warning-800 dark:text-warning-200">
                    Guardian Access Control
                  </h4>
                  <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                    You have full control over what information guardians can see. All access requires your explicit consent and can be revoked at any time.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1 divide-y divide-secondary-200 dark:divide-secondary-700">
              <PrivacySetting
                title="Allow Guardian Dashboard Access"
                description="Enable parents/teachers to access a simplified view of your study progress"
                checked={privacySettings.guardianAccess || false}
                onChange={(value) => updatePrivacySetting('guardianAccess', value)}
                disabled={loading}
              />

              <PrivacySetting
                title="Share Study Hours"
                description="Allow guardians to see total study time and session counts"
                checked={privacySettings.shareStudyHours || false}
                onChange={(value) => updatePrivacySetting('shareStudyHours', value)}
                disabled={loading || !privacySettings.guardianAccess}
              />

              <PrivacySetting
                title="Share Goal Progress"
                description="Allow guardians to see your study goals and progress towards them"
                checked={privacySettings.shareGoalProgress || false}
                onChange={(value) => updatePrivacySetting('shareGoalProgress', value)}
                disabled={loading || !privacySettings.guardianAccess}
              />

              <PrivacySetting
                title="Share Subject Breakdown"
                description="Allow guardians to see time spent on different subjects"
                checked={privacySettings.shareSubjectBreakdown || false}
                onChange={(value) => updatePrivacySetting('shareSubjectBreakdown', value)}
                disabled={loading || !privacySettings.guardianAccess}
              />

              <PrivacySetting
                title="Allow Guardian Reminders"
                description="Allow guardians to send supportive study reminders (requires your approval)"
                checked={privacySettings.allowGuardianReminders || false}
                onChange={(value) => updatePrivacySetting('allowGuardianReminders', value)}
                disabled={loading || !privacySettings.guardianAccess}
              />
            </div>

            {privacySettings.guardianAccess && (
              <div className="mt-6 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
                  Guardian Access Requests
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600">
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        Parent Request - Sarah Haider
                      </p>
                      <p className="text-xs text-secondary-600 dark:text-secondary-400">
                        Requesting access to study hours and goal progress
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-xs bg-success-600 text-white rounded hover:bg-success-700">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-xs bg-danger-600 text-white rounded hover:bg-danger-700">
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Profile Privacy */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 font-display">
            Profile Privacy
          </h3>
          <div className="space-y-1 divide-y divide-secondary-200 dark:divide-secondary-700">
            <div className="flex items-center justify-between py-4">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  Profile Visibility
                </h4>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Control who can see your profile information
                </p>
              </div>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
                disabled={loading}
                className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-secondary-300 dark:border-secondary-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
              >
                <option value="private">Private</option>
                <option value="friends">Friends Only</option>
                <option value="public">Public</option>
              </select>
            </div>

            <PrivacySetting
              title="Show Email Address"
              description="Allow others to see your email address in your profile"
              checked={privacySettings.showEmail}
              onChange={(value) => updatePrivacySetting('showEmail', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Show Phone Number"
              description="Allow others to see your phone number in your profile"
              checked={privacySettings.showPhone}
              onChange={(value) => updatePrivacySetting('showPhone', value)}
              disabled={loading}
            />
          </div>
        </Card>

        {/* Data Privacy */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
            Data Privacy
          </h3>
          <div className="space-y-1 divide-y divide-secondary-200 dark:divide-secondary-700">
            <PrivacySetting
              title="Share Study Data"
              description="Allow anonymous sharing of study patterns for research purposes"
              checked={privacySettings.shareStudyData}
              onChange={(value) => updatePrivacySetting('shareStudyData', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Analytics"
              description="Help improve our service by sharing usage analytics"
              checked={privacySettings.allowAnalytics}
              onChange={(value) => updatePrivacySetting('allowAnalytics', value)}
              disabled={loading}
            />
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
            Notification Preferences
          </h3>
          <div className="space-y-1 divide-y divide-secondary-200 dark:divide-secondary-700">
            <PrivacySetting
              title="Email Notifications"
              description="Receive important updates and notifications via email"
              checked={privacySettings.emailNotifications}
              onChange={(value) => updatePrivacySetting('emailNotifications', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Push Notifications"
              description="Receive push notifications in your browser"
              checked={privacySettings.pushNotifications}
              onChange={(value) => updatePrivacySetting('pushNotifications', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Study Reminders"
              description="Get reminded about your study sessions and goals"
              checked={privacySettings.studyReminders}
              onChange={(value) => updatePrivacySetting('studyReminders', value)}
              disabled={loading}
            />

            <PrivacySetting
              title="Security Alerts"
              description="Get notified about important security events"
              checked={privacySettings.securityAlerts}
              onChange={(value) => updatePrivacySetting('securityAlerts', value)}
              disabled={loading}
            />
          </div>
        </Card>

        {/* Connected Devices */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4">
            Connected Devices
          </h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
            Manage devices that have access to your account. Remove access for devices you no longer use.
          </p>
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device._id}
                className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {device.deviceInfo?.browser || 'Unknown Browser'} on {device.deviceInfo?.os || 'Unknown OS'}
                    </p>
                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                      Last active: {new Date(device.lastAccessed).toLocaleString()}
                    </p>
                    {device.location && (
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Location: {device.location.city}, {device.location.country}
                      </p>
                    )}
                    {device.isCurrent && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        Current Device
                      </span>
                    )}
                  </div>
                </div>
                {!device.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeDevice(device._id)}
                  >
                    Revoke Access
                  </Button>
                )}
              </div>
            ))}
            {devices.length === 0 && (
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                No connected devices found.
              </p>
            )}
          </div>
        </Card>

        {/* Data Management and Governance */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 font-display">
            Data Management and Governance
          </h3>
          
          {/* Data Export Options */}
          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-3">
                📋 Data Export Options
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <button 
                    onClick={exportData}
                    className="w-full p-3 text-left bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-500 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📊</span>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Complete Data Export
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          All profile, sessions, and settings (JSON)
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-3 text-left bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-500 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📈</span>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Study Reports Only
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          Session data and progress (PDF/CSV)
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="space-y-3">
                  <button className="w-full p-3 text-left bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-500 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📚</span>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Resource Hub Data
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          Notes, links, and materials (ZIP)
                        </p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full p-3 text-left bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-500 transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🔍</span>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                          Audit Logs
                        </p>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400">
                          Privacy actions and access logs (CSV)
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Data Retention Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                📅 Data Retention Preferences
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      Session Data Retention
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      How long to keep detailed session logs
                    </p>
                  </div>
                  <select className="text-sm border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700">
                    <option>6 months</option>
                    <option>1 year</option>
                    <option>2 years</option>
                    <option>Indefinitely</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      Presence Detection Logs
                    </p>
                    <p className="text-xs text-secondary-600 dark:text-secondary-400">
                      How long to keep presence monitoring data
                    </p>
                  </div>
                  <select className="text-sm border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700">
                    <option>1 month</option>
                    <option>3 months</option>
                    <option>6 months</option>
                    <option>1 year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Deletion */}
            <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-danger-900 dark:text-danger-100 mb-3">
                  ⚠️ Account Deletion Options
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-danger-900 dark:text-danger-100">
                        Temporary Account Deactivation
                      </p>
                      <p className="text-xs text-danger-700 dark:text-danger-300">
                        Hide your account for 30 days (reversible)
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Deactivate
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-danger-900 dark:text-danger-100">
                        Permanent Account Deletion
                      </p>
                      <p className="text-xs text-danger-700 dark:text-danger-300">
                        Permanently delete all data (irreversible after 30 days)
                      </p>
                    </div>
                    <Button variant="danger" size="sm" onClick={deleteAccount}>
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Audit Log */}
        <Card>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-4 font-display">
            🔍 Security and Audit Trail
          </h3>
          <div className="space-y-4">
            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-3">
                Recent Privacy Actions
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-secondary-200 dark:border-secondary-700">
                  <span className="text-secondary-700 dark:text-secondary-300">
                    Guardian access enabled for study hours
                  </span>
                  <span className="text-secondary-500 dark:text-secondary-400 text-xs">
                    2 hours ago
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-secondary-200 dark:border-secondary-700">
                  <span className="text-secondary-700 dark:text-secondary-300">
                    Camera presence detection disabled
                  </span>
                  <span className="text-secondary-500 dark:text-secondary-400 text-xs">
                    1 day ago
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-secondary-700 dark:text-secondary-300">
                    Data export requested (complete data)
                  </span>
                  <span className="text-secondary-500 dark:text-secondary-400 text-xs">
                    3 days ago
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
};

export default PrivacyPage;