// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Hardcoded Supabase credentials to resolve environment variable issues.
const supabaseUrl = 'https://ciqyehvuvznmckvwsehp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXllaHZ1dnpubWNrdndzZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Njc1MjcsImV4cCI6MjA3MjE0MzUyN30.t0KS4aCf_F0ad5eHqb7-_aG_XgV6pc3ilWDqmKgAzec';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing.');
  throw new Error('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'chronicle-ai-auth',
  },
  global: {
    headers: {
      'x-application-name': 'chronicle-ai',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});
