import React, { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from '../../hooks/useNavigate';
import { supabase } from '../../lib/supabase';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import toast from 'react-hot-toast';

export const SubscriptionSection: React.FC = () => {
  const { usage, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

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
