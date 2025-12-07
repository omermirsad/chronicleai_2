# Chronicle AI - First Deployment Checklist

Use this checklist for your very first production deployment. Print it out or check items off as you go.

**Estimated Time:** 2-3 hours  
**Date Started:** ___________  
**Completed By:** ___________

---

## ☑️ Pre-Deployment (30 minutes)

### Local Setup
- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm 9+ installed (`npm -v`)
- [ ] Git configured with your credentials
- [ ] Code editor set up (VS Code recommended)
- [ ] All dependencies installed (`npm install`)
- [ ] No errors in `npm run type-check`
- [ ] No errors in `npm run lint`

### Accounts Created
- [ ] Supabase account created
- [ ] Google Cloud account (for Gemini API)
- [ ] Gemini API key obtained
- [ ] Vercel OR Netlify account created
- [ ] Domain name purchased (or will use free subdomain)
- [ ] Email account for support@yourdomain.com

---

## ☑️ Supabase Setup (45 minutes)

### Project Creation
- [ ] New Supabase project created
- [ ] Project name: `chronicle-ai-production`
- [ ] Region selected (closest to users)
- [ ] Database password saved securely
- [ ] Pro tier ($25/month) or higher selected

### Credentials
- [ ] Project URL copied
- [ ] Anon/public key copied
- [ ] Service role key copied and stored securely
- [ ] All keys added to `.env.local` file

### Database
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Project linked (`npx supabase link`)
- [ ] Migrations pushed (`npx supabase db push`)
- [ ] All 5 tables visible in Table Editor:
  - [ ] profiles
  - [ ] journal_entries
  - [ ] audit_logs
  - [ ] rate_limits
  - [ ] user_sessions
- [ ] RLS enabled on all tables
- [ ] Database functions created (check SQL editor)

### Storage
- [ ] `journal-photos` bucket created
- [ ] Bucket set to **public**
- [ ] File size limit: 5MB
- [ ] RLS policies applied to storage.objects

### Authentication
- [ ] Email provider enabled
- [ ] Email confirmation enabled for production
- [ ] Google OAuth configured:
  - [ ] Client ID obtained
  - [ ] Client Secret obtained
  - [ ] Redirect URI added
  - [ ] Credentials added to Supabase
- [ ] GitHub OAuth configured:
  - [ ] OAuth App created
  - [ ] Client ID obtained
  - [ ] Client Secret obtained
  - [ ] Callback URL added
  - [ ] Credentials added to Supabase
- [ ] Site URL set to production domain
- [ ] Redirect URLs configured

### Email Templates
- [ ] Confirm Signup template customized
- [ ] Reset Password template customized
- [ ] Magic Link template customized
- [ ] Change Email template customized
- [ ] All email templates tested

### Edge Functions
- [ ] Gemini API key set as secret (`npx supabase secrets set`)
- [ ] Secret verified (`npx supabase secrets list`)
- [ ] `gemini-proxy` function deployed
- [ ] `health` function deployed (optional)
- [ ] Functions tested with curl
- [ ] Function logs checked (no errors)

---

## ☑️ Code Preparation (30 minutes)

### Environment Variables
- [ ] `.env.local` created from `.env.example`
- [ ] `VITE_SUPABASE_URL` set correctly
- [ ] `VITE_SUPABASE_ANON_KEY` set correctly
- [ ] `VITE_APP_URL` set to production URL
- [ ] Optional variables configured (Sentry, PWA)
- [ ] Environment variables validated (`npm run validate:env`)

### Code Quality
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.log in production code
- [ ] All TODOs addressed or documented
- [ ] Tests passing (`npm test`)

### Build Test
- [ ] Production build successful (`npm run build:prod`)
- [ ] `dist` folder created
- [ ] `dist/index.html` exists
- [ ] Bundle size reasonable (<2MB)
- [ ] Build analyzed (`npm run analyze`)

### Pre-Deployment Check
- [ ] Pre-deployment script passed (`./scripts/pre-deploy.sh`)
- [ ] All checks green

---

## ☑️ Hosting Setup (30 minutes)

### Choose Your Platform

**Option A: Vercel**
- [ ] Vercel CLI installed (`npm install -g vercel`)
- [ ] Logged in (`vercel login`)
- [ ] Project linked (`vercel link`)
- [ ] Environment variables added in dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_APP_URL`
  - [ ] `NODE_ENV=production`
- [ ] `vercel.json` configuration in place
- [ ] Deployed to production (`vercel --prod`)

**Option B: Netlify**
- [ ] Netlify CLI installed (`npm install -g netlify-cli`)
- [ ] Logged in (`netlify login`)
- [ ] Site created (`netlify link`)
- [ ] Environment variables added in dashboard
- [ ] `netlify.toml` configuration in place
- [ ] Build settings configured:
  - [ ] Build command: `npm run build:prod`
  - [ ] Publish directory: `dist`
- [ ] Deployed to production (`netlify deploy --prod`)

### Domain Configuration
- [ ] Custom domain added (or using free subdomain)
- [ ] DNS records updated:
  - [ ] A record or CNAME configured
  - [ ] DNS propagation checked (dnschecker.org)
- [ ] SSL certificate issued (wait 5-10 minutes)
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS

---

## ☑️ Post-Deployment (30 minutes)

### Update Supabase Settings
- [ ] Site URL updated to production domain
- [ ] Redirect URLs updated:
  - [ ] Production URL added
  - [ ] Local URL kept for development
- [ ] OAuth redirect URIs updated
- [ ] Changes saved

### Verification
- [ ] Database verification passed (`npm run verify:db`)
- [ ] Health check passed:
  ```bash
  npx ts-node scripts/health-check.ts --url https://yourdomain.com
  ```
- [ ] All health checks green:
  - [ ] Main page loads
  - [ ] Terms page accessible
  - [ ] Privacy page accessible
  - [ ] Help page accessible
  - [ ] SSL/TLS working
  - [ ] Security headers present

### Manual Testing
- [ ] **Sign Up Flow:**
  - [ ] Email sign up works
  - [ ] Verification email received
  - [ ] Email link works
  - [ ] Redirects to app after verification
  
- [ ] **OAuth Flow:**
  - [ ] Google sign in works
  - [ ] GitHub sign in works
  - [ ] Profile created correctly
  
- [ ] **Core Features:**
  - [ ] Can create freestyle entry
  - [ ] AI analysis appears (<15 seconds)
  - [ ] Tags and sentiment displayed
  - [ ] Can upload photo
  - [ ] Photo displays correctly
  - [ ] Calendar view works
  - [ ] Perspective lens works
  - [ ] Can generate insights (3+ entries)
  
- [ ] **Mobile Testing:**
  - [ ] Tested on iPhone Safari
  - [ ] Tested on Android Chrome
  - [ ] All features work on mobile
  - [ ] UI responsive on all screen sizes

### Performance
- [ ] Lighthouse audit run
- [ ] Performance score >80
- [ ] Accessibility score >90
- [ ] Page load time <3 seconds
- [ ] No console errors

---

## ☑️ Monitoring Setup (15 minutes)

### Error Monitoring (Optional but Recommended)
- [ ] Sentry project created (if using)
- [ ] Sentry DSN added to environment variables
- [ ] Test error sent to verify tracking
- [ ] Alert rules configured
- [ ] Team members invited

### Uptime Monitoring
- [ ] Uptime monitor service chosen (UptimeRobot, etc.)
- [ ] Monitor created for production URL
- [ ] Check interval: 5 minutes
- [ ] Alert email configured
- [ ] SSL expiry alerts enabled
- [ ] Test alert sent

### Supabase Monitoring
- [ ] Email alerts enabled in Supabase dashboard
- [ ] Monitoring high CPU usage
- [ ] Monitoring high memory usage
- [ ] Monitoring storage quota
- [ ] Database performance dashboard bookmarked

---

## ☑️ Documentation (10 minutes)

### Internal Documentation
- [ ] Deployment date recorded
- [ ] Production URLs documented:
  - [ ] App URL: ___________
  - [ ] Supabase URL: ___________
  - [ ] Admin email: ___________
- [ ] Credentials stored securely (password manager)
- [ ] Emergency contacts list created
- [ ] Rollback procedure documented
- [ ] Support email configured (support@yourdomain.com)

### External Documentation
- [ ] Help Center reviewed and updated
- [ ] Terms of Service reviewed
- [ ] Privacy Policy reviewed
- [ ] README updated with production info

---

## ☑️ Go Live! (5 minutes)

### Final Checks
- [ ] All previous items checked ✅
- [ ] Team members have access
- [ ] Support email monitored
- [ ] Monitoring dashboards open

### Launch
- [ ] Status: 🟢 LIVE
- [ ] Announced (if ready)
- [ ] First users invited
- [ ] Monitoring actively for first 2 hours

---

## ☑️ First 24 Hours

### Hour 1-2 (Active Monitoring)
- [ ] Sentry checked (no critical errors)
- [ ] Supabase Dashboard checked (traffic flowing)
- [ ] Sign-up rate monitored
- [ ] Support email checked

### Hour 3-6 (Metrics Review)
- [ ] User sign-ups counted: _____
- [ ] Entries created counted: _____
- [ ] AI features used: _____
- [ ] Error rate: _____%
- [ ] Average load time: _____ms

### Hour 7-24 (Regular Checks)
- [ ] Error logs reviewed every 4 hours
- [ ] Support requests answered
- [ ] Database performance checked
- [ ] Costs monitored

---

## ✅ Success Criteria

Your deployment is **successful** when all of these are true:

- ✅ All health checks passing
- ✅ Users can sign up and sign in
- ✅ Journal entries can be created
- ✅ AI analysis working (<15 seconds)
- ✅ Photos uploading successfully
- ✅ Mobile experience working
- ✅ No critical errors in logs
- ✅ Performance acceptable (<3s load)
- ✅ Monitoring active and alerting

---

## 🆘 If Something Goes Wrong

### Immediate Actions
1. **Don't Panic** - Most issues are fixable
2. **Check the logs** - Supabase, Vercel/Netlify, browser console
3. **Review recent changes** - What was deployed?
4. **Rollback if needed** - `vercel rollback` or `netlify rollback`
5. **Post status update** - Be transparent with users
6. **Ask for help** - Support channels, GitHub, Discord

### Common Issues
- **"Site not loading"** → Check DNS propagation, SSL cert
- **"Sign up not working"** → Check Supabase auth settings
- **"AI not working"** → Check edge function logs and API key
- **"Photos not uploading"** → Check storage bucket and RLS policies

---

## 📞 Emergency Contacts

**Primary Developer:**
- Name: ___________
- Email: ___________
- Phone: ___________

**Services:**
- Supabase: support@supabase.com
- Vercel: https://vercel.com/support
- Gemini: https://ai.google.dev/support

---

## 🎉 Congratulations!

If you've checked all the boxes above, you've successfully deployed Chronicle AI to production!

**Next Steps:**
1. Monitor closely for first week
2. Gather user feedback
3. Fix any issues quickly
4. Plan next iteration

**Remember:** Launch is just the beginning. The real work is listening to users and iterating.

---

**Deployment Completed:** ___________  
**Deployed By:** ___________  
**Notes:**

_____________________________________________
_____________________________________________
_____________________________________________

---

*Keep this checklist for future reference and deployments*
