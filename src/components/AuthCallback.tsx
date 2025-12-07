import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpenIcon } from '@/components/Icons';
import { logger } from '@/lib/logger';

// Timeout utility
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

/**
 * AuthCallback component
 * Handles the auth callback from email confirmation and password reset links
 */
const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');

  useEffect(() => {
    // The supabase client will automatically handle the session from the URL
    // due to detectSessionInUrl: true configuration
    const handleAuthCallback = async () => {
      try {
        // Get the hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        // Check if this is a signup confirmation or password recovery
        if (type === 'signup' || type === 'recovery') {
          // Poll for session with timeout (max 10 seconds)
          const startTime = Date.now();
          let session = null;

          while (!session && Date.now() - startTime < 10000) {
            const sessionPromise = supabase.auth.getSession();
            const result = await withTimeout(sessionPromise, 5000);
            const currentSession = result.data.session;

            if (currentSession) {
              session = currentSession;
              break;
            }

            // Wait 500ms before next check
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (session) {
            setStatus('success');
            // Redirect to the main app after a brief delay
            setTimeout(() => {
              window.location.href = '/app';
            }, 1000);
          } else {
            // If no session after polling, show error
            logger.error('No session established after callback');
            setError('Failed to establish session. The link may have expired.');
            setStatus('error');
          }
        } else {
          // For other types or if no type, just redirect to app
          // The auth state will be handled by useAuth hook
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/app';
          }, 1000);
        }
      } catch (error) {
        logger.error('Error handling auth callback', error as Error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="flex justify-center items-center gap-2 mb-8">
          <BookOpenIcon className="w-10 h-10 text-rose-600 animate-pulse" />
          <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Chronicle AI</h1>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-stone-200">
          {status === 'confirming' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Confirming your email...</h2>
              <p className="text-stone-600">Please wait while we complete your signup.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Email confirmed!</h2>
              <p className="text-stone-600">Redirecting you to Chronicle AI...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">Confirmation Failed</h2>
              <p className="text-stone-600 mb-4">{error || 'Unable to confirm your email.'}</p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
                >
                  Go to Sign In
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-stone-200 text-stone-800 rounded-md hover:bg-stone-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
