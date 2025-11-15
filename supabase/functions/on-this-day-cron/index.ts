// Supabase Edge Function: On This Day Cron Job
// Runs daily to send "On This Day" email notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateOnThisDayEmail, OnThisDayData, OnThisDayEntry } from '../_shared/email-templates/on-this-day.ts';
import { getTranslator } from '../_shared/i18n.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const APP_URL = Deno.env.get('APP_URL') || 'https://chronicle-ai.app';

serve(async (req) => {
  // Verify this is a cron request - FAIL CLOSED
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  // CRITICAL: Fail closed - if CRON_SECRET is not set, reject the request
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return new Response(JSON.stringify({
      error: 'Server configuration error: CRON_SECRET not set'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron access attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's month and day
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate(); // 1-31

    // Get all users who have opted in to "On This Day" emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, preferences')
      .not('preferences->>onThisDay', 'is', 'false')
      .not('preferences->>emailNotifications', 'is', 'false');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Processing "On This Day" for ${profiles?.length || 0} users`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each user
    for (const profile of profiles || []) {
      try {
        // Check if user has onThisDay preference (default to true if emailNotifications is true)
        const preferences = profile.preferences as any || {};
        if (preferences.onThisDay === false) {
          results.skipped++;
          continue;
        }

        // Get user's language preference
        const userLanguage = preferences.language || 'en';
        const t = getTranslator(userLanguage);

        // Get entries from this day in previous years
        // We'll use the get_on_this_day_entries function
        const { data: entries, error: entriesError } = await supabase
          .rpc('get_on_this_day_entries', {
            target_user_id: profile.id,
          });

        if (entriesError) {
          console.error(`Error fetching entries for user ${profile.id}:`, entriesError);
          results.failed++;
          continue;
        }

        // Skip if no entries from past years on this day
        if (!entries || entries.length === 0) {
          results.skipped++;
          continue;
        }

        // Transform entries to match template interface
        const onThisDayEntries: OnThisDayEntry[] = entries.map((entry: any) => {
          const entryDate = new Date(entry.date);
          const yearsAgo = today.getFullYear() - entryDate.getFullYear();

          return {
            id: entry.id,
            date: entry.date,
            text: entry.text,
            mood: entry.mood,
            tags: entry.tags,
            yearsAgo,
          };
        });

        // Prepare email data
        const emailData: OnThisDayData = {
          userName: profile.full_name || 'there',
          entries: onThisDayEntries,
          appUrl: APP_URL,
        };

        // Generate HTML email
        const emailHtml = generateOnThisDayEmail(emailData);

        // Skip if no HTML generated (shouldn't happen, but just in case)
        if (!emailHtml) {
          results.skipped++;
          continue;
        }

        // Prepare subject line using translated text
        const subject = t('onThisDaySubject');

        // Send email using Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chronicle AI <memories@chronicle-ai.app>',
            to: [profile.email],
            subject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error(`Failed to send email to ${profile.email}:`, errorData);
          results.failed++;
        } else {
          console.log(`Successfully sent "On This Day" email to ${profile.email}`);
          results.success++;
        }

      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
        results.failed++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Processed ${results.success + results.failed + results.skipped} users`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in "On This Day" cron:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
