import { useCallback } from 'react';

/**
 * Custom hook for programmatic navigation
 * Provides a consistent interface for navigating between routes
 *
 * @example
 * const navigate = useNavigate();
 * navigate('/settings');
 * navigate('/pricing', { replace: true });
 */
export function useNavigate() {
  return useCallback(
    (path: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        window.history.replaceState({}, '', path);
      } else {
        window.history.pushState({}, '', path);
      }
      window.dispatchEvent(new CustomEvent('navigate', { detail: path }));
    },
    []
  );
}

/**
 * Hook for going back in history
 */
export function useGoBack() {
  return useCallback(() => {
    window.history.back();
  }, []);
}

/**
 * Hook for going forward in history
 */
export function useGoForward() {
  return useCallback(() => {
    window.history.forward();
  }, []);
}

/**
 * Hook to get current path
 */
export function useCurrentPath() {
  return window.location.pathname;
}
