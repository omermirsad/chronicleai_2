import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

// Timeout utility to prevent hanging on slow/failed requests
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processSession = async (session: Session | null) => {
    if (session?.user) {
      try {
        // Execute the profile query and await it directly to get the response
        const profileResponse = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Check if we got data and handle potential errors
        if (profileResponse.error) {
          throw profileResponse.error;
        }

        const profileData = profileResponse.data as Profile | null;

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name:
            profileData?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0],
          avatarUrl: profileData?.avatar_url || session.user.user_metadata?.avatar_url,
        });
        setError(null);
      } catch (error) {
        logger.error('Error fetching profile', error as Error);
        // Fallback to basic user info if profile fetch fails
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email?.split('@')[0],
        });
        setError(null); // Not a critical error, we have fallback
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        // Add timeout to session fetch (15 seconds)
        const sessionPromise = supabase.auth.getSession();
        const result = await withTimeout(sessionPromise, 15000);
        const session = result.data.session;

        if (mounted) {
          await processSession(session);
        }
      } catch (error) {
        logger.error('Error getting session', error as Error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to initialize authentication');
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        await processSession(session);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Sign out error', error);
      throw error;
    }
    setUser(null);
  };

  return {
    user,
    loading,
    error,
    signOut,
  };
};