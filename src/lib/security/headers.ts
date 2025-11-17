/**
 * Security Headers Configuration
 * Facebook/Meta-level security standards
 */

export interface SecurityHeaders {
  'Content-Security-Policy'?: string;
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'Referrer-Policy'?: string;
  'Permissions-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'X-XSS-Protection'?: string;
}

/**
 * Generate Content Security Policy
 */
export function generateCSP(): string {
  const isDev = import.meta.env.DEV;

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      isDev ? "'unsafe-eval'" : '', // Vite HMR in dev
      isDev ? "'unsafe-inline'" : '', // Vite HMR in dev
      'https://cdn.jsdelivr.net', // CDNs if needed
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components/CSS-in-JS
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      import.meta.env.VITE_SUPABASE_URL,
    ].filter(Boolean),
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      import.meta.env.VITE_SUPABASE_URL,
      'https://generativelanguage.googleapis.com', // Gemini API
      'https://*.sentry.io', // Sentry
      isDev ? 'ws://localhost:*' : '', // Vite HMR
      isDev ? 'http://localhost:*' : '', // Vite dev server
    ].filter(Boolean),
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': !isDev ? [] : undefined,
  };

  return Object.entries(directives)
    .filter(([_, values]) => values !== undefined)
    .map(([key, values]) => {
      if (Array.isArray(values) && values.length === 0) {
        return key;
      }
      return `${key} ${Array.isArray(values) ? values.join(' ') : values}`;
    })
    .join('; ');
}

/**
 * Get all security headers
 */
export function getSecurityHeaders(): SecurityHeaders {
  const isProd = import.meta.env.PROD;

  return {
    'Content-Security-Policy': generateCSP(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'geolocation=(self)',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=(self)', // Allow for voice input
      'payment=()',
      'usb=()',
    ].join(', '),
    ...(isProd && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
    'X-XSS-Protection': '1; mode=block',
  };
}

/**
 * Apply security headers to meta tags (for client-side)
 */
export function applySecurityHeaders(): void {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([name, value]) => {
    if (value) {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = value;
      document.head.appendChild(meta);
    }
  });
}

/**
 * Validate external URLs before navigation
 */
export function isAllowedExternalUrl(url: string): boolean {
  const allowedDomains = [
    'github.com',
    'google.com',
    'supabase.co',
    'vercel.app',
    'netlify.app',
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.some((domain) => urlObj.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate and sanitize HTML
 */
export function sanitizeHtml(html: string): string {
  // Use DOMPurify for production HTML sanitization
  if (typeof window !== 'undefined' && (window as any).DOMPurify) {
    return (window as any).DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }

  // Fallback: strip all HTML
  return sanitizeInput(html);
}
