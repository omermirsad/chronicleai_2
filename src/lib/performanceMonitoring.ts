/**
 * Performance Monitoring Utilities
 * Tracks and reports application performance metrics
 */

import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;

  /**
   * Mark the start of an operation
   */
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * Mark the end of an operation and record the duration
   */
  endMeasure(name: string): number | null {
    if (typeof performance === 'undefined') {
      return null;
    }

    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measure = performance.getEntriesByName(name)[0] as PerformanceEntry;
      const duration = measure.duration;

      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      });

      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);

      logger.debug(`Performance: ${name} took ${duration.toFixed(2)}ms`);

      return duration;
    } catch (error) {
      logger.error('Performance measurement error:', error);
      return null;
    }
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.startMeasure(name);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(name: string, operation: () => T): T {
    this.startMeasure(name);
    try {
      return operation();
    } finally {
      this.endMeasure(name);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Send to Sentry in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      Sentry.metrics.distribution(metric.name, metric.value, {
        unit: metric.unit as any,
      });
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average metric value by name
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Monitor Web Vitals (Core Web Vitals)
   */
  monitorWebVitals(): void {
    if (typeof window === 'undefined') return;

    // LCP (Largest Contentful Paint)
    this.observePerformanceEntry('largest-contentful-paint', (entry: any) => {
      this.recordMetric({
        name: 'LCP',
        value: entry.renderTime || entry.loadTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    });

    // FID (First Input Delay)
    this.observePerformanceEntry('first-input', (entry: any) => {
      this.recordMetric({
        name: 'FID',
        value: entry.processingStart - entry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
      });
    });

    // CLS (Cumulative Layout Shift)
    this.observePerformanceEntry('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        this.recordMetric({
          name: 'CLS',
          value: entry.value,
          unit: 'score',
          timestamp: Date.now(),
        });
      }
    });

    // TTFB (Time to First Byte)
    if (window.performance && window.performance.timing) {
      const navigation = window.performance.timing;
      const ttfb = navigation.responseStart - navigation.requestStart;

      this.recordMetric({
        name: 'TTFB',
        value: ttfb,
        unit: 'ms',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Observe performance entries
   */
  private observePerformanceEntry(
    type: string,
    callback: (entry: PerformanceEntry) => void
  ): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ type, buffered: true });
    } catch (error) {
      // PerformanceObserver not supported
      logger.debug('PerformanceObserver not supported for type:', type);
    }
  }

  /**
   * Get page load time
   */
  getPageLoadTime(): number | null {
    if (typeof window === 'undefined' || !window.performance) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return navigation.loadEventEnd - navigation.fetchStart;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const report: string[] = ['=== Performance Report ===\n'];

    const metricNames = [...new Set(this.metrics.map(m => m.name))];

    for (const name of metricNames) {
      const metrics = this.getMetricsByName(name);
      const avg = this.getAverageMetric(name);
      const min = Math.min(...metrics.map(m => m.value));
      const max = Math.max(...metrics.map(m => m.value));
      const unit = metrics[0]?.unit || '';

      report.push(
        `${name}:\n` +
        `  Average: ${avg?.toFixed(2)}${unit}\n` +
        `  Min: ${min.toFixed(2)}${unit}\n` +
        `  Max: ${max.toFixed(2)}${unit}\n` +
        `  Count: ${metrics.length}\n`
      );
    }

    const pageLoad = this.getPageLoadTime();
    if (pageLoad) {
      report.push(`Page Load Time: ${pageLoad.toFixed(2)}ms\n`);
    }

    return report.join('\n');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize Web Vitals monitoring
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  performanceMonitor.monitorWebVitals();
}
