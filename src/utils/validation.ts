// src/utils/validation.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Validate and sanitize journal entry text
 */
export const validateJournalText = (text: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, sanitized: '', error: 'Text is required' };
  }

  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Text cannot be empty' };
  }

  if (trimmed.length > 10000) {
    return { isValid: false, sanitized: trimmed, error: 'Text exceeds maximum length of 10,000 characters' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, sanitized: sanitizeHtml(trimmed), error: 'Text contains potentially unsafe content' };
    }
  }

  return { isValid: true, sanitized: sanitizeHtml(trimmed) };
};

/**
 * Validate image file for upload
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid image format. Allowed: JPEG, PNG, WebP, GIF' };
  }

  // Additional security check for file content
  return new Promise<{ isValid: boolean; error?: string }>((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Check file signatures (magic numbers)
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46],
      };

      let isValidSignature = false;
      
      for (const [, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => arr[index] === byte)) {
          isValidSignature = true;
          break;
        }
      }

      if (!isValidSignature) {
        resolve({ isValid: false, error: 'File content does not match image format' });
      } else {
        resolve({ isValid: true });
      }
    };

    reader.onerror = () => {
      resolve({ isValid: false, error: 'Failed to read file' });
    };

    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Validate mood value
 */
export const validateMood = (mood: any): boolean => {
  return typeof mood === 'number' && mood >= 1 && mood <= 5 && Number.isInteger(mood);
};

/**
 * Validate energy value
 */
export const validateEnergy = (energy: any): boolean => {
  return typeof energy === 'number' && energy >= 0 && energy <= 100 && Number.isInteger(energy);
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts = new Map<string, number[]>();
  
  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    // Cleanup old entries
    this.cleanup();
    
    return true;
  }

  private cleanup() {
    const now = Date.now();
    
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}

// Create rate limiter instances
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
export const authRateLimiter = new RateLimiter(5, 300000); // 5 attempts per 5 minutes
