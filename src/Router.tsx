import { FC, lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';

const App = lazy(() => import('./App'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));

const PageLoader: FC = () => (
  <div className="min-h-screen bg-rose-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
      <p className="mt-4 text-stone-600">Loading...</p>
    </div>
  </div>
);

const Router: FC = () => {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

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

  // Public routes configuration
  const publicRoutes: Record<string, JSX.Element> = {
    '/': <LandingPage />,
    '/terms': <TermsOfService />,
    '/privacy': <PrivacyPolicy />,
    '/help': <HelpCenter />,
  };

  // Handle public routes
  if (publicRoutes[path]) {
    return <Suspense fallback={<PageLoader />}>{publicRoutes[path]}</Suspense>;
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
