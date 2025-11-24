// src/lib/errorMonitoring.ts
/**
 * Error Monitoring Service
 * Initializes Sentry for production error tracking
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/lib/logger';

export const initErrorMonitoring = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE;

  // Only initialize Sentry if DSN is provided
  if (!sentryDsn) {
    logger.info('Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracePropagationTargets: ['localhost', /^\//],
      }),
      new Sentry.Replay({
        // Mask all text and block all media by default
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Don't report errors in development
    enabled: environment === 'production',

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      // Filter out extension errors
      if (event.exception?.values?.[0]?.value?.includes('extension')) {
        return null;
      }

      // Filter out network errors (they're usually temporary)
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }

      return event;
    },
  });

  logger.info('Error monitoring initialized');
};

/**
 * Manually capture an exception
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    logger.error('Error captured', error, context);
  }
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (user: { id: string; email: string }) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  }
};

/**
 * Clear user context (on logout)
 */
export const clearUserContext = () => {
  if (import.meta.env.MODE === 'production') {
    Sentry.setUser(null);
  }
};
