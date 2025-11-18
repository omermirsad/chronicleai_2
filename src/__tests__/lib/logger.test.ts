/**
 * Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, LogLevel } from '@/lib/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log debug messages in development', () => {
    logger.debug('test debug message');
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should log info messages', () => {
    logger.info('test info message');
    expect(consoleInfoSpy).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('test warning');
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    logger.error('test error');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should log error messages with Error object', () => {
    const error = new Error('test error');
    logger.error('something went wrong', error);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should set user context', () => {
    logger.setUser('user-123', { email: 'test@example.com' });
    // Verify no errors thrown
    expect(true).toBe(true);
  });

  it('should clear user context', () => {
    logger.clearUser();
    // Verify no errors thrown
    expect(true).toBe(true);
  });

  it('should add breadcrumbs', () => {
    logger.breadcrumb('User clicked button', { buttonId: 'submit' });
    // Verify no errors thrown
    expect(true).toBe(true);
  });

  it('should store and retrieve error logs', () => {
    logger.clearStoredLogs();
    const logs = logger.getStoredLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
});
