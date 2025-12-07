/**
 * Security Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeInput,
  isValidEmail,
  isSafeUrl,
  generateSecureRandomString,
  isProduction,
  isDevelopment,
} from '../../lib/security';

describe('Security Module', () => {
  describe('sanitizeInput', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = '"test" & \'test\'';
      const result = sanitizeInput(input);

      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle normal text without modification', () => {
      const input = 'Hello World 123';
      const result = sanitizeInput(input);

      expect(result).toBe('Hello World 123');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
    });
  });

  describe('isSafeUrl', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://example.com',
          },
        },
        writable: true,
      });
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('should accept HTTPS URLs', () => {
      expect(isSafeUrl('https://example.com/path')).toBe(true);
      expect(isSafeUrl('https://google.com')).toBe(true);
    });

    it('should accept relative URLs', () => {
      expect(isSafeUrl('/path/to/resource')).toBe(true);
      expect(isSafeUrl('/api/endpoint')).toBe(true);
    });

    it('should accept localhost for development', () => {
      expect(isSafeUrl('http://localhost:3000')).toBe(true);
      expect(isSafeUrl('http://localhost:5173')).toBe(true);
    });

    it('should reject unsafe protocols', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });
  });

  describe('generateSecureRandomString', () => {
    it('should generate string of correct length', () => {
      const result = generateSecureRandomString(16);
      expect(result.length).toBe(32); // Each byte becomes 2 hex chars
    });

    it('should generate unique strings', () => {
      const str1 = generateSecureRandomString();
      const str2 = generateSecureRandomString();

      expect(str1).not.toBe(str2);
    });

    it('should only contain hex characters', () => {
      const result = generateSecureRandomString();
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should use default length of 32 bytes (64 hex chars)', () => {
      const result = generateSecureRandomString();
      expect(result.length).toBe(64);
    });
  });

  describe('environment checks', () => {
    it('should correctly identify environment', () => {
      // In test environment, MODE is 'test'
      expect(typeof isProduction()).toBe('boolean');
      expect(typeof isDevelopment()).toBe('boolean');
    });
  });
});

describe('Security Headers', () => {
  it('should generate CSP header without errors', async () => {
    const { generateCSPHeader } = await import('../../lib/security');
    const csp = generateCSPHeader();

    expect(typeof csp).toBe('string');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('frame-ancestors');
  });

  it('should get all security headers', async () => {
    const { getSecurityHeaders } = await import('../../lib/security');
    const headers = getSecurityHeaders();

    expect(headers).toHaveProperty('Content-Security-Policy');
    expect(headers).toHaveProperty('X-Frame-Options');
    expect(headers).toHaveProperty('X-Content-Type-Options');
    expect(headers).toHaveProperty('Referrer-Policy');
    expect(headers).toHaveProperty('Strict-Transport-Security');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});
