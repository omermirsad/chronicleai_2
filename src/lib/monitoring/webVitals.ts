/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and reports to analytics/monitoring services
 *
 * @see https://web.dev/vitals/
 */

import { onCLS, onFID, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '../logger';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Web Vitals thresholds based on Google's recommendations
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for a metric based on its value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics/monitoring service
 */
function sendToAnalytics(metric: WebVitalsMetric): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    logger.debug('Web Vitals', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }

  // Send to analytics in production
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  }

  // Send to Sentry performance monitoring
  if (window.Sentry) {
    window.Sentry.metrics.distribution(metric.name, metric.value, {
      tags: {
        rating: metric.rating,
        navigationType: metric.navigationType,
      },
      unit: 'millisecond',
    });
  }

  // Custom analytics endpoint (optional)
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'web-vital', ...metric }),
      keepalive: true,
    }).catch((err) => {
      logger.error('Failed to send Web Vital metric', err);
    });
  }
}

/**
 * Handle metric callback
 */
function handleMetric(metric: Metric): void {
  const webVital: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
  };

  sendToAnalytics(webVital);

  // Log warnings for poor metrics
  if (webVital.rating === 'poor') {
    logger.warn(`Poor ${metric.name} performance detected`, {
      value: metric.value,
      threshold: THRESHOLDS[metric.name as keyof typeof THRESHOLDS]?.poor,
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(): void {
  try {
    // Core Web Vitals
    onCLS(handleMetric);
    onFID(handleMetric);
    onLCP(handleMetric);

    // Additional metrics
    onFCP(handleMetric);
    onTTFB(handleMetric);

    logger.info('Web Vitals monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error);
  }
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): Record<string, number> {
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!perfData) {
    return {};
  }

  return {
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    ttfb: perfData.responseStart - perfData.requestStart,
    download: perfData.responseEnd - perfData.responseStart,
    domInteractive: perfData.domInteractive - perfData.fetchStart,
    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
    loadComplete: perfData.loadEventEnd - perfData.fetchStart,
  };
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks(): void {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
            });

            // Send to Sentry
            if (window.Sentry) {
              window.Sentry.captureMessage('Long Task Detected', {
                level: 'warning',
                tags: { duration: entry.duration },
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      logger.error('Failed to monitor long tasks', error);
    }
  }
}

// Global type augmentation for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    Sentry?: any;
  }
}
