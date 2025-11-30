import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Router from './Router';
import { validateEnv } from './lib/envValidation';
import { logger } from '@/lib/logger';
import './index.css';

// Import the i18n configuration
import './i18n';

// Validate environment variables early
try {
  validateEnv();
} catch (error) {
  logger.error('Environment validation failed:', error);
  if (import.meta.env.PROD) throw error;
}

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.VITE_ENABLE_PWA === 'true') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => logger.info('Service Worker registered:', registration.scope),
      (error) => logger.error('Service Worker registration failed:', error)
    );
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Router />
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
