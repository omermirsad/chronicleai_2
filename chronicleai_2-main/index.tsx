// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './src/Router';
import { initErrorMonitoring } from './src/lib/errorMonitoring';
import './src/index.css';

// Initialize error monitoring in production
if (import.meta.env.PROD) {
  initErrorMonitoring();
}

// Register service worker for PWA (if enabled)
if ('serviceWorker' in navigator && import.meta.env.VITE_ENABLE_PWA === 'true') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('Service Worker registered:', registration.scope);
      },
      (error) => {
        console.log('Service Worker registration failed:', error);
      }
    );
  });
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);