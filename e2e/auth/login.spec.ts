import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check if auth UI is present
    await expect(page.locator('text=/sign in|login/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check meta tags
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /.+/
    );

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      // Test mobile-specific behavior
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(500);
    }
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('Service Worker')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should have accessible elements', async ({ page }) => {
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check for landmarks
    const mainLandmark = page.locator('main');
    await expect(mainLandmark).toBeAttached();
  });

  test.skip('should handle successful login', async ({ page }) => {
    // This test requires valid test credentials
    // TODO: Set up test authentication flow with Supabase

    // Example implementation:
    // await page.fill('input[type="email"]', 'test@example.com');
    // await page.fill('input[type="password"]', 'testpassword');
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL(/dashboard|journal/);
  });
});
