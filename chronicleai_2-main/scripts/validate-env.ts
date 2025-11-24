// scripts/validate-env.ts
/**
 * Environment Variable Validation Script
 * Run this before deployment to ensure all required variables are set
 * 
 * Usage: node scripts/validate-env.ts
 */

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  example?: string;
}

const PRODUCTION_ENV_VARS: EnvVariable[] = [
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validator: (val) => val.startsWith('https://') && val.includes('.supabase.co'),
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key',
    validator: (val) => val.length > 100,
    example: 'eyJhbGc...'
  },
  {
    name: 'VITE_APP_URL',
    required: true,
    description: 'Production app URL',
    validator: (val) => val.startsWith('https://'),
    example: 'https://chronicle-ai.app'
  },
  {
    name: 'VITE_SENTRY_DSN',
    required: false,
    description: 'Sentry error monitoring DSN',
    validator: (val) => val.startsWith('https://'),
    example: 'https://xxx@xxx.ingest.sentry.io/xxx'
  },
  {
    name: 'VITE_ENABLE_ANALYTICS',
    required: false,
    description: 'Enable analytics tracking',
    validator: (val) => val === 'true' || val === 'false',
    example: 'false'
  },
  {
    name: 'VITE_ENABLE_PWA',
    required: false,
    description: 'Enable Progressive Web App features',
    validator: (val) => val === 'true' || val === 'false',
    example: 'true'
  }
];

const EDGE_FUNCTION_SECRETS: EnvVariable[] = [
  {
    name: 'GEMINI_API_KEY',
    required: true,
    description: 'Google Gemini API key (set in Supabase secrets)',
    validator: (val) => val.length > 20,
    example: 'AIzaSy...'
  },
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Auto-set by Supabase',
    validator: (val) => val.startsWith('https://'),
    example: 'https://xxxxx.supabase.co'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Auto-set by Supabase',
    validator: (val) => val.length > 100,
    example: 'eyJhbGc...'
  }
];

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

function validateEnvironment(vars: EnvVariable[], envSource: 'production' | 'edge-functions'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`\n🔍 Validating ${envSource} environment variables...\n`);

  for (const envVar of vars) {
    const value = process.env[envVar.name];
    const isSet = value !== undefined && value !== '';

    if (envVar.required && !isSet) {
      errors.push(`❌ MISSING REQUIRED: ${envVar.name} - ${envVar.description}`);
      if (envVar.example) {
        errors.push(`   Example: ${envVar.example}`);
      }
    } else if (!envVar.required && !isSet) {
      warnings.push(`⚠️  OPTIONAL NOT SET: ${envVar.name} - ${envVar.description}`);
    } else if (isSet && envVar.validator && !envVar.validator(value)) {
      errors.push(`❌ INVALID FORMAT: ${envVar.name} - ${envVar.description}`);
      if (envVar.example) {
        errors.push(`   Expected format like: ${envVar.example}`);
      }
    } else if (isSet) {
      console.log(`✅ ${envVar.name}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

function printResults(result: ValidationResult): void {
  console.log('\n' + '='.repeat(60));
  
  if (result.errors.length > 0) {
    console.log('\n❌ VALIDATION FAILED\n');
    console.log('Errors:');
    result.errors.forEach(error => console.log(error));
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(warning => console.log(warning));
  }

  if (result.success) {
    console.log('\n✅ ALL REQUIRED ENVIRONMENT VARIABLES ARE SET!\n');
  } else {
    console.log('\n❌ Please fix the errors above before deploying.\n');
  }
  
  console.log('='.repeat(60) + '\n');
}

function checkSupabaseSecrets(): void {
  console.log('\n📋 Supabase Edge Function Secrets Checklist:');
  console.log('   Run these commands to verify:\n');
  console.log('   npx supabase secrets list\n');
  console.log('   Expected secrets:');
  EDGE_FUNCTION_SECRETS.forEach(secret => {
    console.log(`   - ${secret.name}: ${secret.description}`);
  });
  console.log('\n   To set a secret:');
  console.log('   npx supabase secrets set GEMINI_API_KEY=your_key\n');
}

function main() {
  console.log('\n' + '='.repeat(60));
  console.log('Chronicle AI - Environment Validation');
  console.log('='.repeat(60));

  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    console.log('\n⚠️  Note: Not running in production mode.');
    console.log('   Set NODE_ENV=production to validate production environment.\n');
  }

  // Validate production environment variables
  const prodResult = validateEnvironment(PRODUCTION_ENV_VARS, 'production');
  printResults(prodResult);

  // Show Supabase secrets checklist
  checkSupabaseSecrets();

  // Exit with error if validation failed
  if (!prodResult.success) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { validateEnvironment, ValidationResult };