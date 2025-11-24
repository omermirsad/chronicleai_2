import type { Page } from '@playwright/test';

/**
 * E2E Test Helper Utilities
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Take a full page screenshot
 */
export async function takeFullPageScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, selector);
}

/**
 * Get Web Vitals metrics
 */
export async function getWebVitals(page: Page): Promise<Record<string, number>> {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: Record<string, number> = {};

      // Get performance metrics
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        metrics.TTFB = perfData.responseStart - perfData.requestStart;
        metrics.DOMContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
        metrics.LoadComplete = perfData.loadEventEnd - perfData.loadEventStart;
      }

      setTimeout(() => resolve(metrics), 1000);
    });
  });
}

/**
 * Check for console errors
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any
): Promise<void> {
  await page.route(url, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
