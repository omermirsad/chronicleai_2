import { useState, useCallback, useEffect } from 'react';
import { GuidedSessionType } from '../types';
import { getGuidedPrompt } from '../services/geminiService';
import { logger } from '@/lib/logger';
import { STORAGE_KEYS } from '../constants';

export interface GuidedHistoryItem {
  prompt: string;
  response: string;
}

export interface GuidedSession {
  type: GuidedSessionType;
  title: string;
}

/**
 * Hook for managing guided journaling sessions
 * Extracted from JournalEditor to follow Single Responsibility Principle
 */
export const useGuidedSession = () => {
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [history, setHistory] = useState<GuidedHistoryItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptChoices, setPromptChoices] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  /**
   * Fetch next prompt for the guided session
   */
  const fetchNextPrompt = useCallback(
    async (sessionType: GuidedSessionType, currentHistory: GuidedHistoryItem[]) => {
      setIsThinking(true);
      setCurrentPrompt('');
      setPromptChoices([]);

      try {
        const prompts = await getGuidedPrompt(sessionType, currentHistory);
        if (prompts.length === 1) {
          setCurrentPrompt(prompts[0]);
        } else {
          setPromptChoices(prompts);
        }
      } catch (error) {
        logger.error('Failed to fetch next prompt:', error);
        throw error;
      } finally {
        setIsThinking(false);
      }
    },
    []
  );

  /**
   * Advance the session with a response
   */
  const advanceSession = useCallback(
    (response: string) => {
      const newHistory = [...history, { prompt: currentPrompt, response }];
      setHistory(newHistory);
      setCurrentResponse('');
      return newHistory;
    },
    [history, currentPrompt]
  );

  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback(
    (additionalData?: { mood?: number | null; energy?: number }) => {
      if (!session) return;

      const draft = {
        session,
        history,
        currentResponse,
        timestamp: Date.now(),
        ...additionalData,
      };

      localStorage.setItem(STORAGE_KEYS.GUIDED_DRAFT, JSON.stringify(draft));
    },
    [session, history, currentResponse]
  );

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(STORAGE_KEYS.GUIDED_DRAFT);
      if (!draft) return null;

      const parsed = JSON.parse(draft);
      const isRecent = Date.now() - parsed.timestamp < 1000 * 60 * 60; // 1 hour

      if (isRecent && parsed.history?.length > 0) {
        return parsed;
      }

      return null;
    } catch (error) {
      logger.error('Failed to load guided session draft:', error);
      return null;
    }
  }, []);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.GUIDED_DRAFT);
  }, []);

  /**
   * Reset guided session state
   */
  const resetSession = useCallback(() => {
    setSession(null);
    setHistory([]);
    setCurrentPrompt('');
    setPromptChoices([]);
    setCurrentResponse('');
    setIsThinking(false);
  }, []);

  /**
   * Select a prompt from choices
   */
  const selectPrompt = useCallback((choice: string) => {
    setCurrentPrompt(choice);
    setPromptChoices([]);
  }, []);

  /**
   * Initialize session with a type
   */
  const initializeSession = useCallback(
    async (sessionData: GuidedSession) => {
      setSession(sessionData);
      await fetchNextPrompt(sessionData.type, []);
    },
    [fetchNextPrompt]
  );

  /**
   * Resume session from draft
   */
  const resumeFromDraft = useCallback(
    async (draft: any) => {
      setSession(draft.session);
      setHistory(draft.history);
      setCurrentResponse(draft.currentResponse || '');
      await fetchNextPrompt(draft.session.type, draft.history);
      return {
        mood: draft.mood,
        energy: draft.energy,
      };
    },
    [fetchNextPrompt]
  );

  return {
    // State
    session,
    history,
    currentPrompt,
    promptChoices,
    currentResponse,
    isThinking,

    // Actions
    setSession,
    setHistory,
    setCurrentPrompt,
    setPromptChoices,
    setCurrentResponse,
    setIsThinking,
    fetchNextPrompt,
    advanceSession,
    saveDraft,
    loadDraft,
    clearDraft,
    resetSession,
    selectPrompt,
    initializeSession,
    resumeFromDraft,
  };
};
