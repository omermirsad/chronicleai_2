# Supabase Email Templates for Chronicle AI

These templates should be configured in your Supabase Dashboard under:
**Authentication > Email Templates**

---

## 1. Confirm Signup Email

**Subject:** Welcome to Chronicle AI - Confirm Your Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #292524;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f43f5e;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #f43f5e;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #f43f5e;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      text-align: center;
      font-size: 14px;
      color: #78716c;
    }
    .code-box {
      background-color: #fef2f2;
      border: 1px solid #f43f5e;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📖 Chronicle AI</div>
  </div>
  
  <div class="content">
    <h1>Welcome to Chronicle AI!</h1>
    
    <p>Thank you for signing up. We're excited to be part of your self-reflection journey.</p>
    
    <p>To get started, please confirm your email address by clicking the button below:</p>
    
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Your Email</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="code-box">{{ .ConfirmationURL }}</div>
    
    <p><strong>This link expires in 24 hours.</strong></p>
    
    <p>Once confirmed, you'll be able to:</p>
    <ul>
      <li>Create unlimited journal entries</li>
      <li>Get AI-powered insights and perspectives</li>
      <li>Track your mood and energy over time</li>
      <li>Discover patterns in your thoughts and emotions</li>
    </ul>
    
    <p>If you didn't create an account with Chronicle AI, you can safely ignore this email.</p>
  </div>
  
  <div class="footer">
    <p>Chronicle AI - Your Intelligent Journaling Companion</p>
    <p>
      <a href="https://chronicle-ai.app/help" style="color: #f43f5e; text-decoration: none;">Help Center</a> • 
      <a href="https://chronicle-ai.app/privacy" style="color: #f43f5e; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
```

---

## 2. Reset Password Email

**Subject:** Reset Your Chronicle AI Password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #292524;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f43f5e;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #f43f5e;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #f43f5e;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      text-align: center;
      font-size: 14px;
      color: #78716c;
    }
    .code-box {
      background-color: #fef2f2;
      border: 1px solid #f43f5e;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📖 Chronicle AI</div>
  </div>
  
  <div class="content">
    <h1>Reset Your Password</h1>
    
    <p>We received a request to reset the password for your Chronicle AI account.</p>
    
    <p>Click the button below to create a new password:</p>
    
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="code-box">{{ .ConfirmationURL }}</div>
    
    <div class="warning-box">
      <strong>⚠️ Important:</strong> This link expires in 1 hour for security reasons.
    </div>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <p>For your security, we recommend:</p>
    <ul>
      <li>Using a strong, unique password</li>
      <li>Not sharing your password with anyone</li>
      <li>Enabling two-factor authentication (when available)</li>
    </ul>
  </div>
  
  <div class="footer">
    <p>Chronicle AI - Your Intelligent Journaling Companion</p>
    <p>
      <a href="https://chronicle-ai.app/help" style="color: #f43f5e; text-decoration: none;">Help Center</a> • 
      <a href="mailto:support@chronicle-ai.app" style="color: #f43f5e; text-decoration: none;">Contact Support</a>
    </p>
  </div>
</body>
</html>
```

---

## 3. Magic Link Email (Passwordless Sign In)

**Subject:** Your Chronicle AI Sign In Link

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #292524;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f43f5e;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #f43f5e;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #f43f5e;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      text-align: center;
      font-size: 14px;
      color: #78716c;
    }
    .code-box {
      background-color: #fef2f2;
      border: 1px solid #f43f5e;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📖 Chronicle AI</div>
  </div>
  
  <div class="content">
    <h1>Sign In to Chronicle AI</h1>
    
    <p>Click the button below to securely sign in to your account:</p>
    
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Sign In Now</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="code-box">{{ .ConfirmationURL }}</div>
    
    <p><strong>This link expires in 15 minutes.</strong></p>
    
    <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
  </div>
  
  <div class="footer">
    <p>Chronicle AI - Your Intelligent Journaling Companion</p>
    <p>
      <a href="https://chronicle-ai.app/help" style="color: #f43f5e; text-decoration: none;">Help Center</a> • 
      <a href="https://chronicle-ai.app/privacy" style="color: #f43f5e; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
```

---

## 4. Email Change Confirmation

**Subject:** Confirm Your New Email Address

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #292524;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #f43f5e;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #f43f5e;
    }
    .content {
      padding: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #f43f5e;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 12px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      text-align: center;
      font-size: 14px;
      color: #78716c;
    }
    .code-box {
      background-color: #fef2f2;
      border: 1px solid #f43f5e;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 14px;
      word-break: break-all;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📖 Chronicle AI</div>
  </div>
  
  <div class="content">
    <h1>Confirm Your New Email</h1>
    
    <p>You requested to change the email address for your Chronicle AI account.</p>
    
    <div class="info-box">
      <strong>ℹ️ Note:</strong> Your account email will not change until you confirm this new address.
    </div>
    
    <p>Click the button below to confirm your new email address:</p>
    
    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirm New Email</a>
    </p>
    
    <p>Or copy and paste this link into your browser:</p>
    <div class="code-box">{{ .ConfirmationURL }}</div>
    
    <p><strong>This link expires in 24 hours.</strong></p>
    
    <p>If you didn't request this email change, please contact support immediately at support@chronicle-ai.app.</p>
  </div>
  
  <div class="footer">
    <p>Chronicle AI - Your Intelligent Journaling Companion</p>
    <p>
      <a href="https://chronicle-ai.app/help" style="color: #f43f5e; text-decoration: none;">Help Center</a> • 
      <a href="mailto:support@chronicle-ai.app" style="color: #f43f5e; text-decoration: none;">Contact Support</a>
    </p>
  </div>
</body>
</html>
```

---

## Instructions for Setting Up in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Email Templates**
3. Select each template type:
   - Confirm signup
   - Reset password
   - Magic Link
   - Change Email Address
4. Replace the default template with the HTML above
5. Make sure to update the placeholder URLs:
   - Replace `https://chronicle-ai.app` with your actual domain
   - Update support email addresses
6. Test each template by:
   - Signing up with a new account (Confirm signup)
   - Requesting password reset (Reset password)
   - Using magic link sign in (Magic Link)
   - Changing email address (Change Email)

---

## Customization Tips

- **Branding**: Add your logo image URL to replace the emoji logo
- **Colors**: Update the hex colors to match your brand
- **Content**: Adjust copy to match your tone of voice
- **Footer**: Add social media links, company address, etc.
- **Mobile**: Templates are responsive and mobile-friendly

---

## Testing Email Delivery

Use these test email addresses to test without sending real emails:
- success@simulator.amazonses.com (successful delivery)
- bounce@simulator.amazonses.com (hard bounce)
- complaint@simulator.amazonses.com (complaint)

Check Supabase logs to verify email sending status.
