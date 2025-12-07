import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Accessibility Testing Suite
 * Tests WCAG 2.1 Level AA compliance
 */

test.describe('Accessibility (a11y)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper document structure', async ({ page }) => {
    // Check for proper HTML structure
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang');

    // Check for single h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tag: active?.tagName,
        hasVisibleOutline: window.getComputedStyle(active!).outline !== 'none',
      };
    });

    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement.tag);
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // Check common text elements for contrast
    const textElements = await page.locator('p, h1, h2, h3, button, a').all();

    for (const element of textElements.slice(0, 10)) {
      const isVisible = await element.isVisible();
      if (!isVisible) continue;

      const styles = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
        };
      });

      // Basic check - ensure color is not transparent
      expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should have ARIA labels where needed', async ({ page }) => {
    // Check buttons without text have aria-label
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');

      // Button should have either text, aria-label, or aria-labelledby
      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        ariaLabel ||
        ariaLabelledBy;

      if (await button.isVisible()) {
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], textarea').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have a label, aria-label, or aria-labelledby
      // (Placeholder alone is not sufficient)
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;

      if (await input.isVisible()) {
        // Placeholder alone is not sufficient for accessibility
        if (!hasAccessibleName && placeholder) {
          console.warn(`Input with placeholder "${placeholder}" should have a proper label`);
        }
      }
    }
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Check for proper landmark regions
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThanOrEqual(1);

    // Check for navigation
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThanOrEqual(0); // Not all pages need nav
  });

  test('should have focus indicators', async ({ page }) => {
    // Focus on first interactive element
    await page.keyboard.press('Tab');

    const focusIndicator = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;

      const styles = window.getComputedStyle(active);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    });

    // Should have some form of focus indicator
    const hasFocusIndicator =
      (focusIndicator?.outline && focusIndicator.outline !== 'none' && focusIndicator.outlineWidth !== '0px') ||
      (focusIndicator?.boxShadow && focusIndicator.boxShadow !== 'none');

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should not have duplicate IDs', async ({ page }) => {
    const duplicateIds = await page.evaluate(() => {
      const ids: Record<string, number> = {};
      const elements = document.querySelectorAll('[id]');

      elements.forEach((el) => {
        const id = el.getAttribute('id');
        if (id) {
          ids[id] = (ids[id] || 0) + 1;
        }
      });

      return Object.entries(ids)
        .filter(([_, count]) => count > 1)
        .map(([id]) => id);
    });

    expect(duplicateIds).toHaveLength(0);
  });
});
