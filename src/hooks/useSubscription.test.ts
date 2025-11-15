import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSubscription } from './useSubscription';
import { supabase } from '../lib/supabase';
import { createMockUser, createMockProfile } from '../test/mocks';
import type { SubscriptionTier } from '../types';

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: createMockUser(),
  })),
}));

describe('useSubscription', () => {
  const mockProfile = createMockProfile({
    subscription_tier: 'free',
    ai_calls_used: 5,
    ai_calls_limit: 10,
    consumable_ai_calls: 0,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for supabase.channel
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    } as any);
  });

  it('should fetch subscription data on mount', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage).toEqual({
      tier: 'free',
      aiCallsUsed: 5,
      aiCallsLimit: 10,
      aiCallsRemaining: 5,
      percentageUsed: 50,
      consumableAICalls: 0,
      billingPeriodStart: undefined,
      billingPeriodEnd: undefined,
    });
  });

  it('should correctly calculate aiCallsRemaining', async () => {
    const profileWithHighUsage = createMockProfile({
      ai_calls_used: 9,
      ai_calls_limit: 10,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: profileWithHighUsage,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usage?.aiCallsRemaining).toBe(1);
    expect(result.current.usage?.percentageUsed).toBe(90);
  });

  it('should detect when limit is reached', async () => {
    const profileAtLimit = createMockProfile({
      ai_calls_used: 10,
      ai_calls_limit: 10,
      consumable_ai_calls: 0,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: profileAtLimit,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasReachedLimit()).toBe(true);
    expect(result.current.canMakeAICall()).toBe(false);
  });

  it('should allow AI calls when consumable calls are available', async () => {
    const profileWithConsumable = createMockProfile({
      ai_calls_used: 10,
      ai_calls_limit: 10,
      consumable_ai_calls: 5,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: profileWithConsumable,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasReachedLimit()).toBe(false);
    expect(result.current.canMakeAICall()).toBe(true);
  });

  it('should increment AI call count successfully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          success: true,
          calls_used: 6,
          calls_limit: 10,
          calls_remaining: 4,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const incrementResult = await result.current.incrementAICallCount();

    expect(incrementResult.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('increment_ai_calls', {
      user_uuid: 'test-user-123',
    });
    expect(result.current.usage?.aiCallsUsed).toBe(6);
    expect(result.current.usage?.aiCallsRemaining).toBe(4);
  });

  it('should fail to increment when limit is reached', async () => {
    const profileAtLimit = createMockProfile({
      ai_calls_used: 10,
      ai_calls_limit: 10,
      consumable_ai_calls: 0,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: profileAtLimit,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const incrementResult = await result.current.incrementAICallCount();

    expect(incrementResult.success).toBe(false);
    expect(incrementResult.message).toContain('reached your limit');
  });

  it('should update subscription tier', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn()
            .mockResolvedValueOnce({
              data: mockProfile,
              error: null,
            })
            .mockResolvedValueOnce({
              data: { ...mockProfile, subscription_tier: 'pro', ai_calls_limit: 100 },
              error: null,
            }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const success = await result.current.updateSubscriptionTier(
      'pro' as SubscriptionTier,
      'cus_test',
      'sub_test'
    );

    expect(success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('update_subscription_tier', {
      user_uuid: 'test-user-123',
      new_tier: 'pro',
      new_stripe_customer_id: 'cus_test',
      new_stripe_subscription_id: 'sub_test',
    });
  });

  it('should return correct status text for free tier', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const statusText = result.current.getStatusText();
    expect(statusText).toBe('5 AI calls remaining (5/10 monthly)');
  });

  it('should return correct status text for premium tier', async () => {
    const premiumProfile = createMockProfile({
      subscription_tier: 'premium',
      ai_calls_limit: -1,
    });

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: premiumProfile,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const statusText = result.current.getStatusText();
    expect(statusText).toBe('Unlimited AI analysis');
  });

  it('should return correct usage color', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 50% usage should be green
    expect(result.current.getUsageColor()).toBe('green');
  });

  it('should handle subscription fetch errors', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom);

    const { result } = renderHook(() => useSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.usage).toBeNull();
  });
});
