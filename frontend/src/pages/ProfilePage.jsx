/**
 * ProfilePage Component
 * 
 * This component provides a comprehensive user profile management interface
 * for the Intelligent Study Session Guardian application. It allows users to
 * view and edit their personal information, manage account settings, and
 * control various aspects of their study experience.
 * 
 * Key Features:
 * - Personal information editing (name, email, phone, institution)
 * - Profile picture management and display
 * - Bio and personal description editing
 * - Module control settings for study features
 * - Account preferences and customization options
 * - Real-time form validation and updates
 * 
 * The page integrates with the authentication context to maintain user
 * data consistency across the application.
 * 
 * @component
 * @author Intelligent Study Session Guardian Team
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProfileModuleControls from '../components/ProfileModuleControls';
import { 
  UserIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  // Authentication context for user data and profile management
  const { user } = useAuth();
  
  /**
   * Form data state for user profile information
   * Manages all editable user profile fields
   */
  const [formData, setFormData] = useState({
    // User's display name (can be different from legal name)
    displayName: '',
    // User's email address (used for login and notifications)
    email: '',
    // Optional phone number for contact and SMS notifications
    phoneNumber: '',
    // Educational institution or workplace
    institution: '',
    // Personal bio or description text
    bio: ''
  });

  /**
   * Initialize form data with current user information
   * Runs when user data is loaded or updated
   */
  useEffect(() => {
    if (user) {
      setFormData({
        // Prefer profile display name over auth display name
        displayName: user.profile?.displayName || user.displayName || '',
        email: user.email || '',
        phoneNumber: user.profile?.phoneNumber || '',
        institution: user.profile?.institution || '',
        bio: user.profile?.bio || ''
      });
    }
  }, [user]);

  /**
   * Handles form input changes for controlled components
   * Updates the corresponding field in formData state
   * 
   * @function handleInputChange
   * @param {React.ChangeEvent} e - The input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles form submission for profile updates
   * Currently in demo mode - would integrate with backend API
   * 
   * @function handleSubmit
   * @param {React.FormEvent} e - The form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Integrate with actual API call for profile updates
    console.log('Profile update data:', formData);
    alert('Profile updated successfully! (Demo mode)');
  };

  /**
   * Main component render
   * Displays profile form with user information and module controls
   */
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-secondary-600 dark:text-secondary-400">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-secondary-700 rounded-full border-2 border-primary-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <PencilIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </button>
              </div>
              
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-1">
                {formData.displayName || 'User'}
              </h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                {formData.email}
              </p>
              
              <button className="w-full px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                <PencilIcon className="w-4 h-4 mr-2 inline-block" />
                Edit Avatar
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
              <div className="flex items-center mb-6">
                <UserIcon className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                  Personal Information
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-sm font-medium placeholder-secondary-400 transition-all duration-200 ease-in-out border border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white hover:border-secondary-400 dark:bg-secondary-700 dark:border-secondary-600 dark:hover:border-secondary-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 text-secondary-900 dark:text-white"
                      placeholder="Enter your display name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="block w-full px-4 py-3 text-sm font-medium border rounded-lg shadow-sm bg-secondary-50 dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-500 dark:text-secondary-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                      Contact support to change your email
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-sm font-medium placeholder-secondary-400 transition-all duration-200 ease-in-out border border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white hover:border-secondary-400 dark:bg-secondary-700 dark:border-secondary-600 dark:hover:border-secondary-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 text-secondary-900 dark:text-white"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 text-sm font-medium placeholder-secondary-400 transition-all duration-200 ease-in-out border border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white hover:border-secondary-400 dark:bg-secondary-700 dark:border-secondary-600 dark:hover:border-secondary-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 text-secondary-900 dark:text-white"
                      placeholder="School, university, or workplace"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="block w-full px-4 py-3 text-sm border border-secondary-300 focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-secondary-700 dark:border-secondary-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 text-secondary-900 dark:text-white placeholder-secondary-400"
                  />
                </div>
                
                <div className="pt-6 border-t border-secondary-200 dark:border-secondary-700">
                  <button 
                    type="submit"
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 border border-transparent rounded-lg shadow-sm hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Additional Settings Sections */}
            <div className="mt-8 space-y-6">
              {/* Module Controls - Timer, Reminders, Goals */}
              <ProfileModuleControls />

              {/* Notifications */}
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center mb-4">
                  <BellIcon className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    Notification Preferences
                  </h2>
                </div>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Manage your notification settings and preferences.
                </p>
              </div>

              {/* Privacy & Security */}
              <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6">
                <div className="flex items-center mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-primary-600 mr-3" />
                  <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">
                    Privacy & Security
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-secondary-900 dark:text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Update your account password for security
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors">
                      Change
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg">
                    <div>
                      <h3 className="font-medium text-secondary-900 dark:text-white">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 border border-secondary-300 dark:border-secondary-600 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-600 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;