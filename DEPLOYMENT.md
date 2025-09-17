# Chronicle AI - Production Deployment Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Supabase account and project
- Google Cloud account with Gemini API access
- (Optional) Sentry account for error monitoring
- Deployment platform account (Vercel, Netlify, or similar)

## Environment Setup

### 1. Local Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Fill in your environment variables:

```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
VITE_GEMINI_API_KEY=your_gemini_api_key  # For local testing only
VITE_SENTRY_DSN=your_sentry_dsn
VITE_APP_URL=http://localhost:5173
```

### 2. Supabase Configuration

#### Database Setup

Run the migration script to create tables and RLS policies:

```bash
npx supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

#### Storage Setup

1. Go to Supabase Dashboard > Storage
2. Create a bucket named `journal-photos`
3. Set it to public access
4. Configure CORS if needed

#### Edge Functions

Deploy the Gemini proxy function:

```bash
# Set your Gemini API key in Supabase
npx supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Deploy the function
npx supabase functions deploy gemini-proxy
```

#### Authentication

1. Enable Email/Password authentication
2. Enable OAuth providers (Google, GitHub)
3. Configure redirect URLs:
   - Local: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`

## Build Optimization

### 1. Production Build

```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test

# Build for production
npm run build:prod
```

### 2. Bundle Analysis

```bash
npm run analyze
```

Review the bundle visualization and optimize if needed:
- Remove unused dependencies
- Lazy load heavy components
- Use dynamic imports for code splitting

### 3. Performance Checklist

- [x] Code splitting implemented
- [x] Lazy loading for routes
- [x] Image optimization
- [x] Bundle compression (gzip/brotli)
- [x] Tree shaking enabled
- [x] Console logs removed in production
- [x] Source maps hidden in production
- [x] PWA configured for offline support

## Security Checklist

- [x] Environment variables properly configured
- [x] API keys stored securely (never in client code)
- [x] Input validation and sanitization
- [x] XSS protection (DOMPurify)
- [x] Rate limiting implemented
- [x] RLS policies configured in Supabase
- [x] HTTPS enforced
- [x] Content Security Policy headers
- [x] CORS properly configured

## Deployment Platforms

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Configure environment variables in Vercel dashboard
3. Deploy:

```bash
vercel --prod
```

### Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Create `netlify.toml`:

```toml
[build]
  command = "npm run build:prod"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

3. Deploy:

```bash
netlify deploy --prod
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Monitoring & Maintenance

### 1. Error Monitoring (Sentry)

- Monitor error rates
- Set up alerts for critical errors
- Review performance metrics
- Configure release tracking

### 2. Performance Monitoring

- Use Lighthouse for performance audits
- Monitor Core Web Vitals
- Set up Real User Monitoring (RUM)
- Track API response times

### 3. Database Maintenance

```sql
-- Regular maintenance queries
-- Clean up old sessions
DELETE FROM auth.sessions WHERE created_at < NOW() - INTERVAL '30 days';

-- Analyze table performance
ANALYZE journal_entries;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 4. Backup Strategy

- Enable Supabase daily backups
- Export critical data regularly
- Test restore procedures
- Document recovery processes

## Scaling Considerations

### When to Scale

- API rate limits being hit
- Database connection pool exhausted
- Storage approaching limits
- Response times degrading

### Scaling Options

1. **Database**: Upgrade Supabase tier
2. **Storage**: Implement CDN for images
3. **API**: Implement caching layer
4. **Frontend**: Use edge deployment

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node version
   - Clear cache: `rm -rf node_modules dist`
   - Reinstall: `npm ci`

2. **Runtime Errors**
   - Check browser console
   - Review Sentry errors
   - Verify environment variables

3. **Performance Issues**
   - Run Lighthouse audit
   - Check bundle size
   - Review network waterfall
   - Analyze database queries

### Debug Mode

Enable debug mode in production (temporarily):

```javascript
// In src/config/index.ts
export const DEBUG = new URLSearchParams(window.location.search).has('debug');
```

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flows
- [ ] Verify data persistence
- [ ] Check offline functionality
- [ ] Test on mobile devices
- [ ] Verify error tracking
- [ ] Monitor initial performance
- [ ] Set up uptime monitoring
- [ ] Configure backup automation
- [ ] Document deployment process

## Support

For issues or questions:
- GitHub Issues: [your-repo-url]
- Documentation: [your-docs-url]
- Email: support@chronicle-ai.app
