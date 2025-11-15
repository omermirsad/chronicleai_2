import en from './locales/en.json' assert { type: 'json' };
import es from './locales/es.json' assert { type: 'json' };

const locales: Record<string, typeof en> = { en, es };

// Simple "t" function for server-side translation
export const getTranslator = (language: string | undefined) => {
  const lang = language || 'en';
  const strings = locales[lang] || locales.en;

  return (key: keyof typeof en, replacements?: Record<string, string | number>) => {
    let str = strings[key] || en[key]; // Fallback to English key

    if (replacements) {
      Object.entries(replacements).forEach(([key, value]) => {
        str = str.replace(`{{${key}}}`, String(value));
      });
    }
    return str;
  };
};
