// src/hooks/useJournal.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, DatabaseEntry, Database } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { sanitizeTextInput, sanitizeTags, validateUUID } from '../utils/security';
import { SecureStorage } from '../utils/encryption';
import toast from 'react-hot-toast';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
const ENTRIES_PER_PAGE = 20;
const OFFLINE_QUEUE_KEY = 'offline_queue';
const MAX_RETRY_ATTEMPTS = 3;

interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  payload?: any;
  timestamp: number;
  retryCount: number;
}

const transformDbEntry = (dbEntry: DatabaseEntry): JournalEntry => ({
  id: dbEntry.id,
  date: dbEntry.date,
  text: dbEntry.text,
  photo: dbEntry.photo_url ? { url: dbEntry.photo_url } : undefined,
  mood: dbEntry.mood ?? undefined,
  energy: dbEntry.energy ?? undefined,
  aiAnalysis: dbEntry.ai_analysis as any,
  guidedSession: dbEntry.guided_session as any,
  tags: dbEntry.tags ?? undefined,
  createdAt: dbEntry.created_at,
  updatedAt: dbEntry.updated_at,
});

export const useJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const abortControllerRef = useRef<AbortController>();
  const loadingRef = useRef(false);

  // Process offline queue with retry logic
  const processOfflineQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    try {
      const queueData = await SecureStorage.getItem(OFFLINE_QUEUE_KEY, user.id);
      const queue: OfflineAction[] = queueData || [];
      
      if (queue.length === 0) return;

      toast.loading('Syncing offline changes...', { id: 'syncing' });
      setSyncStatus('syncing');

      const remainingActions: OfflineAction[] = [];

      for (const action of queue) {
        if (action.retryCount >= MAX_RETRY_ATTEMPTS) {
          console.error('Max retries exceeded for action:', action);
          continue;
        }

        let success = false;
        
        try {
          switch (action.type) {
            case 'add':
              const { error: addError } = await supabase
                .from('journal_entries')
                .insert([action.payload]);
              success = !addError;
              break;
              
            case 'update':
              if (!validateUUID(action.id)) throw new Error('Invalid UUID');
              const { error: updateError } = await supabase
                .from('journal_entries')
                .update(action.payload)
                .eq('id', action.id)
                .eq('user_id', user.id);
              success = !updateError;
              break;
              
            case 'delete':
              if (!validateUUID(action.id)) throw new Error('Invalid UUID');
              const { error: deleteError } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', action.id)
                .eq('user_id', user.id);
              success = !deleteError;
              break;
          }
        } catch (error) {
          console.error('Failed to sync action:', action, error);
          action.retryCount++;
          remainingActions.push(action);
        }

        if (!success && action.retryCount < MAX_RETRY_ATTEMPTS) {
          action.retryCount++;
          remainingActions.push(action);
        }
      }

      await SecureStorage.setItem(OFFLINE_QUEUE_KEY, remainingActions, user.id);
      
      toast.dismiss('syncing');
      if (remainingActions.length === 0) {
        toast.success('All offline changes synced!');
        setSyncStatus('idle');
      } else {
        toast.error(`${remainingActions.length} changes failed to sync`);
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Failed to process offline queue:', error);
      setSyncStatus('error');
    }
  }, [user]);

  // Fetch entries with pagination
  const fetchEntries = useCallback(async (pageNumber: number = 0, append: boolean = false) => {
    if (!user || loadingRef.current) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      loadingRef.current = true;
      setSyncStatus('syncing');
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
        
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Fetch paginated entries
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .range(
          pageNumber * ENTRIES_PER_PAGE,
          (pageNumber + 1) * ENTRIES_PER_PAGE - 1
        );

      if (error) throw error;

      const transformedEntries = (data || []).map(transformDbEntry);
      
      if (append) {
        setEntries(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEntries = transformedEntries.filter(e => !existingIds.has(e.id));
          return [...prev, ...newEntries];
        });
      } else {
        setEntries(transformedEntries);
      }
      
      setHasMore(transformedEntries.length === ENTRIES_PER_PAGE);
      setPage(pageNumber);
      setSyncStatus('idle');
      
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      
      console.error('Error fetching entries:', error);
      
      if (!navigator.onLine) {
        setSyncStatus('offline');
        toast.error('You are offline. Showing cached entries.');
        // Load from secure storage if offline
        const cachedEntries = await SecureStorage.getItem('cached_entries', user.id);
        if (cachedEntries) {
          setEntries(cachedEntries);
        }
      } else {
        setSyncStatus('error');
        toast.error('Failed to load journal entries');
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  // Load more entries
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchEntries(page + 1, true);
    }
  }, [page, loading, hasMore, fetchEntries]);

  // Infinite scroll observer
  const lastEntryRef = useCallback((node: HTMLElement | null) => {
    if (loading) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );
    
    if (node) observer.observe(node);
    
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [loading, hasMore, loadMore]);

  // Initial load and online/offline handling
  useEffect(() => {
    if (user) {
      fetchEntries();
      processOfflineQueue();
    }

    const handleOnline = () => {
      toast.success('Back online! Syncing changes...');
      setSyncStatus('syncing');
      processOfflineQueue();
    };

    const handleOffline = () => {
      toast.error('You are offline. Changes will sync when connected.');
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user, fetchEntries, processOfflineQueue]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel(`journal-entries-${user.id}`)
      .on<DatabaseEntry>(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'journal_entries', 
          filter: `user_id=eq.${user.id}` 
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEntry = transformDbEntry(payload.new as DatabaseEntry);
            setEntries(prev => {
              if (prev.some(e => e.id === newEntry.id)) return prev;
              return [newEntry, ...prev].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
            });
            setTotalCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedEntry = transformDbEntry(payload.new as DatabaseEntry);
            setEntries(prev => prev.map(e => 
              e.id === updatedEntry.id ? updatedEntry : e
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as DatabaseEntry).id;
            setEntries(prev => prev.filter(e => e.id !== deletedId));
            setTotalCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Add offline queue action
  const addToOfflineQueue = async (action: Omit<OfflineAction, 'timestamp' | 'retryCount'>) => {
    if (!user) return;
    
    const queue = await SecureStorage.getItem(OFFLINE_QUEUE_KEY, user.id) || [];
    const newAction: OfflineAction = {
      ...action,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    queue.push(newAction);
    await SecureStorage.setItem(OFFLINE_QUEUE_KEY, queue, user.id);
    setSyncStatus('offline');
  };

  // Add entry
  const addEntry = async (newEntryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    // Generate temporary ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticEntry: JournalEntry = {
      ...newEntryData,
      id: tempId,
      text: sanitizeTextInput(newEntryData.text),
      tags: newEntryData.tags ? sanitizeTags(newEntryData.tags) : undefined,
      date: new Date(newEntryData.date).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistically update UI
    setEntries(prev => [optimisticEntry, ...prev]);
    setTotalCount(prev => prev + 1);

    // Prepare database payload
    const payload: Database['public']['Tables']['journal_entries']['Insert'] = {
      user_id: user.id,
      date: optimisticEntry.date,
      text: optimisticEntry.text,
      photo_url: newEntryData.photo?.url,
      mood: newEntryData.mood,
      energy: newEntryData.energy,
      ai_analysis: newEntryData.aiAnalysis as any,
      guided_session: newEntryData.guidedSession as any,
      tags: optimisticEntry.tags
    };
    
    try {
      if (!navigator.onLine) throw new Error("Offline");
      
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      
      // Replace temp entry with real entry
      if (data) {
        setEntries(prev => prev.map(e => 
          e.id === tempId ? transformDbEntry(data) : e
        ));
      }
      
      toast.success('Entry saved');
      
      // Cache entries for offline access
      const allEntries = await SecureStorage.getItem('cached_entries', user.id) || [];
      allEntries.unshift(transformDbEntry(data));
      await SecureStorage.setItem('cached_entries', allEntries.slice(0, 50), user.id);
      
    } catch (error) {
      console.warn('Saving entry offline:', error);
      await addToOfflineQueue({ type: 'add', payload, id: tempId });
      toast.info('Entry saved offline, will sync when connected.');
    }
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    if (!user || !validateUUID(id)) return;

    // Optimistically update
    const originalEntries = entries;
    setEntries(prev => prev.map(e => 
      e.id === id ? { 
        ...e, 
        ...updates,
        text: updates.text ? sanitizeTextInput(updates.text) : e.text,
        tags: updates.tags ? sanitizeTags(updates.tags) : e.tags,
        updatedAt: new Date().toISOString()
      } : e
    ));

    const payload: Database['public']['Tables']['journal_entries']['Update'] = {};
    if ('date' in updates) payload.date = updates.date;
    if ('text' in updates) payload.text = sanitizeTextInput(updates.text!);
    if ('photo' in updates) payload.photo_url = updates.photo?.url;
    if ('mood' in updates) payload.mood = updates.mood;
    if ('energy' in updates) payload.energy = updates.energy;
    if ('aiAnalysis' in updates) payload.ai_analysis = updates.aiAnalysis as any;
    if ('guidedSession' in updates) payload.guided_session = updates.guidedSession as any;
    if ('tags' in updates) payload.tags = updates.tags ? sanitizeTags(updates.tags) : undefined;

    try {
      if (!navigator.onLine) throw new Error("Offline");
      
      const { error } = await supabase
        .from('journal_entries')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      toast.success('Entry updated');
    } catch (error) {
      console.warn('Updating entry offline:', error);
      setEntries(originalEntries); // Revert
      await addToOfflineQueue({ type: 'update', id, payload });
      toast.info('Changes saved offline, will sync when connected.');
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!user || !validateUUID(id)) return;

    // Optimistically update
    const originalEntries = entries;
    setEntries(prev => prev.filter(e => e.id !== id));
    setTotalCount(prev => Math.max(0, prev - 1));

    try {
      if (!navigator.onLine) throw new Error("Offline");
      
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      toast.success('Entry deleted');
      
      // Update cache
      const cachedEntries = await SecureStorage.getItem('cached_entries', user.id) || [];
      const filtered = cachedEntries.filter((e: JournalEntry) => e.id !== id);
      await SecureStorage.setItem('cached_entries', filtered, user.id);
      
    } catch (error) {
      console.warn('Deleting entry offline:', error);
      setEntries(originalEntries); // Revert
      await addToOfflineQueue({ type: 'delete', id });
      toast.info('Deletion saved offline, will sync when connected.');
    }
  };

  return {
    entries,
    loading,
    initialLoading,
    hasMore,
    totalCount,
    syncStatus,
    addEntry,
    updateEntry,
    deleteEntry,
    loadMore,
    lastEntryRef,
    refetch: () => fetchEntries(0, false)
  };
};
