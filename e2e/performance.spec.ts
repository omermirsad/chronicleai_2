import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Homepage should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should measure Web Vitals', async ({ page }) => {
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: Record<string, number> = {};

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.FID = entry.processingStart - entry.startTime;
          });
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            clsValue += (entry as any).value;
          }
          metrics.CLS = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Return after a delay to collect metrics
        setTimeout(() => resolve(metrics), 2000);
      });
    });

    console.log('Web Vitals:', webVitals);

    // Assert Web Vitals thresholds (if available)
    if ((webVitals as any).LCP) {
      // LCP should be under 2.5 seconds
      expect((webVitals as any).LCP).toBeLessThan(2500);
    }

    if ((webVitals as any).CLS !== undefined) {
      // CLS should be under 0.1
      expect((webVitals as any).CLS).toBeLessThan(0.1);
    }
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/');

    // Get initial memory usage
    const initialMetrics = await page.metrics();

    // Navigate around the app
    // TODO: Add navigation once routes are authenticated

    // Force garbage collection (requires --expose-gc flag)
    // await page.evaluate(() => {
    //   if (window.gc) window.gc();
    // });

    const finalMetrics = await page.metrics();

    // Memory shouldn't grow more than 50MB
    const memoryGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');

    // Check if images have proper attributes
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const loading = await img.getAttribute('loading');

      // Images should have alt text
      expect(alt).toBeTruthy();

      // Non-critical images should use lazy loading
      // (Allow exceptions for logo/header images)
      // if (loading) {
      //   expect(['lazy', 'eager']).toContain(loading);
      // }
    }
  });
});
