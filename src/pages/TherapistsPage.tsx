// src/pages/TherapistsPage.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';
import Footer from '@/components/Footer';

const TherapistsPage: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [profession, setProfession] = useState('');
  const [useCase, setUseCase] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) {
        toast.error('Please sign in to join the waitlist');
        return;
      }

      const { data, error } = await supabase.rpc('join_waitlist', {
        p_feature_id: 'therapist_portal',
        p_email: email,
        p_metadata: {
          profession,
          use_case: useCase,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      if (data?.success) {
        setSubmitted(true);
        toast.success('Thank you! We\'ll notify you when the Therapist Portal is ready.');
      } else {
        throw new Error(data?.error || 'Failed to join waitlist');
      }
    } catch (error) {
      logger.error('Error joining waitlist', error as Error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to join waitlist. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Therapist Collaboration</h1>
            <a
              href="/"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-4">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-indigo-900">Coming in V3.0</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
              Empower Your Practice with AI-Assisted Journaling
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chronicle AI is developing a secure, HIPAA-compliant portal for therapists to
              collaborate with clients through structured journaling and AI-powered insights.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Client Collaboration</h3>
              <p className="text-gray-600">
                HIPAA-compliant platform for reviewing client journals with end-to-end encryption
                and granular permission controls.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Access aggregated mood trends, emotional patterns, and AI-generated insights to
                inform your therapeutic approach.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Prompts & Goals</h3>
              <p className="text-gray-600">
                Create personalized journaling prompts and track therapeutic goals with your
                clients in real-time.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-indigo-100">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Progress Reports</h3>
              <p className="text-gray-600">
                Generate comprehensive progress reports with visualizations and insights to share
                during sessions.
              </p>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-indigo-200">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">You're on the List!</h3>
                <p className="text-gray-600 mb-6">
                  Thank you for your interest. We'll notify you as soon as the Therapist Portal launches.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
                >
                  Return to Home
                </a>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Join the Waitlist</h3>
                  <p className="text-gray-600">
                    Be among the first to access the Therapist Portal when it launches.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="therapist@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="profession" className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Role *
                    </label>
                    <select
                      id="profession"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select your role...</option>
                      <option value="psychologist">Psychologist</option>
                      <option value="therapist">Therapist / Counselor</option>
                      <option value="psychiatrist">Psychiatrist</option>
                      <option value="social_worker">Clinical Social Worker</option>
                      <option value="coach">Life Coach</option>
                      <option value="other">Other Mental Health Professional</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
                      How would you use the Therapist Portal? *
                    </label>
                    <textarea
                      id="useCase"
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Tell us about your practice and how you'd like to collaborate with clients..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !user}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : !user ? 'Please Sign In First' : 'Join the Waitlist'}
                  </button>

                  {!user && (
                    <p className="text-sm text-center text-gray-600">
                      <a href="/auth" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Sign in or create an account
                      </a>{' '}
                      to join the waitlist
                    </p>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-12 bg-indigo-50 rounded-lg p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-3">What to Expect</h3>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Early access to the platform before public launch</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Opportunity to provide feedback and shape the features</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Special pricing for early adopters</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>HIPAA compliance and enterprise-grade security from day one</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer variant="landing" />
    </div>
  );
};

export default TherapistsPage;
