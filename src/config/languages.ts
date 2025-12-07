export type AppLanguage = 'en' | 'es' | 'fr' | 'de' | 'tr' | 'ar' | 'fa' | 'ru' | 'zh' | 'ko' | 'ja';

export const supportedLanguages: { code: AppLanguage; name: string; nativeName: string; rtl?: boolean }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];
