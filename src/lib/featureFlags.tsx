/**
 * Feature Flags System
 * Facebook/Meta-level feature management and A/B testing
 */

import React from 'react';
import { logger } from './logger';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  metadata?: Record<string, any>;
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  userId?: string;
  userGroups?: string[];
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private userId?: string;
  private userGroups: Set<string> = new Set();
  private overrides: Map<string, boolean> = new Map();

  constructor() {
    this.loadFromLocalStorage();
    this.initializeDefaultFlags();
  }

  /**
   * Initialize default flags
   */
  private initializeDefaultFlags(): void {
    const defaultFlags: Record<string, FeatureFlag> = {
      'new-editor': {
        name: 'new-editor',
        enabled: false,
        rolloutPercentage: 0,
        metadata: { description: 'New journal editor with enhanced features' },
      },
      'ai-suggestions': {
        name: 'ai-suggestions',
        enabled: true,
        rolloutPercentage: 100,
        metadata: { description: 'AI-powered writing suggestions' },
      },
      'voice-input': {
        name: 'voice-input',
        enabled: true,
        rolloutPercentage: 100,
        metadata: { description: 'Voice-to-text input' },
      },
      'dark-mode': {
        name: 'dark-mode',
        enabled: true,
        rolloutPercentage: 100,
        metadata: { description: 'Dark mode theme' },
      },
      'analytics': {
        name: 'analytics',
        enabled: import.meta.env.PROD,
        rolloutPercentage: 100,
        metadata: { description: 'Analytics tracking' },
      },
      'performance-monitoring': {
        name: 'performance-monitoring',
        enabled: import.meta.env.PROD,
        rolloutPercentage: 100,
        metadata: { description: 'Performance monitoring' },
      },
      'experimental-features': {
        name: 'experimental-features',
        enabled: import.meta.env.DEV,
        rolloutPercentage: 0,
        metadata: { description: 'Experimental features' },
      },
    };

    Object.entries(defaultFlags).forEach(([name, flag]) => {
      if (!this.flags.has(name)) {
        this.flags.set(name, flag);
      }
    });
  }

  /**
   * Load flags from remote config (e.g., LaunchDarkly, Firebase)
   */
  async loadRemoteConfig(): Promise<void> {
    try {
      // TODO: Implement remote config loading
      // Example: LaunchDarkly, Firebase Remote Config, or custom API

      if (import.meta.env.VITE_FEATURE_FLAGS_ENDPOINT) {
        const response = await fetch(import.meta.env.VITE_FEATURE_FLAGS_ENDPOINT);
        const config: FeatureFlagConfig = await response.json();

        config.flags && this.setFlags(config.flags);

        logger.info('Feature flags loaded from remote', {
          count: Object.keys(config.flags || {}).length,
        });
      }
    } catch (error) {
      logger.error('Failed to load remote feature flags', error);
      // Fail gracefully - use defaults
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, userGroups?: string[]): void {
    this.userId = userId;

    if (userGroups) {
      this.userGroups = new Set(userGroups);
    }

    logger.breadcrumb('Feature flags user context set', { userId, userGroups });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = undefined;
    this.userGroups.clear();
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(flagName: string): boolean {
    // Check override first (for testing/debugging)
    if (this.overrides.has(flagName)) {
      return this.overrides.get(flagName)!;
    }

    const flag = this.flags.get(flagName);

    if (!flag) {
      logger.warn(`Feature flag "${flagName}" not found, defaulting to false`);
      return false;
    }

    // If explicitly disabled, return false
    if (!flag.enabled) {
      return false;
    }

    // Check user group restrictions
    if (flag.userGroups && flag.userGroups.length > 0) {
      const hasGroup = flag.userGroups.some((group) => this.userGroups.has(group));
      if (!hasGroup) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      return this.isInRollout(flagName, flag.rolloutPercentage);
    }

    return true;
  }

  /**
   * Determine if user is in rollout percentage
   * Uses deterministic hashing for consistency
   */
  private isInRollout(flagName: string, percentage: number): boolean {
    if (!this.userId) {
      // Use session-based rollout for anonymous users
      const sessionId = this.getSessionId();
      const hash = this.hashString(`${flagName}-${sessionId}`);
      return (hash % 100) < percentage;
    }

    // Use user ID for consistent rollout
    const hash = this.hashString(`${flagName}-${this.userId}`);
    return (hash % 100) < percentage;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('feature_flags_session_id');

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('feature_flags_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Override flag value (for testing/debugging)
   */
  override(flagName: string, enabled: boolean): void {
    this.overrides.set(flagName, enabled);
    this.saveToLocalStorage();

    logger.info(`Feature flag "${flagName}" overridden to ${enabled}`);
  }

  /**
   * Remove override
   */
  removeOverride(flagName: string): void {
    this.overrides.delete(flagName);
    this.saveToLocalStorage();
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
    this.saveToLocalStorage();
  }

  /**
   * Set multiple flags
   */
  setFlags(flags: Record<string, FeatureFlag>): void {
    Object.entries(flags).forEach(([name, flag]) => {
      this.flags.set(name, flag);
    });
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};

    this.flags.forEach((flag, name) => {
      result[name] = this.isEnabled(name);
    });

    return result;
  }

  /**
   * Get flag metadata
   */
  getMetadata(flagName: string): Record<string, any> | undefined {
    return this.flags.get(flagName)?.metadata;
  }

  /**
   * Save overrides to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      const overrides = Object.fromEntries(this.overrides);
      localStorage.setItem('feature_flag_overrides', JSON.stringify(overrides));
    } catch (error) {
      logger.error('Failed to save feature flag overrides', error);
    }
  }

  /**
   * Load overrides from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('feature_flag_overrides');

      if (stored) {
        const overrides = JSON.parse(stored);
        Object.entries(overrides).forEach(([name, value]) => {
          this.overrides.set(name, value as boolean);
        });
      }
    } catch (error) {
      logger.error('Failed to load feature flag overrides', error);
    }
  }

  /**
   * Track flag usage for analytics
   */
  trackUsage(flagName: string, variant: boolean): void {
    logger.breadcrumb('Feature flag used', { flagName, variant });

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'feature_flag_used', {
        flag_name: flagName,
        variant: variant ? 'enabled' : 'disabled',
      });
    }
  }
}

// Export singleton
export const featureFlags = new FeatureFlagManager();

/**
 * React hook for feature flags (to be used in React components)
 */
export function useFeatureFlag(flagName: string): boolean {
  const enabled = featureFlags.isEnabled(flagName);

  // Track usage
  featureFlags.trackUsage(flagName, enabled);

  return enabled;
}

/**
 * HOC for feature-gated components
 */
export function withFeatureFlag<P extends object>(
  flagName: string,
  Component: React.ComponentType<P>,
  Fallback?: React.ComponentType<P>
): React.ComponentType<P> {
  return (props: P) => {
    const enabled = useFeatureFlag(flagName);

    if (!enabled && Fallback) {
      return <Fallback {...props} />;
    }

    return enabled ? <Component {...props} /> : null;
  };
}

// Global type augmentation
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
