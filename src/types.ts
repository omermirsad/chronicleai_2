// src/types.ts

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'premium';

// public.profiles
export interface Profile {
  id: string; // uuid
  updated_at?: string; // timestamp with time zone
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  ai_calls_limit?: number;
  ai_calls_used?: number;
  billing_period_start?: string;
  billing_period_end?: string;
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
  ai_analysis?: AIAnalysis;
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
        Row: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          preferences?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          ai_calls_limit?: number;
          ai_calls_used?: number;
          billing_period_start?: string;
          billing_period_end?: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          preferences?: Record<string, any>;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          avatar_url?: string;
          preferences?: Record<string, any>;
          subscription_tier?: SubscriptionTier;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          ai_calls_limit?: number;
          ai_calls_used?: number;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: DatabaseEntry;
        Insert: Omit<DatabaseEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseEntry, 'id' | 'user_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
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

// Subscription and pricing types
export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // monthly price in dollars
  yearlyPrice?: number; // yearly price in dollars (if applicable)
  stripePriceId?: string;
  stripeYearlyPriceId?: string;
  features: string[];
  aiCallsLimit: number | 'unlimited';
  popular?: boolean;
}

export interface SubscriptionUsage {
  tier: SubscriptionTier;
  aiCallsUsed: number;
  aiCallsLimit: number;
  aiCallsRemaining: number;
  percentageUsed: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
}
