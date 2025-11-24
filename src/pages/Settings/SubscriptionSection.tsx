import React, { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from '@/hooks/useNavigate';
import { supabase } from '@/lib/supabase';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import { AI_CALL_PACKS } from '@/config/pricing';
import { loadStripe } from '@stripe/stripe-js';
import { config } from '@/config';

const stripePromise = loadStripe(config.stripe.publishableKey);

export const SubscriptionSection: React.FC = () => {
  const { usage, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [buyingCallPack, setBuyingCallPack] = useState(false);

  const { execute: handleManageSubscription, loading } = useAsyncAction(
    async () => {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    },
    {
      errorMessage: 'Failed to open customer portal. Please try again.',
    }
  );

  const handleBuyCallPack = async (packId: string) => {
    setBuyingCallPack(true);
    try {
      const pack = AI_CALL_PACKS.find(p => p.id === packId);
      if (!pack || !pack.stripePriceId) {
        toast.error('AI Call Pack is not available. Please contact support.');
        return;
      }

      // Create checkout session for one-time purchase
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: pack.stripePriceId,
          mode: 'payment', // One-time payment, not subscription
        },
      });

      if (error) throw error;

      if (!data.sessionId) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (redirectError) {
        throw redirectError;
      }
    } catch (error) {
      logger.error('Error purchasing AI Call Pack', error as Error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to purchase AI Call Pack. Please try again.'
      );
    } finally {
      setBuyingCallPack(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-6">Subscription</h2>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-6">Subscription</h2>
        <p className="text-stone-600">Loading subscription information...</p>
      </div>
    );
  }

  const tierColors = {
    premium: 'bg-purple-100 text-purple-800',
    pro: 'bg-indigo-100 text-indigo-800',
    free: 'bg-stone-100 text-stone-800',
  };

  const progressColor =
    usage.percentageUsed >= 100
      ? 'bg-red-500'
      : usage.percentageUsed >= 80
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-stone-800">Subscription</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${tierColors[usage.tier]}`}>
          {usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        {/* AI Usage Stats */}
        <div className="bg-stone-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">AI Analysis Usage</span>
            <span className="text-sm font-bold text-stone-900">
              {usage.aiCallsUsed} / {usage.tier === 'premium' ? '∞' : usage.aiCallsLimit}
            </span>
          </div>

          {usage.tier !== 'premium' && (
            <>
              <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${progressColor}`}
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                />
              </div>
              <p className="text-xs text-stone-600 mt-1">
                {usage.aiCallsRemaining} calls remaining this month
              </p>
            </>
          )}
        </div>

        {/* Consumable AI Calls (Pro users only) */}
        {usage.tier === 'pro' && usage.consumableAICalls !== undefined && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-indigo-900">Extra AI Calls</span>
              </div>
              <span className="text-sm font-bold text-indigo-900">
                {usage.consumableAICalls} available
              </span>
            </div>
            <p className="text-xs text-indigo-700 mb-3">
              One-time purchases that never expire. Used after your monthly limit is reached.
            </p>
            {AI_CALL_PACKS.map(pack => (
              <button
                key={pack.id}
                onClick={() => handleBuyCallPack(pack.id)}
                disabled={buyingCallPack}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {buyingCallPack ? 'Processing...' : `Buy ${pack.calls} Extra Calls - $${pack.price}`}
              </button>
            ))}
          </div>
        )}

        {/* Billing Period */}
        {usage.billingPeriodEnd && (
          <div className="text-sm text-stone-600">
            <p>
              Billing period ends:{' '}
              <span className="font-medium">
                {new Date(usage.billingPeriodEnd).toLocaleDateString()}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-2">
          {usage.tier === 'free' ? (
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Upgrade to Pro or Premium
            </button>
          ) : (
            <>
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
              {usage.tier === 'pro' && (
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-6 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition"
                >
                  Upgrade to Premium
                </button>
              )}
            </>
          )}
        </div>

        {/* Coming Soon Features (Premium users only) */}
        {usage.tier === 'premium' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Coming Soon for Premium
            </h3>
            <div className="space-y-3">
              <WaitlistFeature
                featureId="api_access"
                title="API Access"
                description="Programmatic access to your journal data and AI insights"
              />
              <WaitlistFeature
                featureId="custom_prompts"
                title="Custom AI Prompts"
                description="Create your own AI analysis prompts for personalized insights"
              />
            </div>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-stone-500 pt-2">
          {usage.tier === 'free'
            ? 'Upgrade to get more AI analysis calls and unlock advanced features.'
            : 'Manage your billing, payment methods, and subscription settings.'}
        </p>
      </div>
    </div>
  );
};

// Waitlist Feature Component
const WaitlistFeature: React.FC<{
  featureId: string;
  title: string;
  description: string;
}> = ({ featureId, title, description }) => {
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check waitlist status on mount
  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('check_waitlist_status', {
          p_feature_id: featureId,
        });

        if (error) throw error;
        if (data?.on_waitlist) {
          setOnWaitlist(true);
        }
      } catch (error) {
        logger.error('Error checking waitlist status', error as Error);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkStatus();
  }, [featureId]);

  const handleJoinWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_waitlist', {
        p_feature_id: featureId,
      });

      if (error) throw error;

      if (data?.success) {
        setOnWaitlist(true);
        toast.success(`You've been added to the ${title} waitlist!`);
      } else {
        throw new Error(data?.error || 'Failed to join waitlist');
      }
    } catch (error) {
      logger.error('Error joining waitlist', error as Error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between bg-white rounded-lg p-3 border border-blue-100">
      <div className="flex-1">
        <h4 className="font-medium text-stone-800 text-sm">{title}</h4>
        <p className="text-xs text-stone-600 mt-0.5">{description}</p>
      </div>
      <button
        onClick={handleJoinWaitlist}
        disabled={loading || onWaitlist || checkingStatus}
        className={`ml-3 px-3 py-1.5 text-xs font-medium rounded-md transition flex-shrink-0 ${
          onWaitlist
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
        }`}
      >
        {checkingStatus ? '...' : onWaitlist ? '✓ On Waitlist' : loading ? 'Joining...' : 'Join Waitlist'}
      </button>
    </div>
  );
};
