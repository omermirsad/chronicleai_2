// main.tsx
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Router from './Router';
import { initErrorMonitoring } from './lib/errorMonitoring';
import { logger } from './utils/logger';
import './index.css';

// Import the i18n configuration
import './i18n';

// Capacitor imports
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { platformClass } from './utils/platform';

// Initialize error monitoring in production
if (import.meta.env.PROD) {
  initErrorMonitoring();
}

// Initialize Capacitor plugins for native apps
const initCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Configure Status Bar
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#44403c' });

      // Hide splash screen after app is ready
      await SplashScreen.hide();

      // Handle app state changes
      CapApp.addListener('appStateChange', ({ isActive }) => {
        logger.info('App state changed. Active:', isActive);
      });

      // Handle back button on Android
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapApp.exitApp();
        } else {
          window.history.back();
        }
      });

      logger.info('Capacitor initialized successfully');
    } catch (error) {
      logger.error('Capacitor initialization error:', error);
    }
  }
};

// Add platform class to HTML element
document.documentElement.classList.add(platformClass());

// Register service worker for PWA (web only)
if ('serviceWorker' in navigator &&
    import.meta.env.VITE_ENABLE_PWA === 'true' &&
    !Capacitor.isNativePlatform()) {
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

// Initialize Capacitor before rendering
initCapacitor();

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