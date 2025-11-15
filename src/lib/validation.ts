/**
 * Input validation schemas and utilities
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const patterns = {
  // UUID v4 pattern
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  // Email pattern (basic)
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // URL pattern
  url: /^https?:\/\/.+/,
};

/**
 * Journal entry validation schema
 */
export const journalEntrySchema = z.object({
  text: z
    .string()
    .min(1, 'Entry text cannot be empty')
    .max(50000, 'Entry text cannot exceed 50,000 characters')
    .trim(),
  mood: z
    .number()
    .int('Mood must be an integer')
    .min(1, 'Mood must be at least 1')
    .max(5, 'Mood cannot exceed 5')
    .optional(),
  energy: z
    .number()
    .int('Energy must be an integer')
    .min(0, 'Energy must be at least 0')
    .max(100, 'Energy cannot exceed 100')
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, 'Tag cannot be empty')
        .max(50, 'Tag cannot exceed 50 characters')
        .trim()
    )
    .max(20, 'Cannot have more than 20 tags')
    .optional(),
  date: z
    .string()
    .datetime('Invalid date format')
    .optional(),
});

export type JournalEntryInput = z.infer<typeof journalEntrySchema>;

/**
 * AI analysis request validation
 */
export const aiAnalysisRequestSchema = z.object({
  parts: z
    .array(
      z.object({
        text: z.string().optional(),
        inlineData: z
          .object({
            mimeType: z.string(),
            data: z.string(),
          })
          .optional(),
      })
    )
    .min(1, 'At least one part is required')
    .max(10, 'Cannot exceed 10 parts'),
  config: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().int().min(1).max(8192).optional(),
    })
    .optional(),
});

export type AIAnalysisRequest = z.infer<typeof aiAnalysisRequestSchema>;

/**
 * Email validation schema
 */
export const emailSchema = z.object({
  to: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email address too long'),
  subject: z
    .string()
    .min(1, 'Subject cannot be empty')
    .max(200, 'Subject too long')
    .trim(),
  html: z
    .string()
    .min(1, 'Email content cannot be empty')
    .max(100000, 'Email content too large'),
  from: z
    .string()
    .email('Invalid from email address')
    .max(255, 'From email address too long')
    .optional(),
});

export type EmailInput = z.infer<typeof emailSchema>;

/**
 * Stripe checkout session validation
 */
export const checkoutSessionSchema = z.object({
  priceId: z
    .string()
    .min(1, 'Price ID is required')
    .startsWith('price_', 'Invalid Stripe price ID format'),
  successUrl: z
    .string()
    .url('Invalid success URL')
    .startsWith('http', 'Success URL must be a valid HTTP(S) URL'),
  cancelUrl: z
    .string()
    .url('Invalid cancel URL')
    .startsWith('http', 'Cancel URL must be a valid HTTP(S) URL'),
});

export type CheckoutSessionInput = z.infer<typeof checkoutSessionSchema>;

/**
 * User ID validation
 */
export const userIdSchema = z
  .string()
  .uuid('Invalid user ID format');

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  offset: z
    .number()
    .int('Offset must be an integer')
    .min(0, 'Offset must be non-negative')
    .default(0),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Search/filter validation
 */
export const searchFiltersSchema = z.object({
  search: z
    .string()
    .max(200, 'Search query too long')
    .optional(),
  startDate: z
    .string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z
    .string()
    .datetime('Invalid end date format')
    .optional(),
  tags: z
    .array(z.string().max(50))
    .max(10, 'Cannot filter by more than 10 tags')
    .optional(),
  mood: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

/**
 * Sanitize HTML content to prevent XSS
 * This is a basic sanitizer - DOMPurify should be used for rendering
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
}

/**
 * Validate and sanitize user input
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Safe validate - returns result instead of throwing
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate file upload
 */
export const fileUploadSchema = z.object({
  name: z
    .string()
    .min(1, 'Filename cannot be empty')
    .max(255, 'Filename too long'),
  size: z
    .number()
    .int()
    .min(1, 'File size must be greater than 0')
    .max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  type: z
    .string()
    .refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
      'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed'
    ),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;
