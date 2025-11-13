/**
 * Centralized logging utility
 * Prevents console statements in production and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enableInProduction: boolean;
  logLevel: LogLevel;
}

class Logger {
  private config: LoggerConfig = {
    enableInProduction: false,
    logLevel: 'debug',
  };

  private isDevelopment(): boolean {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment() && !this.config.enableInProduction) {
      // In production, only log warnings and errors
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  debug(...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  }

  /**
   * Log API calls for debugging
   */
  api(method: string, endpoint: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(`[API] ${method} ${endpoint}`, data || '');
    }
  }

  /**
   * Configure logger settings
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for consumers
export type { LogLevel };
