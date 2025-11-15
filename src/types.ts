// src/types.ts

import { AppLanguage } from './config/languages';

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'premium';

// Guided session types (moved before DatabaseEntry and Database)
export type GuidedSessionType =
  | 'gratitude'
  | 'challenge'
  | 'review'
  | 'future-self'
  | 'mindful-observation'
  | 'stoic-reflection';

// AI Analysis interface (moved before DatabaseEntry and Database)
export interface AIAnalysis {
  summary: string[];
  tags: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | string;
  acknowledgement?: string;
  socraticQuestion?: string;
}

// Gamification types (moved before Database)
export type AchievementCategory = 'streak' | 'entries' | 'insights' | 'exploration';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement_type: 'count' | 'streak' | 'consecutive';
  requirement_value: number;
  points: number;
  created_at?: string;
}

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
  current_streak?: number;
  longest_streak?: number;
  last_entry_date?: string;
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
          current_streak?: number;
          longest_streak?: number;
          last_entry_date?: string;
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
    Views: {};
    Functions: {
      get_user_achievements: {
        Args: { user_id_param: string };
        Returns: Array<{
          achievement_id: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          points: number;
          earned_at: string;
        }>;
      };
      check_and_award_achievements: {
        Args: { user_id_param: string };
        Returns: { newly_awarded_achievements: any[] }[];
      };
      increment_ai_calls: {
        Args: { user_uuid: string };
        Returns: Array<{
          success: boolean;
          calls_used: number;
          calls_limit: number;
          calls_remaining: number;
        }>;
      };
      update_subscription_tier: {
        Args: {
          user_uuid: string;
          new_tier: SubscriptionTier;
          new_stripe_customer_id?: string;
          new_stripe_subscription_id?: string;
        };
        Returns: void;
      };
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

export interface Perspective {
  title: string;
  content: string;
}

export type View = 'feed' | 'editor' | 'insights' | 'calendar';

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
  consumableAICalls: number; // One-time AI calls purchased separately
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: AchievementDefinition;
}

export interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  achievements: UserAchievement[];
  nextMilestone?: {
    achievement: AchievementDefinition;
    progress: number;
    total: number;
  };
}

// User preferences (email notifications and language)
export interface UserPreferences {
  emailNotifications: boolean;
  insightsFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  weeklyDigest: boolean;
  onThisDay: boolean;
  streakReminders: boolean;
  achievementNotifications: boolean;
  language?: AppLanguage;
}

// Backwards compatibility alias
export type EmailPreferences = UserPreferences;

// Coaching types
export type CoachingModuleType =
  | 'goal-setting'
  | 'anxiety-management'
  | 'gratitude-practice'
  | 'self-compassion'
  | 'mindfulness';

export interface CoachingStep {
  stepNumber: number;
  prompt: string;
  userResponse?: string;
  aiFollowUp?: string;
}

export interface CoachingSession {
  moduleType: CoachingModuleType;
  title: string;
  currentStep: number;
  totalSteps: number;
  steps: CoachingStep[];
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}
