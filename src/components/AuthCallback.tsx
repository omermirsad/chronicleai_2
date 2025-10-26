import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpenIcon } from './Icons';

/**
 * AuthCallback component
 * Handles the auth callback from email confirmation and password reset links
 */
const AuthCallback = () => {
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
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if we have a session
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            // Redirect to the main app
            window.location.href = '/app';
          } else {
            // If no session, redirect back to auth page
            console.error('No session established after callback');
            window.location.href = '/';
          }
        } else {
          // For other types or if no type, just redirect to app
          // The auth state will be handled by useAuth hook
          setTimeout(() => {
            window.location.href = '/app';
          }, 1500);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        // Redirect to home on error
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Confirming your email...</h2>
          <p className="text-stone-600">Please wait while we complete your signup.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
