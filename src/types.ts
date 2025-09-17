// src/types.ts

// public.profiles
export interface Profile {
  id: string; // uuid
  updated_at?: string; // timestamp with time zone
  email: string;
  full_name?: string;
  avatar_url?: string;
}

// public.journal_entries
export interface DatabaseEntry {
  id: string; // uuid
  user_id: string; // uuid
  created_at?: string; // timestamp with time zone
  updated_at?: string; // timestamp with time zone
  date: string; // timestamp with time zone
  text: string;
  photo_url?: string;
  mood?: number; // 1-5
  energy?: number; // 0-100
  // Fix: Changed type from `any` to a specific interface to fix Supabase type inference.
  ai_analysis?: AIAnalysis;
  // Fix: Changed type from `any` to a specific interface to fix Supabase type inference.
  guided_session?: {
    type: GuidedSessionType;
    title: string;
  };
  tags?: string[];
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        // Fix: Removed 'created_at' from Omit as it's not in the Profile interface.
        Insert: Omit<Profile, 'id' | 'updated_at'>;
        Update: Partial<Profile>;
      };
      journal_entries: {
        Row: DatabaseEntry;
        Insert: Omit<DatabaseEntry, 'id' | 'updated_at' | 'created_at'>;
        Update: Partial<DatabaseEntry>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}


// App-specific types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  photo?: {
    base64?: string; // for upload
    mimeType?: string; // for upload
    url?: string; // from storage
  };
  mood?: number; // 1-5 scale
  energy?: number; // 0-100 scale
  aiAnalysis?: AIAnalysis;
  guidedSession?: {
    type: GuidedSessionType;
    title: string;
  };
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AIAnalysis {
  summary: string[];
  tags: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | string;
  acknowledgement?: string;
  socraticQuestion?: string;
}

export interface Perspective {
  title: string;
  content: string;
}

export type View = 'feed' | 'editor' | 'insights' | 'calendar';

export type GuidedSessionType = 
  | 'gratitude' 
  | 'challenge' 
  | 'review' 
  | 'future-self' 
  | 'mindful-observation' 
  | 'stoic-reflection';
