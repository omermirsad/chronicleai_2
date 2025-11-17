import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { JournalEntry } from '../types';
import { JournalService } from '../services/journal/journalService';
import { useAuth } from './useAuth';
import { useOfflineSync } from './useOfflineSync';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

/**
 * Hook for managing journal entries with offline support
 */
export const useJournal = () => {
  const { user } = useAuth();
  const { syncStatus, addToOfflineQueue, processOfflineQueue } = useOfflineSync();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all journal entries for the current user
   */
  const fetchEntries = useCallback(
    async (filters?: {
      mood?: number | null;
      energyMin?: number | null;
      energyMax?: number | null;
      tags?: string[];
      guidedSessionType?: string | null;
      search?: string;
    }) => {
      if (!user) return;

      try {
        setLoading(true);
        const fetchedEntries = await JournalService.fetchEntries(user.id, filters);
        setEntries(fetchedEntries);
      } catch (error) {
        logger.error('Error fetching entries:', error);
        toast.error('Failed to load entries');
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Add a new journal entry
   */
  const addEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    // Optimistic update
    const optimisticEntry: JournalEntry = {
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...newEntryData,
    };
    setEntries((prev) => [optimisticEntry, ...prev]);

    const payload = {
      user_id: user.id,
      date: newEntryData.date,
      text: newEntryData.text,
      photo_url: newEntryData.photo?.url,
      mood: newEntryData.mood,
      energy: newEntryData.energy,
      ai_analysis: newEntryData.aiAnalysis,
      guided_session: newEntryData.guidedSession,
      tags: newEntryData.tags,
    };

    try {
      if (!navigator.onLine) throw new Error('Offline');

      await JournalService.insertEntry(payload);

      // Haptic feedback for successful save
      if (Capacitor.isNativePlatform()) {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
          console.error('Haptics error:', error);
        }
      }

      toast.success('Entry saved');

      // Refresh entries to get the real entry from the server
      await fetchEntries();
    } catch (error) {
      logger.warn('Saving entry offline:', error);
      addToOfflineQueue({ type: 'add', payload });
      toast.info('Entry saved offline, will sync when connected.');
    }
  };

  /**
   * Update an existing journal entry
   */
  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) return;

    // Optimistic update
    const originalEntries = [...entries];
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)));

    const payload: Partial<any> = {};
    if ('date' in updates) payload.date = updates.date;
    if ('text' in updates) payload.text = updates.text;
    if ('photo' in updates) payload.photo_url = updates.photo?.url;
    if ('mood' in updates) payload.mood = updates.mood;
    if ('energy' in updates) payload.energy = updates.energy;
    if ('aiAnalysis' in updates) payload.ai_analysis = updates.aiAnalysis;
    if ('guidedSession' in updates) payload.guided_session = updates.guidedSession;
    if ('tags' in updates) payload.tags = updates.tags;

    try {
      if (!navigator.onLine) throw new Error('Offline');

      await JournalService.updateEntry(id, payload);

      // Haptic feedback for successful update
      if (Capacitor.isNativePlatform()) {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch (error) {
          console.error('Haptics error:', error);
        }
      }
    } catch (error) {
      logger.warn('Updating entry offline:', error);
      setEntries(originalEntries);
      addToOfflineQueue({ type: 'update', id, payload });
      toast.info('Update saved offline, will sync when connected.');
    }
  };

  /**
   * Delete a journal entry
   */
  const deleteEntry = async (id: string) => {
    if (!user) return;

    // Optimistic update
    const originalEntries = [...entries];
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    try {
      if (!navigator.onLine) throw new Error('Offline');

      await JournalService.deleteEntry(id);
      toast.success('Entry deleted');
    } catch (error) {
      logger.warn('Deleting entry offline:', error);
      setEntries(originalEntries);
      addToOfflineQueue({ type: 'delete', id });
      toast.info('Delete saved offline, will sync when connected.');
    }
  };

  // Load entries on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchEntries();
    } else {
      setEntries([]);
      setLoading(false);
    }
  }, [user, fetchEntries]);

  // Process offline queue when coming online
  useEffect(() => {
    const handleOnline = async () => {
      await processOfflineQueue();
      if (user) {
        fetchEntries();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, processOfflineQueue, fetchEntries]);

  return {
    entries,
    loading,
    syncStatus,
    addEntry,
    updateEntry,
    deleteEntry,
    fetchEntries,
  };
};
