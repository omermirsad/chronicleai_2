/**
 * Environment Variable Validation
 * Validates required environment variables at runtime
 */

import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Environment variable schema
 */
const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .min(1, 'VITE_SUPABASE_URL is required'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_ANON_KEY must be at least 20 characters')
    .regex(/^eyJ/, 'VITE_SUPABASE_ANON_KEY must be a valid JWT token'),

  // Application Settings
  VITE_APP_URL: z
    .string()
    .url('VITE_APP_URL must be a valid URL')
    .optional()
    .default('http://localhost:5173'),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  VITE_ENABLE_PWA: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true'),

  // Optional: Gemini API (only needed for local development)
  VITE_GEMINI_API_KEY: z
    .string()
    .optional(),

  // Optional: Sentry
  VITE_SENTRY_DSN: z
    .string()
    .url('VITE_SENTRY_DSN must be a valid URL')
    .optional(),

  // Stripe Configuration
  VITE_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .startsWith('pk_', 'VITE_STRIPE_PUBLISHABLE_KEY must start with pk_')
    .optional(),

  // Stripe Price IDs
  VITE_STRIPE_PRO_PRICE_ID: z.string().optional(),
  VITE_STRIPE_PRO_YEARLY_PRICE_ID: z.string().optional(),
  VITE_STRIPE_PREMIUM_PRICE_ID: z.string().optional(),
  VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 */
export function validateEnv(): ValidatedEnv {
  try {
    const env = envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_APP_URL: import.meta.env.VITE_APP_URL,
      VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS,
      VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA,
      VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      VITE_STRIPE_PRO_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
      VITE_STRIPE_PRO_YEARLY_PRICE_ID: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
      VITE_STRIPE_PREMIUM_PRICE_ID: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID,
      VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID: import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID,
    });

    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      const errorMessage = `Environment validation failed:\n${missingVars.join('\n')}`;

      logger.error('Environment validation failed', { errors: missingVars });
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Check if required Stripe configuration is present
 */
export function hasStripeConfig(): boolean {
  return !!(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    (import.meta.env.VITE_STRIPE_PRO_PRICE_ID || import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID)
  );
}

/**
 * Check if Sentry is configured
 */
export function hasSentryConfig(): boolean {
  return !!import.meta.env.VITE_SENTRY_DSN;
}

/**
 * Check if analytics are enabled
 */
export function isAnalyticsEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
}

/**
 * Get the current environment mode
 */
export function getEnvironmentMode(): 'development' | 'production' | 'test' {
  return (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironmentMode() === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironmentMode() === 'development';
}
