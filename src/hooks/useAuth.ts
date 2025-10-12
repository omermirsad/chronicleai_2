import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const processSession = async (session: Session | null) => {
    if (session?.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const profileData = profile as Profile | null;

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name:
            profileData?.full_name ||
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0],
          avatarUrl: profileData?.avatar_url || session.user.user_metadata?.avatar_url,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to basic user info if profile fetch fails
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email?.split('@')[0],
        });
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await processSession(session);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await processSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setUser(null);
  };

  return {
    user,
    loading,
    signOut,
  };
};
