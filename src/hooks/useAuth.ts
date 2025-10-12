import * as React from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const processSession = async (session: Session | null) => {
    if (session?.user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        setUser({
            id: session.user.id,
            email: session.user.email!,
            // Fix: Cast `profile` to `any` to work around a complex type inference issue
            // where `profile` is incorrectly inferred as `never`, causing property access errors.
            name: ((profile as any)?.full_name) || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatarUrl: ((profile as any)?.avatar_url) || session.user.user_metadata?.avatar_url,
        });
    } else {
        setUser(null);
    }
  };

  React.useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await processSession(session);
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await processSession(session);
        setLoading(false);
      }
    );

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