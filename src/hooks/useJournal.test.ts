import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useJournal } from './useJournal';
import { JournalService } from '../services/journal/journalService';
import { createMockJournalEntry, createMockUser } from '../test/mocks';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: createMockUser(),
  })),
}));

vi.mock('./useOfflineSync', () => ({
  useOfflineSync: vi.fn(() => ({
    syncStatus: 'idle',
    addToOfflineQueue: vi.fn(),
    processOfflineQueue: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../services/journal/journalService', () => ({
  JournalService: {
    fetchEntries: vi.fn(),
    insertEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useJournal', () => {
  const mockEntries = [
    createMockJournalEntry({ id: '1', text: 'Entry 1' }),
    createMockJournalEntry({ id: '2', text: 'Entry 2' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch entries on mount when user is authenticated', async () => {
    vi.mocked(JournalService.fetchEntries).mockResolvedValue(mockEntries);

    const { result } = renderHook(() => useJournal());

    // Initially loading
    expect(result.current.loading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(JournalService.fetchEntries).toHaveBeenCalledWith('test-user-123', undefined);
    expect(result.current.entries).toEqual(mockEntries);
  });

  it('should add a new entry successfully when online', async () => {
    vi.mocked(JournalService.fetchEntries).mockResolvedValue([]);
    vi.mocked(JournalService.insertEntry).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newEntry = {
      date: new Date().toISOString(),
      text: 'New test entry',
      mood: 4,
      energy: 75,
      tags: ['test'],
    };

    await act(async () => {
      await result.current.addEntry(newEntry);
    });

    expect(JournalService.insertEntry).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Entry saved');
  });

  it('should handle offline entry creation', async () => {
    const { useOfflineSync } = await import('./useOfflineSync');
    const mockAddToOfflineQueue = vi.fn();

    vi.mocked(useOfflineSync).mockReturnValue({
      syncStatus: 'offline',
      addToOfflineQueue: mockAddToOfflineQueue,
      processOfflineQueue: vi.fn().mockResolvedValue(undefined),
      hasPendingActions: vi.fn(),
      clearOfflineQueue: vi.fn(),
    });

    vi.mocked(JournalService.fetchEntries).mockResolvedValue([]);
    vi.mocked(JournalService.insertEntry).mockRejectedValue(new Error('Offline'));

    // Set navigator to offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newEntry = {
      date: new Date().toISOString(),
      text: 'Offline entry',
      mood: 3,
      energy: 50,
      tags: [],
    };

    await act(async () => {
      await result.current.addEntry(newEntry);
    });

    expect(mockAddToOfflineQueue).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Entry saved offline, will sync when connected.');
  });

  it('should update an existing entry', async () => {
    vi.mocked(JournalService.fetchEntries).mockResolvedValue(mockEntries);
    vi.mocked(JournalService.updateEntry).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updates = { text: 'Updated text', mood: 5 };

    await act(async () => {
      await result.current.updateEntry('1', updates);
    });

    expect(JournalService.updateEntry).toHaveBeenCalledWith('1', {
      text: 'Updated text',
      mood: 5,
    });
  });

  it('should delete an entry', async () => {
    vi.mocked(JournalService.fetchEntries).mockResolvedValue(mockEntries);
    vi.mocked(JournalService.deleteEntry).mockResolvedValue(undefined);

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteEntry('1');
    });

    expect(JournalService.deleteEntry).toHaveBeenCalledWith('1');
    expect(toast.success).toHaveBeenCalledWith('Entry deleted');
  });

  it('should fetch entries with filters', async () => {
    vi.mocked(JournalService.fetchEntries).mockResolvedValue(mockEntries);

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const filters = { mood: 4, energyMin: 50 };

    await act(async () => {
      await result.current.fetchEntries(filters);
    });

    expect(JournalService.fetchEntries).toHaveBeenCalledWith('test-user-123', filters);
  });

  it('should handle errors when fetching entries', async () => {
    vi.mocked(JournalService.fetchEntries).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useJournal());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to load entries');
    expect(result.current.entries).toEqual([]);
  });
});
