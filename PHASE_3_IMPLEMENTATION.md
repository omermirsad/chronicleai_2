# Phase 3: Defensible Moat (Retention & Stickiness) - Implementation Guide

## Overview

Phase 3 focuses on building sustainable retention mechanisms through:
1. **Automated Email Notifications** - Weekly digests and "On This Day" memories
2. **Gamification & Streaks** - Engagement tracking and achievement system
3. **AI-Powered Coaching** - Interactive, multi-step coaching modules

---

## ✅ Feature #13: Weekly Mood-Based Newsletter

### Implementation Status: **COMPLETE**

### What Was Built:

#### 1. Email Templates (`supabase/functions/_shared/email-templates/`)
- **`base.ts`** - Shared email layout with consistent branding
- **`weekly-digest.ts`** - Personalized weekly summary template
- **`on-this-day.ts`** - Memory lane email template
- **`streak-reminder.ts`** - Streak maintenance and milestone emails

#### 2. Email Service Integration
- **Package**: `resend` (installed via npm)
- **Edge Function**: `supabase/functions/send-email/index.ts`
  - Handles authenticated email sending
  - Uses Resend API for delivery
  - Supports HTML email templates

#### 3. Weekly Digest Cron Job
- **Location**: `supabase/functions/weekly-digest-cron/index.ts`
- **Frequency**: Weekly (recommended: Sundays at 9 AM)
- **Features**:
  - Aggregates entries from past 7 days
  - Calculates average mood and energy
  - Extracts top 5 tags
  - Determines mood trend (improving/declining/stable)
  - Generates AI summary using Gemini
  - Respects user preferences (`weeklyDigest` toggle)

#### 4. User Preferences
- **Location**: `src/pages/Settings.tsx`
- **New Toggles Added**:
  - ✅ Enable Email Notifications (master switch)
  - ✅ Weekly Digest
  - ✅ On This Day
  - ✅ Streak Reminders
  - ✅ Achievement Notifications

### Required Environment Variables:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
GEMINI_API_KEY=xxxxxxxxxxxxx
APP_URL=https://your-app-url.com
CRON_SECRET=random-secret-string-for-auth
```

### Setup Instructions:

1. **Install Dependencies**:
   ```bash
   npm install resend
   ```

2. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy send-email
   npx supabase functions deploy weekly-digest-cron
   npx supabase functions deploy on-this-day-cron
   ```

3. **Configure Cron Jobs**:
   See `supabase/functions/_shared/cron-config.md` for detailed instructions on:
   - pg_cron setup (recommended for Supabase)
   - GitHub Actions (free alternative)
   - External cron services (EasyCron, Vercel)

4. **Test Manually**:
   ```bash
   curl -X POST \
     https://your-project.supabase.co/functions/v1/weekly-digest-cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

---

## ✅ Feature #14: "On This Day" Email Notifications

### Implementation Status: **COMPLETE**

### What Was Built:

#### 1. Daily Cron Job
- **Location**: `supabase/functions/on-this-day-cron/index.ts`
- **Frequency**: Daily (recommended: 8 AM local time)
- **Features**:
  - Queries entries from same date in previous years
  - Uses existing `get_on_this_day_entries()` database function
  - Sends personalized memory emails
  - Shows entry excerpts, mood, and tags
  - Includes deep links back to full entries

#### 2. Email Template
- **Location**: `supabase/functions/_shared/email-templates/on-this-day.ts`
- **Features**:
  - Displays multiple memories if available
  - Shows "X years ago" badges
  - Includes entry preview (300 chars)
  - Links to full entry view
  - Inspirational quote

### User Experience:

1. Users receive daily email at 8 AM (configurable)
2. Email shows entries from 1+ years ago on this date
3. Users can click through to view full entries
4. Can opt out via Settings > Email Notifications > On This Day

---

## ✅ Feature #15: Personalized AI Coaching

### Implementation Status: **COMPLETE**

### What Was Built:

#### 1. Coaching Module System
- **Location**: `src/services/geminiService.ts`
- **New Export**: `COACHING_MODULES` and `getCoachingPrompt()`

#### 2. Five Coaching Modules:

##### 🎯 Goal Setting & Clarity
- 4-step process for defining and planning goals
- SMART goal framework integration
- Action-oriented closing

##### 😰 Anxiety Management
- 4-step CBT-inspired anxiety exploration
- Focus on control vs. acceptance
- Grounding and coping strategies

##### 🙏 Gratitude Practice
- 4-step gratitude cultivation
- Broadens perspective beyond current challenges
- Reinforces positive patterns

##### 💙 Self-Compassion Exercise
- Based on Kristin Neff's framework
- Recognizes inner critic
- Normalizes struggles through common humanity

##### 🧘 Mindfulness Check-In
- Present-moment awareness practice
- Body scan and emotion naming
- Non-judgmental observation

#### 3. Dynamic Follow-ups
Each module uses AI to:
- Acknowledge user responses with empathy
- Generate personalized follow-up questions
- Adapt flow based on user input
- Provide warm closing reflections

### Integration Points:

The existing `JournalEditor.tsx` already supports guided sessions via the `getGuidedPrompt()` function. The new coaching modules can be integrated by:

1. Extending `GuidedSessionType` to include coaching modules
2. Using `getCoachingPrompt()` instead of `getGuidedPrompt()` for coaching sessions
3. Maintaining step-by-step conversation history

### Usage Example:

```typescript
import { getCoachingPrompt, COACHING_MODULES } from './services/geminiService';

// Get first coaching prompt
const { prompt } = await getCoachingPrompt('goal-setting', 0);

// Get next prompt after user response
const { followUp, prompt: nextPrompt } = await getCoachingPrompt(
  'goal-setting',
  1,
  userResponse
);
```

---

## ✅ Feature #16: Gamification & Retention Mechanics

### Implementation Status: **COMPLETE**

### What Was Built:

#### 1. Database Schema (`supabase/migrations/003_add_gamification_features.sql`)

**New Profile Columns**:
- `current_streak` (INTEGER) - Consecutive days journaling
- `longest_streak` (INTEGER) - Personal best
- `last_entry_date` (DATE) - For streak calculation

**New Tables**:
- `achievement_definitions` - 14 pre-defined achievements
- `user_achievements` - User's earned achievements with timestamps

**Achievement Categories**:
- 🔥 **Streaks**: 3, 7, 14, 30, 100 days
- 📝 **Entries**: 10, 50, 100, 365 entries
- 💡 **Insights**: 5, 25 insights generated
- 🧭 **Exploration**: On This Day views, Perspectives, Guided sessions

**Database Functions**:
- `calculate_user_streak()` - True consecutive day calculation
- `update_user_streak()` - Automatic trigger on entry creation
- `check_and_award_achievements()` - Award matching achievements
- `get_user_achievements()` - Fetch user's earned achievements

#### 2. Frontend Integration

**New Hook** (`src/hooks/useGamification.ts`):
```typescript
const { stats, loading, refresh, checkForNewAchievements } = useGamification();

// stats contains:
// - currentStreak, longestStreak
// - totalPoints
// - achievements[]
// - nextMilestone (progress tracking)
```

**New Components**:

##### `StreakDisplay.tsx`
- **Compact variant**: Shows current streak (🔥 3 day streak)
- **Full variant**: Current, longest, next milestone, progress bar
- Integrated into Header dropdown
- Available on Achievements page

##### `AchievementsGallery.tsx`
- Grid display of all achievements
- Earned vs. locked states
- Category filtering (All, Streaks, Entries, Insights, Exploration)
- Progress tracking (X/14 unlocked)
- Total points display

#### 3. New Routes

**`/achievements`** (`src/pages/AchievementsPage.tsx`):
- Full streak display
- Achievement gallery with filters
- Accessible via Header > Achievements

#### 4. Header Integration
- Streak display in user dropdown
- "🏆 Achievements" menu item added
- Navigate to `/achievements` for full view

### Gamification Flow:

1. **User writes entry** → Trigger fires
2. **Streak calculated** → Profile updated
3. **Achievements checked** → New achievements awarded
4. **Frontend polling** → UI updates with new badges
5. **(Future)** → Email notification for milestones

---

## 🔧 Technical Architecture

### Email Flow:
```
Cron Job → Supabase Edge Function → Resend API → User's Inbox
          ↓
    Checks preferences
    Aggregates data
    Generates AI summary
```

### Streak Calculation:
```
Entry Created → Trigger → calculate_user_streak()
                       ↓
              Update profiles table
                       ↓
              check_and_award_achievements()
                       ↓
              Insert user_achievements
```

### Coaching Flow:
```
User selects module → getCoachingPrompt(moduleType, 0)
                   ↓
              Display prompt
                   ↓
           User responds
                   ↓
    getCoachingPrompt(moduleType, stepNumber, response)
                   ↓
         AI generates follow-up
                   ↓
              Repeat until complete
```

---

## 📊 Database Migration

To apply gamification schema:

```bash
# Run migration
npx supabase db push

# Or apply manually
psql $DATABASE_URL < supabase/migrations/003_add_gamification_features.sql
```

The migration will:
1. Add new columns to profiles
2. Create achievement tables
3. Insert 14 default achievements
4. Calculate initial streaks for existing users
5. Set up triggers for automatic updates

---

## 🎨 UI/UX Enhancements

### Settings Page
- Reorganized email preferences into collapsible section
- Master switch + granular controls
- Visual hierarchy with descriptions
- Disabled old "Insights Frequency" (now redundant)

### Header
- Added streak display in dropdown
- New "Achievements" navigation item
- Increased dropdown width for streak display

### New Achievements Page
- Hero section with full streak display
- Progress bar and stats
- Category filter tabs
- Responsive grid layout
- Locked/earned visual states

---

## 🧪 Testing Checklist

### Email Notifications:
- [ ] Weekly digest sends on Sunday
- [ ] On This Day sends daily at 8 AM
- [ ] Emails respect user preferences
- [ ] AI summaries are coherent and empathetic
- [ ] Unsubscribe links work
- [ ] Email templates render correctly in Gmail/Outlook/Apple Mail

### Gamification:
- [ ] Streak increments on consecutive days
- [ ] Streak breaks when day is skipped
- [ ] Achievements auto-award at milestones
- [ ] UI shows correct current/longest streak
- [ ] Achievement gallery filters work
- [ ] Locked achievements appear grayscale
- [ ] Points total correctly

### Coaching:
- [ ] All 5 modules load properly
- [ ] Step-by-step flow works
- [ ] AI follow-ups are contextual
- [ ] Closing reflections generate
- [ ] Error states fallback gracefully

---

## 🚀 Deployment Steps

1. **Environment Variables**:
   ```bash
   # In Supabase Dashboard > Settings > Edge Functions
   RESEND_API_KEY=re_xxxxx
   GEMINI_API_KEY=xxxxx
   APP_URL=https://your-app.com
   CRON_SECRET=random-secret
   ```

2. **Database Migration**:
   ```bash
   npx supabase db push
   ```

3. **Deploy Edge Functions**:
   ```bash
   npx supabase functions deploy send-email
   npx supabase functions deploy weekly-digest-cron
   npx supabase functions deploy on-this-day-cron
   ```

4. **Set Up Cron Jobs**:
   - Follow instructions in `supabase/functions/_shared/cron-config.md`
   - Use pg_cron, GitHub Actions, or external service

5. **Deploy Frontend**:
   ```bash
   npm run build
   # Deploy to Vercel/Netlify
   ```

---

## 📈 Metrics to Track

### Retention Metrics:
- **Weekly Active Users (WAU)** - Users with entries in past 7 days
- **Monthly Active Users (MAU)** - Users with entries in past 30 days
- **Average Streak Length** - Mean current_streak across users
- **Streak Survival Rate** - % of users maintaining 7+ day streak

### Engagement Metrics:
- **Email Open Rate** - Weekly digest & On This Day
- **Email Click-Through Rate** - Deep links to app
- **Achievement Completion Rate** - % of users with 5+ achievements
- **Coaching Module Usage** - Completions per module type

### Feature Adoption:
- **Email Opt-In Rate** - % enabling weekly digest
- **Achievements Page Views** - Traffic to `/achievements`
- **Coaching Session Starts** - Initial module activations
- **Coaching Session Completions** - Finished all steps

---

## 🎯 Success Criteria

Phase 3 is successful if:

1. **Retention Improves**:
   - 30-day retention increases by 20%
   - Average streak length > 5 days
   - WAU/MAU ratio > 0.3

2. **Email Engagement**:
   - Open rate > 40% (industry avg: 20-25%)
   - Click rate > 15%
   - Unsubscribe rate < 2%

3. **Feature Adoption**:
   - 60%+ users opt into weekly digest
   - 50%+ users visit achievements page
   - 40%+ users try coaching module

4. **Qualitative Signals**:
   - Positive user feedback on emails
   - Streaks motivate daily usage
   - Coaching modules feel helpful, not gimmicky

---

## 🔮 Future Enhancements

### Email Notifications:
- [ ] Personalized send time optimization (ML-based)
- [ ] Daily streak reminder at 8 PM
- [ ] Monthly "Year in Review" email
- [ ] Smart digest (only send if interesting patterns detected)

### Gamification:
- [ ] Streak freeze days (1 per month)
- [ ] Social features (anonymized leaderboards)
- [ ] Custom achievement definitions
- [ ] Achievement badges in email signatures
- [ ] Weekly challenges (e.g., "Journal 7 days this week")

### Coaching:
- [ ] Full JournalEditor refactor for coaching mode
- [ ] Save coaching session progress
- [ ] Coaching session library/history
- [ ] Personalized module recommendations based on mood/tags
- [ ] Longer-form coaching programs (21-day, 90-day)

---

## 📚 Related Documentation

- **Email Setup**: `supabase/functions/_shared/cron-config.md`
- **Database Schema**: `supabase/migrations/003_add_gamification_features.sql`
- **Type Definitions**: `src/types.ts` (lines 190-259)
- **Coaching Modules**: `src/services/geminiService.ts` (lines 207-354)

---

## 🙋 Support & Troubleshooting

### "Weekly digest not sending"
1. Check cron job is configured and running
2. Verify `RESEND_API_KEY` is set correctly
3. Check user has `weeklyDigest: true` in preferences
4. Review Supabase function logs for errors

### "Streak not incrementing"
1. Verify migration 003 was applied
2. Check trigger exists: `trigger_update_streak`
3. Ensure entry has valid `date` field
4. Run `SELECT calculate_user_streak('user-id')` manually

### "Achievements not awarding"
1. Call `check_and_award_achievements(user_id)` manually
2. Check `achievement_definitions` table has 14 rows
3. Verify RLS policies allow inserts to `user_achievements`
4. Review function logs for errors

### "Coaching prompts failing"
1. Verify `GEMINI_API_KEY` is set
2. Check `gemini-proxy` edge function is deployed
3. Review network tab for API errors
4. Test with fallback prompts (should always work)

---

## ✅ Checklist for Completion

- [x] Weekly digest cron job implemented
- [x] On This Day cron job implemented
- [x] Email templates created (weekly, on-this-day, streak-reminder)
- [x] Email opt-in toggles in Settings
- [x] Database schema for streaks and achievements
- [x] Automatic streak calculation trigger
- [x] Achievement system with 14 default achievements
- [x] Gamification hook (`useGamification`)
- [x] Streak display component (compact & full)
- [x] Achievements gallery component
- [x] Achievements page with routing
- [x] Header integration (streak + menu item)
- [x] Coaching modules (5 types)
- [x] Dynamic coaching prompts with AI
- [x] Documentation completed
- [ ] Cron jobs scheduled in production
- [ ] End-to-end testing completed
- [ ] Deployed to production

---

**Implementation Date**: November 2025
**Status**: ✅ Ready for Testing & Deployment
**Next Steps**: Set up cron jobs, test email delivery, monitor metrics
