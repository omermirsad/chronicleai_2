# Chronicle AI - Production Deployment Guide

This guide outlines the steps required to deploy Chronicle AI to production securely and reliably.

## Prerequisites

- [ ] Production Supabase project created
- [ ] Production domain/hosting configured (Vercel, Netlify, or similar)
- [ ] Sentry account for error monitoring (optional but recommended)
- [ ] SSL/HTTPS certificate (usually automatic with hosting providers)

## 1. Environment Variables Configuration

Set the following environment variables in your production hosting platform:

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI (for journal analysis)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Optional Variables

```bash
# Error Monitoring (Sentry)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Analytics (if using)
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### Verification Steps

- [ ] Verify all required environment variables are set
- [ ] Test that Supabase connection works in production
- [ ] Confirm Gemini API key has sufficient quota
- [ ] Test Sentry integration sends test errors correctly

## 2. Supabase Database Setup

### Run Database Migrations

Execute the following migrations in your production Supabase SQL editor:

```bash
# Run migrations in order
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_security_updates.sql
```

### Row Level Security (RLS) Policies

Verify RLS is enabled for all tables:

- [ ] `profiles` table - users can only read/write their own profile
- [ ] `journal_entries` table - users can only access their own entries
- [ ] `user_preferences` table - users can only access their own preferences

### Database Indexes

Verify these indexes exist for performance:

- [ ] `journal_entries.user_id` - B-tree index
- [ ] `journal_entries.created_at` - B-tree index
- [ ] `journal_entries.tags` - GIN index for array search
- [ ] `journal_entries.mood` - B-tree index
- [ ] `journal_entries.energy_level` - B-tree index

### Enable Realtime

- [ ] Enable Realtime for `journal_entries` table in Supabase dashboard
- [ ] Test realtime subscriptions work across browser tabs

## 3. Supabase Authentication Setup

### Configure Auth Providers

In Supabase Dashboard → Authentication → Providers:

- [ ] **Email** - Enable email/password authentication
- [ ] **Google OAuth** - Add Client ID and Secret
- [ ] **GitHub OAuth** - Add Client ID and Secret

### Auth Redirect URLs

Add your production URLs to allowed redirect URLs:

```
https://yourdomain.com/auth/callback
https://yourdomain.com
```

### Email Templates

Customize email templates in Supabase Dashboard → Authentication → Email Templates:

- [ ] Confirmation email
- [ ] Password reset email
- [ ] Magic link email

## 4. Security Configuration

### Content Security Policy (CSP)

Implement CSP headers using the `generateCSPHeader` function from `src/lib/security.ts`.

For Vercel, add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com; frame-src https://accounts.google.com;"
        }
      ]
    }
  ]
}
```

For Netlify, add to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; ..."
```

### Additional Security Headers

Add these headers via your hosting provider:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### HTTPS Enforcement

- [ ] Verify HTTPS is enforced (hosting providers usually handle this)
- [ ] Test that HTTP requests redirect to HTTPS
- [ ] Verify SSL certificate is valid and not expired

## 5. Build and Deploy

### Build the Application

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Test the build locally (optional)
npm run preview
```

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### Manual Deployment

1. Build the app: `npm run build`
2. Upload `dist/` directory to your hosting provider
3. Configure hosting to serve `index.html` for all routes (SPA mode)

## 6. Post-Deployment Verification

### Functional Testing

- [ ] Sign up with email works
- [ ] Sign in with Google OAuth works
- [ ] Sign in with GitHub OAuth works
- [ ] Create a new journal entry
- [ ] AI analysis generates correctly
- [ ] Calendar view displays entries
- [ ] Insights view shows patterns
- [ ] Realtime sync works across tabs
- [ ] Mobile responsive design works
- [ ] Offline mode queues actions

### Performance Testing

- [ ] Lighthouse score > 90 for Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Check bundle size is optimized

### Security Testing

- [ ] CSP headers are set correctly (check browser console)
- [ ] All resources load over HTTPS
- [ ] Test RLS policies (try accessing another user's data)
- [ ] Verify no secrets in client-side code
- [ ] Check for XSS vulnerabilities

### Error Monitoring

- [ ] Test Sentry integration by triggering an error
- [ ] Verify error appears in Sentry dashboard
- [ ] Configure alert rules for critical errors
- [ ] Set up email notifications for new issues

## 7. Monitoring and Maintenance

### Sentry Alerts

Configure alerts for:

- New issues (first occurrence)
- Issue frequency spikes (> 10 errors/minute)
- Critical errors (500 errors, auth failures)

### Supabase Monitoring

- [ ] Monitor database usage and connection pool
- [ ] Set up alerts for high CPU/memory usage
- [ ] Monitor storage usage for journal entries
- [ ] Track authentication success/failure rates

### Regular Maintenance

- [ ] Weekly: Review Sentry errors
- [ ] Monthly: Check Supabase usage and costs
- [ ] Quarterly: Security audit and dependency updates
- [ ] Annually: SSL certificate renewal (if manual)

## 8. Rollback Plan

If deployment fails:

1. **Revert code**: Revert to previous Git commit
2. **Redeploy**: Deploy the previous version
3. **Database**: Run rollback migrations if needed
4. **Notify users**: Post status update if downtime occurred

### Rollback Commands

```bash
# Git rollback
git revert HEAD
git push origin main

# Redeploy
vercel --prod  # or netlify deploy --prod
```

## 9. Domain and DNS Configuration

### Custom Domain Setup

- [ ] Add custom domain in hosting provider dashboard
- [ ] Configure DNS records (CNAME or A record)
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify HTTPS certificate is issued

### Subdomain Setup (if needed)

```
app.yourdomain.com → Production app
staging.yourdomain.com → Staging environment
```

## 10. Legal and Compliance

- [ ] Terms of Service page is accessible
- [ ] Privacy Policy page is accessible
- [ ] Sign-up flow includes links to ToS and Privacy Policy
- [ ] Cookie consent banner (if required by jurisdiction)
- [ ] GDPR compliance (data export/delete functionality)

## 11. Backup Strategy

### Database Backups

- [ ] Enable automatic daily backups in Supabase
- [ ] Test backup restoration process
- [ ] Document backup retention policy (30 days recommended)

### Code Backups

- [ ] Ensure Git repository has remote backup
- [ ] Tag production releases: `git tag v1.0.0`
- [ ] Document versioning strategy

## Troubleshooting

### Common Issues

**Auth callback fails**
- Check redirect URLs in Supabase settings
- Verify OAuth credentials are correct

**AI analysis not working**
- Check Gemini API key is set correctly
- Verify API quota is not exceeded
- Check Supabase Edge Function logs

**Realtime not working**
- Verify Realtime is enabled for tables
- Check WebSocket connection in browser dev tools
- Verify RLS policies allow realtime subscriptions

**Sentry not capturing errors**
- Verify VITE_SENTRY_DSN is set
- Check `enabled: true` in production mode
- Test with `throw new Error('Test')` in code

## Support and Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev/guide/
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com/

## Checklist Summary

Use this quick checklist before going live:

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] RLS policies enabled and tested
- [ ] Auth providers configured (email, Google, GitHub)
- [ ] Security headers implemented (CSP, HTTPS, etc.)
- [ ] Production build successful
- [ ] Application deployed to hosting
- [ ] Functional testing passed
- [ ] Performance testing passed (Lighthouse > 90)
- [ ] Security testing passed
- [ ] Sentry error monitoring working
- [ ] Terms/Privacy pages accessible
- [ ] Custom domain configured (if applicable)
- [ ] Backups enabled and tested

---

**Last Updated**: November 2025
**Version**: 1.0.0
