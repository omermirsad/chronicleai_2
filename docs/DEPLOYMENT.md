# Deployment Guide

## Overview

This document provides comprehensive deployment instructions for Chronicle AI at Facebook/Meta production standards.

## Pre-Deployment Checklist

Before deploying to production, ensure all items are completed:

### 1. Code Quality

```bash
# Run all quality checks
npm run lint                 # ESLint
npm run type-check          # TypeScript
npm run format:check        # Prettier
npm run test                # Unit tests
npm run test:coverage       # Coverage >80%
npm run test:e2e            # E2E tests
npm run security:check      # Security audit
```

### 2. Build Verification

```bash
# Build and analyze
npm run build:prod
npm run analyze:bundle
npm run lighthouse

# Verify bundle sizes
du -sh dist/
find dist/assets/js -name "*.js" -exec du -h {} \; | sort -rh | head -10
```

### 3. Environment Configuration

Create `.env.production`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App
VITE_APP_URL=https://chronicle-ai.app
VITE_APP_VERSION=2.0.0

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_SENTRY_ENVIRONMENT=production

# API Keys (Serverless Functions Only - NOT in frontend env)
# These should be in Supabase Edge Functions secrets
```

### 4. Security Checklist

- [ ] All secrets in environment variables or secrets management
- [ ] API keys never in frontend code
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CSP properly set
- [ ] Dependencies audited (`npm audit`)
- [ ] No console.logs in production code
- [ ] Source maps disabled in production

## Deployment Platforms

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Or use npm script
npm run deploy:vercel
```

**Vercel Configuration**:

```json
{
  "buildCommand": "npm run build:prod",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vite",
  "regions": ["iad1"],
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Or use npm script
npm run deploy:netlify
```

**netlify.toml** (already configured):
- Build command: `npm run build:prod`
- Publish directory: `dist`
- Redirects for SPA routing
- Security headers

### GitHub Actions Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run pre-deploy

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Post-Deployment Verification

### Automated Checks

```bash
# Health check
curl https://your-app.com/health

# Lighthouse CI (run from CI/CD)
npm run lighthouse

# Smoke tests
npm run test:e2e -- --grep="@smoke"
```

### Manual Verification

1. **Functionality**:
   - [ ] Homepage loads
   - [ ] Authentication works (sign up, login, logout)
   - [ ] Journal creation/editing
   - [ ] AI features functional
   - [ ] File uploads working
   - [ ] Payments processing (Stripe)

2. **Performance**:
   - [ ] LCP < 2.5s
   - [ ] FID < 100ms
   - [ ] CLS < 0.1
   - [ ] TTI < 3.8s

3. **Cross-Browser**:
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge
   - [ ] Mobile Safari
   - [ ] Mobile Chrome

4. **Monitoring**:
   - [ ] Sentry receiving events
   - [ ] Analytics tracking
   - [ ] Performance metrics reporting
   - [ ] Error rates normal

## Monitoring & Observability

### Sentry Setup

```typescript
// Already configured in src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Web Vitals Monitoring

```typescript
// Already configured in src/lib/monitoring/webVitals.ts
import { initWebVitals } from './lib/monitoring/webVitals';

initWebVitals();
```

### Logging

```typescript
import { logger } from './lib/logger';

logger.error('Critical error', error, { context: 'payment' });
logger.warn('Degraded performance', { metric: 'LCP', value: 3500 });
logger.info('Feature used', { feature: 'voice-input' });
```

## Rollback Procedure

### Vercel Rollback

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Netlify Rollback

1. Go to Netlify dashboard
2. Select deployment
3. Click "Publish deploy"

### Manual Rollback

```bash
# Revert git commit
git revert HEAD
git push origin main

# CI/CD will auto-deploy previous version
```

## Incident Response

### 1. Detect

- Sentry alerts
- Uptime monitor alerts
- User reports
- Performance degradation

### 2. Assess

```bash
# Check Sentry errors
https://sentry.io/organizations/your-org/projects/

# Check Vercel/Netlify logs
vercel logs
netlify deploy:list

# Check application logs
# Via browser console or Sentry breadcrumbs
```

### 3. Mitigate

**Quick fixes**:
- Feature flag toggle
- Rollback deployment
- Scale resources
- Circuit breaker activation

**Communication**:
- Update status page
- Notify stakeholders
- Post incident updates

### 4. Resolve

- Deploy fix
- Verify fix in staging
- Deploy to production
- Monitor for recurrence

### 5. Post-Mortem

- Document incident
- Root cause analysis
- Action items
- Update runbooks

## Performance Optimization

### Bundle Size Optimization

```bash
# Analyze bundle
npm run analyze

# Check for duplicates
npx depcheck

# Update dependencies
npm update
```

### Caching Strategy

- **Static assets**: 1 year (`Cache-Control: public, max-age=31536000, immutable`)
- **HTML**: No cache (`Cache-Control: no-cache`)
- **API responses**: Vary by endpoint
- **Service Worker**: Cache-first for static, network-first for API

### CDN Configuration

Use Vercel/Netlify edge network:
- Automatic global distribution
- Automatic HTTPS
- Automatic compression (Brotli/Gzip)
- DDoS protection

## Security

### Content Security Policy

```typescript
// Configured in src/lib/security.ts
import { getSecurityHeaders } from '@/lib/security';

// Security headers are automatically applied via hosting platform configs
// (vercel.json / netlify.toml)
```

### Rate Limiting

```typescript
// API rate limiting configured
import { fetchWithRateLimit } from './lib/api/retryConfig';

const data = await fetchWithRateLimit('/api/endpoint');
```

## Maintenance

### Regular Updates

- **Dependencies**: Weekly (Dependabot PRs)
- **Security patches**: Immediately
- **Node.js version**: Every 6 months
- **Framework updates**: Every quarter

### Database Migrations

```bash
# Create migration
npm run supabase:migration:new migration_name

# Apply migrations
npm run supabase:db:push

# Verify
npm run verify:db
```

### Backup & Recovery

- **Database**: Supabase automatic backups
- **Environment variables**: Store in 1Password/Vault
- **Code**: Git repository
- **Monitoring**: Export Sentry/Analytics data monthly

## Cost Optimization

### Monitoring Costs

- Supabase: Monitor database size, API calls
- Vercel/Netlify: Monitor bandwidth, build minutes
- Sentry: Monitor event quota
- Google AI: Monitor API usage

### Optimization Tips

1. Use CDN for static assets
2. Optimize images (WebP, compression)
3. Tree-shake dependencies
4. Lazy load routes
5. Code splitting
6. Cache API responses
7. Use serverless functions efficiently

## Support

For deployment issues:
1. Check this documentation
2. Review CI/CD logs
3. Check Vercel/Netlify status
4. Contact platform support

---

**Last Updated**: 2025-01-17
**Version**: 2.0.0
