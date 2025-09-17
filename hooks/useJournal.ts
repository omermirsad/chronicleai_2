// src/hooks/useJournal.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { JournalEntry, DatabaseEntry, Database } from '../types';
import { db, storage } from '../lib/supabase';
import { useAuth } from './useAuth';
import { ErrorLogger } from '../lib/errorMonitoring';
import { validateJournalText, validateImageFile, validateMood, validateEnergy } from '../utils/validation';
import { useDebounce } from '../utils/performance';
import toast from 'react-hot-toast';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
const OFFLINE_QUEUE_KEY = 'chronicle-ai-offline-queue';
const CACHE_KEY = 'chronicle-ai-entries-cache';

interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  payload: any;
  timestamp: number;
  retryCount: number;
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Debounced search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered entries
  const filteredEntries = useMemo(() => {
    if (!debouncedSearchTerm) return entries;
    
    const term = debouncedSearchTerm.toLowerCase();
    return entries.filter(entry => 
      entry.text.toLowerCase().includes(term) ||
      entry.aiAnalysis?.tags?.some(tag => tag.toLowerCase().includes(term)) ||
      entry.guidedSession?.title.toLowerCase().includes(term)
    );
  }, [entries, debouncedSearchTerm]);

  // Load cached entries immediately
  useEffect(() => {
    const loadCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.userId === user?.id && parsedCache.entries) {
            setEntries(parsedCache.entries);
          }
        }
      } catch (error) {
        ErrorLogger.logWarning('Failed to load cache', { error });
      }
    };

    if (user) {
      loadCache();
    }
  }, [user]);

  // Cache entries when they change
  useEffect(() => {
    if (user && entries.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          userId: user.id,
          entries,
          timestamp: Date.now(),
        }));
      } catch (error) {
        ErrorLogger.logWarning('Failed to cache entries', { error });
      }
    }
  }, [user, entries]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('idle');
      processOfflineQueue();
      toast.success('Back online! Syncing your entries...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      toast.error('You are offline. Changes will sync when connection returns.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processOfflineQueue = useCallback(async () => {
    try {
      const queue: OfflineAction[] = JSON.parse(
        localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'
      );

      if (queue.length === 0 || !navigator.onLine) return;

      toast.loading('Syncing offline changes...', { id: 'syncing' });
      setSyncStatus('syncing');

      const remainingActions: OfflineAction[] = [];
      
      for (const action of queue) {
        if (action.retryCount >= 3) {
          ErrorLogger.log(new Error('Max retries exceeded for offline action'), action);
          continue;
        }

        try {
          if (action.type === 'add') {
            await db.journalEntries().insert([action.payload]);
          } else if (action.type === 'update') {
            await db.journalEntries()
              .update(action.payload)
              .eq('id', action.payload.id);
          } else if (action.type === 'delete') {
            await db.journalEntries()
              .delete()
              .eq('id', action.payload.id);
          }

          ErrorLogger.addBreadcrumb('Offline action synced', action);
        } catch (error) {
          remainingActions.push({
            ...action,
            retryCount: action.retryCount + 1,
          });
          ErrorLogger.logWarning('Failed to sync offline action', { action, error });
        }
      }

      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingActions));
      toast.dismiss('syncing');
      
      if (remainingActions.length === 0) {
        toast.success('All offline changes synced!');
        setSyncStatus('idle');
      } else {
        toast.warning(`${remainingActions.length} changes could not be synced`);
        setSyncStatus('error');
      }
    } catch (error) {
      ErrorLogger.log(error as Error, { context: 'processOfflineQueue' });
      setSyncStatus('error');
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSyncStatus('syncing');

      const { data, error } = await db.journalEntries()
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const transformedEntries = (data || []).map(transformDbEntry);
      setEntries(transformedEntries);
      setSyncStatus('idle');
      
      ErrorLogger.addBreadcrumb('Entries fetched', { count: transformedEntries.length });
    } catch (error) {
      ErrorLogger.log(error as Error, { context: 'fetchEntries' });
      toast.error('Failed to load journal entries');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const addToOfflineQueue = (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    try {
      const queue: OfflineAction[] = JSON.parse(
        localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'
      );
      
      const newAction: OfflineAction = {
        ...action,
        id: `offline-${Date.now()}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      
      queue.push(newAction);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setSyncStatus('offline');
    } catch (error) {
      ErrorLogger.log(error as Error, { context: 'addToOfflineQueue' });
    }
  };

  const addEntry = useCallback(async (
    newEntryData: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) {
      toast.error('Please sign in to add entries');
      return;
    }

    // Validate input
    const textValidation = validateJournalText(newEntryData.text);
    if (!textValidation.isValid) {
      toast.error(textValidation.error!);
      return;
    }

    if (newEntryData.mood && !validateMood(newEntryData.mood)) {
      toast.error('Invalid mood value');
      return;
    }

    if (newEntryData.energy !== undefined && !validateEnergy(newEntryData.energy)) {
      toast.error('Invalid energy value');
      return;
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticEntry: JournalEntry = {
      ...newEntryData,
      id: tempId,
      text: textValidation.sanitized,
      date: new Date(newEntryData.date).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEntries(prev => [optimisticEntry, ...prev].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ));

    // Handle photo upload if present
    let photoUrl: string | undefined;
    if (newEntryData.photo?.base64) {
      try {
        const blob = await fetch(`data:${newEntryData.photo.mimeType};base64,${newEntryData.photo.base64}`).then(r => r.blob());
        const file = new File([blob], 'photo.jpg', { type: newEntryData.photo.mimeType });
        
        const validationResult = await validateImageFile(file);
        if (!validationResult.isValid) {
          toast.error(validationResult.error!);
          setEntries(prev => prev.filter(e => e.id !== tempId));
          return;
        }

        photoUrl = await storage.photos.upload(user.id, file) || undefined;
      } catch (error) {
        ErrorLogger.log(error as Error, { context: 'photo upload' });
        toast.error('Failed to upload photo');
      }
    }

    const payload: Database['public']['Tables']['journal_entries']['Insert'] = {
      user_id: user.id,
      date: newEntryData.date,
      text: textValidation.sanitized,
      photo_url: photoUrl || newEntryData.photo?.url,
      mood: newEntryData.mood,
      energy: newEntryData.energy,
      ai_analysis: newEntryData.aiAnalysis,
      guided_session: newEntryData.guidedSession,
      tags: newEntryData.tags,
    };

    try {
      if (!isOnline) throw new Error('Offline');

      const { data, error } = await db.journalEntries()
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic entry with real one
      setEntries(prev => prev.map(e => 
        e.id === tempId ? transformDbEntry(data) : e
      ));

      toast.success('Entry saved');
      ErrorLogger.addBreadcrumb('Entry added', { id: data.id });
    } catch (error) {
      if (!isOnline) {
        addToOfflineQueue({ type: 'add', payload });
        toast.info('Entry saved offline, will sync when connected');
      } else {
        // Revert optimistic update on error
        setEntries(prev => prev.filter(e => e.id !== tempId));
        ErrorLogger.log(error as Error, { context: 'addEntry' });
        toast.error('Failed to save entry');
      }
    }
  }, [user, isOnline]);

  const updateEntry = useCallback(async (
    id: string,
    updates: Partial<JournalEntry>
  ) => {
    if (!user) return;

    // Validate updates
    if (updates.text) {
      const textValidation = validateJournalText(updates.text);
      if (!textValidation.isValid) {
        toast.error(textValidation.error!);
        return;
      }
      updates.text = textValidation.sanitized;
    }

    if (updates.mood && !validateMood(updates.mood)) {
      toast.error('Invalid mood value');
      return;
    }

    if (updates.energy !== undefined && !validateEnergy(updates.energy)) {
      toast.error('Invalid energy value');
      return;
    }

    // Optimistic update
    const originalEntries = entries;
    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));

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
      if (!isOnline) throw new Error('Offline');

      const { error } = await db.journalEntries()
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      ErrorLogger.addBreadcrumb('Entry updated', { id });
    } catch (error) {
      if (!isOnline) {
        addToOfflineQueue({ type: 'update', payload: { ...payload, id } });
        toast.info('Changes saved offline, will sync when connected');
      } else {
        // Revert optimistic update on error
        setEntries(originalEntries);
        ErrorLogger.log(error as Error, { context: 'updateEntry' });
        toast.error('Failed to update entry');
      }
    }
  }, [user, entries, isOnline]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;

    // Optimistic update
    const originalEntries = entries;
    const entryToDelete = entries.find(e => e.id === id);
    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      if (!isOnline) throw new Error('Offline');

      // Delete photo if exists
      if (entryToDelete?.photo?.url) {
        await storage.photos.delete(entryToDelete.photo.url);
      }

      const { error } = await db.journalEntries()
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entry deleted');
      ErrorLogger.addBreadcrumb('Entry deleted', { id });
    } catch (error) {
      if (!isOnline) {
        addToOfflineQueue({ type: 'delete', payload: { id } });
        toast.info('Deletion saved offline, will sync when connected');
      } else {
        // Revert optimistic update on error
        setEntries(originalEntries);
        ErrorLogger.log(error as Error, { context: 'deleteEntry' });
        toast.error('Failed to delete entry');
      }
    }
  }, [user, entries, isOnline]);

  return {
    entries: filteredEntries,
    allEntries: entries,
    loading,
    syncStatus,
    isOnline,
    searchTerm,
    setSearchTerm,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: fetchEntries,
  };
};
