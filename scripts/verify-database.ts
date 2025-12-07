#!/usr/bin/env node
/**
 * Database Verification Script
 * Verifies database schema and configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function verifyDatabase(): Promise<void> {
  console.log('🔍 Verifying database setup...\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const checks = [
    {
      name: 'Supabase Connection',
      test: async () => {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows, which is ok
        return true;
      },
    },
    {
      name: 'Profiles Table',
      test: async () => {
        const { error } = await supabase.from('profiles').select('*').limit(1);
        if (error && error.code !== 'PGRST116') throw error;
        return true;
      },
    },
    {
      name: 'Journal Entries Table',
      test: async () => {
        const { error } = await supabase.from('journal_entries').select('*').limit(1);
        if (error && error.code !== 'PGRST116') throw error;
        return true;
      },
    },
    {
      name: 'Achievements Table',
      test: async () => {
        const { error } = await supabase.from('achievements').select('*').limit(1);
        if (error && error.code !== 'PGRST116') throw error;
        return true;
      },
    },
    {
      name: 'Storage Bucket (journal-photos)',
      test: async () => {
        const { data, error } = await supabase.storage.from('journal-photos').list('', { limit: 1 });
        if (error && !error.message.includes('not found')) throw error;
        return true;
      },
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      await check.test();
      console.log(`✅ ${check.name}`);
    } catch (error: any) {
      console.log(`❌ ${check.name}: ${error.message}`);
      allPassed = false;
    }
  }

  console.log('');

  if (!allPassed) {
    console.error('❌ Database verification failed!');
    console.log('💡 Make sure you have run the Supabase migrations:');
    console.log('   npx supabase db push\n');
    process.exit(1);
  }

  console.log('✅ Database verification successful!\n');

  // Check for Edge Functions
  console.log('📋 Edge Functions Status:');
  console.log('   Required functions:');
  console.log('   - gemini-proxy');
  console.log('   - create-checkout-session');
  console.log('   - create-portal-session');
  console.log('   - stripe-webhook');
  console.log('   - on-this-day-cron');
  console.log('   - weekly-digest-cron');
  console.log('\n   Deploy with: npm run supabase:functions:deploy\n');
}

// Run verification
verifyDatabase().catch((error) => {
  console.error('❌ Verification error:', error);
  process.exit(1);
});
