import { User, Profile, SubscriptionTier } from '../../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  ...overrides,
});

export const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'test-user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  subscription_tier: 'free' as SubscriptionTier,
  ai_calls_limit: 10,
  ai_calls_used: 0,
  current_streak: 0,
  longest_streak: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockSupabaseUser = (
  overrides?: Partial<SupabaseUser>
): SupabaseUser => ({
  id: 'test-user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockProSubscription = (): Partial<Profile> => ({
  subscription_tier: 'pro',
  stripe_customer_id: 'cus_test123',
  stripe_subscription_id: 'sub_test123',
  ai_calls_limit: 100,
  ai_calls_used: 25,
  billing_period_start: new Date().toISOString(),
  billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

export const createMockPremiumSubscription = (): Partial<Profile> => ({
  subscription_tier: 'premium',
  stripe_customer_id: 'cus_premium123',
  stripe_subscription_id: 'sub_premium123',
  ai_calls_limit: -1, // unlimited
  ai_calls_used: 150,
  billing_period_start: new Date().toISOString(),
  billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});
