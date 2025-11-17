import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chronicleai.app',
  appName: 'Chronicle AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For local development, uncomment and set your computer's IP
    // url: 'http://YOUR_IP:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fef2f2',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#f43f5e',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT', // LIGHT or DARK
      backgroundColor: '#44403c', // matches your theme-color
    },
    Keyboard: {
      resize: 'native',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  // Android-specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set true for debugging
  },
};

export default config;
