// main.tsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Router from './Router';
import { initErrorMonitoring } from './lib/errorMonitoring';
import { logger } from './utils/logger';
import './index.css';

// Import the i18n configuration
import './i18n';

// Initialize error monitoring in production
if (import.meta.env.PROD) {
  initErrorMonitoring();
}

// Register service worker for PWA (if enabled)
if ('serviceWorker' in navigator && import.meta.env.VITE_ENABLE_PWA === 'true') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        logger.info('Service Worker registered:', registration.scope);
      },
      (error) => {
        logger.error('Service Worker registration failed:', error);
      }
    );
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* Wrap the app in Suspense for translation loading */}
    <Suspense fallback={<div>Loading...</div>}>
      <Router />
    </Suspense>
  </React.StrictMode>
);