import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export const useDateLocale = () => {
  const { i18n } = useTranslation();
  const [dateLocale, setDateLocale] = useState<Locale>(enUS);

  useEffect(() => {
    const loadLocale = async () => {
      let localeModule: { default: Locale };
      try {
        switch (i18n.language) {
          case 'es':
            localeModule = await import('date-fns/locale/es');
            break;
          case 'fr':
            localeModule = await import('date-fns/locale/fr');
            break;
          case 'de':
            localeModule = await import('date-fns/locale/de');
            break;
          case 'tr':
            localeModule = await import('date-fns/locale/tr');
            break;
          default:
            localeModule = await import('date-fns/locale/en-US');
        }
        setDateLocale(localeModule.default || enUS);
      } catch (error) {
        console.warn('Could not load date-fns locale:', error);
        setDateLocale(enUS); // Fallback to English
      }
    };

    loadLocale();
  }, [i18n.language]);

  return dateLocale;
};
