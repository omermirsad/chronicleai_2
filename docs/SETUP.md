# Setup Guide - Facebook/Meta-Level Development Environment

## Quick Start

```bash
# Clone repository
git clone https://github.com/omermirsad/chronicleai_2.git
cd chronicleai_2

# Install dependencies
npm install

# Set up Git hooks (Husky)
npm run prepare

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## Prerequisites

- **Node.js**: ≥18.0.0 (LTS recommended)
- **npm**: ≥9.0.0
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "vitest.explorer"
  ]
}
```

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- Production dependencies
- Development dependencies
- Playwright browsers (for E2E tests)

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_VERSION=2.0.0

# Features (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=false

# Monitoring (optional)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=development
```

### 3. Set Up Git Hooks

```bash
npm run prepare
```

This initializes Husky hooks for:
- Pre-commit: Lint, format, type-check
- Commit-msg: Validate commit messages
- Pre-push: Run tests

### 4. Verify Setup

```bash
# Check Node version
node --version  # Should be ≥18.0.0

# Check npm version
npm --version   # Should be ≥9.0.0

# Run type check
npm run type-check

# Run tests
npm test

# Run linter
npm run lint
```

## Development Workflow

### Daily Development

```bash
# Start dev server (with HMR)
npm run dev

# In separate terminal, run tests in watch mode
npm run test:ui

# In another terminal, check types continuously
npm run type-check -- --watch
```

### Code Quality Checks

```bash
# Lint code
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

### Testing

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed
```

### Building

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze

# Analyze with visualizer
npm run analyze:bundle
```

## Git Workflow

### Commit Messages

Follow Conventional Commits:

```bash
# Feature
git commit -m "feat: add user profile page"

# Bug fix
git commit -m "fix: resolve login redirect issue"

# Documentation
git commit -m "docs: update API documentation"

# Chore
git commit -m "chore: update dependencies"

# Performance
git commit -m "perf: optimize image loading"

# Refactor
git commit -m "refactor: simplify auth logic"

# Test
git commit -m "test: add unit tests for journal service"
```

### Pre-commit Checks

Automatically runs when you commit:
1. ESLint (auto-fix enabled)
2. Prettier (auto-format)
3. TypeScript type checking
4. Console.log warnings

### Pre-push Checks

Automatically runs when you push:
1. Full TypeScript type check
2. Complete test suite

### Branch Naming

```bash
# Feature branches
git checkout -b feat/user-profile

# Bug fixes
git checkout -b fix/login-redirect

# Experimental features
git checkout -b experiment/new-editor
```

## Testing

### Unit Tests

Located in `src/__tests__/`:

```typescript
// Example: src/__tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

Run with:
```bash
npm test
```

### E2E Tests

Located in `e2e/`:

```typescript
// Example: e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('should display login page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Sign in')).toBeVisible();
});
```

Run with:
```bash
npm run test:e2e
```

### Coverage Requirements

Enforced thresholds:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

Check coverage:
```bash
npm run test:coverage
```

## Feature Flags

### Usage

```typescript
// In components
import { useFeatureFlag } from '@/lib/featureFlags';

function MyComponent() {
  const isEnabled = useFeatureFlag('new-feature');

  if (!isEnabled) return null;

  return <NewFeature />;
}
```

### Local Overrides

```typescript
// In browser console or development
import { featureFlags } from '@/lib/featureFlags';

// Enable feature
featureFlags.override('new-feature', true);

// Disable feature
featureFlags.override('new-feature', false);

// Remove override
featureFlags.removeOverride('new-feature');

// Clear all overrides
featureFlags.clearOverrides();
```

## Debugging

### Logging

```typescript
import { logger } from '@/lib/logger';

// Different log levels
logger.debug('Debug message', { data: 'value' });
logger.info('Info message', { userId: '123' });
logger.warn('Warning message', { metric: 'LCP' });
logger.error('Error message', error, { context: 'payment' });
logger.fatal('Fatal error', error, { critical: true });

// Breadcrumbs (for Sentry)
logger.breadcrumb('User clicked button', { button: 'submit' });
```

### Chrome DevTools

Enable React DevTools:
```bash
# Install React DevTools extension
# https://chrome.google.com/webstore/detail/react-developer-tools/
```

### Sentry (Production Errors)

View errors in Sentry dashboard:
```
https://sentry.io/organizations/your-org/projects/
```

## Performance

### Web Vitals Monitoring

Automatically tracked in development and production:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

View in browser console or Sentry.

### Bundle Analysis

```bash
# Visual analysis
npm run analyze

# Bundle size report
npm run analyze:bundle
```

### Lighthouse

```bash
# Run Lighthouse CI
npm run lighthouse

# Requirements:
# - Performance: >90
# - Accessibility: >95
# - Best Practices: >90
# - SEO: >90
```

## Troubleshooting

### Common Issues

#### 1. Husky hooks not running

```bash
# Reinstall hooks
rm -rf .husky/_
npm run prepare
chmod +x .husky/*
```

#### 2. TypeScript errors

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

#### 3. Tests failing

```bash
# Clear test cache
npm run test -- --clearCache

# Update snapshots
npm run test -- -u
```

#### 4. Build errors

```bash
# Clean build artifacts
rm -rf dist

# Rebuild
npm run build
```

#### 5. Playwright issues

```bash
# Reinstall browsers
npx playwright install --with-deps
```

### Getting Help

1. Check existing documentation
2. Review CI/CD logs
3. Check Sentry for production errors
4. Review GitHub Issues
5. Contact team lead

## Additional Resources

- [Main README](../README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Facebook-Level Upgrade](./FACEBOOK_LEVEL_UPGRADE.md)
- [Architecture Decision Records](./adr/)
- [Production Checklist](../PRODUCTION_CHECKLIST.md)

## Scripts Reference

### Development
- `npm run dev` - Start dev server
- `npm run preview` - Preview production build

### Building
- `npm run build` - Build for production
- `npm run build:prod` - Build with production env
- `npm run analyze` - Analyze bundle with ANALYZE=true
- `npm run analyze:bundle` - Visual bundle analysis

### Testing
- `npm test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Run E2E tests with UI

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - TypeScript type check
- `npm run format` - Format with Prettier
- `npm run format:check` - Check formatting

### Security
- `npm run security:check` - Run security audit
- `npm run security:fix` - Fix security issues

### Deployment
- `npm run pre-deploy` - Run all pre-deployment checks
- `npm run deploy:vercel` - Deploy to Vercel
- `npm run deploy:netlify` - Deploy to Netlify

### Supabase
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:db:push` - Push database changes

### Mobile
- `npm run mobile:ios` - Build and open iOS
- `npm run mobile:android` - Build and open Android

### Other
- `npm run lighthouse` - Run Lighthouse CI
- `npm run prepare` - Install Husky hooks (auto-runs)

---

**Last Updated**: 2025-01-17
**Version**: 2.0.0
