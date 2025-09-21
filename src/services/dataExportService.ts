// src/services/dataExportService.ts
import { supabase } from '../lib/supabase';
import { JournalEntry } from '../types';
import { validateUUID } from '../utils/security';
import toast from 'react-hot-toast';

/**
 * Service for GDPR-compliant data export and deletion
 */
export class DataExportService {
  /**
   * Export all user data in various formats
   */
  static async exportUserData(
    userId: string, 
    format: 'json' | 'markdown' | 'csv' = 'json'
  ): Promise<void> {
    if (!validateUUID(userId)) {
      throw new Error('Invalid user ID');
    }

    const loadingToast = toast.loading('Preparing your data export...');

    try {
      // Fetch all user data with proper error handling
      const [entriesResult, profileResult, statsResult] = await Promise.allSettled([
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase.rpc('get_user_statistics', { p_user_id: userId })
      ]);

      if (entriesResult.status === 'rejected' || profileResult.status === 'rejected') {
        throw new Error('Failed to fetch user data');
      }

      const exportData = {
        exportInfo: {
          userId,
          exportedAt: new Date().toISOString(),
          format,
          version: '2.0.0',
          totalEntries: entriesResult.value.data?.length || 0
        },
        profile: profileResult.status === 'fulfilled' ? profileResult.value.data : null,
        statistics: statsResult.status === 'fulfilled' ? statsResult.value.data : null,
        entries: entriesResult.value.data || [],
      };

      // Export based on format
      switch (format) {
        case 'json':
          await this.exportAsJSON(exportData);
          break;
        case 'markdown':
          await this.exportAsMarkdown(exportData);
          break;
        case 'csv':
          await this.exportAsCSV(exportData);
          break;
        default:
          throw new Error('Unsupported export format');
      }

      toast.success('Your data has been exported successfully!', { id: loadingToast });
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.', { id: loadingToast });
      throw error;
    }
  }

  /**
   * Export as JSON
   */
  private static async exportAsJSON(data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export as Markdown
   */
  private static async exportAsMarkdown(data: any): Promise<void> {
    let markdown = `# Chronicle AI Journal Export\n\n`;
    markdown += `**Export Date:** ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}\n\n`;
    
    // User info
    if (data.profile) {
      markdown += `## User Information\n\n`;
      markdown += `- **Email:** ${data.profile.email}\n`;
      markdown += `- **Name:** ${data.profile.full_name || 'Not set'}\n`;
      markdown += `- **Member Since:** ${new Date(data.profile.created_at).toLocaleDateString()}\n\n`;
    }

    // Statistics
    if (data.statistics) {
      markdown += `## Your Journey Statistics\n\n`;
      markdown += `- **Total Entries:** ${data.statistics.total_entries || 0}\n`;
      markdown += `- **Average Mood:** ${data.statistics.avg_mood ? `${parseFloat(data.statistics.avg_mood).toFixed(1)}/5` : 'N/A'}\n`;
      markdown += `- **Average Energy:** ${data.statistics.avg_energy ? `${parseFloat(data.statistics.avg_energy).toFixed(0)}%` : 'N/A'}\n`;
      markdown += `- **Current Streak:** ${data.statistics.current_streak || 0} days\n`;
      markdown += `- **Longest Streak:** ${data.statistics.longest_streak || 0} days\n`;
      markdown += `- **Total Words Written:** ${data.statistics.total_words || 0}\n\n`;
    }

    markdown += `---\n\n`;
    markdown += `## Journal Entries\n\n`;

    // Group entries by month
    const entriesByMonth = new Map<string, any[]>();
    data.entries.forEach((entry: any) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!entriesByMonth.has(monthKey)) {
        entriesByMonth.set(monthKey, []);
      }
      entriesByMonth.get(monthKey)!.push(entry);
    });

    // Write entries organized by month
    for (const [monthKey, entries] of entriesByMonth) {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      markdown += `### ${monthName}\n\n`;
      
      for (const entry of entries) {
        const date = new Date(entry.date);
        markdown += `#### ${date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}\n\n`;
        
        if (entry.mood) markdown += `**Mood:** ${entry.mood}/5 `;
        if (entry.energy !== null) markdown += `**Energy:** ${entry.energy}%\n\n`;
        
        if (entry.tags?.length) {
          markdown += `**Tags:** ${entry.tags.map((t: string) => `#${t}`).join(', ')}\n\n`;
        }
        
        markdown += entry.text + '\n\n';
        
        if (entry.ai_analysis) {
          markdown += `> **AI Insights:**\n`;
          if (entry.ai_analysis.summary?.length) {
            markdown += `> - ${entry.ai_analysis.summary.join('\n> - ')}\n`;
          }
          if (entry.ai_analysis.socraticQuestion) {
            markdown += `> \n> **Reflection Question:** ${entry.ai_analysis.socraticQuestion}\n`;
          }
          markdown += '\n';
        }
        
        markdown += `---\n\n`;
      }
    }

    // Add footer
    markdown += `\n\n## Privacy Notice\n\n`;
    markdown += `This export contains all your personal data from Chronicle AI. `;
    markdown += `Please store it securely and be mindful when sharing.\n\n`;
    markdown += `*Generated by Chronicle AI v${data.exportInfo.version}*`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-export-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export as CSV
   */
  private static async exportAsCSV(data: any): Promise<void> {
    // CSV headers
    const headers = [
      'Date', 'Time', 'Mood', 'Energy', 'Text', 'Tags', 
      'AI Summary', 'AI Sentiment', 'AI Question'
    ];
    
    // Convert entries to CSV rows
    const rows = data.entries.map((entry: any) => {
      const date = new Date(entry.date);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        entry.mood || '',
        entry.energy !== null ? entry.energy : '',
        `"${(entry.text || '').replace(/"/g, '""')}"`,
        entry.tags?.join('; ') || '',
        entry.ai_analysis?.summary?.join('; ') || '',
        entry.ai_analysis?.sentiment || '',
        entry.ai_analysis?.socraticQuestion || ''
      ];
    });
    
    // Combine headers and rows
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-export-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Delete all user data (GDPR right to be forgotten)
   */
  static async deleteAllUserData(userId: string): Promise<void> {
    if (!validateUUID(userId)) {
      throw new Error('Invalid user ID');
    }

    const confirmDelete = window.confirm(
      'WARNING: This will permanently delete ALL your data including:\n' +
      '• All journal entries\n' +
      '• Your profile information\n' +
      '• All AI analyses and insights\n' +
      '• Your account\n\n' +
      'This action CANNOT be undone. Are you absolutely sure?'
    );

    if (!confirmDelete) return;

    const finalConfirm = window.prompt(
      'To confirm deletion, please type "DELETE MY DATA" exactly:'
    );

    if (finalConfirm !== 'DELETE MY DATA') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    const loadingToast = toast.loading('Deleting your data...');

    try {
      // Delete in correct order due to foreign key constraints
      
      // 1. Delete journal entries
      const { error: entriesError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('user_id', userId);
      
      if (entriesError) throw entriesError;

      // 2. Delete rate limits
      await supabase
        .from('rate_limits')
        .delete()
        .eq('user_id', userId);

      // 3. Delete user sessions
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      // 4. Delete audit logs (soft delete - anonymize instead)
      await supabase
        .from('audit_logs')
        .update({ 
          user_id: null,
          ip_address: null,
          user_agent: null,
          metadata: { deleted: true, deleted_at: new Date().toISOString() }
        })
        .eq('user_id', userId);
      
      // 5. Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // 6. Delete auth user (this will sign them out)
      const { error: authError } = await supabase.auth.admin?.deleteUser(userId);
      
      if (authError) {
        // If admin deletion fails, try to delete via user's own session
        const { error: selfDeleteError } = await supabase.rpc('delete_user');
        if (selfDeleteError) throw selfDeleteError;
      }
      
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      toast.success('All your data has been permanently deleted', { id: loadingToast });
      
      // Redirect to homepage after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error: any) {
      console.error('Delete user data error:', error);
      toast.error('Failed to delete all data. Please contact support.', { id: loadingToast });
      throw error;
    }
  }

  /**
   * Request data portability package (all formats)
   */
  static async requestDataPackage(userId: string): Promise<void> {
    const loadingToast = toast.loading('Preparing your complete data package...');
    
    try {
      // Create a timestamp for consistent naming
      const timestamp = Date.now();
      
      // Export in all formats
      await Promise.all([
        this.exportUserData(userId, 'json'),
        this.exportUserData(userId, 'markdown'),
        this.exportUserData(userId, 'csv')
      ]);
      
      toast.success(
        'Your data package has been downloaded in JSON, Markdown, and CSV formats',
        { id: loadingToast, duration: 5000 }
      );
    } catch (error) {
      toast.error('Failed to create data package', { id: loadingToast });
      throw error;
    }
  }
}
