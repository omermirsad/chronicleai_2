// src/pages/PricingPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { PRICING_PLANS } from '../config/pricing';
import { PricingPlan, SubscriptionTier } from '../types';
import { loadStripe } from '@stripe/stripe-js';
import { config } from '../config';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { logger } from '../utils/logger';

const stripePromise = loadStripe(config.stripe.publishableKey);

interface PricingCardProps {
  plan: PricingPlan;
  currentTier?: SubscriptionTier;
  billingPeriod: 'monthly' | 'yearly';
  onSelectPlan: (plan: PricingPlan) => void;
  loading: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  currentTier,
  billingPeriod,
  onSelectPlan,
  loading,
}) => {
  const isCurrentPlan = currentTier === plan.tier;
  const isFree = plan.tier === 'free';

  const displayPrice = billingPeriod === 'yearly' && plan.yearlyPrice
    ? plan.yearlyPrice
    : plan.price;

  const monthlyEquivalent = billingPeriod === 'yearly' && plan.yearlyPrice
    ? (plan.yearlyPrice / 12).toFixed(2)
    : null;

  return (
    <div
      className={`relative rounded-2xl border-2 p-8 shadow-lg transition-all hover:shadow-xl ${
        plan.popular
          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-white scale-105'
          : 'border-gray-200 bg-white'
      } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-4 right-4 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
          Current Plan
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-5xl font-extrabold text-gray-900">
            ${isFree ? '0' : displayPrice}
          </span>
          {!isFree && (
            <span className="ml-2 text-gray-500">
              /{billingPeriod === 'yearly' ? 'year' : 'month'}
            </span>
          )}
        </div>
        {monthlyEquivalent && (
          <p className="mt-1 text-sm text-gray-600">
            (${monthlyEquivalent}/month billed annually)
          </p>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center">
          <span className="text-3xl font-bold text-indigo-600">
            {typeof plan.aiCallsLimit === 'number' ? plan.aiCallsLimit : '∞'}
          </span>
          <span className="ml-2 text-sm text-gray-600">
            AI calls per month
          </span>
        </div>
      </div>

      <ul className="mb-8 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="mr-3 h-5 w-5 flex-shrink-0 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelectPlan(plan)}
        disabled={loading || isCurrentPlan || isFree}
        className={`w-full rounded-lg py-3 px-4 font-semibold transition-colors ${
          isCurrentPlan
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : isFree
            ? 'bg-gray-200 text-gray-700 cursor-default'
            : plan.popular
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
        }`}
        aria-label={`Select ${plan.name} plan`}
      >
        {loading
          ? 'Processing...'
          : isCurrentPlan
          ? 'Current Plan'
          : isFree
          ? 'Free Forever'
          : `Upgrade to ${plan.name}`}
      </button>
    </div>
  );
};

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const { usage } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return;
    }

    if (plan.tier === 'free') {
      return; // Free tier doesn't need checkout
    }

    try {
      setLoading(true);

      // Get the appropriate price ID based on billing period
      const priceId = billingPeriod === 'yearly'
        ? plan.stripeYearlyPriceId
        : plan.stripePriceId;

      if (!priceId) {
        toast.error('Pricing configuration error. Please contact support.');
        return;
      }

      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          email: user.email,
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
      logger.error('Error creating checkout session:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start checkout. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Pricing Plans</h1>
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Start free, upgrade when you're ready for more AI-powered insights
          </p>

          {usage && (
            <div className="mt-6 inline-flex items-center rounded-full bg-indigo-100 px-6 py-2">
              <span className="text-sm font-medium text-indigo-900">
                Current plan: <span className="font-bold capitalize">{usage.tier}</span>
                {' • '}
                {usage.aiCallsRemaining} of {usage.aiCallsLimit} AI calls remaining
              </span>
            </div>
          )}
        </div>

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              aria-pressed={billingPeriod === 'monthly'}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
              aria-pressed={billingPeriod === 'yearly'}
            >
              Yearly
              <span className="ml-1 text-xs font-semibold text-green-600">
                (Save 17%)
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.tier}
              plan={plan}
              currentTier={usage?.tier}
              billingPeriod={billingPeriod}
              onSelectPlan={handleSelectPlan}
              loading={loading}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h3 className="text-center text-2xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">
                What counts as an AI call?
              </h4>
              <p className="text-gray-600">
                Each time you save a journal entry with AI analysis enabled, or use the
                Perspective Lens feature, it counts as one AI call.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be
                prorated and reflected in your next billing cycle.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">
                What happens if I exceed my limit?
              </h4>
              <p className="text-gray-600">
                You'll be prompted to upgrade when you reach your limit. You can still
                write entries, but AI analysis won't be available until you upgrade or
                your limit resets next month.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow">
              <h4 className="font-semibold text-gray-900 mb-2">
                Is my data secure?
              </h4>
              <p className="text-gray-600">
                Absolutely. All your data is encrypted and stored securely. We never
                sell your data or use it for any purpose other than providing you with
                the service.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
