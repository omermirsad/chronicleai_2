// src/config/index.ts
/**
 * Application Configuration
 * Centralized configuration for environment variables and app settings
 */

import { logger } from '@/lib/logger';

export const config = {
  // App settings
  app: {
    name: 'Chronicle AI',
    version: '2.0.0',
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enablePWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  },

  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // Google Gemini API (for local development only)
  gemini: {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  },

  // Sentry error monitoring
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
  },

  // Feature flags
  features: {
    voiceInput: true,
    photoUpload: true,
    guidedSessions: true,
    perspectiveLens: true,
    insights: true,
    dataExport: true,
  },

  // AI limits
  ai: {
    maxRequestsPerMinute: 10,
    maxTokensPerRequest: 8000,
  },

  // Storage limits
  storage: {
    maxPhotoSize: 5 * 1024 * 1024, // 5MB
    maxPhotosPerEntry: 1,
  },

  // Stripe configuration
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    // Price IDs should be set in environment variables
    proPriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    proYearlyPriceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || '',
    premiumPriceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || '',
    premiumYearlyPriceId: import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    // Consumable AI call packs (one-time purchases)
    aiCallPack25PriceId: import.meta.env.VITE_STRIPE_AI_CALL_PACK_25_PRICE_ID || '',
  },
};

// Validate required environment variables
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const required = [
    { key: 'VITE_SUPABASE_URL', value: config.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: config.supabase.anonKey },
  ];

  const missing = required
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  return {
    valid: missing.length === 0,
    missing,
  };
};

// Validate required environment variables at startup
const validateRequiredEnvVars = () => {
  const validation = validateConfig();

  if (!validation.valid && import.meta.env.PROD) {
    throw new Error(
      `Missing required environment variables: ${validation.missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

// Run validation
validateRequiredEnvVars();

// Log configuration on app start (dev only)
if (import.meta.env.DEV) {
  const validation = validateConfig();

  if (!validation.valid) {
    logger.error('❌ Missing required environment variables:', validation.missing);
  } else {
    logger.info('✅ Configuration validated successfully');
  }

  logger.info('App configuration:', {
    environment: import.meta.env.MODE,
    appUrl: config.app.url,
    analyticsEnabled: config.app.enableAnalytics,
    pwaEnabled: config.app.enablePWA,
  });
}
