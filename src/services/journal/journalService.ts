import { supabase } from '../../lib/supabase';
import type { JournalEntry, DatabaseEntry } from '../../types';

/**
 * Transform database entry to application journal entry
 */
export const transformDbEntry = (dbEntry: DatabaseEntry): JournalEntry => ({
  id: dbEntry.id,
  date: dbEntry.date,
  text: dbEntry.text,
  photo: dbEntry.photo_url ? { url: dbEntry.photo_url } : undefined,
  mood: dbEntry.mood,
  energy: dbEntry.energy,
  aiAnalysis: dbEntry.ai_analysis,
  guidedSession: dbEntry.guided_session,
  tags: dbEntry.tags,
  createdAt: dbEntry.created_at,
  updatedAt: dbEntry.updated_at,
});

/**
 * Journal Service - Abstracts database operations for journal entries
 */
export class JournalService {
  /**
   * Fetch all journal entries for a user
   */
  static async fetchEntries(userId: string, filters?: {
    mood?: number | null;
    energyMin?: number | null;
    energyMax?: number | null;
    tags?: string[];
    guidedSessionType?: string | null;
    search?: string;
  }): Promise<JournalEntry[]> {
    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply filters if provided
    if (filters) {
      if (filters.mood !== null && filters.mood !== undefined) {
        query = query.eq('mood', filters.mood);
      }
      if (filters.energyMin !== null && filters.energyMin !== undefined) {
        query = query.gte('energy', filters.energyMin);
      }
      if (filters.energyMax !== null && filters.energyMax !== undefined) {
        query = query.lte('energy', filters.energyMax);
      }
      if (filters.guidedSessionType) {
        query = query.eq('guided_session->type', filters.guidedSessionType);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      if (filters.search) {
        query = query.ilike('text', `%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(transformDbEntry);
  }

  /**
   * Insert a new journal entry
   */
  /**
   * Insert a new journal entry
   */
  static async insertEntry(payload: Omit<DatabaseEntry, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Explicitly cast to any to avoid strict type mismatch with Supabase auto-generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('journal_entries') as any).insert([payload]);
    if (error) throw error;
  }

  /**
   * Update an existing journal entry
   */
  static async updateEntry(
    id: string,
    payload: Partial<Omit<DatabaseEntry, 'id' | 'user_id' | 'created_at'>>
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('journal_entries') as any).update(payload).eq('id', id);
    if (error) throw error;
  }

  /**
   * Delete a journal entry
   */
  static async deleteEntry(id: string): Promise<void> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Get entry count for a user
   */
  static async getEntryCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get entries for a specific date range
   */
  static async getEntriesInRange(userId: string, startDate: string, endDate: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDbEntry);
  }
}
