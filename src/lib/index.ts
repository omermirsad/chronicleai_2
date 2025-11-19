/**
 * Library barrel exports
 * Central export point for all utility modules
 */

// Error handling
export * from './errors';
export {
  ErrorType,
  ErrorDetails,
  handleError,
  createErrorDetails,
  withErrorHandling,
  retryOperation,
  showSuccess,
  showInfo,
  showLoading,
  dismissToast,
} from './errorHandler';
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
export { performanceMonitor, measurePerformance, trackUserTiming, trackResourceTiming } from './performanceMonitoring';

// Analytics
export { analytics } from './analytics';

// API & Data
export { supabase } from './supabase';
export { validateEnv, getRequiredEnvVars, validateBrowserEnv } from './envValidation';
export { validateJournalEntry, validateEmail, validatePassword, validateUserProfile } from './validation';
export { RateLimiter } from './rateLimiter';

// Data Export
export {
  exportToJSON,
  exportToCSV,
  exportToMarkdown,
  exportToPDF,
  downloadExport,
} from './dataExportService';

// Feature Flags
export { FeatureFlagProvider, useFeatureFlag, useFeatureFlags, withFeatureFlag } from './featureFlags';

// API utilities
export { retryConfig, createRetryableRequest } from './api/retryConfig';
