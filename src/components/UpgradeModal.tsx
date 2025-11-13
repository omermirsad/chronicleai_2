// src/components/UpgradeModal.tsx
import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { PRICING_PLANS } from '../config/pricing';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'premium_feature';
  featureName?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  reason = 'limit_reached',
  featureName,
}) => {
  const { usage } = useSubscription();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTitle = () => {
    if (reason === 'limit_reached') {
      return "You've reached your AI analysis limit";
    }
    return `Upgrade to access ${featureName || 'this feature'}`;
  };

  const getMessage = () => {
    if (reason === 'limit_reached') {
      return `You've used all ${usage?.aiCallsLimit || 10} AI analysis calls for this month. Upgrade to continue getting AI-powered insights for your journal entries.`;
    }
    return `${featureName || 'This feature'} is available on Pro and Premium plans. Upgrade to unlock advanced analytics and insights.`;
  };

  const proFeatures = PRICING_PLANS.find(p => p.tier === 'pro')?.features || [];
  const premiumFeatures = PRICING_PLANS.find(p => p.tier === 'premium')?.features || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2
              id="upgrade-modal-title"
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              {getTitle()}
            </h2>
            <p className="text-gray-600">{getMessage()}</p>
          </div>

          {/* Current Usage (if limit reached) */}
          {reason === 'limit_reached' && usage && (
            <div className="mb-8 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Current plan: <span className="capitalize">{usage.tier}</span>
                </span>
                <span className="text-sm font-bold text-red-600">
                  {usage.aiCallsUsed} / {usage.aiCallsLimit} used
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            {/* Pro Plan */}
            <div className="rounded-lg border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-white p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">$9.99</span>
                  <span className="ml-1 text-gray-600">/month</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold text-indigo-600">100</div>
                <div className="text-sm text-gray-600">AI calls per month</div>
              </div>

              <ul className="space-y-2 mb-4">
                {proFeatures.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg
                      className="mr-2 h-4 w-4 flex-shrink-0 text-green-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded bg-indigo-100 px-3 py-1 text-center text-sm font-semibold text-indigo-900">
                Most Popular
              </div>
            </div>

            {/* Premium Plan */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">Premium</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">$19.99</span>
                  <span className="ml-1 text-gray-600">/month</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold text-indigo-600">∞</div>
                <div className="text-sm text-gray-600">Unlimited AI calls</div>
              </div>

              <ul className="space-y-2 mb-4">
                {premiumFeatures.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg
                      className="mr-2 h-4 w-4 flex-shrink-0 text-green-500 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded bg-gray-100 px-3 py-1 text-center text-sm font-semibold text-gray-700">
                Best Value
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleUpgrade}
              className="flex-1 rounded-lg bg-indigo-600 py-3 px-6 font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              View All Plans
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 py-3 px-6 font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Bottom note */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Save 17% with annual billing • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
