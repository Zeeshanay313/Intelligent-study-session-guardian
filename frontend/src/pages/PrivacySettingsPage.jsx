import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

const PrivacySettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { apiCall } = useApi();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  
  const [privacySettings, setPrivacySettings] = useState({
    cameraConsent: user?.privacy?.cameraConsent || false,
    guardianSharing: user?.privacy?.guardianSharing || false,
    shareFields: user?.privacy?.shareFields || [],
    notifications: {
      inApp: user?.privacy?.notifications?.inApp ?? true,
      email: user?.privacy?.notifications?.email ?? false,
      studyReminders: user?.privacy?.notifications?.studyReminders ?? true,
      guardianUpdates: user?.privacy?.notifications?.guardianUpdates ?? false,
      goalUpdates: user?.privacy?.notifications?.goalUpdates ?? true,
      achievementAlerts: user?.privacy?.notifications?.achievementAlerts ?? true,
      breakReminders: user?.privacy?.notifications?.breakReminders ?? true
    }
  });

  // Load user devices
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await apiCall('/devices', 'GET');
      if (response.success) {
        setDevices(response.data.devices);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const updatePrivacySetting = async (setting, value) => {
    try {
      setLoading(true);
      const newSettings = { ...privacySettings };
      
      if (setting.includes('.')) {
        const [parent, child] = setting.split('.');
        newSettings[parent] = { ...newSettings[parent], [child]: value };
      } else {
        newSettings[setting] = value;
      }
      
      const response = await apiCall('/users/me/privacy', 'PATCH', newSettings);
      
      if (response.success) {
        setPrivacySettings(newSettings);
        updateUser({ ...user, privacy: newSettings });
        toast.success('Privacy settings updated');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error('Privacy update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraPermission = async () => {
    try {
      if (!privacySettings.cameraConsent) {
        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission
        await updatePrivacySetting('cameraConsent', true);
        toast.success('Camera access granted');
      } else {
        // Revoke camera consent
        await updatePrivacySetting('cameraConsent', false);
        toast.success('Camera access revoked');
      }
    } catch (error) {
      toast.error('Failed to update camera permission');
      console.error('Camera permission error:', error);
    }
  };

  const toggleShareField = (field) => {
    const currentFields = privacySettings.shareFields;
    const newFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];
    
    updatePrivacySetting('shareFields', newFields);
  };

  const exportUserData = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/users/me/export', 'POST');
      
      if (response.success) {
        // Trigger download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-study-guardian-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Your data has been exported and downloaded');
      }
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeDeviceAccess = async (deviceId) => {
    try {
      const response = await apiCall(`/devices/${deviceId}`, 'DELETE');
      if (response.success) {
        setDevices(devices.filter(d => d._id !== deviceId));
        toast.success('Device access revoked');
      }
    } catch (error) {
      toast.error('Failed to revoke device access');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
          Privacy & Security Settings
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-2">
          Manage your privacy preferences and data controls
        </p>
      </div>

      {/* Camera & Microphone Permissions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Camera & Microphone Access
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <div>
              <h3 className="font-medium">Camera Access</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Allow Study Guardian to access your camera for focus monitoring
              </p>
            </div>
            <Button
              variant={privacySettings.cameraConsent ? 'danger' : 'primary'}
              onClick={handleCameraPermission}
              disabled={loading}
            >
              {privacySettings.cameraConsent ? 'Revoke Access' : 'Grant Access'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Guardian Sharing */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Guardian Sharing
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Share with Guardians</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Allow parents/guardians to view your study progress
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={privacySettings.guardianSharing}
                onChange={(e) => updatePrivacySetting('guardianSharing', e.target.checked)}
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {privacySettings.guardianSharing && (
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h4 className="font-medium mb-3">What to share:</h4>
              <div className="space-y-2">
                {['profile', 'studyTime', 'progress', 'schedule'].map(field => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={privacySettings.shareFields.includes(field)}
                      onChange={() => toggleShareField(field)}
                      className="mr-2 rounded border-secondary-300"
                    />
                    <span className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a1.414 1.414 0 010-2L18 10l-5 0V17zM4 7h9m-9 4h9m-9 4h9" />
          </svg>
          Notification Preferences
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(privacySettings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <span className="capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={value}
                  onChange={(e) => updatePrivacySetting(`notifications.${key}`, e.target.checked)}
                />
                <div className="w-9 h-5 bg-secondary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-secondary-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-secondary-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-secondary-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Device Management */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z" />
          </svg>
          Device Access Management
        </h2>
        
        <div className="space-y-3">
          {devices.map(device => (
            <div key={device._id} className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">{device.deviceInfo.name || 'Unknown Device'}</h3>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="danger"
                size="small"
                onClick={() => revokeDeviceAccess(device._id)}
              >
                Revoke Access
              </Button>
            </div>
          ))}
          {devices.length === 0 && (
            <p className="text-secondary-600 dark:text-secondary-400 text-center py-8">
              No devices found
            </p>
          )}
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Data Management
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <div>
              <h3 className="font-medium">Export Your Data</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Download a copy of all your data in JSON format
              </p>
            </div>
            <Button onClick={exportUserData} disabled={loading}>
              Export Data
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
            <div>
              <h3 className="font-medium text-danger-800 dark:text-danger-200">Delete Account</h3>
              <p className="text-sm text-danger-600 dark:text-danger-400">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="danger" onClick={() => window.location.href = '/profile?section=delete'}>
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PrivacySettingsPage;