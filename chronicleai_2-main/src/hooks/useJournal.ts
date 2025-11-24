import { useState, useEffect, useCallback } from 'react';
import { JournalEntry, DatabaseEntry } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
const OFFLINE_QUEUE_KEY = 'chronicle-ai-offline-queue';

interface OfflineAction {
  type: 'add' | 'update' | 'delete';
  id?: string;
  payload?: any;
}

const transformDbEntry = (dbEntry: DatabaseEntry): JournalEntry => ({
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

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const processOfflineQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    const queueData = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueData) return;

    const queue: OfflineAction[] = JSON.parse(queueData);
    if (queue.length === 0) return;

    toast.loading('Syncing offline changes...', { id: 'syncing' });
    setSyncStatus('syncing');

    const remainingActions: OfflineAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === 'add') {
          await supabase.from('journal_entries').insert([action.payload]);
        } else if (action.type === 'update' && action.id) {
          await supabase.from('journal_entries').update(action.payload).eq('id', action.id);
        } else if (action.type === 'delete' && action.id) {
          await supabase.from('journal_entries').delete().eq('id', action.id);
        }
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        remainingActions.push(action);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingActions));
    toast.dismiss('syncing');

    if (remainingActions.length < queue.length) {
      toast.success('Offline changes synced!');
    } else {
      toast.error('Failed to sync offline changes.');
    }

    setSyncStatus(remainingActions.length > 0 ? 'error' : 'idle');
  }, [user]);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setEntries((data || []).map(transformDbEntry));
      setSyncStatus('idle');
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error('Failed to load journal entries.');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
    window.addEventListener('online', processOfflineQueue);
    return () => window.removeEventListener('online', processOfflineQueue);
  }, [fetchEntries, processOfflineQueue]);

  useEffect(() => {
    if (!user) return;

    const changes = supabase
      .channel('journal-entries-changes')
      .on<DatabaseEntry>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries((prev) => [
              transformDbEntry(payload.new as DatabaseEntry),
              ...prev,
            ]);
          } else if (payload.eventType === 'UPDATE') {
            setEntries((prev) =>
              prev.map((e) =>
                e.id === (payload.new as DatabaseEntry).id
                  ? transformDbEntry(payload.new as DatabaseEntry)
                  : e
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEntries((prev) => prev.filter((e) => e.id !== (payload.old as DatabaseEntry).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(changes);
    };
  }, [user]);

  const addToOfflineQueue = (action: OfflineAction) => {
    const queueData = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: OfflineAction[] = queueData ? JSON.parse(queueData) : [];
    queue.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setSyncStatus('offline');
  };

  const addEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: JournalEntry = {
      ...newEntryData,
      id: tempId,
      date: new Date(newEntryData.date).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEntries((prev) =>
      [optimisticEntry, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    );

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

      const { error } = await supabase.from('journal_entries').insert([payload]);
      if (error) throw error;

      toast.success('Entry saved');
    } catch (error) {
      console.warn('Saving entry offline:', error);
      addToOfflineQueue({ type: 'add', payload });
      toast.info('Entry saved offline, will sync when connected.');
    }
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!user) return;

    const originalEntries = entries;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));

    const payload: Record<string, any> = {};
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

      const { error } = await supabase.from('journal_entries').update(payload).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn('Updating entry offline:', error);
      setEntries(originalEntries);
      addToOfflineQueue({ type: 'update', id, payload });
      toast.info('Changes saved offline, will sync when connected.');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;

    const originalEntries = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      if (!navigator.onLine) throw new Error('Offline');

      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;

      toast.success('Entry deleted');
    } catch (error) {
      console.warn('Deleting entry offline:', error);
      setEntries(originalEntries);
      addToOfflineQueue({ type: 'delete', id });
      toast.info('Deletion saved offline, will sync when connected.');
    }
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry, syncStatus };
};
