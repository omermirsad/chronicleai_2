import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { logger } from '@/lib/logger';

export const useDateLocale = () => {
  const { i18n } = useTranslation();
  const [dateLocale, setDateLocale] = useState<Locale>(enUS);

  useEffect(() => {
    const loadLocale = async () => {
      try {
        let locale: Locale;
        switch (i18n.language) {
          case 'es':
            locale = (await import('date-fns/locale/es')).es;
            break;
          case 'fr':
            locale = (await import('date-fns/locale/fr')).fr;
            break;
          case 'de':
            locale = (await import('date-fns/locale/de')).de;
            break;
          case 'tr':
            locale = (await import('date-fns/locale/tr')).tr;
            break;
          default:
            locale = enUS;
        }
        setDateLocale(locale);
      } catch (error) {
        logger.warn('Could not load date-fns locale', { error: error instanceof Error ? error : new Error(String(error)) });
        setDateLocale(enUS); // Fallback to English
      }
    };

    loadLocale();
  }, [i18n.language]);

  return dateLocale;
};
