// src/Router.tsx
import React, { FC, lazy, Suspense } from 'react';
import { useAuth } from './hooks/useAuth';

// Lazy load all pages
const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

// Simple loading component
const PageLoader: FC = () => (
  <div className="min-h-screen bg-rose-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
      <p className="mt-4 text-stone-600">Loading...</p>
    </div>
  </div>
);

// Simple router component
const Router: FC = () => {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  // Handle navigation
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Store navigate function globally for use in components
  React.useEffect(() => {
    (window as any).navigate = navigate;
  }, []);

  // Public routes that don't require authentication
  const publicRoutes: { [key: string]: React.ReactNode } = {
    '/': <LandingPage />,
    '/terms': <TermsOfService />,
    '/privacy': <PrivacyPolicy />,
    '/help': <HelpCenter />,
  };

  // Auth route
  if (path === '/auth' || path.startsWith('/auth/')) {
    return (
      <Suspense fallback={<PageLoader />}>
        <App />
      </Suspense>
    );
  }

  // Check if current path is a public route
  if (publicRoutes[path]) {
    return (
      <Suspense fallback={<PageLoader />}>
        {publicRoutes[path]}
      </Suspense>
    );
  }

  // For protected routes (app), show landing page if not authenticated
  if (!loading && !user && path !== '/') {
    // Redirect to landing page if trying to access app while not logged in
    window.location.href = '/';
    return <PageLoader />;
  }

  // Show app for authenticated users or loading state
  return (
    <Suspense fallback={<PageLoader />}>
      <App />
    </Suspense>
  );
};

// Simple history listener to trigger re-renders on navigation
export const useRouter = () => {
  const [, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    navigate: (path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    },
    path: window.location.pathname,
  };
};

export default Router;