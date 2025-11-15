import { describe, it, expect } from 'vitest';
import {
  journalEntrySchema,
  aiAnalysisRequestSchema,
  emailSchema,
  checkoutSessionSchema,
  userIdSchema,
  paginationSchema,
  searchFiltersSchema,
  fileUploadSchema,
  sanitizeHtml,
  validateInput,
  safeValidateInput,
} from './validation';

describe('validation', () => {
  describe('journalEntrySchema', () => {
    it('should validate valid journal entry', () => {
      const entry = {
        text: 'This is a test entry',
        mood: 4,
        energy: 75,
        tags: ['test', 'work'],
        date: new Date().toISOString(),
      };

      const result = journalEntrySchema.parse(entry);
      expect(result).toEqual(entry);
    });

    it('should require text field', () => {
      const entry = { mood: 4 };

      expect(() => journalEntrySchema.parse(entry)).toThrow();
    });

    it('should reject empty text', () => {
      const entry = { text: '' };

      expect(() => journalEntrySchema.parse(entry)).toThrow('Entry text cannot be empty');
    });

    it('should reject text longer than 50000 characters', () => {
      const entry = { text: 'a'.repeat(50001) };

      expect(() => journalEntrySchema.parse(entry)).toThrow(
        'Entry text cannot exceed 50,000 characters'
      );
    });

    it('should validate mood range', () => {
      expect(() => journalEntrySchema.parse({ text: 'test', mood: 0 })).toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', mood: 6 })).toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', mood: 1 })).not.toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', mood: 5 })).not.toThrow();
    });

    it('should validate energy range', () => {
      expect(() => journalEntrySchema.parse({ text: 'test', energy: -1 })).toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', energy: 101 })).toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', energy: 0 })).not.toThrow();
      expect(() => journalEntrySchema.parse({ text: 'test', energy: 100 })).not.toThrow();
    });

    it('should validate tags', () => {
      const validEntry = { text: 'test', tags: ['tag1', 'tag2'] };
      expect(() => journalEntrySchema.parse(validEntry)).not.toThrow();

      const tooManyTags = { text: 'test', tags: Array(21).fill('tag') };
      expect(() => journalEntrySchema.parse(tooManyTags)).toThrow(
        'Cannot have more than 20 tags'
      );

      const longTag = { text: 'test', tags: ['a'.repeat(51)] };
      expect(() => journalEntrySchema.parse(longTag)).toThrow();
    });

    it('should trim whitespace from text', () => {
      const entry = { text: '  test  ' };
      const result = journalEntrySchema.parse(entry);

      expect(result.text).toBe('test');
    });
  });

  describe('aiAnalysisRequestSchema', () => {
    it('should validate valid AI request', () => {
      const request = {
        parts: [{ text: 'Analyze this' }],
        config: { temperature: 0.7, maxTokens: 1000 },
      };

      const result = aiAnalysisRequestSchema.parse(request);
      expect(result).toEqual(request);
    });

    it('should require at least one part', () => {
      const request = { parts: [] };

      expect(() => aiAnalysisRequestSchema.parse(request)).toThrow(
        'At least one part is required'
      );
    });

    it('should limit parts to 10', () => {
      const request = { parts: Array(11).fill({ text: 'test' }) };

      expect(() => aiAnalysisRequestSchema.parse(request)).toThrow('Cannot exceed 10 parts');
    });

    it('should validate temperature range', () => {
      const invalidLow = { parts: [{ text: 'test' }], config: { temperature: -0.1 } };
      const invalidHigh = { parts: [{ text: 'test' }], config: { temperature: 2.1 } };

      expect(() => aiAnalysisRequestSchema.parse(invalidLow)).toThrow();
      expect(() => aiAnalysisRequestSchema.parse(invalidHigh)).toThrow();
    });
  });

  describe('emailSchema', () => {
    it('should validate valid email', () => {
      const email = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      const result = emailSchema.parse(email);
      expect(result).toEqual(email);
    });

    it('should reject invalid email addresses', () => {
      const email = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      };

      expect(() => emailSchema.parse(email)).toThrow('Invalid email address');
    });

    it('should reject empty subject', () => {
      const email = {
        to: 'test@example.com',
        subject: '',
        html: '<p>Test</p>',
      };

      expect(() => emailSchema.parse(email)).toThrow('Subject cannot be empty');
    });

    it('should validate optional from field', () => {
      const email = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        from: 'sender@example.com',
      };

      const result = emailSchema.parse(email);
      expect(result.from).toBe('sender@example.com');
    });
  });

  describe('checkoutSessionSchema', () => {
    it('should validate valid checkout session', () => {
      const session = {
        priceId: 'price_1234567890',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      const result = checkoutSessionSchema.parse(session);
      expect(result).toEqual(session);
    });

    it('should require priceId to start with "price_"', () => {
      const session = {
        priceId: 'invalid_1234',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };

      expect(() => checkoutSessionSchema.parse(session)).toThrow(
        'Invalid Stripe price ID format'
      );
    });

    it('should validate URLs', () => {
      const session = {
        priceId: 'price_1234',
        successUrl: 'not-a-url',
        cancelUrl: 'https://example.com/cancel',
      };

      expect(() => checkoutSessionSchema.parse(session)).toThrow();
    });
  });

  describe('userIdSchema', () => {
    it('should validate valid UUID', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';

      const result = userIdSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUID', () => {
      const invalidUuid = 'not-a-uuid';

      expect(() => userIdSchema.parse(invalidUuid)).toThrow('Invalid user ID format');
    });
  });

  describe('paginationSchema', () => {
    it('should validate valid pagination', () => {
      const pagination = { limit: 50, offset: 20 };

      const result = paginationSchema.parse(pagination);
      expect(result).toEqual(pagination);
    });

    it('should use default values', () => {
      const result = paginationSchema.parse({});

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should reject limit > 100', () => {
      const pagination = { limit: 101, offset: 0 };

      expect(() => paginationSchema.parse(pagination)).toThrow('Limit cannot exceed 100');
    });

    it('should reject negative offset', () => {
      const pagination = { limit: 20, offset: -1 };

      expect(() => paginationSchema.parse(pagination)).toThrow('Offset must be non-negative');
    });
  });

  describe('searchFiltersSchema', () => {
    it('should validate valid filters', () => {
      const filters = {
        search: 'test query',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        tags: ['work', 'personal'],
        mood: 4,
      };

      const result = searchFiltersSchema.parse(filters);
      expect(result).toEqual(filters);
    });

    it('should allow empty filters', () => {
      const result = searchFiltersSchema.parse({});

      expect(result).toEqual({});
    });

    it('should reject too many tags', () => {
      const filters = { tags: Array(11).fill('tag') };

      expect(() => searchFiltersSchema.parse(filters)).toThrow(
        'Cannot filter by more than 10 tags'
      );
    });

    it('should validate mood range', () => {
      expect(() => searchFiltersSchema.parse({ mood: 0 })).toThrow();
      expect(() => searchFiltersSchema.parse({ mood: 6 })).toThrow();
      expect(() => searchFiltersSchema.parse({ mood: 3 })).not.toThrow();
    });
  });

  describe('fileUploadSchema', () => {
    it('should validate valid file upload', () => {
      const file = {
        name: 'test.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
      };

      const result = fileUploadSchema.parse(file);
      expect(result).toEqual(file);
    });

    it('should reject files larger than 10MB', () => {
      const file = {
        name: 'large.jpg',
        size: 11 * 1024 * 1024,
        type: 'image/jpeg',
      };

      expect(() => fileUploadSchema.parse(file)).toThrow('File size cannot exceed 10MB');
    });

    it('should reject invalid file types', () => {
      const file = {
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
      };

      expect(() => fileUploadSchema.parse(file)).toThrow('Invalid file type');
    });

    it('should accept all valid image types', () => {
      const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

      types.forEach((type) => {
        const file = { name: 'test.jpg', size: 1024, type };
        expect(() => fileUploadSchema.parse(file)).not.toThrow();
      });
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHtml(html);

      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const html = '<button onclick="alert(\'XSS\')">Click</button>';
      const result = sanitizeHtml(html);

      expect(result).not.toContain('onclick');
    });

    it('should handle multiple script tags', () => {
      const html = '<script>bad1</script><p>Good</p><script>bad2</script>';
      const result = sanitizeHtml(html);

      expect(result).not.toContain('bad1');
      expect(result).not.toContain('bad2');
      expect(result).toContain('Good');
    });

    it('should preserve safe HTML', () => {
      const html = '<div class="container"><p>Safe content</p></div>';
      const result = sanitizeHtml(html);

      expect(result).toBe(html);
    });
  });

  describe('validateInput', () => {
    it('should validate and return data', () => {
      const schema = journalEntrySchema;
      const data = { text: 'Test entry' };

      const result = validateInput(schema, data);

      expect(result.text).toBe('Test entry');
    });

    it('should throw on invalid data', () => {
      const schema = journalEntrySchema;
      const data = { mood: 10 };

      expect(() => validateInput(schema, data)).toThrow();
    });
  });

  describe('safeValidateInput', () => {
    it('should return success result for valid data', () => {
      const schema = journalEntrySchema;
      const data = { text: 'Test entry' };

      const result = safeValidateInput(schema, data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('Test entry');
      }
    });

    it('should return error result for invalid data', () => {
      const schema = journalEntrySchema;
      const data = { mood: 10 };

      const result = safeValidateInput(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });
});
