/**
 * Library barrel exports
 * Central export point for all utility modules
 */

// Error handling
export * from './errors';
export type { ErrorType, ErrorDetails } from './errorHandler';
export { initErrorMonitoring, captureException, setUserContext, clearUserContext } from './errorMonitoring';

// Security
export {
  generateCSPHeader,
  getSecurityHeaders,
  sanitizeInput,
  isValidEmail,
  isSafeUrl,
  isRateLimited,
  generateSecureRandomString,
  isProduction,
  isDevelopment,
  logSecurityEvent,
} from './security';

// Logging & Monitoring
export { logger } from './logger';
export { initWebVitals } from './monitoring/webVitals';
export { performanceMonitor } from './performanceMonitoring';

// Analytics
export { analytics } from './analytics';

// API & Data
export { supabase } from './supabase';
export { validateEnv } from './envValidation';
export { rateLimiter } from './rateLimiter';

// Data Export
// Data export functions not yet implemented

// Feature Flags
export { useFeatureFlag } from './featureFlags';

// API utilities
export { RetryConfig } from './api/retryConfig';
