/**
 * Global Error Handler
 * Centralized error handling for the application
 */

import { captureException } from './errorMonitoring';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  AI = 'ai',
  STRIPE = 'stripe',
  STORAGE = 'storage',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  userMessage?: string;
  context?: Record<string, any>;
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]: 'Connection issue. Please check your internet and try again.',
  [ErrorType.AUTH]: 'Authentication failed. Please sign in again.',
  [ErrorType.VALIDATION]: 'Invalid input. Please check your data and try again.',
  [ErrorType.AI]: 'AI service temporarily unavailable. Please try again later.',
  [ErrorType.STRIPE]: 'Payment processing issue. Please contact support if this persists.',
  [ErrorType.STORAGE]: 'File upload failed. Please try a smaller file.',
  [ErrorType.DATABASE]: 'Database error. Please try again later.',
  [ErrorType.UNKNOWN]: 'Something went wrong. Please try again.',
};

/**
 * Handle errors globally
 */
export function handleError(error: Error | AppError, showToast = true): void {
  const appError = isAppError(error) ? error : createAppError(error);

  // Log error
  logger.error('Error occurred:', {
    type: appError.type,
    message: appError.message,
    context: appError.context,
  });

  // Send to error monitoring service
  if (appError.originalError) {
    captureException(appError.originalError, {
      type: appError.type,
      ...appError.context,
    });
  }

  // Show user-friendly message
  if (showToast) {
    const userMessage = appError.userMessage || ERROR_MESSAGES[appError.type];
    toast.error(userMessage, {
      duration: 5000,
      position: 'top-center',
    });
  }
}

/**
 * Create an AppError from a generic error
 */
export function createAppError(
  error: Error,
  type: ErrorType = ErrorType.UNKNOWN,
  context?: Record<string, any>
): AppError {
  // Detect error type from error message
  const detectedType = detectErrorType(error);

  return {
    type: type !== ErrorType.UNKNOWN ? type : detectedType,
    message: error.message,
    originalError: error,
    context,
  };
}

/**
 * Detect error type from error message
 */
function detectErrorType(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return ErrorType.NETWORK;
  }
  if (message.includes('auth') || message.includes('unauthorized')) {
    return ErrorType.AUTH;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }
  if (message.includes('gemini') || message.includes('ai')) {
    return ErrorType.AI;
  }
  if (message.includes('stripe') || message.includes('payment')) {
    return ErrorType.STRIPE;
  }
  if (message.includes('storage') || message.includes('upload')) {
    return ErrorType.STORAGE;
  }
  if (message.includes('database') || message.includes('supabase')) {
    return ErrorType.DATABASE;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Type guard for AppError
 */
function isAppError(error: any): error is AppError {
  return error && typeof error.type === 'string' && typeof error.message === 'string';
}

/**
 * Async error wrapper for promise-based operations
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorType?: ErrorType,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(
      createAppError(error as Error, errorType || ErrorType.UNKNOWN, context)
    );
    return null;
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        logger.warn(`Operation failed, retrying... (${attempt}/${maxRetries})`);
        onRetry?.(attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Success toast helper
 */
export function showSuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  });
}

/**
 * Info toast helper
 */
export function showInfo(message: string): void {
  toast(message, {
    duration: 4000,
    position: 'top-center',
    icon: 'ℹ️',
  });
}

/**
 * Loading toast helper
 */
export function showLoading(message: string): string {
  return toast.loading(message, {
    position: 'top-center',
  });
}

/**
 * Dismiss toast
 */
export function dismissToast(toastId: string): void {
  toast.dismiss(toastId);
}
