import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

interface UseAsyncActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  logError?: boolean;
}

interface UseAsyncActionReturn<T extends (...args: any[]) => Promise<any>> {
  execute: T;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook for handling async actions with loading state, error handling, and toast notifications
 *
 * @example
 * const { execute: saveProfile, loading } = useAsyncAction(
 *   async (name: string) => {
 *     await supabase.from('profiles').update({ name }).eq('id', userId);
 *   },
 *   {
 *     successMessage: 'Profile updated successfully',
 *     errorMessage: 'Failed to update profile',
 *   }
 * );
 */
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: UseAsyncActionOptions = {}
): UseAsyncActionReturn<T> {
  const {
    successMessage,
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
    logError = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      setLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (successMessage) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess();
        }

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);

        if (logError) {
          logger.error('Async action error:', err);
        }

        // Show error toast with custom message or error message
        const displayMessage = errorObj.message || errorMessage;
        toast.error(displayMessage);

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action, successMessage, errorMessage, onSuccess, onError, logError]
  ) as T;

  return {
    execute,
    loading,
    error,
  };
}

/**
 * Simplified version for actions that don't need loading state management
 * (useful when you have multiple actions and want a single loading state)
 */
export async function executeAsyncAction<T>(
  action: () => Promise<T>,
  options: UseAsyncActionOptions = {}
): Promise<T | null> {
  const {
    successMessage,
    errorMessage = 'An error occurred',
    onSuccess,
    onError,
    logError = true,
  } = options;

  try {
    const result = await action();

    if (successMessage) {
      toast.success(successMessage);
    }

    if (onSuccess) {
      onSuccess();
    }

    return result;
  } catch (err) {
    if (logError) {
      logger.error('Async action error:', err);
    }

    const errorObj = err instanceof Error ? err : new Error(String(err));
    const displayMessage = errorObj.message || errorMessage;
    toast.error(displayMessage);

    if (onError) {
      onError(err);
    }

    return null;
  }
}
