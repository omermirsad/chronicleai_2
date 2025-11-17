/**
 * Client-Side Rate Limiter (UX Feature)
 *
 * IMPORTANT: This is NOT a security feature. Client-side rate limiting can be
 * easily bypassed by malicious users. This is purely for UX to prevent accidental
 * button spamming and provide user feedback.
 *
 * Real security rate limiting is implemented server-side in the Supabase Edge Functions.
 */

import { logger } from '../utils/logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every minute
    if (typeof window !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  /**
   * Check if request is allowed under rate limit
   */
  check(key: string, config: RateLimitConfig): boolean {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const now = Date.now();

    const entry = this.storage.get(fullKey);

    if (!entry) {
      // First request
      this.storage.set(fullKey, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Check if window has expired
    if (now >= entry.resetTime) {
      // Reset the counter
      this.storage.set(fullKey, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded:', {
        key: fullKey,
        count: entry.count,
        limit: config.maxRequests,
      });
      return false;
    }

    // Increment counter
    entry.count++;
    this.storage.set(fullKey, entry);
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string, config: RateLimitConfig): number {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const entry = this.storage.get(fullKey);

    if (!entry) {
      return config.maxRequests;
    }

    const now = Date.now();

    if (now >= entry.resetTime) {
      return config.maxRequests;
    }

    return Math.max(0, config.maxRequests - entry.count);
  }

  /**
   * Get time until reset (in milliseconds)
   */
  getResetTime(key: string, config: RateLimitConfig): number {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const entry = this.storage.get(fullKey);

    if (!entry) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Manually reset rate limit for a key
   */
  reset(key: string, keyPrefix?: string): void {
    const fullKey = keyPrefix ? `${keyPrefix}:${key}` : key;
    this.storage.delete(fullKey);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.storage.entries()) {
      if (now >= entry.resetTime) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.storage.delete(key);
    }

    if (toDelete.length > 0) {
      logger.debug(`Rate limiter: cleaned up ${toDelete.length} expired entries`);
    }
  }

  /**
   * Destroy the rate limiter (cleanup)
   */
  destroy(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.storage.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  AI_REQUESTS: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'ai',
  },
  API_REQUESTS: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api',
  },
  PHOTO_UPLOADS: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'upload',
  },
  AUTH_ATTEMPTS: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth',
  },
} as const;

/**
 * Helper to check rate limit and throw error if exceeded
 */
export function enforceRateLimit(
  key: string,
  config: RateLimitConfig,
  errorMessage?: string
): void {
  const allowed = rateLimiter.check(key, config);

  if (!allowed) {
    const resetTime = rateLimiter.getResetTime(key, config);
    const resetMinutes = Math.ceil(resetTime / 60000);

    throw new Error(
      errorMessage ||
      `Rate limit exceeded. Please try again in ${resetMinutes} minute${resetMinutes !== 1 ? 's' : ''}.`
    );
  }
}

/**
 * Decorator for rate-limited functions
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string,
  config: RateLimitConfig
): T {
  return ((...args: Parameters<T>) => {
    const key = getKey(...args);
    enforceRateLimit(key, config);
    return fn(...args);
  }) as T;
}
