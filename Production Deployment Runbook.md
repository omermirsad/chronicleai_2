# Chronicle AI - Production Deployment Runbook

**Version:** 2.0.0  
**Last Updated:** {{ DATE }}  
**Estimated Time:** 2-3 hours (first deployment)

---

## 📋 Pre-Requisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm 9+ installed (`npm -v`)
- [ ] Git installed and configured
- [ ] Supabase account created
- [ ] Google Cloud account (for Gemini API)
- [ ] Domain name (or use free subdomain from hosting)
- [ ] Hosting account (Vercel or Netlify)
- [ ] ~2-3 hours of uninterrupted time

---

## Phase 1: Local Setup (15 minutes)

### 1.1 Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd chronicle-ai

# Install dependencies
npm install

# Verify installation
npm run type-check
npm run lint
```

### 1.2 Create Environment Files

```bash
# Copy example env file
cp .env.example .env.local

# Edit with your values
nano .env.local  # or use your preferred editor
```

Required values:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_APP_URL=http://localhost:5173
```

---

## Phase 2: Supabase Setup (30 minutes)

### 2.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name:** chronicle-ai-production
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing:** At least Pro ($25/month)
4. Wait ~2 minutes for project creation

### 2.2 Copy Credentials

From Supabase Dashboard > Settings > API:

1. Copy Project URL → `VITE_SUPABASE_URL`
2. Copy anon/public key → `VITE_SUPABASE_ANON_KEY`
3. Copy service_role key → Save for later (never expose publicly!)

### 2.3 Run Database Migrations

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push

# Verify tables were created
# Go to Supabase Dashboard > Table Editor
# You should see: profiles, journal_entries, audit_logs, rate_limits, user_sessions
```

### 2.4 Create Storage Bucket

1. Go to Supabase Dashboard > Storage
2. Click "Create Bucket"
3. Name: `journal-photos`
4. Make it **Public**
5. Click "Create Bucket"

**Verify:** Go to Storage > journal-photos > Settings
- Public bucket: ✅ ON
- File size limit: 5MB (default is fine)

### 2.5 Configure Authentication

1. Go to Supabase Dashboard > Authentication > Providers

**Enable Email:**
- Enable email provider
- Disable "Confirm email" for testing (enable for production!)

**Enable Google OAuth:**
1. Go to Google Cloud Console
2. Create OAuth 2.0 Client ID
3. Add redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. Add to Supabase Auth Providers > Google

**Enable GitHub OAuth:**
1. Go to GitHub > Settings > Developer Settings > OAuth Apps
2. Create new OAuth App
3. Add callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret
5. Add to Supabase Auth Providers > GitHub

### 2.6 Customize Email Templates

Go to Supabase Dashboard > Authentication > Email Templates

Use the email templates provided in `supabase-email-templates.md`

**Important:** Update these placeholders:
- Replace `https://chronicle-ai.app` with your domain
- Replace `support@chronicle-ai.app` with your email

### 2.7 Deploy Edge Functions

```bash
# Set Gemini API key as secret
npx supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key

# Verify it's set
npx supabase secrets list

# Deploy gemini-proxy function
npx supabase functions deploy gemini-proxy

# Deploy health check function (optional but recommended)
npx supabase functions deploy health

# Test the function
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/gemini-proxy' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"parts":[{"text":"Hello"}],"config":{}}'

# Should return 200 with AI response
```

---

## Phase 3: Verification (15 minutes)

### 3.1 Verify Database Setup

```bash
npm run verify:db
```

Expected output:
```
✅ Table: profiles
✅ Table: journal_entries
✅ Table: audit_logs
✅ RLS: profiles
✅ RLS: journal_entries
✅ Storage Bucket: journal-photos
✅ Edge Function: gemini-proxy
```

If any checks fail, refer to troubleshooting section.

### 3.2 Test Locally

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5173
```

**Test these flows:**
1. Sign up with email
2. Sign in
3. Create a journal entry
4. Wait for AI analysis (should appear in ~10 seconds)
5. View entry in calendar
6. Try perspective lens
7. Generate insights (need 3+ entries)

---

## Phase 4: Production Build (10 minutes)

### 4.1 Update Environment for Production

Create `.env.production` or configure in hosting platform:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://yourdomain.com
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false  # Enable later
```

### 4.2 Run Pre-Deployment Checks

```bash
# Make script executable
chmod +x scripts/pre-deploy.sh

# Run all checks
./scripts/pre-deploy.sh
```

This checks:
- TypeScript compilation
- Linting
- Code formatting
- Security vulnerabilities
- Environment variables
- Production build
- Bundle size

**Fix any errors before proceeding!**

---

## Phase 5: Deploy to Vercel (30 minutes)

### 5.1 Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link
```

Follow prompts:
- Set up new project: **Yes**
- Project name: **chronicle-ai**
- Framework: **Vite**

### 5.2 Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

Add these variables for **Production**:
```
VITE_SUPABASE_URL = https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_key
VITE_APP_URL = https://yourdomain.vercel.app  (or custom domain)
VITE_ENABLE_PWA = true
NODE_ENV = production
```

### 5.3 Deploy

```bash
# Deploy to production
vercel --prod

# Or use npm script
npm run deploy:vercel
```

Wait 2-5 minutes for deployment.

### 5.4 Configure Custom Domain (Optional)

1. Go to Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for DNS propagation (5-30 minutes)
5. SSL certificate auto-generated

---

## Phase 5 (Alternative): Deploy to Netlify (30 minutes)

### 5.1 Create Netlify Site

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link project
netlify link
```

### 5.2 Configure Environment Variables

In Netlify Dashboard > Site Settings > Environment Variables:

Add the same variables as Vercel (see above).

### 5.3 Configure Build Settings

In Netlify Dashboard > Site Settings > Build & Deploy:

**Build command:** `npm run build:prod`
**Publish directory:** `dist`
**Node version:** `18`

### 5.4 Deploy

```bash
# Deploy to production
netlify deploy --prod

# Or use npm script
npm run deploy:netlify
```

---

## Phase 6: Post-Deployment Verification (15 minutes)

### 6.1 Update Supabase Redirect URLs

Go to Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
```
https://yourdomain.com
```

**Redirect URLs (add both):**
```
https://yourdomain.com/**
http://localhost:5173/**
```

### 6.2 Run Health Check

```bash
npx ts-node scripts/health-check.ts --url https://yourdomain.com
```

Expected output:
```
✅ Main Page (245ms)
✅ Terms of Service
✅ Privacy Policy
✅ Help Center
✅ SSL/TLS
✅ Security Headers
```

### 6.3 Manual Testing

**Test these critical flows:**

1. **Sign Up Flow:**
   - Go to https://yourdomain.com
   - Click "Sign Up"
   - Enter email and password
   - Check email for verification link
   - Click verification link
   - Should redirect to app

2. **OAuth Flow:**
   - Sign out
   - Sign in with Google
   - Should work without errors
   - Try GitHub OAuth

3. **Journal Entry Creation:**
   - Create freestyle entry
   - Wait for AI analysis
   - Should appear within 10-15 seconds

4. **Photo Upload:**
   - Create entry with photo
   - Photo should upload successfully
   - Verify photo displays correctly

5. **Mobile Testing:**
   - Open on iPhone Safari
   - Open on Android Chrome
   - All features should work
   - UI should be responsive

---

## Phase 7: Monitoring Setup (15 minutes)

### 7.1 Set Up Error Monitoring (Optional)

If using Sentry:

1. Create Sentry project
2. Copy DSN
3. Add to environment variables: `VITE_SENTRY_DSN`
4. Redeploy

### 7.2 Set Up Uptime Monitoring

Recommended free services:
- UptimeRobot (uptimerobot.com)
- Freshping (freshping.io)
- StatusCake (statuscake.com)

Configure:
- Monitor URL: `https://yourdomain.com`
- Check interval: 5 minutes
- Alert email: your email
- Alert on: Down, SSL expiry

### 7.3 Set Up Supabase Alerts

Go to Supabase Dashboard > Project Settings > Integrations:

- Enable email alerts for:
  - High CPU usage
  - High memory usage
  - Storage quota warnings
  - High number of connections

---

## Phase 8: Launch! (5 minutes)

### 8.1 Final Checklist

- [ ] All health checks passing
- [ ] Manual testing complete
- [ ] Monitoring configured
- [ ] Error tracking active
- [ ] Backup strategy documented
- [ ] Support email configured
- [ ] Team members have access
- [ ] Runbook reviewed

### 8.2 Go Live

1. Announce on social media (if ready)
2. Send to early users / beta testers
3. Monitor closely for first 24 hours
4. Respond to support requests

---

## Post-Launch: First 24 Hours

### Hour 1-2: Active Monitoring
- [ ] Check Sentry for errors (if enabled)
- [ ] Watch Supabase Dashboard for traffic
- [ ] Monitor sign-up conversion
- [ ] Check support email

### Hour 3-6: Metrics Review
- [ ] Sign-up rate
- [ ] Time to first entry
- [ ] AI usage patterns
- [ ] Error rates
- [ ] Performance metrics

### Hour 7-24: Regular Checks
- [ ] Review error logs every 3-4 hours
- [ ] Respond to support requests
- [ ] Check database performance
- [ ] Monitor costs (Supabase, API usage)

---

## Troubleshooting

### Issue: Email verification not working

**Symptoms:** Users don't receive verification emails

**Fixes:**
1. Check Supabase Auth logs
2. Verify email templates configured
3. Check spam folder
4. Ensure Site URL is correct in Supabase settings

---

### Issue: AI analysis not appearing

**Symptoms:** Journal entries created but no AI insights

**Fixes:**
```bash
# 1. Check edge function logs
npx supabase functions logs gemini-proxy

# 2. Test function directly
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/gemini-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"parts":[{"text":"test"}],"config":{}}'

# 3. Verify Gemini API key is set
npx supabase secrets list

# 4. Check if user hit rate limit
# Go to Supabase > Database > rate_limits table
```

---

### Issue: Photos not uploading

**Symptoms:** Photo upload fails or images don't display

**Fixes:**
1. Verify storage bucket is public
2. Check RLS policies on storage.objects
3. Verify file size < 5MB
4. Check browser console for errors

---

### Issue: Slow page load

**Symptoms:** Site takes >3 seconds to load

**Fixes:**
1. Check bundle size: `npm run analyze`
2. Enable compression in hosting platform
3. Optimize images
4. Review and remove unused dependencies
5. Implement code splitting

---

## Rollback Procedure

If critical issues occur after deployment:

### Immediate Actions

```bash
# 1. Rollback deployment
vercel rollback  # or netlify rollback

# 2. Post status update
# - Email users if needed
# - Post on status page
# - Update social media

# 3. Investigate issue
# - Check Sentry errors
# - Review Supabase logs
# - Check deployment logs
```

### Database Rollback

```bash
# If database migration caused issues
npx supabase db reset

# Restore from backup
# Contact Supabase support with:
# - Timestamp of last good state
# - Description of issue
```

---

## Emergency Contacts

**Primary Developer:**
- Name: [Your Name]
- Email: [Your Email]
- Phone: [Your Phone]

**Services:**
- Supabase Support: support@supabase.com
- Vercel Support: https://vercel.com/support
- Netlify Support: https://www.netlify.com/support/
- Google Cloud: https://cloud.google.com/support

---

## Success Criteria

Your deployment is successful when:

- [ ] Health checks all passing
- [ ] Users can sign up and sign in
- [ ] Journal entries can be created
- [ ] AI analysis works within 15 seconds
- [ ] Photos upload successfully
- [ ] All pages accessible
- [ ] No errors in monitoring tools
- [ ] Mobile experience works
- [ ] Performance is acceptable (<3s load)

---

## Next Steps After Launch

1. **Week 1:**
   - Monitor daily
   - Fix critical bugs
   - Gather user feedback
   - Optimize performance

2. **Week 2-4:**
   - Analyze usage patterns
   - Plan feature iterations
   - Improve onboarding
   - A/B test key flows

3. **Month 2+:**
   - Scale infrastructure if needed
   - Add advanced features
   - Improve AI prompts
   - Expand integrations

---

## Maintenance Schedule

**Daily:**
- Check error logs
- Monitor uptime
- Respond to support requests

**Weekly:**
- Review analytics
- Check backup status
- Update dependencies (if security updates)

**Monthly:**
- Review costs
- Check for dependency updates
- Test disaster recovery
- Performance audit

---

**Congratulations on launching Chronicle AI! 🎉**

Remember: Launch is just the beginning. Focus on user feedback and iterate quickly.

---

*This runbook should be updated after each deployment with lessons learned.*
