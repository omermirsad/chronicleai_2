// src/utils/security.ts
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Configure marked with security options
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false,
});

/**
 * Safely parse and sanitize markdown content
 */
export const parseMarkdownSafely = (markdown: string): string => {
  if (!markdown || typeof markdown !== 'string') return '';
  
  try {
    // First parse markdown
    const html = marked.parse(markdown);
    
    // Then sanitize the HTML
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      ALLOW_DATA_ATTR: false,
      FORCE_BODY: true,
      SAFE_FOR_TEMPLATES: true,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
    });
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return DOMPurify.sanitize(markdown); // Fallback to plain sanitization
  }
};

/**
 * Sanitize text input and prevent SQL injection
 */
export const sanitizeTextInput = (input: string, maxLength: number = 10000): string => {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Trim and limit length
  sanitized = sanitized.trim().substring(0, maxLength);
  
  return sanitized;
};

/**
 * Validate and sanitize tags array
 */
export const sanitizeTags = (tags: string[]): string[] => {
  if (!Array.isArray(tags)) return [];
  
  return tags
    .filter(tag => typeof tag === 'string')
    .map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''))
    .filter(tag => tag.length > 0 && tag.length <= 50)
    .slice(0, 10) // Maximum 10 tags
    .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
};

/**
 * Validate UUID format
 */
export const validateUUID = (uuid: string): boolean => {
  if (typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate mood value (1-5)
 */
export const validateMood = (mood: any): mood is number => {
  return typeof mood === 'number' && mood >= 1 && mood <= 5 && Number.isInteger(mood);
};

/**
 * Validate energy value (0-100)
 */
export const validateEnergy = (energy: any): energy is number => {
  return typeof energy === 'number' && energy >= 0 && energy <= 100 && Number.isInteger(energy);
};

/**
 * Sanitize URL for safe usage
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * CSRF token management
 */
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
  private static readonly TOKEN_LIFETIME = 3600000; // 1 hour
  
  /**
   * Generate a new CSRF token for a user
   */
  static generateToken(userId: string): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + this.TOKEN_LIFETIME;
    
    this.tokens.set(userId, { token, expires });
    
    // Clean up expired tokens
    this.cleanupExpired();
    
    return token;
  }
  
  /**
   * Validate a CSRF token
   */
  static validateToken(userId: string, token: string): boolean {
    const stored = this.tokens.get(userId);
    if (!stored) return false;
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(userId);
      return false;
    }
    
    const isValid = stored.token === token;
    if (isValid) {
      // Token is single-use, delete after validation
      this.tokens.delete(userId);
    }
    
    return isValid;
  }
  
  /**
   * Clean up expired tokens
   */
  private static cleanupExpired(): void {
    const now = Date.now();
    for (const [userId, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(userId);
      }
    }
  }
  
  /**
   * Get token for a user (if exists and valid)
   */
  static getToken(userId: string): string | null {
    const stored = this.tokens.get(userId);
    if (!stored) return null;
    
    if (Date.now() > stored.expires) {
      this.tokens.delete(userId);
      return null;
    }
    
    return stored.token;
  }
}

/**
 * Content Security Policy header generator
 */
export const generateCSPHeader = (): string => {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://aistudiocdn.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ];
  
  return directives.join('; ');
};
