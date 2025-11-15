// Supabase Edge Function: Weekly Digest Cron Job
// Runs weekly to send personalized mood-based newsletters

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateWeeklyDigest, WeeklyDigestData } from '../_shared/email-templates/weekly-digest.ts';
import { getTranslator } from '../_shared/i18n.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
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

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Get all users who have opted in to weekly digests
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, preferences')
      .not('preferences->>weeklyDigest', 'is', 'false')
      .not('preferences->>emailNotifications', 'is', 'false');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Processing weekly digests for ${profiles?.length || 0} users`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each user
    for (const profile of profiles || []) {
      try {
        // Check if user has weeklyDigest preference (default to true if emailNotifications is true)
        const preferences = profile.preferences as any || {};
        if (preferences.weeklyDigest === false) {
          results.skipped++;
          continue;
        }

        // Get user's language preference
        const userLanguage = preferences.language || 'en';
        const t = getTranslator(userLanguage);

        // Get user's entries from the past 7 days
        const { data: entries, error: entriesError } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', profile.id)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString())
          .order('date', { ascending: false });

        if (entriesError) {
          console.error(`Error fetching entries for user ${profile.id}:`, entriesError);
          results.failed++;
          continue;
        }

        // Skip if user has no entries
        if (!entries || entries.length === 0) {
          results.skipped++;
          continue;
        }

        // Calculate statistics
        const moods = entries
          .map((e: any) => e.mood)
          .filter((m: number | null) => m !== null && m !== undefined);
        const averageMood = moods.length > 0
          ? moods.reduce((sum: number, m: number) => sum + m, 0) / moods.length
          : 3;

        // Extract all tags and find top 5
        const tagCounts: Record<string, number> = {};
        entries.forEach((entry: any) => {
          if (entry.tags && Array.isArray(entry.tags)) {
            entry.tags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
        const topTags = Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag);

        // Calculate mood trend
        const firstHalfMoods = moods.slice(Math.floor(moods.length / 2));
        const secondHalfMoods = moods.slice(0, Math.floor(moods.length / 2));
        const firstAvg = firstHalfMoods.length > 0
          ? firstHalfMoods.reduce((sum: number, m: number) => sum + m, 0) / firstHalfMoods.length
          : averageMood;
        const secondAvg = secondHalfMoods.length > 0
          ? secondHalfMoods.reduce((sum: number, m: number) => sum + m, 0) / secondHalfMoods.length
          : averageMood;

        let moodTrend: 'improving' | 'declining' | 'stable' = 'stable';
        if (secondAvg - firstAvg > 0.3) moodTrend = 'improving';
        else if (firstAvg - secondAvg > 0.3) moodTrend = 'declining';

        // Determine dominant sentiment
        const sentiments: Record<string, number> = {};
        entries.forEach((entry: any) => {
          const sentiment = entry.ai_analysis?.sentiment || 'Neutral';
          sentiments[sentiment] = (sentiments[sentiment] || 0) + 1;
        });
        const dominantSentiment = Object.entries(sentiments)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Neutral';

        // Generate AI summary using Gemini
        const entriesText = entries
          .map((e: any) => e.text)
          .slice(0, 10)
          .join('\n\n---\n\n');

        const prompt = `You are an empathetic AI journal assistant. Analyze the following journal entries from the past week and provide a personalized, warm summary (2-3 paragraphs) that:
1. Highlights key themes and patterns
2. Acknowledges emotional experiences
3. Offers gentle encouragement and insights
4. Is written in a compassionate, supportive tone

Journal entries:
${entriesText}

Provide only the summary text, no additional commentary.`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        const aiSummary = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
          'This week, you showed up for yourself with consistency and reflection. Keep nurturing this practice!';

        // Prepare email data
        const emailData: WeeklyDigestData = {
          userName: profile.full_name || 'there',
          weekStart: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          weekEnd: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          totalEntries: entries.length,
          averageMood,
          dominantSentiment,
          topTags,
          moodTrend,
          aiSummary,
          appUrl: APP_URL,
        };

        // Generate HTML email
        const emailHtml = generateWeeklyDigest(emailData);

        // Send email using Resend
        const subject = t('weeklyDigestSubject');
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Chronicle AI <digest@chronicle-ai.app>',
            to: [profile.email],
            subject: subject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error(`Failed to send email to ${profile.email}:`, errorData);
          results.failed++;
        } else {
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
    console.error('Error in weekly digest cron:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
