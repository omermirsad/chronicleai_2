import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { JournalService } from '../services/journal/journalService';
import { STORAGE_KEYS } from '../constants';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import type { DatabaseEntry } from '../types';

type AddAction = {
  type: 'add';
  payload: Omit<DatabaseEntry, 'id' | 'created_at' | 'updated_at'>;
};

type UpdateAction = {
  type: 'update';
  id: string;
  payload: Partial<Omit<DatabaseEntry, 'id' | 'user_id' | 'created_at'>>;
};

type DeleteAction = {
  type: 'delete';
  id: string;
};

type OfflineAction = AddAction | UpdateAction | DeleteAction;
type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

/**
 * Hook for managing offline queue and synchronization
 */
export function useOfflineSync() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  /**
   * Load offline queue from localStorage
   */
  const loadOfflineQueue = useCallback((): OfflineAction[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to load offline queue:', error);
      return [];
    }
  }, []);

  /**
   * Save offline queue to localStorage
   */
  const saveOfflineQueue = useCallback((queue: OfflineAction[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      logger.error('Failed to save offline queue:', error);
    }
  }, []);

  /**
   * Add an action to the offline queue
   */
  const addToOfflineQueue = useCallback(
    (action: OfflineAction) => {
      const queue = loadOfflineQueue();
      queue.push(action);
      saveOfflineQueue(queue);
      setSyncStatus('offline');
    },
    [loadOfflineQueue, saveOfflineQueue]
  );

  /**
   * Process the offline queue and sync with server
   */
  const processOfflineQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;

    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    toast.loading('Syncing offline changes...', { id: 'syncing' });
    setSyncStatus('syncing');

    const remainingActions: OfflineAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === 'add') {
          await JournalService.insertEntry(action.payload);
        } else if (action.type === 'update') {
          await JournalService.updateEntry(action.id, action.payload);
        } else if (action.type === 'delete') {
          await JournalService.deleteEntry(action.id);
        }
      } catch (error) {
        logger.error('Failed to sync action:', action, error);
        remainingActions.push(action);
      }
    }

    saveOfflineQueue(remainingActions);
    toast.dismiss('syncing');

    if (remainingActions.length < queue.length) {
      toast.success('Offline changes synced!');
    } else {
      toast.error('Failed to sync offline changes.');
    }

    setSyncStatus(remainingActions.length > 0 ? 'error' : 'idle');

    return remainingActions.length === 0;
  }, [user, loadOfflineQueue, saveOfflineQueue]);

  /**
   * Check if there are pending offline actions
   */
  const hasPendingActions = useCallback(() => {
    return loadOfflineQueue().length > 0;
  }, [loadOfflineQueue]);

  /**
   * Clear the offline queue
   */
  const clearOfflineQueue = useCallback(() => {
    saveOfflineQueue([]);
    setSyncStatus('idle');
  }, [saveOfflineQueue]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!user) return;

    const handleOnline = () => {
      processOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, processOfflineQueue]);

  // Try to sync on mount if online
  useEffect(() => {
    if (user && navigator.onLine) {
      processOfflineQueue();
    }
  }, [user]);

  return {
    syncStatus,
    addToOfflineQueue,
    processOfflineQueue,
    hasPendingActions,
    clearOfflineQueue,
  };
}
