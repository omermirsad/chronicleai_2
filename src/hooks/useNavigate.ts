/**
 * Re-export react-router-dom hooks for backwards compatibility
 * This allows existing code to continue using the custom hooks
 * while now using the standard react-router-dom implementation
 */
export { useNavigate } from 'react-router-dom';
export { useLocation } from 'react-router-dom';

/**
 * Hook for going back in history
 */
export function useGoBack() {
  return () => {
    window.history.back();
  };
}

/**
 * Hook for going forward in history
 */
export function useGoForward() {
  return () => {
    window.history.forward();
  };
}

/**
 * Hook to get current path
 * @deprecated Use useLocation() from react-router-dom instead
 */
export function useCurrentPath() {
  return window.location.pathname;
}
