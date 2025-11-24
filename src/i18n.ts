import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Add your supported languages here
export const supportedLngs = ['en', 'es', 'fr', 'de', 'tr'];

i18n
  // Use i18next-http-backend to load translations from /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    // Set default and fallback language
    fallbackLng: 'en',
    // Define supported languages
    supportedLngs: supportedLngs,

    // Configure detection order
    detection: {
      // 1. Check localStorage (user's explicit choice)
      // 2. Check browser navigator (region)
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // Cache user's selection
    },

    // Enable debug logs only in development
    debug: import.meta.env.DEV,

    // React-specific configuration
    react: {
      // Use React Suspense for loading translations
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;
