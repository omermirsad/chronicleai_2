// src/lib/errorMonitoring.ts
import * as Sentry from '@sentry/react';
import { config, isProduction } from '../config';

// Initialize Sentry for production error tracking
export const initErrorMonitoring = () => {
  if (config.sentry.enabled && config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: isProduction ? 'production' : 'development',
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend: (event, hint) => {
        // Filter out non-critical errors
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
          return null;
        }
        
        // Sanitize sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        
        return event;
      },
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Non-Error promise rejection captured',
        /^Network request failed/,
      ],
    });
  }
};

// Custom error logger for development and fallback
export class ErrorLogger {
  static log(error: Error, context?: Record<string, any>) {
    if (isProduction && config.sentry.enabled) {
      Sentry.captureException(error, {
        extra: context,
      });
    } else {
      console.error('Application Error:', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static logWarning(message: string, context?: Record<string, any>) {
    if (isProduction && config.sentry.enabled) {
      Sentry.captureMessage(message, 'warning');
    } else {
      console.warn('Application Warning:', {
        message,
        context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static setUser(user: { id: string; email: string }) {
    if (config.sentry.enabled) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
      });
    }
  }

  static clearUser() {
    if (config.sentry.enabled) {
      Sentry.setUser(null);
    }
  }

  static addBreadcrumb(message: string, data?: Record<string, any>) {
    if (config.sentry.enabled) {
      Sentry.addBreadcrumb({
        message,
        data,
        timestamp: Date.now(),
      });
    }
  }
}
