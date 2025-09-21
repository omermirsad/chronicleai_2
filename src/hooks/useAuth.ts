// src/hooks/useAuth.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { validateEmail } from '../utils/security';
import { SecureStorage } from '../utils/encryption';
import toast from 'react-hot-toast';

const SESSION_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const SESSION_CHECK_INTERVAL = 60 * 1000; // 1 minute
const MAX_REFRESH_RETRIES = 3;

interface AuthState {
  user: User | null;
  loading: boolean;
  sessionError: string | null;
  isRefreshing: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    sessionError: null,
    isRefreshing: false
  });
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const refreshRetriesRef = useRef(0);
  const isMountedRef = useRef(true);

  // Refresh session with retry logic
  const refreshSession = useCallback(async (): Promise<Session | null> => {
    if (!isMountedRef.current) return null;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        refreshRetriesRef.current++;
        
        if (refreshRetriesRef.current >= MAX_REFRESH_RETRIES) {
          console.error('Max refresh retries exceeded:', error);
          setState(prev => ({
            ...prev,
            sessionError: 'Session expired. Please log in again.',
            isRefreshing: false
          }));
          
          // Clear sensitive data and sign out
          await signOut();
          return null;
        }
        
        // Retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, refreshRetriesRef.current), 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return refreshSession();
      }
      
      refreshRetriesRef.current = 0;
      setState(prev => ({ ...prev, isRefreshing: false }));
      return session;
      
    } catch (error) {
      console.error('Session refresh error:', error);
      setState(prev => ({ 
        ...prev, 
        sessionError: 'Failed to refresh session',
        isRefreshing: false
      }));
      return null;
    }
  }, []);

  // Validate and process session
  const validateAndProcessSession = useCallback(async (session: Session | null) => {
    if (!isMountedRef.current || !session) {
      setState(prev => ({ ...prev, user: null, loading: false }));
      return;
    }

    // Validate session integrity
    if (!session.user?.id || !validateEmail(session.user.email || '')) {
      console.error('Invalid session data');
      setState(prev => ({ 
        ...prev, 
        user: null, 
        sessionError: 'Invalid session',
        loading: false 
      }));
      return;
    }

    // Check if session is expired
    const expiresAt = session.expires_at;
    if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
      const refreshedSession = await refreshSession();
      if (!refreshedSession) return;
      session = refreshedSession;
    }

    try {
      // Fetch user profile with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            })
            .select()
            .single();
          
          if (!createError && newProfile) {
            setState(prev => ({
              ...prev,
              user: {
                id: session.user.id,
                email: session.user.email!,
                name: newProfile.full_name || session.user.email?.split('@')[0],
                avatarUrl: newProfile.avatar_url
              },
              loading: false,
              sessionError: null
            }));
            return;
          }
        }
        throw error;
      }

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          user: {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url
          },
          loading: false,
          sessionError: null
        }));
      }
      
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      
      if (!error.message?.includes('aborted')) {
        setState(prev => ({
          ...prev,
          sessionError: 'Failed to load user profile',
          loading: false
        }));
      }
    }
  }, [refreshSession]);

  // Check session validity periodically
  const checkSession = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('Session check: No valid session');
        setState(prev => ({ ...prev, user: null }));
        return;
      }
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const expiryTime = new Date(expiresAt * 1000);
        const now = new Date();
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        
        if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
          console.log('Session expiring soon, refreshing...');
          await refreshSession();
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, [refreshSession]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      // Clear all intervals
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all local data
      if (state.user) {
        await SecureStorage.clear();
      }
      localStorage.clear();
      sessionStorage.clear();
      
      setState({
        user: null,
        loading: false,
        sessionError: null,
        isRefreshing: false
      });
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }, [state.user]);

  // Initialize authentication
  useEffect(() => {
    isMountedRef.current = true;
    
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Initial session error:', error);
          setState(prev => ({ 
            ...prev, 
            loading: false,
            sessionError: 'Failed to initialize authentication' 
          }));
          return;
        }
        
        await validateAndProcessSession(session);
        
        // Set up automatic session refresh if authenticated
        if (session) {
          refreshIntervalRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);
          checkIntervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL);
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({ 
          ...prev, 
          loading: false,
          sessionError: 'Authentication failed' 
        }));
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (!isMountedRef.current) return;
        
        switch (event) {
          case 'SIGNED_OUT':
            setState(prev => ({ ...prev, user: null, loading: false }));
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            break;
            
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            await validateAndProcessSession(session);
            
            // Reset refresh intervals
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            
            if (session) {
              refreshIntervalRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);
              checkIntervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL);
            }
            break;
            
          case 'PASSWORD_RECOVERY':
            toast.success('Password recovery email sent');
            break;
        }
      }
    );

    // Cleanup
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [validateAndProcessSession, refreshSession, checkSession]);

  // Monitor online/offline status for session management
  useEffect(() => {
    const handleOnline = () => {
      if (state.user) {
        checkSession();
      }
    };

    const handleOffline = () => {
      // Clear intervals when offline to prevent unnecessary requests
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.user, checkSession]);

  return {
    user: state.user,
    loading: state.loading,
    sessionError: state.sessionError,
    isRefreshing: state.isRefreshing,
    signOut,
    refreshSession
  };
};
