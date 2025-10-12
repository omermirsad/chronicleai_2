# Chronicle AI - Deployment Scripts

This directory contains scripts to help you deploy and maintain Chronicle AI in production.

## Available Scripts

### 1. `pre-deploy.sh` - Pre-Deployment Check

Comprehensive validation before deploying to production.

**Usage:**
```bash
chmod +x scripts/pre-deploy.sh
./scripts/pre-deploy.sh
```

**What it checks:**
- ✅ Node.js and npm versions
- ✅ TypeScript type checking
- ✅ ESLint validation
- ✅ Code formatting
- ✅ Environment variables
- ✅ Security vulnerabilities
- ✅ Production build
- ✅ Bundle size
- ✅ Git status
- ✅ Sensitive data in code
- ✅ TODO/FIXME comments

**When to run:** Before every production deployment

---

### 2. `validate-env.ts` - Environment Variable Validation

Validates that all required environment variables are set correctly.

**Usage:**
```bash
# For production environment
NODE_ENV=production npx ts-node scripts/validate-env.ts

# Or use npm script
npm run validate:env
```

**What it validates:**
- `VITE_SUPABASE_URL` - format and accessibility
- `VITE_SUPABASE_ANON_KEY` - length and format
- `VITE_APP_URL` - HTTPS protocol
- Optional variables (Sentry, Analytics, PWA)

**When to run:** 
- Before first deployment
- After changing environment variables
- When debugging configuration issues

---

### 3. `verify-database.ts` - Database Schema Verification

Verifies your Supabase database schema is correctly set up.

**Usage:**
```bash
# Set environment variables first
export VITE_SUPABASE_URL="https://xxxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run verification
npx ts-node scripts/verify-database.ts

# Or use npm script
npm run verify:db
```

**What it checks:**
- ✅ All required tables exist
- ✅ Row Level Security (RLS) enabled
- ✅ Storage buckets configured
- ✅ Database functions deployed
- ✅ Edge functions accessible

**When to run:**
- After running database migrations
- Before first deployment
- When debugging database issues

---

### 4. `health-check.ts` - Post-Deployment Health Check

Runs comprehensive health checks on your deployed application.

**Usage:**
```bash
# Check production site
npx ts-node scripts/health-check.ts --url https://yourdomain.com

# Check staging
npx ts-node scripts/health-check.ts --url https://staging.yourdomain.com
```

**What it checks:**
- ✅ Main page accessibility
- ✅ Important routes (terms, privacy, help)
- ✅ SSL/TLS configuration
- ✅ Security headers
- ✅ 404 handling
- ✅ Performance metrics
- ✅ Compression enabled

**When to run:**
- Immediately after deployment
- After DNS changes
- During incident response
- Regular monitoring (daily/weekly)

---

## Quick Start Guide

### First Time Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run database migrations**
   ```bash
   npm run supabase:db:push
   ```

4. **Verify database setup**
   ```bash
   npm run verify:db
   ```

5. **Deploy edge functions**
   ```bash
   # Set Gemini API key
   npx supabase secrets set GEMINI_API_KEY=your_key
   
   # Deploy functions
   npm run supabase:functions:deploy
   ```

6. **Run pre-deployment checks**
   ```bash
   ./scripts/pre-deploy.sh
   ```

7. **Deploy to hosting platform**
   ```bash
   npm run deploy:vercel
   # OR
   npm run deploy:netlify
   ```

8. **Run health check**
   ```bash
   npx ts-node scripts/health-check.ts --url https://yourdomain.com
   ```

---

### Regular Deployment

For subsequent deployments after your first successful deploy:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Run pre-deployment checks
npm run pre-deploy

# 4. Deploy
npm run deploy:vercel  # or deploy:netlify
```

---

## Troubleshooting

### Pre-Deploy Script Fails

**Issue:** TypeScript errors
```bash
# Fix: Run type checking to see details
npm run type-check
```

**Issue:** Linting errors
```bash
# Fix: Auto-fix linting issues
npm run lint:fix
```

**Issue:** Build fails
```bash
# Fix: Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build:prod
```

---

### Database Verification Fails

**Issue:** Tables not found
```bash
# Fix: Run migrations
npm run supabase:db:push
```

**Issue:** RLS not enabled
```sql
-- Run in Supabase SQL Editor
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
```

**Issue:** Storage bucket missing
```bash
# Fix: Create bucket in Supabase Dashboard
# Storage > Create Bucket > "journal-photos" (public)
```

---

### Health Check Fails

**Issue:** 404 errors
```bash
# Fix: Check SPA routing configuration
# Vercel: verify vercel.json redirects
# Netlify: verify netlify.toml redirects
```

**Issue:** Security headers missing
```bash
# Fix: Update hosting platform config
# See vercel.json or netlify.toml examples
```

**Issue:** SSL errors
```bash
# Fix: Wait for SSL provisioning (5-10 minutes)
# Check hosting platform DNS settings
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run pre-deployment checks
        run: npm run pre-deploy
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
      
      - name: Deploy to Vercel
        run: npm run deploy:vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Monitoring Scripts

### Create a monitoring cron job

```bash
# Add to crontab (run health check every hour)
0 * * * * /usr/local/bin/ts-node /path/to/scripts/health-check.ts --url https://yourdomain.com >> /var/log/chronicle-health.log 2>&1
```

### Send alerts on failure

```bash
#!/bin/bash
# health-check-with-alerts.sh

if ! npx ts-node scripts/health-check.ts --url https://yourdomain.com; then
    # Send email alert
    echo "Health check failed!" | mail -s "Chronicle AI Health Alert" admin@yourdomain.com
    
    # Or send Slack notification
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Health check failed for Chronicle AI"}' \
      YOUR_SLACK_WEBHOOK_URL
fi
```

---

## Best Practices

1. **Always run pre-deploy checks** before pushing to production
2. **Test in staging first** if you have a staging environment
3. **Monitor health checks** for the first hour after deployment
4. **Keep scripts updated** as you add new features
5. **Document any custom scripts** you add to this directory
6. **Version control everything** including script changes
7. **Set up automated health checks** for early problem detection

---

## Getting Help

If you encounter issues with these scripts:

1. Check the troubleshooting section above
2. Review error messages carefully
3. Check Supabase logs for backend issues
4. Review hosting platform logs
5. Contact support: support@chronicle-ai.app

---

## Contributing

When adding new deployment scripts:

1. Add clear documentation to this README
2. Include usage examples
3. Add error handling
4. Test thoroughly
5. Update package.json scripts if needed

---

Last Updated: {{ DATE }}