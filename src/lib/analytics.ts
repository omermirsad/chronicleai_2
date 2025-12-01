/**
 * Privacy-Compliant Analytics
 * Minimal, privacy-first analytics tracking
 *
 * No cookies, no personal data, no tracking across sites
 * Can be integrated with Plausible, Fathom, or similar privacy-focused services
 */

import { config } from '../config';
import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

interface PageView {
  url: string;
  referrer?: string;
  title?: string;
}

class Analytics {
  private enabled: boolean;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    this.enabled = config.app.enableAnalytics && import.meta.env.PROD;

    if (this.enabled) {
      logger.info('Analytics initialized');
    }
  }

  /**
   * Track a page view
   */
  trackPageView(pageView: PageView): void {
    if (!this.enabled) {
      logger.debug('Analytics disabled, skipping page view:', pageView);
      return;
    }

    // Send to analytics service
    this.sendEvent({
      name: 'pageview',
      properties: {
        url: pageView.url,
        referrer: pageView.referrer || '',
        title: pageView.title || document.title,
      },
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) {
      logger.debug('Analytics disabled, skipping event:', event);
      return;
    }

    this.sendEvent(event);
  }

  /**
   * Track user sign up (anonymous)
   */
  trackSignup(method: 'email' | 'google'): void {
    this.trackEvent({
      name: 'signup',
      properties: { method },
    });
  }

  /**
   * Track subscription upgrade
   */
  trackUpgrade(plan: 'pro' | 'premium', interval: 'monthly' | 'yearly'): void {
    this.trackEvent({
      name: 'upgrade',
      properties: { plan, interval },
    });
  }

  /**
   * Track feature usage (anonymous)
   */
  trackFeatureUse(feature: string): void {
    this.trackEvent({
      name: 'feature_use',
      properties: { feature },
    });
  }

  /**
   * Track AI request
   */
  trackAIRequest(type: 'analysis' | 'perspective' | 'insight'): void {
    this.trackEvent({
      name: 'ai_request',
      properties: { type },
    });
  }

  /**
   * Track errors (anonymous)
   */
  trackError(errorType: string, message?: string): void {
    this.trackEvent({
      name: 'error',
      properties: {
        type: errorType,
        message: message || 'Unknown error',
      },
    });
  }

  /**
   * Send event to analytics service
   */
  private sendEvent(event: AnalyticsEvent): void {
    try {
      // Option 1: Use Plausible (privacy-friendly)
      if (typeof window !== 'undefined' && (window as any).plausible) {
        (window as any).plausible(event.name, { props: event.properties });
        logger.debug('Analytics event sent (Plausible):', event);
        return;
      }

      // Option 2: Use Fathom (privacy-friendly)
      if (typeof window !== 'undefined' && (window as any).fathom) {
        (window as any).fathom.trackEvent(event.name, event.properties);
        logger.debug('Analytics event sent (Fathom):', event);
        return;
      }

      // Option 3: Use custom endpoint (build your own)
      // this.sendToCustomEndpoint(event);

      // Fallback: Log event (development/testing)
      logger.debug('Analytics event (no service configured):', event);

      // Store in queue for batching (optional)
      this.queue.push(event);

      // Limit queue size
      if (this.queue.length > 100) {
        this.queue = this.queue.slice(-100);
      }
    } catch (error) {
      logger.error('Analytics error:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Send to custom analytics endpoint (example)
   */
  private async _sendToCustomEndpoint(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: event.name,
          properties: event.properties,
          timestamp: new Date().toISOString(),
          // Add anonymous session ID (no cookies)
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      logger.error('Failed to send analytics event:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get anonymous session ID (stored in sessionStorage, not a cookie)
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';

    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('analytics_session', sessionId);
    }
    return sessionId;
  }

  /**
   * Get queued events (for debugging)
   */
  getQueue(): AnalyticsEvent[] {
    return [...this.queue];
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled && import.meta.env.PROD;
    logger.info(`Analytics ${this.enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const analytics = new Analytics();

/**
 * Hook for tracking page views in React Router
 */
export function usePageTracking(): void {
  if (typeof window === 'undefined') return;

  // Track initial page view
  analytics.trackPageView({
    url: window.location.pathname,
    referrer: document.referrer,
    title: document.title,
  });

  // Track navigation changes
  const handleNavigation = () => {
    analytics.trackPageView({
      url: window.location.pathname,
      title: document.title,
    });
  };

  window.addEventListener('navigate', handleNavigation);
  window.addEventListener('popstate', handleNavigation);

  // Note: Cleanup should be done via useEffect in component
  // This function is kept for backward compatibility
}

/**
 * Integration Examples:
 *
 * 1. Plausible.io (Recommended)
 * Add to index.html:
 * <script defer data-domain="chronicle-ai.app" src="https://plausible.io/js/script.js"></script>
 *
 * 2. Fathom Analytics
 * Add to index.html:
 * <script src="https://cdn.usefathom.com/script.js" data-site="YOUR_SITE_ID" defer></script>
 *
 * 3. Custom Analytics
 * Implement sendToCustomEndpoint() with your own backend
 */
