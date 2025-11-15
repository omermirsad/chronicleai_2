/**
 * Production-ready error handling system
 * Provides structured error types with proper status codes and operational flags
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
    };
  }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
  }
}

/**
 * Authentication error - for auth failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
  }
}

/**
 * Authorization error - for permission issues
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, 'NOT_FOUND', 404, true, context);
  }
}

/**
 * Rate limit error - for exceeded rate limits
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, any>) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, context);
  }
}

/**
 * External service error - for third-party API failures
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: Record<string, any>
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true, { service, ...context });
  }
}

/**
 * Timeout error - for operations that exceed time limits
 */
export class TimeoutError extends AppError {
  constructor(
    operation: string,
    timeout: number,
    context?: Record<string, any>
  ) {
    super(
      `Operation "${operation}" timed out after ${timeout}ms`,
      'TIMEOUT_ERROR',
      504,
      true,
      { operation, timeout, ...context }
    );
  }
}

/**
 * Database error - for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
  }
}

/**
 * Determines if an error is an operational error (safe to expose to user)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Formats error for user display
 * Only exposes safe information from operational errors
 */
export function formatErrorForUser(error: Error): { message: string; code?: string } {
  if (error instanceof AppError && error.isOperational) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  // Don't expose internal error details
  return {
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
  };
}

/**
 * Formats error for logging
 * Includes full details for debugging
 */
export function formatErrorForLogging(error: Error): Record<string, any> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      context: error.context,
      stack: error.stack,
    };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}
