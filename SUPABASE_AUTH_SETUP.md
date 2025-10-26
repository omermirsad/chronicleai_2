# Supabase Authentication Setup Guide

This guide explains how to configure Supabase to handle email confirmations and password resets properly.

## Issue
When users click the "Confirm your signup" link in their email, they cannot complete registration. The same issue occurs with password reset links.

## Solution
You need to configure the redirect URLs in your Supabase project dashboard.

## Steps to Fix

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (chronicleai_2)
3. Navigate to **Authentication** → **URL Configuration**

### 2. Configure Redirect URLs

You need to add your application URLs to the allowed redirect URLs list:

#### For Local Development:
```
http://localhost:5173/auth/callback
```

#### For Production:
```
https://your-production-domain.com/auth/callback
```

**Important:** Add both if you're testing locally and have a production site.

### 3. Configure Site URL

Set the **Site URL** to your application's main URL:

- **Local Development:** `http://localhost:5173`
- **Production:** `https://your-production-domain.com`

### 4. Email Template Configuration (Optional)

The email templates should automatically use the configured redirect URLs. However, you can verify this:

1. Go to **Authentication** → **Email Templates**
2. Check the **Confirm Signup** template
3. Ensure it contains: `{{ .ConfirmationURL }}`
4. Check the **Reset Password** template
5. Ensure it contains: `{{ .ConfirmationURL }}`

### 5. Disable Email Confirmation (Optional - NOT RECOMMENDED)

If you want to disable email confirmation entirely (not recommended for production):

1. Go to **Authentication** → **Settings**
2. Find **Enable email confirmations**
3. Toggle it off

**Warning:** This is NOT recommended for production as it allows anyone to sign up without verifying their email.

## How It Works

After the fix:

1. User signs up with email/password
2. Supabase sends confirmation email
3. User clicks "Confirm your signup" link
4. User is redirected to: `your-domain.com/auth/callback?token=...`
5. The app detects the token and establishes the session
6. User is redirected to `/app` (the main application)
7. User is now logged in!

## Testing the Fix

### Local Testing:
1. Start your development server: `npm run dev`
2. Sign up with a new email address
3. Check your email for the confirmation link
4. Click the confirmation link
5. You should be redirected to the app and logged in

### Verify Configuration:
1. In Supabase Dashboard → Authentication → URL Configuration
2. Confirm your redirect URLs are listed
3. Test both signup confirmation and password reset flows

## Troubleshooting

### Still not working?
- Check browser console for errors
- Verify the redirect URL in Supabase matches your app URL exactly
- Check that your `.env` files have the correct Supabase credentials
- Ensure you're using the correct Supabase project

### Email not arriving?
- Check spam folder
- Verify email provider settings in Supabase
- Check Supabase logs for email delivery status

### Session not persisting?
- Clear browser cache and cookies
- Check that `localStorage` is enabled in your browser
- Verify the Supabase client configuration in `src/lib/supabase.ts`

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Configuration Guide](https://supabase.com/docs/guides/auth/auth-email)
- [Redirect URLs Documentation](https://supabase.com/docs/reference/javascript/auth-signup#sign-up-with-redirect)
