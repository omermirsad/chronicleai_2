import { useState, useCallback } from 'react';
import { GuidedSessionType } from '../../types';

export interface EditorState {
  text: string;
  setText: (text: string) => void;
  photo: { base64: string; mimeType: string } | null;
  setPhoto: (photo: { base64: string; mimeType: string } | null) => void;
  mood: number | null;
  setMood: (mood: number | null) => void;
  energy: number;
  setEnergy: (energy: number) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  resetState: () => void;
}

export function useEditorState(): EditorState {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<{ base64: string; mimeType: string } | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setText('');
    setPhoto(null);
    setMood(null);
    setEnergy(50);
    setIsProcessing(false);
  }, []);

  return {
    text,
    setText,
    photo,
    setPhoto,
    mood,
    setMood,
    energy,
    setEnergy,
    isProcessing,
    setIsProcessing,
    resetState,
  };
}

export interface GuidedSessionState {
  session: { type: GuidedSessionType; title: string } | null;
  setSession: (session: { type: GuidedSessionType; title: string } | null) => void;
  history: { prompt: string; response: string }[];
  setHistory: (history: { prompt: string; response: string }[]) => void;
  currentPrompt: string;
  setCurrentPrompt: (prompt: string) => void;
  promptChoices: string[];
  setPromptChoices: (choices: string[]) => void;
  currentResponse: string;
  setCurrentResponse: (response: string) => void;
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
  resetGuidedSession: () => void;
}

export function useGuidedSessionState(): GuidedSessionState {
  const [session, setSession] = useState<{ type: GuidedSessionType; title: string } | null>(null);
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptChoices, setPromptChoices] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const resetGuidedSession = useCallback(() => {
    setSession(null);
    setHistory([]);
    setCurrentPrompt('');
    setPromptChoices([]);
    setCurrentResponse('');
    setIsThinking(false);
  }, []);

  return {
    session,
    setSession,
    history,
    setHistory,
    currentPrompt,
    setCurrentPrompt,
    promptChoices,
    setPromptChoices,
    currentResponse,
    setCurrentResponse,
    isThinking,
    setIsThinking,
    resetGuidedSession,
  };
}
