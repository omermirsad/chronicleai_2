#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are set before deployment
 */

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
}

const envChecks: EnvCheck[] = [
  // Required for all environments
  {
    key: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
  },
  {
    key: 'VITE_APP_URL',
    required: true,
    description: 'Application URL',
  },

  // Stripe configuration (required for production)
  {
    key: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe publishable key',
  },
  {
    key: 'VITE_STRIPE_PRO_PRICE_ID',
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe Pro monthly price ID',
  },
  {
    key: 'VITE_STRIPE_PRO_YEARLY_PRICE_ID',
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe Pro yearly price ID',
  },
  {
    key: 'VITE_STRIPE_PREMIUM_PRICE_ID',
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe Premium monthly price ID',
  },
  {
    key: 'VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID',
    required: process.env.NODE_ENV === 'production',
    description: 'Stripe Premium yearly price ID',
  },

  // Optional but recommended
  {
    key: 'VITE_SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error monitoring (recommended for production)',
  },
  {
    key: 'VITE_ENABLE_PWA',
    required: false,
    description: 'Enable PWA features',
  },
  {
    key: 'VITE_ENABLE_ANALYTICS',
    required: false,
    description: 'Enable analytics tracking',
  },
];

function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const check of envChecks) {
    const value = process.env[check.key];
    const hasValue = value && value.trim() !== '';

    if (check.required && !hasValue) {
      errors.push(`❌ ${check.key} - ${check.description}`);
    } else if (!check.required && !hasValue) {
      warnings.push(`⚠️  ${check.key} - ${check.description}`);
    } else {
      console.log(`✅ ${check.key}`);
    }
  }

  console.log('');

  if (warnings.length > 0) {
    console.log('⚠️  Warnings (optional variables):');
    warnings.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ Missing required environment variables:');
    errors.forEach(error => console.log(`   ${error}`));
    console.log('');
    console.log('💡 Please check your .env file and ensure all required variables are set.');
    console.log('   See .env.example for reference.\n');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set!\n');

  // Additional checks for production
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Production environment checks:');

    const productionChecks = [
      {
        condition: process.env.VITE_APP_URL?.includes('localhost'),
        message: '⚠️  APP_URL is set to localhost - this should be your production domain',
      },
      {
        condition: !process.env.VITE_SENTRY_DSN,
        message: '⚠️  SENTRY_DSN is not set - error monitoring is disabled',
      },
      {
        condition: process.env.VITE_ENABLE_ANALYTICS !== 'true',
        message: '⚠️  Analytics is disabled - consider enabling for production',
      },
    ];

    productionChecks.forEach(({ condition, message }) => {
      if (condition) {
        console.log(`   ${message}`);
      }
    });

    console.log('');
  }
}

// Run validation
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Validation failed:', error);
  process.exit(1);
}
