import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { TOAST_MESSAGES } from '../../constants';
import { UserCircleIcon } from '../../components/Icons';

export const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data?.full_name || '');
        setAvatarUrl(data?.avatar_url || '');
      }
    } catch (error) {
      // Silent fail on load
    }
  };

  const { execute: handleSaveProfile, loading } = useAsyncAction(
    async () => {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    {
      successMessage: TOAST_MESSAGES.PROFILE_UPDATED,
      errorMessage: TOAST_MESSAGES.PROFILE_UPDATE_ERROR,
    }
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
      <div className="flex items-center mb-6">
        <UserCircleIcon className="w-6 h-6 text-rose-600 mr-2" />
        <h2 className="text-2xl font-bold text-stone-800">Profile</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
          />
          <p className="text-xs text-stone-500 mt-1">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-stone-700 mb-2">
            Full Name
          </label>
          <input
            id="full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="avatar-url" className="block text-sm font-medium text-stone-700 mb-2">
            Avatar URL (optional)
          </label>
          <input
            id="avatar-url"
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
  );
};
