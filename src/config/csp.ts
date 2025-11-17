/**
 * Content Security Policy Configuration
 * Defines security policies for production and development
 */

export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'font-src': string[];
  'connect-src': string[];
  'frame-src': string[];
  'worker-src': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests': string[];
  'base-uri': string[];
  'object-src': string[];
}

/**
 * Production CSP - Strictest security
 */
export const productionCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    'https://accounts.google.com',
    'https://js.stripe.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind and inline styles
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:', // Base64 images
    'https:', // User avatars and external images
    'blob:', // Dynamically generated images
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://generativelanguage.googleapis.com',
    'https://accounts.google.com',
    'https://api.stripe.com',
    'https://*.sentry.io',
    'https://sentry.io',
  ],
  'frame-src': [
    'https://accounts.google.com',
    'https://js.stripe.com',
  ],
  'worker-src': [
    "'self'",
    'blob:',
  ],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
};

/**
 * Development CSP - More permissive for dev tools
 */
export const developmentCSP: CSPDirectives = {
  ...productionCSP,
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite HMR
    "'unsafe-eval'", // Required for Vite dev server
    'https://accounts.google.com',
    'https://js.stripe.com',
  ],
  'connect-src': [
    "'self'",
    'ws://localhost:*', // Vite HMR WebSocket
    'http://localhost:*', // Local API testing
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://generativelanguage.googleapis.com',
    'https://accounts.google.com',
    'https://api.stripe.com',
    'https://*.sentry.io',
    'https://sentry.io',
  ],
};

/**
 * Convert CSP directives object to CSP header string
 */
export function buildCSPHeader(directives: CSPDirectives): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key; // Directive with no values (e.g., upgrade-insecure-requests)
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Get CSP header for current environment
 */
export function getCSPHeader(): string {
  const isDev = import.meta.env.MODE === 'development';
  return buildCSPHeader(isDev ? developmentCSP : productionCSP);
}

/**
 * Additional security headers for production
 */
export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Control browser features
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

  // HTTP Strict Transport Security (HTTPS only) - 1 year
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};
