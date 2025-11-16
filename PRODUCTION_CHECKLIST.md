# Production Deployment Checklist

Use this checklist before deploying Chronicle AI to production.

## Pre-Deployment Checklist

### 1. Environment Variables ✅
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Set `VITE_SUPABASE_URL` with production Supabase URL
- [ ] Set `VITE_SUPABASE_ANON_KEY` with production anon key
- [ ] Set `VITE_APP_URL` to production domain (e.g., `https://chronicle-ai.app`)
- [ ] Set `VITE_ENABLE_ANALYTICS=true`
- [ ] Set `VITE_ENABLE_PWA=true`
- [ ] Set `VITE_SENTRY_DSN` with production Sentry DSN (recommended)
- [ ] Set all Stripe keys:
  - `VITE_STRIPE_PUBLISHABLE_KEY` (pk_live_...)
  - `VITE_STRIPE_PRO_PRICE_ID`
  - `VITE_STRIPE_PRO_YEARLY_PRICE_ID`
  - `VITE_STRIPE_PREMIUM_PRICE_ID`
  - `VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID`
- [ ] Run `npm run validate:env` to verify all required variables

### 2. Supabase Configuration ✅
- [ ] Database migrations applied: `npm run supabase:db:push`
- [ ] Run `npm run verify:db` to check database setup
- [ ] Row Level Security (RLS) policies enabled on all tables
- [ ] Storage bucket `journal-photos` created with proper RLS
- [ ] Edge Functions secrets configured:
  - [ ] `GEMINI_API_KEY`
  - [ ] `GEMINI_MODEL` (gemini-2.0-flash or gemini-2.5-flash)
  - [ ] `STRIPE_SECRET_KEY` (sk_live_...)
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Edge Functions deployed:
  - [ ] `gemini-proxy`
  - [ ] `create-checkout-session`
  - [ ] `create-portal-session`
  - [ ] `stripe-webhook`
  - [ ] `on-this-day-cron`
  - [ ] `weekly-digest-cron`
  - [ ] `send-email`

### 3. Stripe Configuration ✅
- [ ] Stripe account in production mode (not test mode)
- [ ] Products created in Stripe Dashboard:
  - [ ] Pro Monthly ($9.99/mo)
  - [ ] Pro Yearly ($99.99/yr)
  - [ ] Premium Monthly ($19.99/mo)
  - [ ] Premium Yearly ($199.99/yr)
- [ ] Price IDs copied to environment variables
- [ ] Webhook endpoint configured:
  - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
  - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- [ ] Webhook signing secret copied to Supabase Edge Functions

### 4. Google Gemini API ✅
- [ ] API key obtained from Google AI Studio
- [ ] API key added to Supabase Edge Functions secrets (NOT in .env)
- [ ] Billing enabled on Google Cloud Console
- [ ] Rate limits understood (10 requests/min default)

### 5. Error Monitoring (Sentry) ✅
- [ ] Sentry project created
- [ ] DSN added to environment variables
- [ ] Sentry releases configured (optional but recommended)
- [ ] Source maps upload configured (optional)

### 6. Code Quality ✅
- [ ] All TypeScript errors resolved: `npm run type-check`
- [ ] All ESLint warnings fixed: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Tests passing: `npm test`
- [ ] Security audit clean: `npm run security:check`

### 7. Build & Bundle ✅
- [ ] Production build successful: `npm run build:prod`
- [ ] Bundle size analyzed: `npm run analyze`
- [ ] No console.logs in production code
- [ ] Source maps disabled in production (security)
- [ ] Gzip/Brotli compression enabled

### 8. SEO & Metadata ✅
- [ ] `index.html` has proper meta tags
- [ ] `robots.txt` configured
- [ ] `sitemap.xml` created and up to date
- [ ] Open Graph images created (`og-image.jpg`)
- [ ] Favicons generated (all sizes)
- [ ] Canonical URLs set correctly

### 9. Performance ✅
- [ ] Lazy loading implemented for routes
- [ ] Code splitting configured
- [ ] Images optimized
- [ ] Web Vitals targets met:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
  - [ ] TTFB < 600ms

### 10. Security ✅
- [ ] Content Security Policy (CSP) headers configured
- [ ] HTTPS enforced (HSTS header)
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] API keys never exposed in frontend code
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] SQL injection prevented via Supabase RLS

### 11. PWA ✅
- [ ] `manifest.json` configured
- [ ] Service worker registered
- [ ] Offline page created
- [ ] Icons for all platforms
- [ ] App installable on mobile

### 12. Monitoring ✅
- [ ] Health check endpoint accessible: `/health`
- [ ] Performance monitoring enabled
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured (if enabled)
- [ ] Uptime monitoring setup (optional: UptimeRobot, Pingdom)

### 13. Deployment Platform ✅

#### For Vercel:
- [ ] Import project from GitHub
- [ ] Environment variables added in Vercel dashboard
- [ ] Build command: `npm run build:prod`
- [ ] Output directory: `dist`
- [ ] Node version: 18.x or higher
- [ ] Custom domain configured
- [ ] SSL certificate active

#### For Netlify:
- [ ] Import project from GitHub
- [ ] Environment variables added in Netlify dashboard
- [ ] Build command: `npm run build:prod`
- [ ] Publish directory: `dist`
- [ ] Node version: 18.x
- [ ] Custom domain configured
- [ ] SSL certificate active

### 14. Post-Deployment Verification ✅
- [ ] Website accessible via production URL
- [ ] Authentication working (sign up, login, logout)
- [ ] Journal entry creation working
- [ ] AI analysis working
- [ ] Photo upload working
- [ ] Stripe checkout working
- [ ] Subscription management working
- [ ] Email sending working
- [ ] All routes accessible
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] SSL certificate valid
- [ ] `/health` endpoint returning healthy status

### 15. Backup & Recovery ✅
- [ ] Database backup strategy in place (Supabase handles this)
- [ ] Environment variables backed up securely
- [ ] Disaster recovery plan documented
- [ ] Rollback plan prepared

### 16. Legal & Compliance ✅
- [ ] Privacy Policy updated with production URL
- [ ] Terms of Service reviewed
- [ ] Cookie consent implemented (if required by GDPR)
- [ ] GDPR compliance verified
- [ ] Data export functionality tested

### 17. Documentation ✅
- [ ] README updated with production setup
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

## Quick Deployment Commands

### Vercel
```bash
npm run pre-deploy
npm run deploy:vercel
```

### Netlify
```bash
npm run pre-deploy
npm run deploy:netlify
```

### Manual Deployment
```bash
# 1. Validate environment
npm run validate:env

# 2. Run all checks
npm run lint
npm run type-check
npm run test

# 3. Build for production
npm run build:prod

# 4. Preview build locally
npm run preview

# 5. Deploy
# Upload dist/ folder to your hosting provider
```

## Common Issues & Solutions

### Build Fails
- Check TypeScript errors: `npm run type-check`
- Check ESLint errors: `npm run lint`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Environment Variables Not Working
- Verify variables start with `VITE_`
- Check `.env.production` is being used
- Restart dev server after changing env vars

### Supabase Connection Fails
- Verify URL and anon key are correct
- Check CORS settings in Supabase dashboard
- Verify RLS policies are not blocking access

### Stripe Webhook Not Receiving Events
- Check webhook URL is correct
- Verify webhook signing secret matches
- Check Edge Function logs in Supabase

### AI Requests Failing
- Verify Gemini API key is in Supabase Edge Functions secrets
- Check billing is enabled on Google Cloud Console
- Verify rate limits not exceeded

## Emergency Rollback

If deployment fails:

1. Revert to previous deployment in hosting dashboard
2. Check error logs
3. Fix issues locally
4. Test thoroughly
5. Redeploy

## Post-Launch Monitoring

First 24 hours:
- [ ] Monitor error rates in Sentry
- [ ] Check server response times
- [ ] Monitor Stripe webhook events
- [ ] Review user sign-up flow
- [ ] Check email delivery
- [ ] Monitor AI API usage and costs

First week:
- [ ] Review analytics
- [ ] Check conversion rates
- [ ] Monitor server costs
- [ ] Review user feedback
- [ ] Check for performance issues

---

**Last Updated:** 2025-01-16
**Version:** 2.0.0
