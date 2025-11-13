// src/config/pricing.ts
import { PricingPlan } from '../types';
import { config } from './index';

/**
 * Pricing plans configuration
 * Note: Stripe Price IDs should be configured in environment variables
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: '', // No Stripe integration for free tier
    features: [
      '10 AI analysis calls per month',
      'Basic mood and energy tracking',
      'Guided journaling sessions',
      'Photo uploads',
      'Voice-to-text input',
      'Data export',
    ],
    aiCallsLimit: 10,
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 9.99,
    yearlyPrice: 99.99, // ~2 months free
    stripePriceId: config.stripe.proPriceId,
    stripeYearlyPriceId: config.stripe.proYearlyPriceId,
    features: [
      '100 AI analysis calls per month',
      'All Free features',
      'Advanced insights and analytics',
      'Perspective Lens (3 AI viewpoints)',
      'Calendar heatmap view',
      'Tag cloud visualization',
      'Priority support',
    ],
    aiCallsLimit: 100,
    popular: true,
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 19.99,
    yearlyPrice: 199.99, // ~2 months free
    stripePriceId: config.stripe.premiumPriceId,
    stripeYearlyPriceId: config.stripe.premiumYearlyPriceId,
    features: [
      'Unlimited AI analysis calls',
      'All Pro features',
      'Advanced pattern recognition',
      'Custom AI prompts',
      'Export to multiple formats',
      'API access (coming soon)',
      'Dedicated support',
    ],
    aiCallsLimit: 'unlimited',
  },
];

/**
 * Get pricing plan by tier
 */
export const getPlanByTier = (tier: string): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.tier === tier);
};

/**
 * Get feature comparison for pricing table
 */
export const FEATURE_COMPARISON = [
  {
    category: 'AI Analysis',
    features: [
      {
        name: 'Monthly AI calls',
        free: '10',
        pro: '100',
        premium: 'Unlimited',
      },
      {
        name: 'Instant entry analysis',
        free: true,
        pro: true,
        premium: true,
      },
      {
        name: 'Perspective Lens',
        free: false,
        pro: true,
        premium: true,
      },
      {
        name: 'Custom AI prompts',
        free: false,
        pro: false,
        premium: true,
      },
    ],
  },
  {
    category: 'Journaling Features',
    features: [
      {
        name: 'Mood & energy tracking',
        free: true,
        pro: true,
        premium: true,
      },
      {
        name: 'Photo uploads',
        free: true,
        pro: true,
        premium: true,
      },
      {
        name: 'Voice-to-text input',
        free: true,
        pro: true,
        premium: true,
      },
      {
        name: 'Guided sessions',
        free: true,
        pro: true,
        premium: true,
      },
    ],
  },
  {
    category: 'Analytics & Insights',
    features: [
      {
        name: 'Basic mood charts',
        free: true,
        pro: true,
        premium: true,
      },
      {
        name: 'Energy level trends',
        free: false,
        pro: true,
        premium: true,
      },
      {
        name: 'Tag cloud visualization',
        free: false,
        pro: true,
        premium: true,
      },
      {
        name: 'Calendar heatmap',
        free: false,
        pro: true,
        premium: true,
      },
      {
        name: 'Advanced pattern recognition',
        free: false,
        pro: false,
        premium: true,
      },
    ],
  },
  {
    category: 'Support & Extras',
    features: [
      {
        name: 'Data export',
        free: 'Basic',
        pro: 'Advanced',
        premium: 'All formats',
      },
      {
        name: 'Support',
        free: 'Community',
        pro: 'Priority',
        premium: 'Dedicated',
      },
      {
        name: 'API access',
        free: false,
        pro: false,
        premium: 'Coming soon',
      },
    ],
  },
];

/**
 * Stripe-related constants
 */
export const STRIPE_CONFIG = {
  // Stripe Customer Portal URL (will be generated dynamically)
  customerPortalUrl: `${config.app.url}/api/stripe/create-portal-session`,

  // Checkout success/cancel URLs
  checkoutSuccessUrl: `${config.app.url}/settings?payment=success`,
  checkoutCancelUrl: `${config.app.url}/pricing?payment=cancelled`,
};
