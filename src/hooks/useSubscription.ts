// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SubscriptionTier, SubscriptionUsage } from '../types';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

export const useSubscription = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data
  const fetchSubscription = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, ai_calls_used, ai_calls_limit, consumable_ai_calls, billing_period_start, billing_period_end')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        const aiCallsUsed = profile.ai_calls_used || 0;
        const aiCallsLimit = profile.ai_calls_limit || 10;
        const aiCallsRemaining = Math.max(0, aiCallsLimit - aiCallsUsed);
        const percentageUsed = aiCallsLimit > 0 ? (aiCallsUsed / aiCallsLimit) * 100 : 0;
        const consumableAICalls = profile.consumable_ai_calls || 0;

        setUsage({
          tier: (profile.subscription_tier as SubscriptionTier) || 'free',
          aiCallsUsed,
          aiCallsLimit,
          aiCallsRemaining,
          percentageUsed,
          consumableAICalls,
          billingPeriodStart: profile.billing_period_start || undefined,
          billingPeriodEnd: profile.billing_period_end || undefined,
        });
      }
    } catch (err) {
      logger.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has reached their AI calls limit (including consumable calls)
  const hasReachedLimit = (): boolean => {
    if (!usage) return false;
    return usage.aiCallsRemaining <= 0 && usage.consumableAICalls <= 0;
  };

  // Check if user can make an AI call (either monthly or consumable)
  const canMakeAICall = (): boolean => {
    return !hasReachedLimit();
  };

  // Increment AI call counter
  const incrementAICallCount = async (): Promise<{ success: boolean; message?: string }> => {
    if (!user?.id) {
      return { success: false, message: 'User not authenticated' };
    }

    if (hasReachedLimit()) {
      return {
        success: false,
        message: `You've reached your limit of ${usage?.aiCallsLimit} AI calls this month. Please upgrade to continue.`
      };
    }

    try {
      // Use the database function to increment safely
      const { data, error } = await supabase
        .rpc('increment_ai_calls', { user_uuid: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];

        if (!result.success) {
          return {
            success: false,
            message: `You've reached your limit of ${result.calls_limit} AI calls this month. Please upgrade to continue.`
          };
        }

        // Update local state
        if (usage) {
          setUsage({
            ...usage,
            aiCallsUsed: result.calls_used,
            aiCallsRemaining: result.calls_remaining,
            percentageUsed: (result.calls_used / result.calls_limit) * 100,
          });
        }

        return { success: true };
      }

      return { success: false, message: 'Failed to update AI call count' };
    } catch (err) {
      logger.error('Error incrementing AI call count:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to track AI usage'
      };
    }
  };

  // Update subscription tier (typically called after successful Stripe checkout)
  const updateSubscriptionTier = async (
    newTier: SubscriptionTier,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .rpc('update_subscription_tier', {
          user_uuid: user.id,
          new_tier: newTier,
          new_stripe_customer_id: stripeCustomerId,
          new_stripe_subscription_id: stripeSubscriptionId,
        });

      if (error) throw error;

      // Refresh subscription data
      await fetchSubscription();
      return true;
    } catch (err) {
      logger.error('Error updating subscription tier:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
      return false;
    }
  };

  // Get subscription status text
  const getStatusText = (): string => {
    if (!usage) return 'Loading...';

    const { tier, aiCallsRemaining, aiCallsLimit, consumableAICalls } = usage;

    if (tier === 'premium') {
      return 'Unlimited AI analysis';
    }

    if (aiCallsRemaining === 0 && consumableAICalls === 0) {
      return 'Limit reached';
    }

    const totalRemaining = aiCallsRemaining + consumableAICalls;
    return `${totalRemaining} AI calls remaining (${aiCallsRemaining}/${aiCallsLimit} monthly${consumableAICalls > 0 ? ` + ${consumableAICalls} extra` : ''})`;
  };

  // Get usage color (for UI indicators)
  const getUsageColor = (): 'green' | 'yellow' | 'red' => {
    if (!usage) return 'green';

    if (usage.percentageUsed >= 100) return 'red';
    if (usage.percentageUsed >= 80) return 'yellow';
    return 'green';
  };

  // Initial fetch
  useEffect(() => {
    fetchSubscription();
  }, [user?.id]);

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    usage,
    loading,
    error,
    hasReachedLimit,
    canMakeAICall,
    incrementAICallCount,
    updateSubscriptionTier,
    getStatusText,
    getUsageColor,
    refresh: fetchSubscription,
  };
};
