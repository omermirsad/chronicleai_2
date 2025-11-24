// src/pages/PrivacyPolicy.tsx
import React, { FC } from 'react';
import { BookOpenIcon } from '../components/Icons';

const PrivacyPolicy: FC = () => {
  return (
    <div className="min-h-screen bg-rose-50">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2">
          <BookOpenIcon className="w-8 h-8 text-rose-600" />
          <h1 className="text-2xl font-bold text-stone-800">Chronicle AI</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-stone-600 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-stone max-w-none">
            <p className="lead">
              At Chronicle AI, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, protect, and share your personal information when you use our journaling service.
            </p>

            <h2>1. Information We Collect</h2>
            
            <h3>1.1 Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Email address, name, password (encrypted)</li>
              <li><strong>Profile Information:</strong> Display name, avatar (optional)</li>
              <li><strong>Journal Entries:</strong> Text content, photos, mood ratings, energy levels, tags</li>
              <li><strong>Preferences:</strong> App settings, notification preferences</li>
            </ul>

            <h3>1.2 Information We Collect Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> Features used, entries created, session duration</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong>Log Data:</strong> IP address, access times, error logs</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens (see Cookie Policy below)</li>
            </ul>

            <h3>1.3 Information from Third Parties</h3>
            <ul>
              <li><strong>OAuth Providers:</strong> When you sign in with Google or GitHub, we receive your email and basic profile information</li>
              <li><strong>Payment Processors:</strong> Stripe handles all payment information (we never see your credit card details)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            
            <h3>2.1 To Provide the Service</h3>
            <ul>
              <li>Create and maintain your account</li>
              <li>Store and display your journal entries</li>
              <li>Generate AI-powered insights and perspectives using Google Gemini</li>
              <li>Provide guided journaling sessions</li>
              <li>Track your mood and energy patterns</li>
              <li>Enable data export and backup features</li>
            </ul>

            <h3>2.2 To Improve the Service</h3>
            <ul>
              <li>Analyze usage patterns (aggregated and anonymized)</li>
              <li>Identify and fix bugs</li>
              <li>Develop new features</li>
              <li>Optimize performance</li>
            </ul>

            <h3>2.3 To Communicate with You</h3>
            <ul>
              <li>Send service-related notifications</li>
              <li>Respond to support requests</li>
              <li>Send important updates about Terms or Privacy Policy changes</li>
              <li>Send marketing emails (with your consent, opt-out available)</li>
            </ul>

            <h3>2.4 For Security and Compliance</h3>
            <ul>
              <li>Detect and prevent fraud or abuse</li>
              <li>Enforce our Terms of Service</li>
              <li>Comply with legal obligations</li>
              <li>Protect rights and safety of users and the public</li>
            </ul>

            <h2>3. AI Processing and Data Sharing</h2>
            
            <h3>3.1 Google Gemini AI Processing</h3>
            <p>
              We use Google's Gemini AI to analyze your journal entries and provide insights. Here's how this works:
            </p>
            <ul>
              <li><strong>What is sent:</strong> Your journal entry text and optional photos</li>
              <li><strong>When it's sent:</strong> When you create or update an entry</li>
              <li><strong>What happens:</strong> Gemini analyzes the content and returns insights (tags, sentiment, questions)</li>
              <li><strong>Data retention:</strong> Google does not retain your journal content after processing</li>
              <li><strong>Training:</strong> Your data is NOT used to train AI models</li>
              <li><strong>Privacy:</strong> Google's AI processing is subject to their privacy policies</li>
            </ul>

            <h3>3.2 No Sharing of Personal Journal Content</h3>
            <p>
              We <strong>never</strong> share, sell, or rent your personal journal entries to third parties. 
              Your thoughts and reflections are private and confidential.
            </p>

            <h3>3.3 Service Providers We Use</h3>
            <p>We share limited data with trusted service providers who help us operate the Service:</p>
            <ul>
              <li><strong>Supabase:</strong> Database and authentication hosting (PostgreSQL, encrypted)</li>
              <li><strong>Google Gemini:</strong> AI analysis (as described above)</li>
              <li><strong>Stripe:</strong> Payment processing (PCI-compliant)</li>
              <li><strong>Sentry:</strong> Error monitoring (anonymized error logs only)</li>
              <li><strong>Cloud Storage:</strong> Photo storage (encrypted at rest)</li>
            </ul>

            <h2>4. Data Security</h2>
            
            <h3>4.1 Security Measures</h3>
            <ul>
              <li><strong>Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest</li>
              <li><strong>Authentication:</strong> Secure password hashing (bcrypt), OAuth 2.0</li>
              <li><strong>Access Control:</strong> Row-Level Security (RLS) ensures users can only access their own data</li>
              <li><strong>Monitoring:</strong> Real-time security monitoring and intrusion detection</li>
              <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
            </ul>

            <h3>4.2 Your Responsibility</h3>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Keep your account credentials confidential</li>
              <li>Enable two-factor authentication (when available)</li>
              <li>Sign out on shared devices</li>
              <li>Report suspected security breaches immediately</li>
            </ul>

            <h2>5. Your Rights and Choices</h2>
            
            <h3>5.1 Access and Control</h3>
            <ul>
              <li><strong>Access:</strong> View all your data through the app</li>
              <li><strong>Edit:</strong> Update or correct your information anytime</li>
              <li><strong>Delete:</strong> Remove individual entries or your entire account</li>
              <li><strong>Export:</strong> Download all your data in JSON, Markdown, or CSV format</li>
            </ul>

            <h3>5.2 Data Portability (GDPR Right)</h3>
            <p>
              You can export your data at any time. The export includes:
            </p>
            <ul>
              <li>All journal entries with timestamps</li>
              <li>Photos and attachments</li>
              <li>AI analyses and insights</li>
              <li>Mood and energy data</li>
              <li>Tags and metadata</li>
              <li>Profile information</li>
            </ul>

            <h3>5.3 Right to Be Forgotten (GDPR Right)</h3>
            <p>
              You can permanently delete your account and all data. Upon deletion:
            </p>
            <ul>
              <li>All entries are permanently deleted within 30 days</li>
              <li>Backup copies are purged within 90 days</li>
              <li>Aggregate anonymized data may be retained for analytics</li>
              <li>Legal or security logs may be retained as required by law</li>
            </ul>

            <h3>5.4 Marketing Preferences</h3>
            <ul>
              <li>Opt out of marketing emails via unsubscribe links</li>
              <li>Control notification preferences in app settings</li>
              <li>We will still send essential service emails (password resets, security alerts)</li>
            </ul>

            <h2>6. Data Retention</h2>
            <ul>
              <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
              <li><strong>Deleted Accounts:</strong> Data purged within 30 days</li>
              <li><strong>Backups:</strong> Backup copies deleted within 90 days</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
              <li><strong>Anonymized Data:</strong> Aggregate statistics may be retained indefinitely</li>
            </ul>

            <h2>7. Children's Privacy</h2>
            <p>
              Chronicle AI is not intended for users under 13 years old. We do not knowingly collect 
              information from children under 13. If we learn we have collected such information, 
              we will delete it immediately. If you believe a child has provided us information, 
              contact us at privacy@chronicle-ai.app.
            </p>

            <h2>8. International Users and Data Transfers</h2>
            <p>
              Chronicle AI is hosted on servers located in [Your Region]. If you access the Service from 
              outside this region, your data may be transferred and stored in [Your Region]. By using the 
              Service, you consent to this transfer.
            </p>
            <p>
              For EU users: We comply with GDPR requirements for data protection and privacy.
            </p>

            <h2>9. Cookies and Tracking</h2>
            
            <h3>9.1 Cookies We Use</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for authentication and security (cannot be disabled)</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use the app (can be disabled)</li>
            </ul>

            <h3>9.2 Third-Party Cookies</h3>
            <ul>
              <li>OAuth providers (Google, GitHub) may set cookies during sign-in</li>
              <li>Analytics services may use cookies to track usage</li>
            </ul>

            <h3>9.3 Managing Cookies</h3>
            <p>
              You can control cookies through your browser settings. Note that disabling essential 
              cookies will prevent you from using the Service.
            </p>

            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via:
            </p>
            <ul>
              <li>Email notification</li>
              <li>In-app notification</li>
              <li>Prominent notice on our website</li>
            </ul>
            <p>
              The "Last Updated" date at the top indicates when changes were made. Continued use after 
              changes constitutes acceptance of the new policy.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding your privacy or this policy:
            </p>
            <ul>
              <li><strong>Email:</strong> privacy@chronicle-ai.app</li>
              <li><strong>Support:</strong> support@chronicle-ai.app</li>
              <li><strong>Data Protection Officer:</strong> dpo@chronicle-ai.app</li>
            </ul>

            <h2>12. Your Consent</h2>
            <p>
              By using Chronicle AI, you consent to the collection and use of your information as 
              described in this Privacy Policy. If you do not agree with this policy, please do not 
              use the Service.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200">
            <a 
              href="/" 
              className="text-rose-600 hover:text-rose-700 font-medium"
            >
              ← Back to Chronicle AI
            </a>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 mt-12 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-stone-600">
          <p>&copy; {new Date().getFullYear()} Chronicle AI. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="/privacy" className="hover:text-rose-600">Privacy Policy</a>
            <a href="/terms" className="hover:text-rose-600">Terms of Service</a>
            <a href="mailto:support@chronicle-ai.app" className="hover:text-rose-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;