# Supabase Edge Functions Cron Configuration

To set up automated email notifications, you need to configure cron jobs in your Supabase project.

## Using pg_cron (Recommended for Supabase)

Supabase supports `pg_cron` extension for scheduling jobs. Add these to your database:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly digest (every Sunday at 9 AM UTC)
SELECT cron.schedule(
  'weekly-digest',
  '0 9 * * 0',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/weekly-digest-cron',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET_HERE',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule "On This Day" (every day at 8 AM UTC)
SELECT cron.schedule(
  'on-this-day',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/on-this-day-cron',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_CRON_SECRET_HERE',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Schedule streak reminders (every day at 7 PM UTC)
-- You'll need to create the streak-reminder-cron function first
-- SELECT cron.schedule(
--   'streak-reminder',
--   '0 19 * * *',
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://your-project.supabase.co/functions/v1/streak-reminder-cron',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer YOUR_CRON_SECRET_HERE',
--         'Content-Type', 'application/json'
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );
```

## Alternative: External Cron Services

You can also use external services like:

### 1. GitHub Actions (Free)

Create `.github/workflows/cron-jobs.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    # Weekly digest - Sundays at 9 AM UTC
    - cron: '0 9 * * 0'
    # On This Day - Daily at 8 AM UTC
    - cron: '0 8 * * *'

jobs:
  weekly-digest:
    if: github.event.schedule == '0 9 * * 0'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Weekly Digest
        run: |
          curl -X POST \
            https://your-project.supabase.co/functions/v1/weekly-digest-cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"

  on-this-day:
    if: github.event.schedule == '0 8 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger On This Day
        run: |
          curl -X POST \
            https://your-project.supabase.co/functions/v1/on-this-day-cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

### 2. Vercel Cron (If hosted on Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 0"
    },
    {
      "path": "/api/cron/on-this-day",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 3. EasyCron or Cron-job.org (Managed Services)

Simply add the URLs as cron jobs:
- Weekly: `https://your-project.supabase.co/functions/v1/weekly-digest-cron`
- Daily: `https://your-project.supabase.co/functions/v1/on-this-day-cron`

## Environment Variables Required

Make sure these are set in your Supabase project:

```bash
RESEND_API_KEY=re_xxxxx
GEMINI_API_KEY=xxxxx
APP_URL=https://your-app.com
CRON_SECRET=your-random-secret-string
```

## Testing

You can manually trigger the cron jobs for testing:

```bash
# Test weekly digest
curl -X POST \
  https://your-project.supabase.co/functions/v1/weekly-digest-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Test on this day
curl -X POST \
  https://your-project.supabase.co/functions/v1/on-this-day-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

## Monitoring

Monitor your cron jobs by checking:

1. Supabase Function Logs (Dashboard > Edge Functions > Logs)
2. Resend Dashboard (for email delivery status)
3. Set up error alerts in your monitoring service

## Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 9 * * 0` - Every Sunday at 9:00 AM
- `0 8 * * *` - Every day at 8:00 AM
- `0 19 * * *` - Every day at 7:00 PM
- `*/30 * * * *` - Every 30 minutes
