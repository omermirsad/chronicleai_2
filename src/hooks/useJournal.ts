import * as React from 'react';
import { JournalEntry, DatabaseEntry, Database } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
const OFFLINE_QUEUE_KEY = 'chronicle-ai-offline-queue';

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
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>('idle');

  const processOfflineQueue = React.useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0 || !navigator.onLine) return;

    toast.loading('Syncing offline changes...', { id: 'syncing' });
    setSyncStatus('syncing');

    const remainingActions = [];

    for (const action of queue) {
        let success = false;
        try {
            // Fix: Cast `supabase.from(...)` to `any` to bypass type inference issues
            // where method parameters are incorrectly inferred as `never`.
            if (action.type === 'add') {
                await (supabase.from('journal_entries') as any).insert([action.payload]);
            } else if (action.type === 'update') {
                await (supabase.from('journal_entries') as any).update(action.payload).eq('id', action.id);
            } else if (action.type === 'delete') {
                await supabase.from('journal_entries').delete().eq('id', action.id);
            }
            success = true;
        } catch (error) {
            console.error('Failed to sync action:', action, error);
            remainingActions.push(action);
        }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingActions));
    toast.dismiss('syncing');
    if (remainingActions.length < queue.length) {
        toast.success('Offline changes synced!');
        // await fetchEntries(); // Refresh all data after sync
    } else {
        toast.error('Failed to sync offline changes.');
    }
    setSyncStatus(remainingActions.length > 0 ? 'error' : 'idle');

  }, []);

  const fetchEntries = React.useCallback(async () => {
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

  React.useEffect(() => {
    fetchEntries();
    window.addEventListener('online', processOfflineQueue);
    return () => window.removeEventListener('online', processOfflineQueue);
  }, [fetchEntries, processOfflineQueue]);

  React.useEffect(() => {
    if (!user) return;

    const changes = supabase.channel('journal-entries-changes')
      .on<DatabaseEntry>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries(prev => [transformDbEntry(payload.new as DatabaseEntry), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEntries(prev => prev.map(e => e.id === (payload.new as DatabaseEntry).id ? transformDbEntry(payload.new as DatabaseEntry) : e));
          } else if (payload.eventType === 'DELETE') {
            setEntries(prev => prev.filter(e => e.id !== (payload.old as DatabaseEntry).id));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(changes);
    };
  }, [user]);

  const addToOfflineQueue = (action: any) => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setSyncStatus('offline');
  };

  const addEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: JournalEntry = { ...newEntryData, id: tempId, date: new Date(newEntryData.date).toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setEntries(prev => [optimisticEntry, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    // FIX: Manually map properties from the camelCase JournalEntry to the snake_case payload
    // to match the database schema. The previous use of object spreading was causing a type mismatch.
    const payload: Database['public']['Tables']['journal_entries']['Insert'] = {
        user_id: user.id,
        date: newEntryData.date,
        text: newEntryData.text,
        photo_url: newEntryData.photo?.url,
        mood: newEntryData.mood,
        energy: newEntryData.energy,
        ai_analysis: newEntryData.aiAnalysis,
        guided_session: newEntryData.guidedSession,
        tags: newEntryData.tags
    };
    
    try {
      if (!navigator.onLine) throw new Error("Offline");
      // Fix: Cast `supabase.from(...)` to `any` to bypass type inference issues
      // where method parameters are incorrectly inferred as `never`.
      const { error } = await (supabase.from('journal_entries') as any).insert([payload]);
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
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  
    // FIX: Manually map properties from the partial camelCase JournalEntry update object
    // to a partial snake_case payload to match the database schema.
    const payload: Database['public']['Tables']['journal_entries']['Update'] = {};
    if ('date' in updates) payload.date = updates.date;
    if ('text' in updates) payload.text = updates.text;
    if ('photo' in updates) payload.photo_url = updates.photo?.url;
    if ('mood' in updates) payload.mood = updates.mood;
    if ('energy' in updates) payload.energy = updates.energy;
    if ('aiAnalysis' in updates) payload.ai_analysis = updates.aiAnalysis;
    if ('guidedSession' in updates) payload.guided_session = updates.guidedSession;
    if ('tags' in updates) payload.tags = updates.tags;
  
    try {
      if (!navigator.onLine) throw new Error("Offline");
      // Fix: Cast `supabase.from(...)` to `any` to bypass type inference issues
      // where method parameters are incorrectly inferred as `never`.
      const { error } = await (supabase.from('journal_entries') as any).update(payload).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.warn('Updating entry offline:', error);
      setEntries(originalEntries); // Revert for offline
      addToOfflineQueue({ type: 'update', id, payload });
      toast.info('Changes saved offline, will sync when connected.');
    }
  };
  
  const deleteEntry = async (id: string) => {
    if (!user) return;
  
    const originalEntries = entries;
    setEntries(prev => prev.filter(e => e.id !== id));
  
    try {
      if (!navigator.onLine) throw new Error("Offline");
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) throw error;
      toast.success('Entry deleted');
    } catch (error) {
      console.warn('Deleting entry offline:', error);
      setEntries(originalEntries); // Revert for offline
      addToOfflineQueue({ type: 'delete', id });
      toast.info('Deletion saved offline, will sync when connected.');
    }
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry, syncStatus };
};