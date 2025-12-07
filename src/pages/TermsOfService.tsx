// src/pages/TermsOfService.tsx
import { FC } from 'react';
import { BookOpenIcon } from '../components/Icons';

const TermsOfService: FC = () => {
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
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-stone-600 mb-8">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose prose-stone max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using Chronicle AI ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Chronicle AI is an intelligent journaling application that uses artificial intelligence to help users 
              reflect on their thoughts, emotions, and experiences. The Service includes:
            </p>
            <ul>
              <li>Personal journaling with text and photo entries</li>
              <li>AI-powered analysis and insights using Google Gemini API</li>
              <li>Guided journaling sessions</li>
              <li>Mood and energy tracking</li>
              <li>Calendar views and historical perspectives</li>
            </ul>

            <h2>3. User Accounts</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              You must create an account to use the Service. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3>3.2 Account Termination</h3>
            <p>
              You may terminate your account at any time through the app settings. We reserve the right to 
              suspend or terminate accounts that violate these terms.
            </p>

            <h2>4. Subscription and Billing</h2>
            <h3>4.1 Subscription Tiers</h3>
            <p>
              Chronicle AI offers different subscription tiers:
            </p>
            <ul>
              <li><strong>Free Tier:</strong> Limited AI features (10 AI calls per month)</li>
              <li><strong>Pro Tier:</strong> Enhanced AI features (500 AI calls per month)</li>
              <li><strong>Premium Tier:</strong> Unlimited AI features</li>
            </ul>

            <h3>4.2 Payment Terms</h3>
            <p>
              Paid subscriptions are billed monthly or annually. All fees are non-refundable except as required 
              by law. We reserve the right to change pricing with 30 days notice.
            </p>

            <h3>4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current 
              billing period. You will retain access until that date.
            </p>

            <h2>5. User Content and Privacy</h2>
            <h3>5.1 Your Content</h3>
            <p>
              You retain all rights to the content you create (journal entries, photos). By using the Service, 
              you grant us permission to:
            </p>
            <ul>
              <li>Store and process your content to provide the Service</li>
              <li>Use AI (Google Gemini) to analyze your content for insights</li>
              <li>Create backups for data security</li>
            </ul>

            <h3>5.2 AI Processing</h3>
            <p>
              Your journal entries are processed by Google Gemini AI to provide analysis, insights, and perspectives. 
              This processing happens in real-time and the AI does not retain your data after processing. We never 
              use your personal journal content to train AI models.
            </p>

            <h3>5.3 Data Privacy</h3>
            <p>
              We take your privacy seriously. Please review our Privacy Policy for detailed information about 
              how we collect, use, and protect your data.
            </p>

            <h2>6. Acceptable Use</h2>
            <p>
              You agree NOT to:
            </p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service to harass, abuse, or harm others</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <h3>7.1 Our Property</h3>
            <p>
              The Service, including its design, functionality, and code, is owned by Chronicle AI and protected 
              by copyright and other intellectual property laws.
            </p>

            <h3>7.2 Your Property</h3>
            <p>
              You retain ownership of your journal entries and any content you create. We claim no ownership 
              over your personal content.
            </p>

            <h2>8. Data Export and Deletion</h2>
            <h3>8.1 Data Export</h3>
            <p>
              You can export all your data at any time in JSON, Markdown, or CSV format through the app settings. 
              Exports include all journal entries, AI analyses, and metadata.
            </p>

            <h3>8.2 Account Deletion</h3>
            <p>
              You have the right to delete your account and all associated data. Upon deletion:
            </p>
            <ul>
              <li>All journal entries are permanently deleted</li>
              <li>All photos are removed from storage</li>
              <li>Your profile information is deleted</li>
              <li>AI analyses and insights are deleted</li>
              <li>This action cannot be undone</li>
            </ul>

            <h2>9. Disclaimers and Limitations</h2>
            <h3>9.1 Service Availability</h3>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted 
              or error-free service. We may suspend or terminate the Service for maintenance or other reasons.
            </p>

            <h3>9.2 AI Limitations</h3>
            <p>
              AI-generated insights and perspectives are for informational purposes only. They should not be 
              considered professional medical, psychological, or therapeutic advice. Always consult qualified 
              professionals for mental health concerns.
            </p>

            <h3>9.3 Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, Chronicle AI shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. We will notify users of material changes 
              via email or in-app notification. Continued use of the Service after changes constitutes acceptance 
              of the new terms.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall be resolved in 
              the courts of [Your Jurisdiction].
            </p>

            <h2>12. Contact Information</h2>
            <p>
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <ul>
              <li>Email: legal@chronicle-ai.app</li>
              <li>Support: support@chronicle-ai.app</li>
            </ul>

            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions will 
              continue in full force and effect.
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

export default TermsOfService;