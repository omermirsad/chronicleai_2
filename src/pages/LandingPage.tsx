// src/pages/LandingPage.tsx
import { FC } from 'react';
import { 
  BookOpenIcon, 
  SparklesIcon, 
  HeartIcon, 
  LightningBoltIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ChartBarIcon
} from '../components/Icons';

const LandingPage: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="w-8 h-8 text-rose-600" />
            <span className="text-2xl font-bold text-stone-800">Chronicle AI</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/auth" className="text-stone-700 hover:text-rose-600 font-medium">
              Sign In
            </a>
            <a 
              href="/auth" 
              className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 font-medium transition"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-medium mb-6">
          <SparklesIcon className="w-4 h-4" />
          AI-Powered Self-Reflection
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 mb-6 leading-tight">
          Your Intelligent
          <br />
          <span className="text-rose-600">Journaling Companion</span>
        </h1>
        
        <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
          Chronicle AI helps you understand yourself better through intelligent journaling. 
          Capture your thoughts, track your emotions, and discover meaningful patterns 
          with AI-powered insights.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/auth" 
            className="px-8 py-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            Start Journaling Free
          </a>
          <a 
            href="#features" 
            className="px-8 py-4 bg-white text-stone-700 rounded-lg hover:bg-stone-50 font-semibold text-lg transition border-2 border-stone-200"
          >
            Learn More
          </a>
        </div>
        
        <p className="text-sm text-stone-500 mt-4">
          No credit card required • 10 AI insights per month on free plan
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Everything You Need for Deep Self-Reflection
            </h2>
            <p className="text-xl text-stone-600 max-w-2xl mx-auto">
              Chronicle AI combines the simplicity of journaling with the power of artificial intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <SparklesIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">AI-Powered Insights</h3>
              <p className="text-stone-600">
                Get intelligent summaries, emotional analysis, and thought-provoking questions 
                tailored to your entries.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <HeartIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Guided Sessions</h3>
              <p className="text-stone-600">
                Structured prompts for gratitude, challenges, weekly reviews, and mindful reflection.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Multiple Perspectives</h3>
              <p className="text-stone-600">
                View your entries through different lenses: objective facts, compassionate friend, 
                and future self.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <LightningBoltIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Mood & Energy Tracking</h3>
              <p className="text-stone-600">
                Track your emotional state and energy levels over time to identify patterns 
                and trends.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <CalendarDaysIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Time Capsule Memories</h3>
              <p className="text-stone-600">
                Rediscover entries from this day in previous years. Reflect on how far you've come.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-lg border border-stone-200 hover:border-rose-300 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Long-term Insights</h3>
              <p className="text-stone-600">
                AI analyzes patterns across multiple entries to surface meaningful themes and growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Simple, Intelligent, Private
            </h2>
            <p className="text-xl text-stone-600">
              Three steps to deeper self-awareness
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Write</h3>
              <p className="text-stone-600">
                Express your thoughts freely or use guided prompts. Add photos, track mood and energy.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Reflect</h3>
              <p className="text-stone-600">
                AI analyzes your entry instantly, providing summaries, tags, and thoughtful questions.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-rose-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Grow</h3>
              <p className="text-stone-600">
                Discover patterns over time and gain deeper understanding of your thoughts and emotions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stone-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-stone-600">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="p-8 rounded-lg border-2 border-stone-200 hover:border-rose-300 transition">
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Free</h3>
              <div className="text-4xl font-bold text-stone-900 mb-6">
                $0<span className="text-lg text-stone-600 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Unlimited journal entries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">10 AI insights per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Photo attachments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Mood & energy tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Calendar view</span>
                </li>
              </ul>
              <a 
                href="/auth" 
                className="block w-full py-3 px-4 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 font-semibold text-center transition"
              >
                Get Started
              </a>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-lg border-2 border-rose-600 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-rose-600 text-white text-sm font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Pro</h3>
              <div className="text-4xl font-bold text-stone-900 mb-6">
                $9<span className="text-lg text-stone-600 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">500 AI insights per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Multiple perspectives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Guided journaling sessions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Priority support</span>
                </li>
              </ul>
              <a 
                href="/auth" 
                className="block w-full py-3 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-center transition"
              >
                Start Free Trial
              </a>
            </div>

            {/* Premium Tier */}
            <div className="p-8 rounded-lg border-2 border-stone-200 hover:border-rose-300 transition">
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Premium</h3>
              <div className="text-4xl font-bold text-stone-900 mb-6">
                $19<span className="text-lg text-stone-600 font-normal">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Unlimited AI insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Custom AI prompts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">Export to all formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-600">✓</span>
                  <span className="text-stone-600">24/7 priority support</span>
                </li>
              </ul>
              <a 
                href="/auth" 
                className="block w-full py-3 px-4 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 font-semibold text-center transition"
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-rose-600 to-rose-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Start Your Self-Discovery Journey Today
          </h2>
          <p className="text-xl mb-8 text-rose-100">
            Join thousands of people using Chronicle AI to understand themselves better
          </p>
          <a 
            href="/auth" 
            className="inline-block px-8 py-4 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-semibold text-lg transition shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </a>
          <p className="text-sm text-rose-100 mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpenIcon className="w-6 h-6 text-rose-500" />
                <span className="text-xl font-bold text-white">Chronicle AI</span>
              </div>
              <p className="text-sm">
                Your intelligent journaling companion for deeper self-reflection and growth.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-rose-500">Features</a></li>
                <li><a href="#pricing" className="hover:text-rose-500">Pricing</a></li>
                <li><a href="/auth" className="hover:text-rose-500">Sign Up</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="hover:text-rose-500">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-rose-500">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@chronicle-ai.app" className="hover:text-rose-500">Contact Us</a></li>
                <li><a href="/help" className="hover:text-rose-500">Help Center</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Chronicle AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;