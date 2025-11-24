/**
 * Structured Logging System
 * Production-grade logging with levels, contexts, and external service integration
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  [key: string]: any;
  userId?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
  stack?: string;
}

class Logger {
  private minLevel: LogLevel;
  private context: LogContext;
  private sessionId: string;

  constructor() {
    this.minLevel = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
    this.sessionId = this.generateSessionId();
    this.context = {
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION || '2.0.0',
      sessionId: this.sessionId,
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Set user context for logging
   */
  setUser(userId: string, metadata?: Record<string, any>): void {
    this.context.userId = userId;
    if (metadata) {
      this.context = { ...this.context, ...metadata };
    }

    // Set Sentry user context
    if (window.Sentry) {
      window.Sentry.setUser({ id: userId, ...metadata });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    delete this.context.userId;
    if (window.Sentry) {
      window.Sentry.setUser(null);
    }
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    contextOrError?: LogContext | Error,
    error?: Error
  ): LogEntry {
    let finalContext: LogContext = { ...this.context };
    let finalError: Error | undefined = error;

    // Handle overloaded parameters
    if (contextOrError instanceof Error) {
      finalError = contextOrError;
    } else if (contextOrError) {
      finalContext = { ...finalContext, ...contextOrError };
    }

    return {
      level,
      message,
      context: finalContext,
      timestamp: new Date().toISOString(),
      error: finalError,
      stack: finalError?.stack,
    };
  }

  /**
   * Log message
   */
  private log(entry: LogEntry): void {
    if (entry.level < this.minLevel) return;

    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.timestamp}] [${levelName}]`;

    // Console output
    if (import.meta.env.DEV) {
      const style = this.getConsoleStyle(entry.level);

      if (entry.error) {
        console.error(`${prefix} ${entry.message}`, entry.context, entry.error);
      } else {
        const method = this.getConsoleMethod(entry.level);
        console[method](`${prefix} ${entry.message}`, entry.context);
      }
    }

    // Send to external services in production
    if (import.meta.env.PROD) {
      this.sendToExternalServices(entry);
    }

    // Store critical logs in localStorage for debugging
    if (entry.level >= LogLevel.ERROR) {
      this.storeInLocalStorage(entry);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      [LogLevel.DEBUG]: 'color: #888',
      [LogLevel.INFO]: 'color: #0066cc',
      [LogLevel.WARN]: 'color: #ff9900',
      [LogLevel.ERROR]: 'color: #cc0000; font-weight: bold',
      [LogLevel.FATAL]: 'color: #cc0000; font-weight: bold; font-size: 14px',
    };
    return styles[level] || '';
  }

  private getConsoleMethod(level: LogLevel): 'log' | 'info' | 'warn' | 'error' {
    if (level >= LogLevel.ERROR) return 'error';
    if (level >= LogLevel.WARN) return 'warn';
    if (level >= LogLevel.INFO) return 'info';
    return 'log';
  }

  /**
   * Send logs to external monitoring services
   */
  private sendToExternalServices(entry: LogEntry): void {
    // Send errors to Sentry
    if (entry.level >= LogLevel.ERROR && window.Sentry) {
      if (entry.error) {
        window.Sentry.captureException(entry.error, {
          level: entry.level >= LogLevel.FATAL ? 'fatal' : 'error',
          tags: entry.context,
          contexts: {
            log: {
              message: entry.message,
              timestamp: entry.timestamp,
            },
          },
        });
      } else {
        window.Sentry.captureMessage(entry.message, {
          level: entry.level >= LogLevel.FATAL ? 'fatal' : 'error',
          tags: entry.context,
        });
      }
    }

    // Send to custom logging endpoint (optional)
    if (import.meta.env.VITE_LOGGING_ENDPOINT && entry.level >= LogLevel.WARN) {
      fetch(import.meta.env.VITE_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch((err) => {
        console.error('Failed to send log to endpoint', err);
      });
    }
  }

  /**
   * Store critical logs in localStorage for debugging
   */
  private storeInLocalStorage(entry: LogEntry): void {
    try {
      const key = 'chronicle_error_logs';
      const stored = localStorage.getItem(key);
      const logs: LogEntry[] = stored ? JSON.parse(stored) : [];

      logs.push(entry);

      // Keep only last 50 error logs
      const trimmed = logs.slice(-50);

      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (error) {
      // Fail silently if localStorage is not available
    }
  }

  /**
   * Public logging methods
   */
  debug(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.ERROR, message, errorOrContext, context as Error));
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(this.createLogEntry(LogLevel.FATAL, message, error, context));

    // Fatal errors should always be reported to Sentry immediately
    if (window.Sentry && error) {
      window.Sentry.captureException(error, {
        level: 'fatal',
        tags: { ...this.context, ...context },
      });
    }
  }

  /**
   * Create a breadcrumb for debugging (Sentry)
   */
  breadcrumb(message: string, data?: Record<string, any>): void {
    if (window.Sentry) {
      window.Sentry.addBreadcrumb({
        message,
        data,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    }
  }

  /**
   * Get stored error logs from localStorage
   */
  getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('chronicle_error_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs(): void {
    try {
      localStorage.removeItem('chronicle_error_logs');
    } catch {
      // Fail silently
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      promise: String(event.promise),
    });
  });
}

// Global type augmentation
declare global {
  interface Window {
    Sentry?: any;
  }
}
