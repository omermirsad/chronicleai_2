import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  getMoodEmoji,
  truncateText,
  isValidEmail,
  generateTempId,
  safeJsonParse,
  debounce,
} from './helpers';

describe('helpers', () => {
  describe('formatDate', () => {
    it('should format a date string to human-readable format', () => {
      const dateString = '2024-01-15T14:30:00.000Z';
      const result = formatDate(dateString);

      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should handle different date formats', () => {
      const dateString = '2024-12-31T23:59:59.999Z';
      const result = formatDate(dateString);

      expect(result).toContain('December');
      expect(result).toContain('31');
      expect(result).toContain('2024');
    });
  });

  describe('getMoodEmoji', () => {
    it('should return correct emoji for mood 1', () => {
      expect(getMoodEmoji(1)).toBe('😠');
    });

    it('should return correct emoji for mood 2', () => {
      expect(getMoodEmoji(2)).toBe('😟');
    });

    it('should return correct emoji for mood 3', () => {
      expect(getMoodEmoji(3)).toBe('😐');
    });

    it('should return correct emoji for mood 4', () => {
      expect(getMoodEmoji(4)).toBe('🙂');
    });

    it('should return correct emoji for mood 5', () => {
      expect(getMoodEmoji(5)).toBe('😄');
    });

    it('should return neutral emoji for invalid mood', () => {
      expect(getMoodEmoji(0)).toBe('😐');
      expect(getMoodEmoji(6)).toBe('😐');
      expect(getMoodEmoji(-1)).toBe('😐');
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);

      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);

      expect(result).toBe('Short text');
    });

    it('should not truncate text equal to maxLength', () => {
      const text = 'Exactly twenty chars';
      const result = truncateText(text, 20);

      expect(result).toBe('Exactly twenty chars');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user name@domain.com')).toBe(false);
    });
  });

  describe('generateTempId', () => {
    it('should generate a temporary ID', () => {
      const id = generateTempId();

      expect(id).toMatch(/^temp-\d+-[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateTempId();
      const id2 = generateTempId();

      expect(id1).not.toBe(id2);
    });

    it('should start with "temp-"', () => {
      const id = generateTempId();

      expect(id.startsWith('temp-')).toBe(true);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const json = '{"name":"test","value":42}';
      const result = safeJsonParse(json, {});

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return fallback for invalid JSON', () => {
      const json = '{invalid json}';
      const fallback = { error: true };
      const result = safeJsonParse(json, fallback);

      expect(result).toEqual(fallback);
    });

    it('should handle arrays', () => {
      const json = '[1,2,3]';
      const result = safeJsonParse(json, []);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should return fallback for empty string', () => {
      const json = '';
      const fallback = null;
      const result = safeJsonParse(json, fallback);

      expect(result).toBeNull();
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('test1');
      debouncedFunc('test2');
      debouncedFunc('test3');

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('test3');
    });

    it('should call function after wait time', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 200);

      debouncedFunc('test');

      vi.advanceTimersByTime(199);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('test');
    });

    it('should reset timer on subsequent calls', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('test1');
      vi.advanceTimersByTime(50);

      debouncedFunc('test2');
      vi.advanceTimersByTime(50);

      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func).toHaveBeenCalledWith('test2');
    });

    it('should handle multiple arguments', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 100);

      debouncedFunc('arg1', 'arg2', 'arg3');

      vi.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });
  });
});
