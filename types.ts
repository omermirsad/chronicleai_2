export interface User {
  id: string;
  email: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  photo?: {
    base64: string;
    mimeType: string;
  };
  mood?: number; // 1-5 scale
  energy?: number; // 0-100 scale
  aiAnalysis?: AIAnalysis;
  guidedSession?: {
    type: GuidedSessionType;
    title: string;
  }
}

export interface AIAnalysis {
  summary: string[];
  tags: string[];
  sentiment: string;
  acknowledgement?: string;
  socraticQuestion?: string;
}

export interface Perspective {
  title: string;
  content: string;
}

export type View = 'feed' | 'editor' | 'insights' | 'calendar';

export type GuidedSessionType = 'gratitude' | 'challenge' | 'review' | 'future-self' | 'mindful-observation' | 'stoic-reflection';