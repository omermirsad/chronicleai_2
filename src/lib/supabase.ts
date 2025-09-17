// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';
import { config, isProduction } from '../config';

// Create Supabase client with production-ready configuration
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'chronicle-ai-auth',
      flowType: 'pkce', // More secure auth flow
      debug: !isProduction,
    },
    global: {
      headers: {
        'x-application-name': config.app.name,
        'x-application-version': config.app.version,
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 5,
      },
      heartbeatIntervalMs: 30000,
      timeout: 10000,
    },
    db: {
      schema: 'public',
    },
    // Connection pooling for better performance
    connectionString: config.supabase.url,
    // Retry configuration for reliability
    shouldThrowOnError: !isProduction,
  }
);

// Health check function
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Export typed database helpers
export const db = {
  profiles: () => supabase.from('profiles'),
  journalEntries: () => supabase.from('journal_entries'),
};

// Storage helpers with error handling
export const storage = {
  photos: {
    upload: async (userId: string, file: File): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('journal-photos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('journal-photos')
          .getPublicUrl(data.path);
        
        return publicUrl;
      } catch (error) {
        console.error('Photo upload error:', error);
        return null;
      }
    },
    
    delete: async (url: string): Promise<boolean> => {
      try {
        const path = url.split('/').slice(-2).join('/');
        const { error } = await supabase.storage
          .from('journal-photos')
          .remove([path]);
        
        return !error;
      } catch {
        return false;
      }
    },
  },
};
