// src/lib/security.ts
/**
 * Security Utilities
 * Content Security Policy and other security-related functions
 */

import { logger } from '../utils/logger';

/**
 * Generate Content Security Policy header value
 * This should be used in your server/edge function configuration
 *
 * @returns CSP header value string
 */
export const generateCSPHeader = (): string => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseDomain = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co';

  const directives = {
    // Default fallback for all resource types
    'default-src': ["'self'"],

    // Scripts: Allow self, inline scripts (needed for Vite HMR in dev), and Google Auth
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite and some auth flows
      "'unsafe-eval'", // Required for Vite dev server
      'https://accounts.google.com',
      'https://www.gstatic.com',
    ],

    // Styles: Allow self and inline styles (Tailwind uses inline styles)
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and inline styles
      'https://fonts.googleapis.com',
    ],

    // Images: Allow self, data URIs (for base64 images), and HTTPS
    'img-src': [
      "'self'",
      'data:', // For base64-encoded images in journal entries
      'https:', // Allow any HTTPS image (user avatars, etc.)
      'blob:', // For dynamically generated images
    ],

    // Fonts: Allow self, data URIs, and Google Fonts
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],

    // AJAX/WebSocket connections
    'connect-src': [
      "'self'",
      `https://${supabaseDomain}`, // Supabase API
      `wss://${supabaseDomain}`, // Supabase Realtime WebSocket
      'https://generativelanguage.googleapis.com', // Google Gemini AI
      'https://accounts.google.com', // Google Auth
    ],

    // Frames/iframes: Only allow Google Auth
    'frame-src': [
      'https://accounts.google.com',
      'https://www.google.com',
    ],

    // Web Workers
    'worker-src': [
      "'self'",
      'blob:',
    ],

    // Form submissions
    'form-action': ["'self'"],

    // Where the page can be embedded (prevent clickjacking)
    'frame-ancestors': ["'none'"],

    // Upgrade insecure requests to HTTPS
    'upgrade-insecure-requests': [],
  };

  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key; // Directive with no values (e.g., upgrade-insecure-requests)
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

/**
 * Get all recommended security headers
 * Use these in your hosting platform configuration
 */
export const getSecurityHeaders = () => {
  return {
    // Content Security Policy
    'Content-Security-Policy': generateCSPHeader(),

    // Prevent the page from being embedded in an iframe (clickjacking protection)
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Control which browser features can be used
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

    // HTTP Strict Transport Security (HTTPS only)
    // 1 year = 31536000 seconds
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // XSS Protection (legacy, but still good to include)
    'X-XSS-Protection': '1; mode=block',
  };
};

/**
 * Sanitize user input to prevent XSS attacks
 * Use this for plain text - creates text node and returns escaped HTML
 * For rich HTML content, use DOMPurify library directly
 *
 * @param input - Raw user input string
 * @returns Sanitized string with HTML entities escaped
 */
export const sanitizeInput = (input: string): string => {
  if (typeof document === 'undefined') {
    // Server-side or non-browser environment
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a URL is safe (HTTPS or relative)
 * Prevents navigation to potentially unsafe URLs
 *
 * @param url - URL to check
 * @returns True if URL is safe
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:' && parsedUrl.hostname === 'localhost';
  } catch {
    // Relative URLs are safe
    return url.startsWith('/');
  }
};

/**
 * Rate limiting helper using localStorage
 * Prevents abuse of API endpoints
 *
 * @param key - Unique key for the rate limit (e.g., 'ai-analysis')
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if rate limit exceeded
 */
export const isRateLimited = (
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean => {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;

  try {
    const data = localStorage.getItem(storageKey);
    const attempts = data ? JSON.parse(data) : [];

    // Filter out old attempts outside the time window
    const recentAttempts = attempts.filter(
      (timestamp: number) => now - timestamp < windowMs
    );

    // Check if rate limit exceeded
    if (recentAttempts.length >= maxAttempts) {
      return true;
    }

    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify(recentAttempts));

    return false;
  } catch (error) {
    logger.error('Rate limiting error:', error);
    return false; // Fail open on error
  }
};

/**
 * Secure random string generator
 * Useful for generating CSRF tokens, nonces, etc.
 *
 * @param length - Length of the random string
 * @returns Cryptographically secure random string
 */
export const generateSecureRandomString = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if the current environment is production
 */
export const isProduction = (): boolean => {
  return import.meta.env.MODE === 'production';
};

/**
 * Check if the current environment is development
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development';
};

/**
 * Log security-related events (only in development)
 */
export const logSecurityEvent = (event: string, details?: any): void => {
  if (isDevelopment()) {
    logger.debug(`[SECURITY] ${event}`, details);
  }
};
