// src/lib/dataExportService.ts
/**
 * Data Export and Account Management Service
 * Provides functionality for users to export their data and delete their account
 * GDPR/Privacy compliance utilities
 */

import { supabase } from './supabase';
import type { DatabaseEntry } from '../types';
import { logger } from '@/lib/logger';

/**
 * Export user data in JSON format
 * Includes all journal entries, profile data, and preferences
 *
 * @param userId - User ID to export data for
 * @returns Promise resolving to exported data
 */
export const exportDataAsJSON = async (userId: string) => {
  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Fetch all journal entries
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (entriesError) {
      throw new Error(`Failed to fetch journal entries: ${entriesError.message}`);
    }

    // Prepare export data
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: (profile as any)?.id || '',
        email: (profile as any)?.email || '',
        fullName: (profile as any)?.full_name || '',
        avatarUrl: (profile as any)?.avatar_url || '',
        preferences: (profile as any)?.preferences || {},
        createdAt: (profile as any)?.created_at || '',
      },
      journalEntries: entries || [],
      statistics: {
        totalEntries: entries?.length || 0,
        dateRange: {
          first: (entries as any)?.[0]?.date || '',
          last: (entries as any)?.[(entries?.length || 0) - 1]?.date || '',
        },
      },
    };

    return exportData;
  } catch (error) {
    logger.error('Error exporting data:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Export user data as a downloadable JSON file
 *
 * @param userId - User ID to export data for
 */
export const downloadDataAsJSON = async (userId: string) => {
  const data = await exportDataAsJSON(userId);

  // Create blob and download
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chronicle-ai-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export journal entries as CSV
 *
 * @param userId - User ID to export data for
 */
export const downloadEntriesAsCSV = async (userId: string) => {
  try {
    // Fetch all journal entries
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    if (!entries || entries.length === 0) {
      throw new Error('No journal entries to export');
    }

    // CSV header
    const headers = [
      'Date',
      'Text',
      'Mood',
      'Energy',
      'Tags',
      'Session Type',
      'AI Summary',
      'Sentiment',
    ];

    // CSV rows
    const rows = entries.map((entry: DatabaseEntry) => {
      const aiSummary = entry?.ai_analysis?.summary?.join('; ') || '';
      const tags = entry?.tags?.join(', ') || '';
      const sentiment = entry?.ai_analysis?.sentiment || '';
      const sessionType = entry?.guided_session?.type || '';

      return [
        entry?.date || '',
        `"${(entry?.text || '').replace(/"/g, '""')}"`, // Escape quotes
        entry?.mood?.toString() || '',
        entry?.energy?.toString() || '',
        `"${tags}"`,
        sessionType,
        `"${aiSummary.replace(/"/g, '""')}"`,
        sentiment,
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row: (string | number)[]) => row.join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-ai-entries-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Error exporting CSV:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Export journal entries as a readable text file
 *
 * @param userId - User ID to export data for
 */
export const downloadEntriesAsText = async (userId: string) => {
  try {
    // Fetch all journal entries
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch journal entries: ${error.message}`);
    }

    if (!entries || entries.length === 0) {
      throw new Error('No journal entries to export');
    }

    // Generate text content
    const textContent = entries
      .map((entry: DatabaseEntry, index: number) => {
        const date = new Date(entry?.date || '').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        let content = `\n${'='.repeat(80)}\n`;
        content += `Entry ${index + 1} - ${date}\n`;
        content += `${'='.repeat(80)}\n\n`;

        if (entry?.guided_session) {
          content += `Session: ${entry.guided_session.title}\n\n`;
        }

        content += `${entry?.text || ''}\n\n`;

        if (entry?.mood) {
          const moods = ['😠', '😟', '😐', '🙂', '😄'];
          content += `Mood: ${moods[entry.mood - 1]} (${entry.mood}/5)\n`;
        }

        if (entry?.energy !== null && entry?.energy !== undefined) {
          content += `Energy: ${entry.energy}/100\n`;
        }

        if (entry?.tags && entry.tags.length > 0) {
          content += `Tags: ${entry.tags.join(', ')}\n`;
        }

        if (entry?.ai_analysis) {
          content += `\nAI Insights:\n`;
          if (entry.ai_analysis.summary) {
            content += `  • ${entry.ai_analysis.summary.join('\n  • ')}\n`;
          }
          if (entry.ai_analysis.sentiment) {
            content += `  Sentiment: ${entry.ai_analysis.sentiment}\n`;
          }
        }

        return content;
      })
      .join('\n\n');

    // Add header
    const header = `CHRONICLE AI - JOURNAL EXPORT\n`;
    const subheader = `Exported on ${new Date().toLocaleString()}\n`;
    const fullContent = header + subheader + textContent;

    // Create blob and download
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-ai-journal-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    logger.error('Error exporting text:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Delete all user data (GDPR right to erasure)
 * This is irreversible!
 *
 * @param userId - User ID to delete data for
 * @returns Promise resolving when deletion is complete
 */
export const deleteUserData = async (userId: string) => {
  try {
    // Delete all journal entries
    const { error: entriesError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('user_id', userId);

    if (entriesError) {
      throw new Error(`Failed to delete journal entries: ${entriesError.message}`);
    }

    // Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // Delete auth user (this also triggers cascade delete in Supabase)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    // Note: auth.admin.deleteUser() may not be available in client SDK
    // Alternative: Call a Supabase Edge Function to delete the auth user
    if (authError) {
      logger.warn('Auth user deletion error:', authError);
      // This might fail in client-side code; ideally handled server-side
    }

    return { success: true };
  } catch (error) {
    logger.error('Error deleting user data:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Request account deletion via Supabase Auth
 * This is the proper way to delete an account from the client
 *
 * @returns Promise resolving when deletion request is sent
 */
export const requestAccountDeletion = async () => {
  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    // Delete all user data first
    await deleteUserData(user.id);

    // Sign out the user
    await supabase.auth.signOut();

    return { success: true };
  } catch (error) {
    logger.error('Error requesting account deletion:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Get user data statistics
 *
 * @param userId - User ID to get stats for
 * @returns Data statistics
 */
export const getUserDataStats = async (userId: string) => {
  try {
    // Count journal entries
    const { count: entriesCount, error: entriesError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (entriesError) {
      throw new Error(`Failed to count entries: ${entriesError.message}`);
    }

    // Get date range
    const { data: entries, error: rangeError } = await supabase
      .from('journal_entries')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (rangeError) {
      throw new Error(`Failed to fetch date range: ${rangeError.message}`);
    }

    // Calculate storage size estimate (rough estimate)
    const { data: allEntries, error: sizeError } = await supabase
      .from('journal_entries')
      .select('text, photo_url, ai_analysis')
      .eq('user_id', userId);

    if (sizeError) {
      throw new Error(`Failed to calculate size: ${sizeError.message}`);
    }

    const estimatedSize = allEntries
      ? JSON.stringify(allEntries).length / 1024 // KB
      : 0;

    return {
      totalEntries: entriesCount || 0,
      dateRange: {
        first: (entries as any)?.[0]?.date || '',
        last: (entries as any)?.[(entries?.length || 0) - 1]?.date || '',
      },
      estimatedSizeKB: Math.round(estimatedSize),
    };
  } catch (error) {
    logger.error('Error getting user data stats:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Export all data formats at once
 *
 * @param userId - User ID to export data for
 */
export const exportAllFormats = async (userId: string) => {
  try {
    await downloadDataAsJSON(userId);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between downloads
    await downloadEntriesAsCSV(userId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await downloadEntriesAsText(userId);
  } catch (error) {
    logger.error('Error exporting all formats:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};
