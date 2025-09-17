

// Fix: Import React types
import { useState, useEffect } from 'react';
import { JournalEntry } from '../types';

const JOURNAL_STORAGE_KEY = 'chronicle-ai-journal';

export const useJournal = () => {
  // Fix: Add generic type to useState
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }
    } catch (error) {
      console.error("Failed to load entries from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveEntries = (updatedEntries: JournalEntry[]) => {
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Failed to save entries to localStorage", error);
    }
  };

  const addEntry = (newEntry: JournalEntry) => {
    const updatedEntries = [newEntry, ...entries];
    saveEntries(updatedEntries);
  };

  const updateEntry = (id: string, updatedData: Partial<JournalEntry>) => {
    const updatedEntries = entries.map(entry =>
      entry.id === id ? { ...entry, ...updatedData } : entry
    );
    saveEntries(updatedEntries);
  };
  
  // Fix: Add deleteEntry function
  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    saveEntries(updatedEntries);
  };

  // Fix: Add missing properties to returned object
  return { entries, addEntry, updateEntry, deleteEntry, loading, syncStatus: 'idle' as const };
};
