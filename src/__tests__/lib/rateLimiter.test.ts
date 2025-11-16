/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimiter, RATE_LIMITS, enforceRateLimit } from '../../lib/rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset rate limiter before each test
    rateLimiter.reset('test-key');
  });

  afterEach(() => {
    rateLimiter.reset('test-key');
  });

  it('should allow requests within limit', () => {
    const config = { maxRequests: 3, windowMs: 60000 };

    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const config = { maxRequests: 2, windowMs: 60000 };

    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(false);
  });

  it('should return correct remaining count', () => {
    const config = { maxRequests: 5, windowMs: 60000 };

    expect(rateLimiter.getRemaining('test-key', config)).toBe(5);
    rateLimiter.check('test-key', config);
    expect(rateLimiter.getRemaining('test-key', config)).toBe(4);
    rateLimiter.check('test-key', config);
    expect(rateLimiter.getRemaining('test-key', config)).toBe(3);
  });

  it('should reset after window expires', async () => {
    const config = { maxRequests: 1, windowMs: 100 }; // 100ms window

    expect(rateLimiter.check('test-key', config)).toBe(true);
    expect(rateLimiter.check('test-key', config)).toBe(false);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(rateLimiter.check('test-key', config)).toBe(true);
  });

  it('should handle different keys independently', () => {
    const config = { maxRequests: 1, windowMs: 60000 };

    expect(rateLimiter.check('key1', config)).toBe(true);
    expect(rateLimiter.check('key2', config)).toBe(true);
    expect(rateLimiter.check('key1', config)).toBe(false);
    expect(rateLimiter.check('key2', config)).toBe(false);
  });

  it('should use key prefix correctly', () => {
    const config = { maxRequests: 1, windowMs: 60000, keyPrefix: 'api' };

    expect(rateLimiter.check('test', config)).toBe(true);
    expect(rateLimiter.check('test', config)).toBe(false);

    // Without prefix should be different
    expect(rateLimiter.check('test', { maxRequests: 1, windowMs: 60000 })).toBe(true);
  });

  it('should enforce rate limit and throw error', () => {
    const config = { maxRequests: 1, windowMs: 60000 };

    expect(() => enforceRateLimit('test-key', config)).not.toThrow();
    expect(() => enforceRateLimit('test-key', config)).toThrow('Rate limit exceeded');
  });

  it('should include reset time in error message', () => {
    const config = { maxRequests: 1, windowMs: 60000 };

    rateLimiter.check('test-key', config);

    try {
      enforceRateLimit('test-key', config);
      expect.fail('Should have thrown error');
    } catch (error: any) {
      expect(error.message).toContain('minute');
    }
  });
});

describe('RATE_LIMITS constants', () => {
  it('should have AI requests limit', () => {
    expect(RATE_LIMITS.AI_REQUESTS).toBeDefined();
    expect(RATE_LIMITS.AI_REQUESTS.maxRequests).toBe(10);
    expect(RATE_LIMITS.AI_REQUESTS.windowMs).toBe(60000);
  });

  it('should have API requests limit', () => {
    expect(RATE_LIMITS.API_REQUESTS).toBeDefined();
    expect(RATE_LIMITS.API_REQUESTS.maxRequests).toBe(100);
  });

  it('should have photo upload limit', () => {
    expect(RATE_LIMITS.PHOTO_UPLOADS).toBeDefined();
    expect(RATE_LIMITS.PHOTO_UPLOADS.maxRequests).toBe(10);
  });

  it('should have auth attempts limit', () => {
    expect(RATE_LIMITS.AUTH_ATTEMPTS).toBeDefined();
    expect(RATE_LIMITS.AUTH_ATTEMPTS.maxRequests).toBe(5);
  });
});
