import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciqyehvuvznmckvwsehp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpcXllaHZ1dnpubWNrdndzZWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1Njc1MjcsImV4cCI6MjA3MjE0MzUyN30.t0KS4aCf_F0ad5eHqb7-_aG_XgV6pc3ilWDqmKgAzec';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);