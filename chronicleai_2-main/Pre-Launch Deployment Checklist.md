# Chronicle AI - Pre-Launch Deployment Checklist

## Phase 1: Infrastructure & Database

### Supabase Setup
- [ ] **Create Supabase Project**
  - [ ] Project name: chronicle-ai-production
  - [ ] Region: Choose closest to target users
  - [ ] Pricing tier: At least Pro ($25/month for better performance)

- [ ] **Database Migrations**
  ```bash
  # Run from project root
  npx supabase db push --db-url "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
  
  # Verify all tables created
  # Connect to database and run:
  SELECT tablename FROM pg_tables WHERE schemaname = 'public';
  
  # Expected tables:
  # - profiles
  # - journal_entries
  # - audit_logs
  # - rate_limits
  # - user_sessions
  ```
  
  - [ ] Verify all tables exist
  - [ ] Verify all indexes created (check with `\di` in psql)
  - [ ] Verify all RLS policies enabled (`SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`)
  - [ ] Test RLS policies by creating test user and verifying they can only access own data

- [ ] **Storage Bucket Configuration**
  - [ ] Create `journal-photos` bucket in Supabase Storage
  - [ ] Set bucket to `public: true`
  - [ ] Verify RLS policies on storage.objects
  - [ ] Test upload: Upload a test image
  - [ ] Test public URL: Verify image accessible via public URL
  - [ ] Configure CORS if needed for different domains

### Edge Functions
- [ ] **Deploy Gemini Proxy Function**
  ```bash
  # Set Gemini API key as secret
  npx supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key_here
  
  # Verify secret set
  npx supabase secrets list
  
  # Deploy the function
  npx supabase functions deploy gemini-proxy
  
  # Verify deployment
  npx supabase functions list
  ```
  
  - [ ] Function deployed successfully
  - [ ] Test function with curl:
    ```bash
    curl -i --location --request POST 'https://[PROJECT-REF].supabase.co/functions/v1/gemini-proxy' \
      --header 'Authorization: Bearer [ANON-KEY]' \
      --header 'Content-Type: application/json' \
      --data '{"parts":[{"text":"Hello"}],"config":{}}'
    ```
  - [ ] Verify rate limiting works (send 11 requests in 1 minute)
  - [ ] Check logs for errors: `npx supabase functions logs gemini-proxy`

- [ ] **Deploy Health Check Function (Optional but Recommended)**
  ```bash
  npx supabase functions deploy health
  
  # Test it
  curl https://[PROJECT-REF].supabase.co/functions/v1/health
  ```

### Authentication Configuration
- [ ] **Email/Password Auth**
  - [ ] Enable email confirmations
  - [ ] Set email templates (see separate section)
  - [ ] Test sign up flow
  - [ ] Test email verification
  - [ ] Test password reset
  
- [ ] **OAuth Providers**
  - [ ] Google OAuth:
    - [ ] Create Google Cloud project
    - [ ] Enable Google+ API
    - [ ] Create OAuth 2.0 credentials
    - [ ] Add redirect URI: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
    - [ ] Add Client ID and Secret to Supabase
    - [ ] Test Google sign in
  
  - [ ] GitHub OAuth:
    - [ ] Create GitHub OAuth app
    - [ ] Add callback URL: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
    - [ ] Add Client ID and Secret to Supabase
    - [ ] Test GitHub sign in

- [ ] **Auth Settings**
  - [ ] Set site URL to production domain
  - [ ] Add redirect URLs:
    - [ ] Production: `https://yourdomain.com/auth/callback`
    - [ ] Local: `http://localhost:5173/auth/callback` (for testing)
  - [ ] Enable "Confirm email" for new signups
  - [ ] Set JWT expiration to appropriate value (default 3600s is fine)
  - [ ] Enable "Secure email change" (requires re-authentication)

---

## Phase 2: Environment Variables

### Production Hosting (Vercel/Netlify)
- [ ] **Set Environment Variables in Hosting Dashboard**
  ```
  # Required
  VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
  VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase
  VITE_APP_URL=https://yourdomain.com
  
  # Optional but Recommended
  VITE_SENTRY_DSN=your_sentry_dsn_if_using
  VITE_ENABLE_ANALYTICS=false  # Start with false, enable after launch
  VITE_ENABLE_PWA=true
  
  # Do NOT set in production (these are for local dev only)
  # VITE_GEMINI_API_KEY - Should only be in Edge Function secrets
  ```

- [ ] **Verify Environment Variables**
  - [ ] Check each variable is set correctly
  - [ ] No trailing spaces or quotes
  - [ ] URLS don't have trailing slashes
  - [ ] Redeploy if you change any variables

### Supabase Edge Function Secrets
- [ ] **Verify Secrets**
  ```bash
  npx supabase secrets list
  
  # Should show:
  # - GEMINI_API_KEY
  # - SUPABASE_URL (auto-set)
  # - SUPABASE_SERVICE_ROLE_KEY (auto-set)
  ```

---

## Phase 3: Frontend Deployment

### Build & Deploy
- [ ] **Run Production Build Locally First**
  ```bash
  npm run build:prod
  
  # Check for errors
  # Verify bundle size is reasonable (<2MB total)
  ```

- [ ] **Deploy to Vercel**
  ```bash
  # Install Vercel CLI if needed
  npm i -g vercel
  
  # Link project
  vercel link
  
  # Deploy to production
  vercel --prod
  ```
  
  OR
  
- [ ] **Deploy to Netlify**
  ```bash
  # Install Netlify CLI if needed
  npm i -g netlify-cli
  
  # Link project
  netlify link
  
  # Deploy to production
  netlify deploy --prod
  ```

- [ ] **Verify Deployment**
  - [ ] Site loads at production URL
  - [ ] No console errors
  - [ ] All assets loading (check Network tab)
  - [ ] Service worker registered (if PWA enabled)

### DNS & SSL
- [ ] **Configure Custom Domain**
  - [ ] Add domain to hosting provider
  - [ ] Update DNS records (A record or CNAME)
  - [ ] Verify SSL certificate issued (may take 5-10 minutes)
  - [ ] Test https://yourdomain.com loads correctly
  - [ ] Test http:// redirects to https://

---

## Phase 4: End-to-End Testing

### Critical Path Testing
- [ ] **New User Flow**
  - [ ] Sign up with email
  - [ ] Receive verification email
  - [ ] Click verification link
  - [ ] Sign in successfully
  - [ ] Onboarding appears
  - [ ] Complete onboarding
  - [ ] Create first freestyle entry
  - [ ] AI analysis appears (wait ~10 seconds)
  - [ ] Entry shows in feed with analysis
  - [ ] Tags, sentiment, and question visible

- [ ] **Guided Session Flow**
  - [ ] Click "New Entry"
  - [ ] Select a guided session (e.g., Gratitude)
  - [ ] Answer first prompt
  - [ ] Click "Next"
  - [ ] Get follow-up prompts
  - [ ] Complete session
  - [ ] Save and verify entry appears

- [ ] **Photo Upload Flow**
  - [ ] Create entry with photo
  - [ ] Photo uploads successfully
  - [ ] Photo displays in entry card
  - [ ] Photo accessible via public URL
  - [ ] Try different image formats (JPEG, PNG, WEBP)

- [ ] **Features Testing**
  - [ ] Calendar View:
    - [ ] Shows entries on correct dates
    - [ ] Click date opens modal with entries
    - [ ] Modal displays all entries from that date
  
  - [ ] Perspective Lens:
    - [ ] Click "View with Perspective Lens"
    - [ ] All 3 perspectives generate
    - [ ] Navigate between perspectives
    - [ ] Close modal
  
  - [ ] Insights Generation:
    - [ ] Create at least 3 entries
    - [ ] Go to Insights view
    - [ ] Click "Generate Insights"
    - [ ] Insights appear after loading
    - [ ] Mood chart displays if mood data exists

- [ ] **OAuth Sign In**
  - [ ] Sign out from test account
  - [ ] Sign in with Google
  - [ ] Profile created automatically
  - [ ] Can create entries
  - [ ] Sign in with GitHub (test separately)

- [ ] **Data Export**
  - [ ] Go to profile menu
  - [ ] Click "Export Data"
  - [ ] Try JSON export - downloads successfully
  - [ ] Try Markdown export - downloads successfully
  - [ ] Try CSV export - downloads successfully
  - [ ] Verify exports contain all entries

### Mobile Testing
- [ ] **iOS Safari**
  - [ ] All pages render correctly
  - [ ] Navigation works
  - [ ] Can create entries
  - [ ] Touch targets are big enough
  - [ ] Modals display correctly
  - [ ] Voice input works (if available)
  - [ ] Photos can be uploaded

- [ ] **Android Chrome**
  - [ ] All pages render correctly
  - [ ] Navigation works
  - [ ] Can create entries
  - [ ] Touch targets are big enough
  - [ ] Modals display correctly
  - [ ] Voice input works (if available)
  - [ ] Photos can be uploaded

### Performance Testing
- [ ] **Run Lighthouse Audit**
  - [ ] Performance score > 80
  - [ ] Accessibility score > 90
  - [ ] Best Practices score > 90
  - [ ] SEO score > 80

- [ ] **Check Core Web Vitals**
  - [ ] LCP (Largest Contentful Paint) < 2.5s
  - [ ] FID (First Input Delay) < 100ms
  - [ ] CLS (Cumulative Layout Shift) < 0.1

### Error Scenarios
- [ ] **Offline Mode**
  - [ ] Disconnect internet
  - [ ] Try to create entry
  - [ ] See "offline" message
  - [ ] Entry saved to offline queue
  - [ ] Reconnect internet
  - [ ] Entry syncs automatically

- [ ] **Rate Limiting**
  - [ ] Make 11+ AI requests in 1 minute
  - [ ] See rate limit error message
  - [ ] Wait 1 minute
  - [ ] Can make requests again

- [ ] **Invalid Auth**
  - [ ] Manually clear localStorage
  - [ ] Page redirects to sign in
  - [ ] No errors in console

---

## Phase 5: Monitoring & Error Tracking

### Sentry Setup
- [ ] **Configure Sentry**
  - [ ] Create Sentry project
  - [ ] Add DSN to environment variables
  - [ ] Deploy with Sentry enabled
  - [ ] Trigger test error to verify tracking
  - [ ] Set up alert rules:
    - [ ] Alert on any error rate > 1% of users
    - [ ] Alert on critical errors immediately
  - [ ] Add team members to Sentry project

- [ ] **Verify Error Tracking**
  - [ ] Trigger a test error
  - [ ] Error appears in Sentry within 1 minute
  - [ ] Stack trace is readable
  - [ ] User context is captured

### Analytics (Optional for Soft Launch)
- [ ] **Set Up Analytics**
  - [ ] Choose analytics provider (PostHog, Plausible, etc.)
  - [ ] Add tracking code
  - [ ] Verify events are being tracked:
    - [ ] Page views
    - [ ] Sign ups
    - [ ] Entries created
    - [ ] AI features used

---

## Phase 6: Content & Legal

### Email Templates
- [ ] **Customize Supabase Email Templates**
  - Go to: Supabase Dashboard > Authentication > Email Templates
  - [ ] **Confirm Signup:**
    ```html
    <h2>Welcome to Chronicle AI!</h2>
    <p>Click the link below to confirm your email address:</p>
    <p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
    <p>Or copy this URL: {{ .ConfirmationURL }}</p>
    <p>If you didn't sign up for Chronicle AI, you can safely ignore this email.</p>
    ```
  
  - [ ] **Reset Password:**
    ```html
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your Chronicle AI password:</p>
    <p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
    <p>Or copy this URL: {{ .ConfirmationURL }}</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
    <p>This link expires in 1 hour.</p>
    ```
  
  - [ ] **Change Email:**
    ```html
    <h2>Confirm Email Change</h2>
    <p>Click the link below to confirm your new email address:</p>
    <p><a href="{{ .ConfirmationURL }}">Confirm New Email</a></p>
    <p>Or copy this URL: {{ .ConfirmationURL }}</p>
    ```
  
  - [ ] Test each email template by triggering the flow

### Legal Pages
- [ ] **Terms of Service**
  - [ ] Review and customize `TermsOfService.tsx`
  - [ ] Update jurisdiction/governing law section
  - [ ] Add your company email addresses
  - [ ] Deploy and verify accessible at `/terms`

- [ ] **Privacy Policy**
  - [ ] Review and customize `PrivacyPolicy.tsx`
  - [ ] Update data processing region
  - [ ] Add your DPO contact (if applicable)
  - [ ] Deploy and verify accessible at `/privacy`

- [ ] **Add Links Throughout App**
  - [ ] Footer of landing page
  - [ ] Footer of auth page
  - [ ] Profile/settings menu
  - [ ] Sign up flow (checkbox: "I agree to Terms")

### Marketing Content
- [ ] **Landing Page**
  - [ ] Deploy `LandingPage.tsx` at root `/`
  - [ ] Verify all links work
  - [ ] Test CTA buttons
  - [ ] Check responsive design
  - [ ] Optimize images (if any added)
  - [ ] Update meta tags for SEO

- [ ] **Help Center**
  - [ ] Deploy `HelpCenter.tsx` at `/help`
  - [ ] Verify all FAQs are accurate
  - [ ] Test search functionality
  - [ ] Test category filtering

---

## Phase 7: Security Hardening

### Security Headers
- [ ] **Add Security Headers to Hosting Platform**
  
  For Vercel, add `vercel.json`:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(self), camera=()"
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
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"
  ```

- [ ] Verify headers with: https://securityheaders.com/

### Rate Limiting Verification
- [ ] **Test All Rate Limits**
  - [ ] Client-side: 10 requests/minute to APIClient
  - [ ] Edge function: 10 requests/minute per user
  - [ ] Database: Verify `check_rate_limit` function works
  - [ ] Subscription tiers: Free=10/month, Pro=500/month

### Backup Verification
- [ ] **Confirm Supabase Backups**
  - [ ] Go to Supabase Dashboard > Database > Backups
  - [ ] Verify daily backups enabled (Pro tier required)
  - [ ] Document backup retention period
  - [ ] Test restore from backup (if possible)

---

## Phase 8: Launch Preparation

### Final Checks
- [ ] **Code Quality**
  - [ ] Run `npm run lint` - no errors
  - [ ] Run `npm run type-check` - no errors
  - [ ] No console.log statements in production code
  - [ ] All TODO comments addressed or documented

- [ ] **Documentation**
  - [ ] README.md updated with production instructions
  - [ ] DEPLOYMENT.md reviewed and accurate
  - [ ] API documentation up to date (if applicable)
  - [ ] Onboarding doc created for team members

- [ ] **Communication**
  - [ ] Support email configured: support@chronicle-ai.app
  - [ ] Auto-responder set up for support emails
  - [ ] Team members trained on support procedures
  - [ ] Escalation process documented

### Go-Live Checklist
- [ ] All items in previous phases complete
- [ ] Production build deployed
- [ ] DNS propagated (test with https://dnschecker.org/)
- [ ] SSL certificate active
- [ ] Error monitoring active and tested
- [ ] Support channels ready
- [ ] Launch blog post/announcement prepared (optional)
- [ ] Social media posts scheduled (optional)

### Post-Launch Monitoring (First 24 Hours)
- [ ] **Hour 1-2:** Monitor actively
  - [ ] Check Sentry for errors
  - [ ] Watch Supabase Dashboard for traffic
  - [ ] Monitor sign-ups
  - [ ] Check support email

- [ ] **Hour 3-6:** Check metrics
  - [ ] Sign-up conversion rate
  - [ ] Average time to first entry
  - [ ] AI usage patterns
  - [ ] Error rates

- [ ] **Hour 7-24:** Regular checks
  - [ ] Review error logs
  - [ ] Respond to support requests
  - [ ] Check database performance
  - [ ] Monitor costs

### Week 1 Post-Launch
- [ ] Review all user feedback
- [ ] Prioritize bug fixes
- [ ] Analyze usage patterns
- [ ] Plan first iteration/improvements

---

## Emergency Contacts & Rollback Plan

### Key Contacts
- [ ] Primary Developer: [Your Email/Phone]
- [ ] Supabase Support: support@supabase.com
- [ ] Hosting Support: [Vercel/Netlify support]
- [ ] Domain Registrar: [Your registrar]

### Rollback Procedure
If critical issues arise post-launch:

1. **Immediate Actions**
   - Post status update: "We're aware of an issue and investigating"
   - Stop all marketing/announcements
   - Assess severity (data loss? auth broken? just slow?)

2. **Rollback Steps**
   ```bash
   # Revert to previous deployment
   vercel rollback  # or netlify rollback
   
   # If database issue, restore from backup
   # Contact Supabase support with timestamp of last good state
   ```

3. **Communication**
   - Email all affected users (if data issue)
   - Post-mortem document after resolution
   - Prevent same issue from recurring

---

## Sign-Off

- [ ] **Technical Lead Approval:** _______________  Date: _______
- [ ] **Product Owner Approval:** _______________  Date: _______
- [ ] **Security Review Completed:** _____________  Date: _______

**Launch Date:** _____________

**Launch Time:** _____________ (UTC)

---

## Notes & Issues Encountered

_Document any issues found during checklist completion:_

1. 
2. 
3. 

---

**Congratulations on preparing for launch! 🚀**

Remember: It's okay if not every feature is perfect on day one. Focus on core functionality working reliably, then iterate based on user feedback.
