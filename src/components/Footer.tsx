// src/components/Footer.tsx
import { FC } from 'react';
import { BookOpenIcon } from './Icons';

interface FooterProps {
  variant?: 'app' | 'landing';
}

const Footer: FC<FooterProps> = ({ variant = 'app' }) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'app') {
    // Minimal footer for inside the app
    return (
      <footer className="bg-white border-t border-stone-200 py-4 mt-auto">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-stone-600">
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-rose-600" />
              <span>&copy; {currentYear} Chronicle AI</span>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/help"
                className="hover:text-rose-600 transition"
              >
                Help Center
              </a>
              <a
                href="/privacy"
                className="hover:text-rose-600 transition"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="hover:text-rose-600 transition"
              >
                Terms
              </a>
              <a
                href="mailto:support@chronicle-ai.app"
                className="hover:text-rose-600 transition"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Full footer for landing and public pages
  return (
    <footer className="bg-stone-900 text-stone-400 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpenIcon className="w-6 h-6 text-rose-500" />
              <span className="text-xl font-bold text-white">Chronicle AI</span>
            </div>
            <p className="text-sm">
              Your intelligent journaling companion for deeper self-reflection and growth.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/#features" className="hover:text-rose-500 transition">
                  Features
                </a>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-rose-500 transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/auth" className="hover:text-rose-500 transition">
                  Sign Up
                </a>
              </li>
              <li>
                <a href="/therapists" className="hover:text-rose-500 transition">
                  For Professionals
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-rose-500 transition">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="hover:text-rose-500 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-rose-500 transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-rose-500 transition">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:support@chronicle-ai.app"
                  className="hover:text-rose-500 transition"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/help" className="hover:text-rose-500 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/yourusername/chronicle-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-500 transition"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/chronicle_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-500 transition"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {currentYear} Chronicle AI. All rights reserved.</p>

            <div className="flex items-center gap-4">
              <span className="text-stone-500">Made with ❤️ for reflection</span>
              <div className="flex gap-3">
                <a
                  href="https://twitter.com/chronicle_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-500 transition"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                  </svg>
                </a>
                <a
                  href="https://github.com/yourusername/chronicle-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-500 transition"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;