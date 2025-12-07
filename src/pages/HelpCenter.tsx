// src/pages/HelpCenter.tsx
import { useState, FC } from 'react';
import { 
  BookOpenIcon, 
  SparklesIcon, 
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  LightningBoltIcon
} from '../components/Icons';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const HelpCenter: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: <BookOpenIcon className="w-5 h-5" /> },
    { id: 'getting-started', name: 'Getting Started', icon: <PencilSquareIcon className="w-5 h-5" /> },
    { id: 'features', name: 'Features', icon: <SparklesIcon className="w-5 h-5" /> },
    { id: 'ai', name: 'AI Insights', icon: <ChatBubbleLeftRightIcon className="w-5 h-5" /> },
    { id: 'privacy', name: 'Privacy & Security', icon: <LightningBoltIcon className="w-5 h-5" /> },
    { id: 'account', name: 'Account & Billing', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  const faqs: FAQItem[] = [
    {
      category: 'getting-started',
      question: 'How do I create my first journal entry?',
      answer: 'Click on "New Entry" in the navigation bar. You can choose between freestyle writing (a blank page for free expression) or guided sessions (structured prompts). Type your thoughts, optionally add a photo, rate your mood and energy, then click "Save Entry".'
    },
    {
      category: 'getting-started',
      question: 'What are guided sessions?',
      answer: 'Guided sessions are structured journaling experiences with AI-powered prompts. We offer sessions for gratitude practice, overcoming challenges, weekly reviews, future self visualization, mindful observation, and stoic reflection. The AI adapts its questions based on your responses.'
    },
    {
      category: 'features',
      question: 'How does voice-to-text work?',
      answer: 'Click the microphone icon while writing an entry. Your browser will request permission to use your microphone. Once granted, speak naturally and your words will be transcribed in real-time. Click the microphone again to stop recording.'
    },
    {
      category: 'features',
      question: 'What is the "On This Day" feature?',
      answer: 'On This Day shows you entries you wrote on the same date in previous years. It\'s a beautiful way to reflect on your growth and see how your thoughts have evolved over time. These entries appear automatically at the top of your journal feed.'
    },
    {
      category: 'features',
      question: 'How do I use the Perspective Lens?',
      answer: 'Click "View with Perspective Lens" on any entry card. The AI will rewrite your entry from three different viewpoints: The Objective Observer (facts vs. feelings), The Compassionate Friend (supportive validation), and The Future Self (wisdom from 5 years ahead).'
    },
    {
      category: 'features',
      question: 'What is the Calendar view?',
      answer: 'The Calendar view shows which days you\'ve written entries. Days with entries are marked with a dot. Click any marked day to see all entries from that date. It\'s a visual way to track your journaling consistency and patterns.'
    },
    {
      category: 'ai',
      question: 'How does AI analyze my entries?',
      answer: 'When you save an entry, it\'s sent to Google\'s Gemini AI for analysis. The AI reads your text (and any photos) to generate: a 3-point summary, relevant tags, sentiment analysis (positive/negative/neutral/mixed), a validating acknowledgement, and a Socratic question for deeper reflection. This happens in seconds.'
    },
    {
      category: 'ai',
      question: 'What are "Insights" and how do I generate them?',
      answer: 'Insights are long-term pattern analysis across multiple entries. You need at least 3 entries to generate insights. Go to the Insights view and click "Generate Insights". The AI analyzes up to 20 recent entries to identify emotional patterns, recurring themes, mood trends, and areas for growth.'
    },
    {
      category: 'ai',
      question: 'Does AI read all my journal entries?',
      answer: 'The AI only analyzes entries you explicitly create or when you request insights/perspectives. Each analysis is done in real-time and Google does not store your journal content after processing. Your entries are never used to train AI models.'
    },
    {
      category: 'ai',
      question: 'How many AI insights do I get per month?',
      answer: 'Free tier: 10 AI analyses per month. Pro tier: 500 per month. Premium tier: Unlimited. Each entry you create, each perspective you view, and each insight generation counts as one AI call. Your usage resets on the first day of each month.'
    },
    {
      category: 'privacy',
      question: 'Is my journal data private and secure?',
      answer: 'Yes, absolutely. Your data is encrypted in transit (TLS/SSL) and at rest. We use Row-Level Security (RLS) in our database so users can only access their own entries. We never share, sell, or rent your personal journal content. Only you and the AI (for analysis) can see your entries.'
    },
    {
      category: 'privacy',
      question: 'Can I export my data?',
      answer: 'Yes! Go to your profile menu and select "Export Data". You can download all your entries in JSON, Markdown, or CSV format. The export includes all text, photos, AI analyses, mood data, and tags. This is your data—you can take it anytime.'
    },
    {
      category: 'privacy',
      question: 'How do I delete my account?',
      answer: 'In your profile settings, click "Delete Account". You\'ll be asked to confirm by typing "DELETE MY DATA". This permanently removes all journal entries, photos, AI analyses, and your profile within 30 days. Backups are purged within 90 days. This cannot be undone.'
    },
    {
      category: 'privacy',
      question: 'Does Chronicle AI work offline?',
      answer: 'Partially. You can read previously loaded entries offline. However, creating new entries, uploading photos, and AI analysis require an internet connection. Changes made offline will sync automatically when you reconnect.'
    },
    {
      category: 'account',
      question: 'How do I change my subscription?',
      answer: 'Go to your profile menu and select "Subscription". You can upgrade to Pro or Premium at any time and you\'ll be charged immediately. Downgrades take effect at the end of your current billing period. Free tier users can upgrade anytime.'
    },
    {
      category: 'account',
      question: 'Can I cancel my subscription?',
      answer: 'Yes, cancel anytime through your profile settings. You\'ll retain Pro/Premium features until the end of your billing period, then automatically move to the Free tier. All your entries are kept—you never lose your data when downgrading.'
    },
    {
      category: 'account',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through Stripe. We don\'t store your card information—Stripe handles all payment processing securely.'
    },
    {
      category: 'account',
      question: 'Do you offer refunds?',
      answer: 'We don\'t typically offer refunds, but we evaluate requests on a case-by-case basis. Contact support@chronicle-ai.app within 7 days of purchase to discuss. We want you to be happy with Chronicle AI.'
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-rose-50">
      <header className="bg-white border-b border-stone-200 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2">
          <BookOpenIcon className="w-8 h-8 text-rose-600" />
          <h1 className="text-2xl font-bold text-stone-800">Chronicle AI Help Center</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-900 mb-4">How can we help you?</h1>
          <p className="text-lg text-stone-600 mb-6">Search for answers or browse by category</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-lg border-2 border-stone-200 focus:border-rose-500 focus:outline-none text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                activeCategory === category.id
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-stone-200 hover:border-stone-300 text-stone-700'
              }`}
            >
              {category.icon}
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <details key={index} className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                <summary className="p-6 cursor-pointer hover:bg-stone-50 font-semibold text-stone-900 flex justify-between items-center">
                  <span>{faq.question}</span>
                  <span className="text-rose-600 text-2xl">+</span>
                </summary>
                <div className="px-6 pb-6 text-stone-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
              <p className="text-stone-600 text-lg">No results found for "{searchQuery}"</p>
              <p className="text-stone-500 mt-2">Try different keywords or browse by category</p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 p-8 bg-white rounded-lg border border-stone-200 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Still need help?</h2>
          <p className="text-stone-600 mb-6">
            Our support team is here for you
          </p>
          <a 
            href="mailto:support@chronicle-ai.app"
            className="inline-block px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold transition"
          >
            Contact Support
          </a>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-rose-600 hover:text-rose-700 font-medium">
            ← Back to Chronicle AI
          </a>
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

export default HelpCenter;