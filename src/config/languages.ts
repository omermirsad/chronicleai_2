export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'tr';

export const supportedLanguages: { code: AppLanguage; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'tr', name: 'Türkçe' },
];
