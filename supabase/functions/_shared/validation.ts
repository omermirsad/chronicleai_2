/**
 * Validation utilities for Supabase Edge Functions
 * Lightweight validation without external dependencies
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * UUID validation
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * URL validation
 */
export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate AI analysis request
 */
export interface AIPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface AIAnalysisRequest {
  parts: AIPart[];
  config?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export function validateAIAnalysisRequest(data: any): ValidationResult<AIAnalysisRequest> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['Request body must be an object'] };
  }

  if (!Array.isArray(data.parts)) {
    errors.push("'parts' must be an array");
  } else {
    if (data.parts.length === 0) {
      errors.push("'parts' array cannot be empty");
    }
    if (data.parts.length > 10) {
      errors.push("'parts' array cannot exceed 10 items");
    }

    // Validate each part
    data.parts.forEach((part: any, index: number) => {
      if (typeof part !== 'object' || part === null) {
        errors.push(`Part at index ${index} must be an object`);
        return;
      }

      if (!part.text && !part.inlineData) {
        errors.push(`Part at index ${index} must have either 'text' or 'inlineData'`);
      }

      if (part.text && typeof part.text !== 'string') {
        errors.push(`Part at index ${index}: 'text' must be a string`);
      }

      if (part.inlineData) {
        if (typeof part.inlineData !== 'object') {
          errors.push(`Part at index ${index}: 'inlineData' must be an object`);
        } else {
          if (typeof part.inlineData.mimeType !== 'string') {
            errors.push(`Part at index ${index}: 'inlineData.mimeType' must be a string`);
          }
          if (typeof part.inlineData.data !== 'string') {
            errors.push(`Part at index ${index}: 'inlineData.data' must be a string`);
          }
        }
      }
    });
  }

  if (data.config !== undefined) {
    if (typeof data.config !== 'object' || data.config === null) {
      errors.push("'config' must be an object");
    } else {
      if (data.config.temperature !== undefined) {
        if (typeof data.config.temperature !== 'number' ||
            data.config.temperature < 0 ||
            data.config.temperature > 2) {
          errors.push("'config.temperature' must be a number between 0 and 2");
        }
      }
      if (data.config.maxTokens !== undefined) {
        if (typeof data.config.maxTokens !== 'number' ||
            !Number.isInteger(data.config.maxTokens) ||
            data.config.maxTokens < 1 ||
            data.config.maxTokens > 8192) {
          errors.push("'config.maxTokens' must be an integer between 1 and 8192");
        }
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: data as AIAnalysisRequest };
}

/**
 * Validate email request
 */
export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export function validateEmailRequest(data: any): ValidationResult<EmailRequest> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['Request body must be an object'] };
  }

  // Validate 'to'
  if (!data.to || typeof data.to !== 'string') {
    errors.push("'to' is required and must be a string");
  } else if (!validateEmail(data.to)) {
    errors.push("'to' must be a valid email address");
  }

  // Validate 'subject'
  if (!data.subject || typeof data.subject !== 'string') {
    errors.push("'subject' is required and must be a string");
  } else {
    if (data.subject.trim().length === 0) {
      errors.push("'subject' cannot be empty");
    }
    if (data.subject.length > 200) {
      errors.push("'subject' cannot exceed 200 characters");
    }
  }

  // Validate 'html'
  if (!data.html || typeof data.html !== 'string') {
    errors.push("'html' is required and must be a string");
  } else {
    if (data.html.trim().length === 0) {
      errors.push("'html' cannot be empty");
    }
    if (data.html.length > 100000) {
      errors.push("'html' cannot exceed 100,000 characters");
    }
  }

  // Validate 'from' if provided
  if (data.from !== undefined) {
    if (typeof data.from !== 'string') {
      errors.push("'from' must be a string");
    } else if (!validateEmail(data.from.replace(/^.*<(.+)>$/, '$1'))) {
      errors.push("'from' must contain a valid email address");
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: data as EmailRequest };
}

/**
 * Validate checkout session request
 */
export interface CheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export function validateCheckoutSessionRequest(data: any): ValidationResult<CheckoutSessionRequest> {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { success: false, errors: ['Request body must be an object'] };
  }

  // Validate priceId
  if (!data.priceId || typeof data.priceId !== 'string') {
    errors.push("'priceId' is required and must be a string");
  } else if (!data.priceId.startsWith('price_')) {
    errors.push("'priceId' must be a valid Stripe price ID (starts with 'price_')");
  }

  // Validate successUrl
  if (!data.successUrl || typeof data.successUrl !== 'string') {
    errors.push("'successUrl' is required and must be a string");
  } else if (!validateURL(data.successUrl)) {
    errors.push("'successUrl' must be a valid HTTP(S) URL");
  }

  // Validate cancelUrl
  if (!data.cancelUrl || typeof data.cancelUrl !== 'string') {
    errors.push("'cancelUrl' is required and must be a string");
  } else if (!validateURL(data.cancelUrl)) {
    errors.push("'cancelUrl' must be a valid HTTP(S) URL");
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: data as CheckoutSessionRequest };
}

/**
 * Sanitize HTML to prevent XSS in emails
 */
export function sanitizeHtmlBasic(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Validate string length
 */
export function validateStringLength(
  str: string,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (str.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  if (str.length > max) {
    return `${fieldName} cannot exceed ${max} characters`;
  }
  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  num: number,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (num > max) {
    return `${fieldName} cannot exceed ${max}`;
  }
  return null;
}
