import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { AppLanguage, UserPreferences } from '@/types';
import { logger } from '@/lib/logger';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Sync DB preference to app on user login
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user) return;

      setIsSyncing(true);
      const { data } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const savedLang = (data?.preferences as UserPreferences)?.language;

      // If a language is saved in DB and it's different from the current one
      if (savedLang && savedLang !== i18n.language) {
        await i18n.changeLanguage(savedLang);
      }
      setIsSyncing(false);
    };

    loadUserLanguage();
  }, [user, i18n]);

  // 2. Update <html> tag for accessibility and SEO
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // 3. Create a function to change language and persist to DB
  const changeLanguage = async (lang: AppLanguage) => {
    if (lang === i18n.language) return;

    // Update i18n (and localStorage) immediately
    await i18n.changeLanguage(lang);

    // Show success toast in the new language
    toast.success(i18n.t('toast.languageChanged'));

    // If logged in, update Supabase preferences
    if (user) {
      try {
        // Fetch current preferences to perform a safe merge
        const { data: profileData, error: fetchError } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const currentPrefs = (profileData?.preferences as UserPreferences) || {};

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            preferences: {
              ...currentPrefs,
              language: lang, // Merge new language setting
            },
          })
          .eq('id', user.id);

        if (updateError) throw updateError;
      } catch (error) {
        logger.error('Failed to save language preference', error as Error);
        toast.error(i18n.t('toast.languageChangeError'));
      }
    }
  };

  return {
    changeLanguage,
    currentLanguage: i18n.language as AppLanguage,
    isSyncing,
  };
};
