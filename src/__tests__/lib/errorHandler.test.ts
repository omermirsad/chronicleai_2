/**
 * Error Handler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleError,
  createAppError,
  ErrorType,
  withErrorHandling,
  retryOperation,
} from '../../lib/errorHandler';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock error monitoring
vi.mock('../../lib/errorMonitoring', () => ({
  captureException: vi.fn(),
}));

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAppError', () => {
    it('should create app error from generic error', () => {
      const error = new Error('Test error');
      const appError = createAppError(error);

      expect(appError.type).toBe(ErrorType.UNKNOWN);
      expect(appError.message).toBe('Test error');
      expect(appError.originalError).toBe(error);
    });

    it('should detect network errors', () => {
      const error = new Error('Network request failed');
      const appError = createAppError(error);

      expect(appError.type).toBe(ErrorType.NETWORK);
    });

    it('should detect auth errors', () => {
      const error = new Error('Unauthorized access');
      const appError = createAppError(error);

      expect(appError.type).toBe(ErrorType.AUTH);
    });

    it('should use provided error type', () => {
      const error = new Error('Test error');
      const appError = createAppError(error, ErrorType.VALIDATION);

      expect(appError.type).toBe(ErrorType.VALIDATION);
    });

    it('should include context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      const appError = createAppError(error, ErrorType.UNKNOWN, context);

      expect(appError.context).toEqual(context);
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await withErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const result = await withErrorHandling(operation);

      expect(result).toBeNull();
    });

    it('should handle error with type', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      await withErrorHandling(operation, ErrorType.DATABASE);

      // Error should be handled (not thrown)
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed 1'))
        .mockRejectedValueOnce(new Error('Failed 2'))
        .mockResolvedValue('success');

      const result = await retryOperation(operation, { maxRetries: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const error = new Error('Permanent failure');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(
        retryOperation(operation, { maxRetries: 2, delayMs: 10 })
      ).rejects.toThrow('Permanent failure');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValue('success');

      await retryOperation(operation, { maxRetries: 2, delayMs: 10, onRetry });

      expect(onRetry).toHaveBeenCalledWith(1);
    });
  });
});
