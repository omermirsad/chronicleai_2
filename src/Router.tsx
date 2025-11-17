import { FC, lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Settings = lazy(() => import('./pages/Settings'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const TherapistsPage = lazy(() => import('./pages/TherapistsPage'));
const AuthCallback = lazy(() => import('./components/AuthCallback'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));

const PageLoader: FC = () => (
  <div className="min-h-screen bg-rose-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
      <p className="mt-4 text-stone-600">Loading...</p>
    </div>
  </div>
);

interface ErrorScreenProps {
  error: string;
  onRetry: () => void;
}

const ErrorScreen: FC<ErrorScreenProps> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md border border-stone-200 p-8 text-center">
      <div className="text-red-600 text-5xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-stone-800 mb-2">Connection Error</h2>
      <p className="text-stone-600 mb-4">{error}</p>
      <div className="space-y-2">
        <button
          onClick={onRetry}
          className="w-full px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-4 py-2 bg-stone-200 text-stone-800 rounded-md hover:bg-stone-300 transition-colors"
        >
          Go to Home Page
        </button>
      </div>
      <p className="text-sm text-stone-500 mt-4">
        If this problem persists, please check your internet connection and try again later.
      </p>
    </div>
  </div>
);

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const Router: FC = () => {
  const { user, error } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout for loading state (20 seconds)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 20000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Show error screen if there's an auth error or loading timeout
  if (error || loadingTimeout) {
    const errorMessage = error || 'Loading is taking longer than expected. Please check your connection and try again.';
    return <ErrorScreen error={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/therapists" element={<TherapistsPage />} />
        <Route path="/health" element={<HealthCheck />} />

        {/* Auth Routes */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/app" replace /> : <App />}
        />

        {/* Protected App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to landing or app */}
        <Route
          path="*"
          element={user ? <Navigate to="/app" replace /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Suspense>
  );
};

export default Router;
