// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import {
  downloadDataAsJSON,
  downloadEntriesAsCSV,
  downloadEntriesAsText,
  requestAccountDeletion,
  getUserDataStats,
} from '../lib/dataExportService';
import { navigate } from '../Router';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  ArrowUturnLeftIcon,
} from '../components/Icons';

interface DataStats {
  totalEntries: number;
  dateRange: {
    first?: string;
    last?: string;
  };
  estimatedSizeKB: number;
}

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { usage, loading: subscriptionLoading } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    emailNotifications: true,
    insightsFrequency: 'weekly',
    weeklyDigest: true,
    onThisDay: true,
    streakReminders: true,
    achievementNotifications: true,
  });

  // Delete account confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user profile and stats on mount
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadDataStats();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
        if (data.preferences) {
          setPreferences({
            theme: data.preferences.theme || 'light',
            emailNotifications: data.preferences.emailNotifications !== false,
            insightsFrequency: data.preferences.insightsFrequency || 'weekly',
            weeklyDigest: data.preferences.weeklyDigest !== false,
            onThisDay: data.preferences.onThisDay !== false,
            streakReminders: data.preferences.streakReminders !== false,
            achievementNotifications: data.preferences.achievementNotifications !== false,
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadDataStats = async () => {
    if (!user) return;

    try {
      const stats = await getUserDataStats(user.id);
      setDataStats(stats);
    } catch (error) {
      console.error('Error loading data stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await downloadDataAsJSON(user.id);
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await downloadEntriesAsCSV(user.id);
      toast.success('Entries exported as CSV');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExportText = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await downloadEntriesAsText(user.id);
      toast.success('Entries exported as text');
    } catch (error) {
      console.error('Error exporting text:', error);
      toast.error('Failed to export text');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setLoading(true);
    try {
      await requestAccountDeletion();
      toast.success('Account deleted successfully');
      // User will be signed out automatically
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session');

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p>Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition mb-4"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            Back to Journal
          </button>
          <h1 className="text-3xl font-bold text-stone-800">Settings</h1>
          <p className="text-stone-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserCircleIcon className="w-6 h-6 text-rose-600" />
              <h2 className="text-xl font-semibold text-stone-800">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-stone-100 border border-stone-300 rounded-lg text-stone-500 cursor-not-allowed"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-6">
              Change Password
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-stone-800">Subscription</h2>
              {usage && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  usage.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                  usage.tier === 'pro' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-stone-100 text-stone-800'
                }`}>
                  {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)}
                </span>
              )}
            </div>

            {subscriptionLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
              </div>
            ) : usage ? (
              <div className="space-y-4">
                {/* AI Usage Stats */}
                <div className="bg-stone-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-stone-700">
                      AI Analysis Usage
                    </span>
                    <span className="text-sm font-bold text-stone-900">
                      {usage.aiCallsUsed} / {usage.tier === 'premium' ? '∞' : usage.aiCallsLimit}
                    </span>
                  </div>

                  {usage.tier !== 'premium' && (
                    <>
                      <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            usage.percentageUsed >= 100 ? 'bg-red-500' :
                            usage.percentageUsed >= 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        {usage.aiCallsRemaining} calls remaining this month
                      </p>
                    </>
                  )}
                </div>

                {/* Billing Period */}
                {usage.billingPeriodEnd && (
                  <div className="text-sm text-stone-600">
                    <p>
                      Billing period ends: {' '}
                      <span className="font-medium">
                        {new Date(usage.billingPeriodEnd).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {usage.tier === 'free' ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Upgrade to Pro or Premium
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleManageSubscription}
                        disabled={loading}
                        className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Manage Subscription'}
                      </button>
                      {usage.tier === 'pro' && (
                        <button
                          onClick={() => navigate('/pricing')}
                          className="px-6 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
                        >
                          Upgrade to Premium
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Info Text */}
                <p className="text-xs text-stone-500 pt-2">
                  {usage.tier === 'free'
                    ? 'Upgrade to get more AI analysis calls and unlock advanced features.'
                    : 'Manage your billing, payment methods, and subscription settings.'}
                </p>
              </div>
            ) : (
              <p className="text-stone-600">Loading subscription information...</p>
            )}
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-6">
              Preferences
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Theme
                </label>
                <select
                  value={preferences.theme}
                  onChange={(e) =>
                    setPreferences({ ...preferences, theme: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Email Notifications Section */}
              <div className="border-t border-stone-200 pt-4">
                <h3 className="text-base font-semibold text-stone-800 mb-4">
                  Email Notifications
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-stone-700">
                        Enable Email Notifications
                      </label>
                      <p className="text-xs text-stone-500">
                        Master switch for all email notifications
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {preferences.emailNotifications && (
                    <div className="ml-6 space-y-3 border-l-2 border-stone-200 pl-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            Weekly Digest
                          </label>
                          <p className="text-xs text-stone-500">
                            Personalized summary every Sunday
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.weeklyDigest}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              weeklyDigest: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            On This Day
                          </label>
                          <p className="text-xs text-stone-500">
                            Daily memories from past years
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.onThisDay}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              onThisDay: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            Streak Reminders
                          </label>
                          <p className="text-xs text-stone-500">
                            Keep your journaling streak alive
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.streakReminders}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              streakReminders: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-stone-700">
                            Achievement Notifications
                          </label>
                          <p className="text-xs text-stone-500">
                            Celebrate your milestones
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.achievementNotifications}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              achievementNotifications: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Insights Frequency (Deprecated)
                </label>
                <p className="text-xs text-stone-500 mb-2">
                  Use "Weekly Digest" toggle above instead
                </p>
                <select
                  value={preferences.insightsFrequency}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      insightsFrequency: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  disabled
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h2 className="text-xl font-semibold text-stone-800 mb-2">
              Data Management
            </h2>
            <p className="text-sm text-stone-600 mb-6">
              Export your data or delete your account
            </p>

            {/* Data Stats */}
            {dataStats && (
              <div className="bg-stone-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">
                  Your Data
                </h3>
                <div className="space-y-1 text-sm text-stone-600">
                  <p>Total Entries: {dataStats.totalEntries}</p>
                  {dataStats.dateRange.first && (
                    <p>
                      Date Range: {new Date(dataStats.dateRange.first).toLocaleDateString()} -{' '}
                      {dataStats.dateRange.last
                        ? new Date(dataStats.dateRange.last).toLocaleDateString()
                        : 'Now'}
                    </p>
                  )}
                  <p>Estimated Size: {dataStats.estimatedSizeKB} KB</p>
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-stone-700">
                Export Your Data
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExportJSON}
                  disabled={loading}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={loading}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={handleExportText}
                  disabled={loading}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
                >
                  Export as Text
                </button>
              </div>
            </div>

            {/* Delete Account */}
            <div className="mt-8 pt-6 border-t border-stone-200">
              <h3 className="text-sm font-semibold text-red-600 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-stone-600 mb-4">
                Once you delete your account, there is no going back. All your data
                will be permanently deleted.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Delete Account
            </h2>
            <p className="text-stone-700 mb-4">
              This action cannot be undone. All your journal entries, insights, and
              profile data will be permanently deleted.
            </p>
            <p className="text-stone-700 mb-4">
              To confirm, type{' '}
              <span className="font-bold">"DELETE MY ACCOUNT"</span> below:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmation !== 'DELETE MY ACCOUNT'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
