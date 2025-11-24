// src/services/analyticsService.ts
/**
 * Analytics Service
 * Lightweight, privacy-focused analytics tracking
 * 
 * Supports: PostHog, Plausible, or Simple Analytics
 * Enable with VITE_ENABLE_ANALYTICS=true
 */

import { config } from '../config';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class AnalyticsService {
  private isEnabled: boolean;
  private userId: string | null = null;

  constructor() {
    this.isEnabled = config.app.enableAnalytics && typeof window !== 'undefined';
  }

  /**
   * Initialize analytics (call once on app start)
   */
  init() {
    if (!this.isEnabled) {
      console.log('Analytics disabled');
      return;
    }

    // Initialize your analytics provider here
    // Example for PostHog:
    // posthog.init('YOUR_API_KEY', { api_host: 'https://app.posthog.com' })
    
    // Example for Plausible:
    // window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }
    
    console.log('Analytics initialized');
  }

  /**
   * Identify user (call after login)
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    this.userId = userId;
    
    // Example for PostHog:
    // posthog.identify(userId, traits)
    
    console.log('User identified:', userId);
  }

  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    const eventData: AnalyticsEvent = {
      name: event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
      },
    };

    // Example for PostHog:
    // posthog.capture(event, properties)
    
    // Example for Plausible:
    // window.plausible(event, { props: properties })
    
    console.log('Event tracked:', eventData);
  }

  /**
   * Track page view
   */
  page(pageName?: string) {
    if (!this.isEnabled) return;
    
    const pageData = {
      name: pageName || document.title,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
    };

    // Example for PostHog:
    // posthog.capture('$pageview')
    
    // Example for Plausible (automatic, but can be manual):
    // window.plausible('pageview')
    
    console.log('Page view:', pageData);
  }

  /**
   * Reset user (call on logout)
   */
  reset() {
    if (!this.isEnabled) return;
    
    this.userId = null;
    
    // Example for PostHog:
    // posthog.reset()
    
    console.log('Analytics reset');
  }

  /**
   * Track common user events
   */
  trackSignUp(method: 'email' | 'google' | 'github') {
    this.track('user_signed_up', { method });
  }

  trackSignIn(method: 'email' | 'google' | 'github') {
    this.track('user_signed_in', { method });
  }

  trackEntryCreated(type: 'freestyle' | 'guided', guidedType?: string) {
    this.track('entry_created', { 
      type, 
      guided_type: guidedType 
    });
  }

  trackAIFeatureUsed(feature: 'analysis' | 'perspectives' | 'insights') {
    this.track('ai_feature_used', { feature });
  }

  trackDataExport(format: 'json' | 'markdown' | 'csv') {
    this.track('data_exported', { format });
  }

  trackSubscriptionChange(from: string, to: string) {
    this.track('subscription_changed', { 
      from_tier: from, 
      to_tier: to 
    });
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      ...context,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export hook for React components
import { useEffect } from 'react';

export const usePageTracking = () => {
  useEffect(() => {
    analytics.page();
  }, []);
};

export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackSignUp: analytics.trackSignUp.bind(analytics),
    trackSignIn: analytics.trackSignIn.bind(analytics),
    trackEntryCreated: analytics.trackEntryCreated.bind(analytics),
    trackAIFeatureUsed: analytics.trackAIFeatureUsed.bind(analytics),
    trackDataExport: analytics.trackDataExport.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
  };
};