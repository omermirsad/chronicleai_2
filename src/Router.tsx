import { FC, lazy, Suspense, useEffect, useState } from 'react';
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

const Router: FC = () => {
  const { user, loading, error } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setPath(customEvent.detail);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigate', handleNavigate);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  // Add timeout for loading state (20 seconds)
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 20000);

      return () => clearTimeout(timeoutId);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Show error screen if there's an auth error or loading timeout
  if (error || loadingTimeout) {
    const errorMessage = error || 'Loading is taking longer than expected. Please check your connection and try again.';
    return <ErrorScreen error={errorMessage} onRetry={handleRetry} />;
  }

  // Public routes configuration
  const publicRoutes: Record<string, JSX.Element> = {
    '/': <LandingPage />,
    '/terms': <TermsOfService />,
    '/privacy': <PrivacyPolicy />,
    '/help': <HelpCenter />,
    '/pricing': <PricingPage />,
    '/therapists': <TherapistsPage />,
    '/health': <HealthCheck />,
  };

  // Handle public routes
  if (publicRoutes[path]) {
    return <Suspense fallback={<PageLoader />}>{publicRoutes[path]}</Suspense>;
  }

  // Handle auth callback route (email confirmation, password reset)
  if (path === '/auth/callback') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthCallback />
      </Suspense>
    );
  }

  // Handle auth route
  if (path === '/auth' || path.startsWith('/auth/')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <App />
      </Suspense>
    );
  }

  // Protected route logic
  if (loading) {
    return <PageLoader />;
  }

  if (!user && path !== '/') {
    // Redirect to landing if not authenticated
    window.history.replaceState({}, '', '/');
    setPath('/');
    return <PageLoader />;
  }

  // Handle Settings route for authenticated users
  if (user && path === '/settings') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Settings />
      </Suspense>
    );
  }

  // Handle Achievements route for authenticated users
  if (user && path === '/achievements') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AchievementsPage />
      </Suspense>
    );
  }

  // Show app for authenticated users
  return (
    <Suspense fallback={<PageLoader />}>
      <App />
    </Suspense>
  );
};

export const navigate = (path: string): void => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new CustomEvent('navigate', { detail: path }));
};

export default Router;
