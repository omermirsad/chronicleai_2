import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useLanguageSync } from '../../hooks/useLanguageSync';
import { TOAST_MESSAGES } from '../../constants';
import { supportedLanguages, AppLanguage } from '../../config/languages';
import type { UserPreferences } from '../../types';

export const PreferencesSection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { changeLanguage, currentLanguage } = useLanguageSync();

  // Omit language from preferences as it's handled by useLanguageSync
  const [preferences, setPreferences] = useState<Omit<UserPreferences, 'language'>>({
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

      // Merge language preference with other preferences
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            ...preferences,
            language: currentLanguage, // Include current language
          }
        })
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
      {/* Language Section */}
      <h3 className="text-xl font-semibold text-stone-800 mb-4">
        {t('settings.generalTitle')}
      </h3>
      <div className="space-y-4 mb-6 pb-6 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-stone-700">
              {t('settings.language')}
            </label>
            <p className="text-xs text-stone-500">
              {t('settings.languageDesc')}
            </p>
          </div>
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value as AppLanguage)}
            className="w-48 text-sm border-stone-300 rounded focus:ring-2 focus:ring-rose-500"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Email Preferences Section */}
      <h3 className="text-xl font-semibold text-stone-800 mb-4">
        {t('settings.emailTitle')}
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-stone-700">
                {t('settings.emailNotifications')}
              </label>
              <p className="text-xs text-stone-500">
                {t('settings.emailNotificationsDesc')}
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
                    {t('settings.weeklyDigest')}
                  </label>
                  <p className="text-xs text-stone-500">
                    {t('settings.weeklyDigestDesc')}
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
                    {t('settings.onThisDay')}
                  </label>
                  <p className="text-xs text-stone-500">
                    {t('settings.onThisDayDesc')}
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
                    {t('settings.streakReminders')}
                  </label>
                  <p className="text-xs text-stone-500">
                    {t('settings.streakRemindersDesc')}
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
                    {t('settings.achievementNotifications')}
                  </label>
                  <p className="text-xs text-stone-500">
                    {t('settings.achievementNotificationsDesc')}
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
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
};
