/**
 * Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../utils/logger';

describe('Logger', () => {
  let consoleLogSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

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

  it('should log API calls with method and endpoint', () => {
    logger.api('GET', '/api/test', { foo: 'bar' });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.stringContaining('GET'),
      expect.stringContaining('/api/test'),
      expect.anything()
    );
  });
});
