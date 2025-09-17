interface Config {
  supabase: {
    url: string;
    anonKey: string;
  };
  gemini: {
    apiKey?: string;
  };
  sentry: {
    dsn?: string;
    enabled: boolean;
  };
  app: {
    url: string;
    name: string;
    version: string;
    enableAnalytics: boolean;
    enablePWA: boolean;
  };
  features: {
    offlineMode: boolean;
    voiceInput: boolean;
    photoUpload: boolean;
    aiAnalysis: boolean;
  };
}

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Validate required environment variables
const validateConfig = (): void => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file'
    );
  }
};

// Only validate in production builds
if (isProduction) {
  validateConfig();
}

export const config: Config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: isProduction && !!import.meta.env.VITE_SENTRY_DSN,
  },
  app: {
    url: import.meta.env.VITE_APP_URL || 'https://chronicle-ai.app',
    name: 'Chronicle AI',
    version: '2.0.0',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  },
  features: {
    offlineMode: true,
    voiceInput: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
    photoUpload: true,
    aiAnalysis: true,
  },
};

export { isDevelopment, isProduction };
