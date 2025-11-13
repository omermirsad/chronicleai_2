// src/pages/Settings/index.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGoBack } from '../../hooks/useNavigate';
import { ArrowUturnLeftIcon } from '../../components/Icons';
import { ProfileSection } from './ProfileSection';
import { PasswordSection } from './PasswordSection';
import { SubscriptionSection } from './SubscriptionSection';
import { PreferencesSection } from './PreferencesSection';
import { DataManagementSection } from './DataManagementSection';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const goBack = useGoBack();

  if (!user) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-stone-600">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition mb-4"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            Back to Journal
          </button>
          <h1 className="text-3xl font-bold text-stone-800">Settings</h1>
          <p className="text-stone-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* All Settings Sections */}
        <div className="space-y-6">
          {/* Profile Section */}
          <ProfileSection />

          {/* Password Change Section */}
          <PasswordSection />

          {/* Subscription Section */}
          <SubscriptionSection />

          {/* Preferences Section */}
          <PreferencesSection />

          {/* Data Management & Danger Zone */}
          <DataManagementSection />
        </div>
      </div>
    </div>
  );
};

export default Settings;
