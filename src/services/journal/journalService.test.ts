import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JournalService, transformDbEntry } from './journalService';
import { supabase } from '../../lib/supabase';
import { createMockDatabaseEntry, createMockDatabaseEntriesArray } from '../../test/mocks';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('JournalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('transformDbEntry', () => {
    it('should transform database entry to journal entry', () => {
      const dbEntry = createMockDatabaseEntry({
        id: 'test-id',
        photo_url: 'https://example.com/photo.jpg',
        mood: 4,
        energy: 75,
      });

      const result = transformDbEntry(dbEntry);

      expect(result).toEqual({
        id: 'test-id',
        date: dbEntry.date,
        text: dbEntry.text,
        photo: { url: 'https://example.com/photo.jpg' },
        mood: 4,
        energy: 75,
        aiAnalysis: dbEntry.ai_analysis,
        guidedSession: dbEntry.guided_session,
        tags: dbEntry.tags,
        createdAt: dbEntry.created_at,
        updatedAt: dbEntry.updated_at,
      });
    });

    it('should handle missing photo_url', () => {
      const dbEntry = createMockDatabaseEntry({ photo_url: undefined });

      const result = transformDbEntry(dbEntry);

      expect(result.photo).toBeUndefined();
    });
  });

  describe('fetchEntries', () => {
    it('should fetch all entries for a user', async () => {
      const mockEntries = createMockDatabaseEntriesArray(3);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await JournalService.fetchEntries('user-123');

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toHaveLength(3);
    });

    it('should apply mood filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      };

      mockQuery.order.mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await JournalService.fetchEntries('user-123', { mood: 4 });

      expect(mockQuery.eq).toHaveBeenCalledWith('mood', 4);
    });

    it('should apply energy range filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
      };

      mockQuery.lte.mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await JournalService.fetchEntries('user-123', {
        energyMin: 50,
        energyMax: 80,
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('energy', 50);
      expect(mockQuery.lte).toHaveBeenCalledWith('energy', 80);
    });

    it('should apply tags filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        contains: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await JournalService.fetchEntries('user-123', {
        tags: ['work', 'productivity'],
      });

      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['work', 'productivity']);
    });

    it('should apply search filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await JournalService.fetchEntries('user-123', {
        search: 'test search',
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith('text', '%test search%');
    });

    it('should apply guided session type filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await JournalService.fetchEntries('user-123', {
        guidedSessionType: 'gratitude',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('guided_session->type', 'gratitude');
    });

    it('should throw error on database error', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(JournalService.fetchEntries('user-123')).rejects.toEqual({
        message: 'Database error',
      });
    });
  });

  describe('insertEntry', () => {
    it('should insert a new entry', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const payload = {
        user_id: 'user-123',
        date: new Date().toISOString(),
        text: 'Test entry',
        mood: 4,
        energy: 75,
      };

      await JournalService.insertEntry(payload);

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockInsert).toHaveBeenCalledWith([payload]);
    });

    it('should throw error on insert failure', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const payload = {
        user_id: 'user-123',
        date: new Date().toISOString(),
        text: 'Test entry',
      };

      await expect(JournalService.insertEntry(payload)).rejects.toEqual({
        message: 'Insert failed',
      });
    });
  });

  describe('updateEntry', () => {
    it('should update an existing entry', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const payload = { text: 'Updated text', mood: 5 };

      await JournalService.updateEntry('entry-123', payload);

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockUpdate).toHaveBeenCalledWith(payload);
      expect(mockEq).toHaveBeenCalledWith('id', 'entry-123');
    });

    it('should throw error on update failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      await expect(JournalService.updateEntry('entry-123', { text: 'Updated' })).rejects.toEqual({
        message: 'Update failed',
      });
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      await JournalService.deleteEntry('entry-123');

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'entry-123');
    });

    it('should throw error on delete failure', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);

      await expect(JournalService.deleteEntry('entry-123')).rejects.toEqual({
        message: 'Delete failed',
      });
    });
  });

  describe('getEntryCount', () => {
    it('should return entry count for a user', async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: 42, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const count = await JournalService.getEntryCount('user-123');

      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(count).toBe(42);
    });

    it('should return 0 when count is null', async () => {
      const mockEq = vi.fn().mockResolvedValue({ count: null, error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const count = await JournalService.getEntryCount('user-123');

      expect(count).toBe(0);
    });
  });

  describe('getEntriesInRange', () => {
    it('should fetch entries within date range', async () => {
      const mockEntries = createMockDatabaseEntriesArray(2);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEntries, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const result = await JournalService.getEntriesInRange('user-123', startDate, endDate);

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.gte).toHaveBeenCalledWith('date', startDate);
      expect(mockQuery.lte).toHaveBeenCalledWith('date', endDate);
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
      expect(result).toHaveLength(2);
    });
  });
});
