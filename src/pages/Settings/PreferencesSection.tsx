import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { TOAST_MESSAGES } from '../../constants';
import type { EmailPreferences } from '../../types';

export const PreferencesSection: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailNotifications: true,
    insightsFrequency: 'weekly',
    weeklyDigest: true,
    onThisDay: true,
    streakReminders: true,
    achievementNotifications: true,
  });

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.preferences) {
        setPreferences({
          emailNotifications: data.preferences?.emailNotifications !== false,
          insightsFrequency: data.preferences?.insightsFrequency || 'weekly',
          weeklyDigest: data.preferences?.weeklyDigest !== false,
          onThisDay: data.preferences?.onThisDay !== false,
          streakReminders: data.preferences?.streakReminders !== false,
          achievementNotifications: data.preferences?.achievementNotifications !== false,
        });
      }
    } catch (error) {
      // Silent fail on load
    }
  };

  const { execute: handleSavePreferences, loading } = useAsyncAction(
    async () => {
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('id', user.id);

      if (error) throw error;
    },
    {
      successMessage: TOAST_MESSAGES.PREFERENCES_SAVED,
      errorMessage: TOAST_MESSAGES.PREFERENCES_SAVE_ERROR,
    }
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
      <h3 className="text-xl font-semibold text-stone-800 mb-4">
        Email Preferences
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-stone-700">
                Email Notifications
              </label>
              <p className="text-xs text-stone-500">
                Receive emails about your journaling journey
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
              className="w-4 h-4 text-rose-600 border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {preferences.emailNotifications && (
            <div className="ml-6 mt-3 space-y-3 border-l-2 border-stone-200 pl-4">
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

        <button
          onClick={handleSavePreferences}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};
